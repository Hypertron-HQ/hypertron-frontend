"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2, Shield, Wallet, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function titleCase(label: string) {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function WorkspaceOverview({ workspace }: { workspace: Workspace }) {
  return (
    <PanelShell
      eyebrow="Workspace"
      title="Overview"
      subtitle={`Pulse for ${workspace.name} — collections, settlements, and alerts.`}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {workspace.pulse.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-2xl font-semibold tracking-tight text-slate-950">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {titleCase(stat.label)}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          Latest activity
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className="font-medium text-emerald-600">
            {workspace.latest.highlight}
          </span>
          {workspace.latest.steps.map((step) => (
            <span key={step} className="contents">
              <span className="h-px w-8 bg-slate-200 sm:w-12" />
              <span>{step}</span>
            </span>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

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

  const readyTotal = notes
    .filter((n) => n.status === "ready")
    .reduce((sum, n) => sum + Number(n.amount || 0), 0);

  return (
    <PanelShell
      eyebrow="Balances"
      title="Treasury"
      subtitle="Shielded notes from private payment links, plus mock vault balances."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 px-5 py-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-amber-700/80 uppercase">
            Shielded (ready)
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {readyTotal.toFixed(2)} XLM
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {notes.filter((n) => n.status === "ready").length} note(s) withdrawable
          </p>
        </div>
        {treasury.balances.map((balance) => (
          <div
            key={balance.asset}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm"
          >
            <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
              {balance.asset}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {balance.amount}
            </p>
            <p className="mt-1 text-xs text-slate-500">{balance.status}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
              Private notes
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Stored in this browser; recovered via viewing key.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refresh()}
            disabled={loading || scanState === "scanning"}
          >
            {scanState === "scanning" ? (
              <>
                <RefreshCw className="mr-1 size-3.5 animate-spin" />
                Scanning…
              </>
            ) : (
              <>
                <RefreshCw className="mr-1 size-3.5" />
                Refresh
              </>
            )}
          </Button>
        </div>

        {scanState === "indexer_down" && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <AlertTriangle className="size-4 shrink-0" />
            Indexer unavailable. Some notes may not appear.
          </div>
        )}

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
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
          <p className="mt-6 text-sm text-slate-500">
            {scanState === "empty"
              ? "No private notes yet. Create a private payment link or receive a private transfer."
              : "No private notes yet. Create a private payment link from Collect."}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {notes.map((note) => (
              <li
                key={note.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {note.amount} XLM
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                    {note.id.slice(0, 10)}… ·{" "}
                    <span className="capitalize">{note.origin}</span> ·{" "}
                    leaf {note.leafIndex ?? "—"} · {note.status}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={note.status !== "ready" || busyId === note.id}
                  onClick={() => void handleWithdraw(note)}
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
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PanelShell>
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
    <PanelShell
      eyebrow="Workspace"
      title="Settings"
      subtitle="Name, members, and private settlement for this workspace."
    >
      <div className="max-w-lg space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Workspace name
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {workspace.name}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {workspace.tier} · {workspace.members} members · Role{" "}
            {workspace.role}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 px-5 py-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Private settlement
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Derive viewing and spend keys from your Freighter wallet and
                publish only the public halves. Secrets never leave this
                browser. Auditors can decrypt with the viewing secret but cannot
                spend.
              </p>
              {profile.viewPub?.trim() && profile.spendPub?.trim() ? (
                <p className="mt-2 break-all font-mono text-[11px] text-slate-600">
                  viewPub {profile.viewPub.slice(0, 18)}… · spendPub{" "}
                  {profile.spendPub.slice(0, 18)}…
                </p>
              ) : (
                <p className="mt-2 text-xs text-amber-800">
                  Not enabled yet — required before creating private links.
                </p>
              )}
              {error ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p className="mt-2 text-sm text-emerald-700">{message}</p>
              ) : null}
              <Button
                type="button"
                className="mt-4"
                disabled={enabling}
                onClick={() => void enablePrivateSettlement()}
              >
                {enabling
                  ? "Signing…"
                  : profile.viewPub?.trim() && profile.spendPub?.trim()
                    ? "Rotate / re-enable"
                    : "Enable private settlement"}
              </Button>
            </div>
          </div>
        </div>

        {profile.viewPub?.trim() && (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 size-5 shrink-0 text-slate-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Auditor disclosure
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Share the viewing <span className="font-medium">secret</span>{" "}
                  only with auditors you trust. It decrypts private payment
                  amounts but cannot spend — spending requires the separate
                  spend key, which stays in this browser.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
                      Viewing public key (safe to share)
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700">
                        {profile.viewPub}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          void copyToClipboard(profile.viewPub!, "pub")
                        }
                      >
                        {copiedPub ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
                      Viewing secret (decrypts amounts — cannot spend)
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Anyone with this secret can decrypt notes addressed to
                      you, but cannot withdraw or transfer them. Prefer
                      exporting a redacted audit report when possible. Never
                      confuse this with the viewing public key above.
                    </p>
                    {showSecret && viewSecret ? (
                      <div className="mt-2 flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded bg-amber-50 px-2 py-1 font-mono text-[11px] text-slate-700">
                          {viewSecret}
                        </code>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            void copyToClipboard(viewSecret, "secret")
                          }
                        >
                          {copiedSecret ? "Copied" : "Copy"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowSecret(false);
                            setViewSecret(null);
                          }}
                        >
                          Hide
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2"
                        onClick={() => void revealViewSecret()}
                      >
                        Reveal secret (requires signature)
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PanelShell>
  );
}

function PanelShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
