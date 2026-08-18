"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Shield, Wallet, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { WalletSession } from "@/lib/auth";
import {
  updateBusinessProfile,
  type BusinessProfile,
} from "@/lib/business";
import {
  findLeafIndex,
  getPoolLeaves,
  getPoolNullifiers,
  getPoolStatus,
} from "@/lib/hypertron-indexer";
import {
  listNotes,
  updateNote,
  type StoredNote,
} from "@/lib/hypertron-note-store";
import {
  listNotesV2,
  updateNoteV2,
  type StoredNoteV2,
} from "@/lib/hypertron-note-store-v2";
import {
  fullScan,
  type ScanState,
} from "@/lib/hypertron-note-scan";
import {
  recipientFieldHex,
  submitPoolUnshield,
} from "@/lib/hypertron-pool";
import {
  buildUnshieldProof,
  computeNullifier,
} from "@/lib/hypertron-prover";
import { deriveNoteSecrets, deriveViewingKey, deriveSpendKey } from "@/lib/hypertron-viewkey";
import { getWorkspaceTreasury, type Workspace } from "@/mockdata";
import { fromBaseUnits } from "@/lib/stellar-network";

export { WorkspacePayments } from "@/components/dashboard/workspace-payments";
export { WorkspaceOverview } from "@/components/dashboard/workspace-overview";

type NoteRow = StoredNote & { status: "pending" | "ready" | "spent" };

type NoteRowV2 = StoredNoteV2 & { status: "pending" | "ready" | "spent" };

type UnifiedNoteRow = {
  id: string;
  ownerPk?: string | null;
  k?: string | null;
  salt?: string | null;
  amount: string;
  amountBaseUnits: string;
  commitment: string;
  leafIndex: number | null;
  spent: boolean;
  status: "pending" | "ready" | "spent";
  origin: "collect" | "received" | "change" | "topup";
  createdAt: number;
};

export function WorkspaceTreasury({
  workspace,
  session,
  profile,
}: {
  workspace: Workspace;
  session: WalletSession;
  profile: BusinessProfile;
}) {
  const treasury = getWorkspaceTreasury(workspace.id);
  const [notes, setNotes] = useState<UnifiedNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const viewKeys = await deriveViewingKey(session.walletAddress);
      if (!viewKeys.ok) {
        setError(viewKeys.error);
        setLoading(false);
        return;
      }
      const spendKeys = await deriveSpendKey(session.walletAddress);
      if (!spendKeys.ok) {
        setError(spendKeys.error);
        setLoading(false);
        return;
      }

      // Run blob scan for received notes (v2)
      setScanState("scanning");
      const scanResult = await fullScan(
        session.walletAddress,
        viewKeys.keys.viewSecret,
        spendKeys.keys.spendSecret,
      );
      setScanState(scanResult.state);

      // Rehydrate Collect note store (v1) from authenticated link list (salts) if needed.
      const { listPaymentLinks, parsePrivateSettlement, confirmSettledLinks } =
        await import("@/lib/payment-links");
      const { putNote, getNote } = await import("@/lib/hypertron-note-store");
      const { toBaseUnits } = await import("@/lib/stellar-network");
      const listed = await listPaymentLinks(workspace.id);
      if (listed.ok) {
        for (const link of listed.links) {
          if (
            !parsePrivateSettlement(link.metadata) ||
            !link.shieldSalt ||
            !link.shieldCommitment
          ) {
            continue;
          }
          const existing = await getNote(link.id);
          if (!existing) {
            await putNote({
              linkId: link.id,
              businessId: workspace.id,
              salt: link.shieldSalt,
              amount: link.amount ?? "0",
              amountBaseUnits: toBaseUnits(link.amount ?? "0"),
              commitment: link.shieldCommitment,
              leafIndex: null,
              paidAt: link.paidAt,
              spent: false,
              createdAt: new Date(link.createdAt).getTime() || Date.now(),
            });
          }
        }
      }

      const storedV1 = await listNotes(workspace.id);
      const storedV2 = await listNotesV2(session.walletAddress);

      const leavesRes = await getPoolLeaves(0);
      const nullsRes = await getPoolNullifiers();
      const leaves = leavesRes.ok ? leavesRes.data.leaves : [];
      const nullifiers = new Set(
        (nullsRes.ok ? nullsRes.nullifiers : []).map((n) =>
          n.toLowerCase().replace(/^0x/, ""),
        ),
      );

      const unified: UnifiedNoteRow[] = [];

      // Process v1 Collect notes
      for (const note of storedV1) {
        let leafIndex = note.leafIndex ?? null;
        if (leafIndex == null && leaves.length) {
          const found = findLeafIndex(leaves, note.commitment);
          if (found >= 0) {
            leafIndex = found;
            await updateNote(note.linkId, { leafIndex: found });
          }
        }

        let spent = Boolean(note.spent);
        if (!spent) {
          const { k } = await deriveNoteSecrets(
            spendKeys.keys.spendSecret,
            note.salt,
          );
          const nf = await computeNullifier(spendKeys.keys.spendSecret, k);
          spent = nullifiers.has(nf.toLowerCase().replace(/^0x/, ""));
          if (spent) await updateNote(note.linkId, { spent: true });
        }

        const statusLabel = spent
          ? "spent"
          : leafIndex != null
            ? "ready"
            : "pending";

        unified.push({
          id: note.linkId,
          salt: note.salt,
          amount: note.amount,
          amountBaseUnits: note.amountBaseUnits,
          commitment: note.commitment,
          leafIndex,
          spent,
          status: statusLabel,
          origin: "collect",
          createdAt: note.createdAt,
        });
      }

      // Process v2 received/change/topup notes (have ownerPk/k directly)
      for (const note of storedV2) {
        // Skip if already in unified via v1 (same commitment)
        if (unified.some((u) => u.commitment === note.commitment)) continue;

        let leafIndex = note.leafIndex;
        if (leafIndex == null && leaves.length) {
          const found = findLeafIndex(leaves, note.commitment);
          if (found >= 0) {
            leafIndex = found;
            await updateNoteV2(note.commitment, { leafIndex: found });
          }
        }

        let spent = note.spent;
        if (!spent && note.k) {
          const nf = await computeNullifier(
            spendKeys.keys.spendSecret,
            note.k,
          );
          spent = nullifiers.has(nf.toLowerCase().replace(/^0x/, ""));
          if (spent) await updateNoteV2(note.commitment, { spent: true });
        }

        const statusLabel = spent
          ? "spent"
          : leafIndex != null
            ? "ready"
            : "pending";

        unified.push({
          id: note.commitment,
          ownerPk: note.ownerPk,
          k: note.k,
          salt: note.salt,
          amount: note.amount,
          amountBaseUnits: note.amountBaseUnits,
          commitment: note.commitment,
          leafIndex,
          spent,
          status: statusLabel,
          origin: note.origin,
          createdAt: note.createdAt,
        });
      }

      // A private link stays "pending" until the merchant can see the note it
      // paid out, which is exactly what the scan above just established.
      if (listed.ok) {
        const settled = unified
          .filter((row) => row.leafIndex != null)
          .map((row) => row.commitment);
        await confirmSettledLinks(listed.links, settled);
      }

      // Sort newest first
      unified.sort((a, b) => b.createdAt - a.createdAt);
      setNotes(unified);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notes.");
      setScanState("indexer_down");
    } finally {
      setLoading(false);
    }
  }, [session.walletAddress, workspace.id]);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  async function handleWithdraw(note: UnifiedNoteRow) {
    setBusyId(note.id);
    setError(null);
    setStatus(null);
    try {
      const recipient =
        profile.receiveAddress?.trim() || session.walletAddress;

      setStatus("Checking indexer…");
      const poolStatus = await getPoolStatus();
      if (!poolStatus.ok) {
        setError(poolStatus.error);
        return;
      }
      if (!poolStatus.status.healthy) {
        setError("Indexer is unhealthy — wait until /status reports healthy.");
        return;
      }

      setStatus("Loading Merkle leaves…");
      let leavesRes = await getPoolLeaves(0);
      if (!leavesRes.ok) {
        setError(leavesRes.error);
        return;
      }

      let leafIndex =
        note.leafIndex ??
        findLeafIndex(leavesRes.data.leaves, note.commitment);
      if (leafIndex < 0) {
        setError(
          "Commitment not found in the pool tree yet. Wait for the deposit to index.",
        );
        return;
      }

      // Get k either directly (v2) or from salt derivation (v1/Collect);
      // spendSk comes from the merchant spend key.
      let k: string;

      setStatus("Deriving spend key…");
      const spendKeys = await deriveSpendKey(session.walletAddress);
      if (!spendKeys.ok) {
        setError(spendKeys.error);
        return;
      }

      if (note.k) {
        k = note.k;
      } else if (note.salt) {
        setStatus("Deriving note secrets…");
        const derived = await deriveNoteSecrets(
          spendKeys.keys.spendSecret,
          note.salt,
        );
        k = derived.k;
      } else {
        setError("Note has no secret data — cannot withdraw.");
        return;
      }

      const recipientField = recipientFieldHex(recipient);

      const attempt = async (leaves: string[], index: number) => {
        setStatus("Building unshield proof…");
        const proved = await buildUnshieldProof({
          spendSk: spendKeys.keys.spendSecret,
          k,
          amountBaseUnits: note.amountBaseUnits,
          leafIndex: index,
          leaves,
          recipientFieldHex: recipientField,
        });
        if (!proved.ok) return proved;
        setStatus("Sign unshield in Freighter…");
        return submitPoolUnshield({
          fromAddress: session.walletAddress,
          proofHex: proved.result.proof,
          rootHex: proved.result.root,
          nullifierHex: proved.result.nullifier,
          recipientAddress: recipient,
          amountBaseUnits: proved.result.amountBaseUnits,
          changeCommitmentHex: proved.result.changeCm,
        });
      };

      let submitted = await attempt(leavesRes.data.leaves, leafIndex);
      if (
        !submitted.ok &&
        /UnknownRoot|unknown root/i.test(submitted.error)
      ) {
        setStatus("Root stale — refetching leaves…");
        leavesRes = await getPoolLeaves(0);
        if (!leavesRes.ok) {
          setError(leavesRes.error);
          return;
        }
        leafIndex = findLeafIndex(leavesRes.data.leaves, note.commitment);
        if (leafIndex < 0) {
          setError("Commitment missing after leaf refresh.");
          return;
        }
        submitted = await attempt(leavesRes.data.leaves, leafIndex);
      }

      if (!submitted.ok) {
        setError(submitted.error);
        return;
      }

      // Update the appropriate store
      if (note.origin === "collect") {
        await updateNote(note.id, {
          spent: true,
          leafIndex,
        });
      } else {
        await updateNoteV2(note.commitment, {
          spent: true,
          leafIndex,
        });
      }

      setStatus(`Withdrawn — tx ${submitted.hash.slice(0, 10)}…`);
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  const readyNotes = notes.filter((n) => n.status === "ready");
  const readyTotal = readyNotes.reduce(
    (sum, n) => sum + Number(n.amount || 0),
    0,
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C9A46A] uppercase">
          Balances
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
          Treasury
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Shielded notes from private payment links, plus mock vault balances.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#E7B66D]/70 bg-gradient-to-br from-[#FBF7F0] to-white px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#C9A46A] uppercase">
              Shielded (ready)
            </p>
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#4A63BE] text-white">
              <Shield className="size-4" strokeWidth={1.9} />
            </span>
          </div>
          <p className="mt-3 text-[28px] leading-none font-semibold tracking-tight text-slate-950">
            {readyTotal.toFixed(2)} XLM
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {readyNotes.length} note(s) withdrawable
          </p>
        </div>
        {treasury.balances.map((balance) => (
          <div
            key={balance.asset}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-5"
          >
            <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
              {balance.asset}
            </p>
            <p className="mt-3 text-[28px] leading-none font-semibold tracking-tight text-slate-950">
              {balance.amount}
            </p>
            <p className="mt-2 text-xs font-medium text-slate-500">
              {balance.status}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
              Private notes
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              Shielded history
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Stored in this browser; recovered via viewing key.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading || scanState === "scanning"}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {scanState === "scanning" ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <RefreshCw className="size-3.5" />
                Refresh
              </>
            )}
          </button>
        </div>

        {scanState === "indexer_down" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="size-4 shrink-0 text-amber-600" />
            Indexer unavailable. Some notes may not appear.
          </div>
        )}

        {error ? (
          <p className="mt-4 text-sm text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="mt-2 text-xs text-slate-500">{status}</p>
        ) : null}

        {loading ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" />
            Loading notes…
          </p>
        ) : notes.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
            {scanState === "empty"
              ? "No private notes yet. Create a private payment link or receive a private transfer."
              : "No private notes yet. Create a private payment link from Collect."}
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_110px_minmax(140px,auto)] gap-2 border-b border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase max-sm:hidden">
              <span>Amount</span>
              <span>Note</span>
              <span>Status</span>
              <span className="text-right">Action</span>
            </div>
            <ul>
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="grid grid-cols-1 items-center gap-3 border-b border-slate-100 px-3.5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_110px_minmax(140px,auto)] sm:gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {note.amount} XLM
                    </p>
                    <p className="mt-0.5 text-xs capitalize text-slate-400 sm:hidden">
                      {note.origin} · leaf {note.leafIndex ?? "—"}
                    </p>
                  </div>
                  <div className="min-w-0 max-sm:hidden">
                    <p className="truncate font-mono text-[12px] text-slate-600">
                      {note.id.slice(0, 10)}…
                    </p>
                    <p className="mt-0.5 text-xs capitalize text-slate-400">
                      {note.origin} · leaf {note.leafIndex ?? "—"}
                    </p>
                  </div>
                  <NoteStatusPill status={note.status} />
                  <div className="sm:justify-self-end">
                    <button
                      type="button"
                      disabled={note.status !== "ready" || busyId === note.id}
                      onClick={() => void handleWithdraw(note)}
                      className={
                        note.status === "ready"
                          ? "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#121F46] to-[#4A63BE] px-3.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(18,31,70,0.18)] transition hover:brightness-110 disabled:opacity-60"
                          : "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-500 disabled:opacity-80"
                      }
                    >
                      {busyId === note.id ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Working…
                        </>
                      ) : note.status === "spent" ? (
                        "Spent"
                      ) : note.status === "pending" ? (
                        "Awaiting confirmation"
                      ) : (
                        <>
                          <Wallet className="size-3.5" />
                          Withdraw
                        </>
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteStatusPill({
  status,
}: {
  status: "pending" | "ready" | "spent";
}) {
  if (status === "ready") {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 className="size-3" strokeWidth={2.4} />
        Ready
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
        <Loader2 className="size-3" strokeWidth={2.4} />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
      Spent
    </span>
  );
}

export function WorkspaceSettingsPanel({
  workspace,
  session,
  profile,
  onProfileUpdated,
}: {
  workspace: Workspace;
  session: WalletSession;
  profile: BusinessProfile;
  onProfileUpdated?: (profile: BusinessProfile) => void;
}) {
  const [enabling, setEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [viewSecret, setViewSecret] = useState<string | null>(null);
  const [copiedPub, setCopiedPub] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  async function enablePrivateSettlement() {
    setEnabling(true);
    setError(null);
    setMessage(null);
    try {
      const viewDerived = await deriveViewingKey(session.walletAddress);
      if (!viewDerived.ok) {
        setError(viewDerived.error);
        return;
      }
      const spendDerived = await deriveSpendKey(session.walletAddress);
      if (!spendDerived.ok) {
        setError(spendDerived.error);
        return;
      }
      const updated = await updateBusinessProfile({
        viewPub: viewDerived.keys.viewPub,
        spendPub: spendDerived.keys.spendPub,
      });
      if (!updated.ok) {
        setError(updated.error);
        return;
      }
      onProfileUpdated?.(updated.profile);
      setMessage(
        "Private settlement enabled. Viewing and spend public keys saved.",
      );
    } finally {
      setEnabling(false);
    }
  }

  async function revealViewSecret() {
    setError(null);
    const derived = await deriveViewingKey(session.walletAddress);
    if (!derived.ok) {
      setError(derived.error);
      return;
    }
    setViewSecret(derived.keys.viewSecret);
    setShowSecret(true);
  }

  async function copyToClipboard(text: string, which: "pub" | "secret") {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "pub") {
        setCopiedPub(true);
        setTimeout(() => setCopiedPub(false), 2000);
      } else {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C9A46A] uppercase">
          Workspace
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Name, members, and private settlement for this workspace.
        </p>
      </div>

      <div className="grid max-w-3xl gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
                Workspace profile
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {workspace.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {workspace.tier} · {workspace.members} member
                {workspace.members === 1 ? "" : "s"} · Role {workspace.role}
              </p>
            </div>
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#4A63BE] text-sm font-semibold text-white">
              {workspace.initial || workspace.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <span className="rounded-full border border-[#E7B66D]/40 bg-[#FBF7F0] px-2.5 py-1 text-[11px] font-semibold text-[#0F1939]">
              {workspace.tier}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {workspace.role}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {workspace.members} member{workspace.members === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E7B66D]/55 bg-[#FBF7F0] p-5 lg:col-span-2">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#4A63BE] text-white">
              <Shield className="size-5" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
                  Private settlement
                </p>
                {profile.viewPub?.trim() && profile.spendPub?.trim() ? (
                  <span className="rounded-md bg-[#4A63BE] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                    Enabled
                  </span>
                ) : (
                  <span className="rounded-md bg-[#0F1939] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#E7B66D] uppercase">
                    Required
                  </span>
                )}
              </div>
              <p className="mt-1 text-base font-semibold text-slate-900">
                Freighter-backed viewing &amp; spend keys
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Derive viewing and spend keys from your Freighter wallet and
                publish only the public halves. Secrets never leave this
                browser. Auditors can decrypt with the viewing secret but cannot
                spend.
              </p>

              {profile.viewPub?.trim() && profile.spendPub?.trim() ? (
                <div className="mt-3 rounded-xl border border-[#E7B66D]/30 bg-white/90 px-3.5 py-3">
                  <p className="break-all font-mono text-[11px] text-slate-600">
                    viewPub {profile.viewPub.slice(0, 18)}… · spendPub{" "}
                    {profile.spendPub.slice(0, 18)}…
                  </p>
                </div>
              ) : (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/80 px-3.5 py-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  Not enabled yet — required before creating private links.
                </div>
              )}

              {error ? (
                <p className="mt-3 text-sm text-rose-600" role="alert">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p className="mt-3 text-sm font-medium text-emerald-700">
                  {message}
                </p>
              ) : null}

              <button
                type="button"
                disabled={enabling}
                onClick={() => void enablePrivateSettlement()}
                className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#121F46] to-[#4A63BE] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {enabling ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing…
                  </>
                ) : profile.viewPub?.trim() && profile.spendPub?.trim() ? (
                  "Rotate / re-enable"
                ) : (
                  "Enable private settlement"
                )}
              </button>
            </div>
          </div>
        </div>

        {profile.viewPub?.trim() ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FBF7F0] text-[#C9A46A]">
                <Shield className="size-5" strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
                  Auditor disclosure
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  Share decrypt access carefully
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  Share the viewing <span className="font-medium">secret</span>{" "}
                  only with auditors you trust. It decrypts private payment
                  amounts but cannot spend — spending requires the separate
                  spend key, which stays in this browser.
                </p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-[#F8F9FC] px-3.5 py-3">
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
                      Viewing public key (safe to share)
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-[11px] text-slate-700">
                        {profile.viewPub}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          void copyToClipboard(profile.viewPub!, "pub")
                        }
                        className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {copiedPub ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#E7B66D]/40 bg-[#FBF7F0] px-3.5 py-3">
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-[#C9A46A] uppercase">
                      Viewing secret (decrypts amounts — cannot spend)
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Anyone with this secret can decrypt notes addressed to
                      you, but cannot withdraw or transfer them. Prefer
                      exporting a redacted audit report when possible.
                    </p>
                    {showSecret && viewSecret ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded-lg border border-[#E7B66D]/30 bg-white px-2.5 py-1.5 font-mono text-[11px] text-slate-700">
                          {viewSecret}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            void copyToClipboard(viewSecret, "secret")
                          }
                          className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {copiedSecret ? "Copied" : "Copy"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSecret(false);
                            setViewSecret(null);
                          }}
                          className="inline-flex h-9 items-center rounded-xl px-3 text-xs font-semibold text-slate-500 transition hover:bg-white/70"
                        >
                          Hide
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void revealViewSecret()}
                        className="mt-3 inline-flex h-10 items-center rounded-xl border border-[#E7B66D]/50 bg-white px-4 text-sm font-semibold text-[#0F1939] transition hover:bg-[#F8F0E2]"
                      >
                        Reveal secret (requires signature)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}


