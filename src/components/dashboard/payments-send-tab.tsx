"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCheck,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  RefreshCw,
  Shield,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WalletSession } from "@/lib/auth";
import type { BusinessProfile } from "@/lib/business";
import {
  getPoolLeaves,
  getPoolNullifiers,
  getPoolStatus,
  findLeafIndex,
} from "@/lib/hypertron-indexer";
import { fullScan } from "@/lib/hypertron-note-scan";
import {
  listNotes,
  updateNote,
} from "@/lib/hypertron-note-store";
import {
  listUnspentNotesV2,
  markNoteSpent,
  putNoteV2,
  selectNotesForAmount,
  updateNoteV2,
  type StoredNoteV2,
} from "@/lib/hypertron-note-store-v2";
import {
  recipientFieldHex,
  submitPoolTransfer,
  submitPoolTransferN,
  submitPoolUnshield,
} from "@/lib/hypertron-pool";
import {
  buildTransferProof,
  buildTransferNProof,
  buildUnshieldProof,
  computeNullifier,
} from "@/lib/hypertron-prover";
import {
  deriveNoteSecrets,
  deriveSpendKey,
  deriveViewingKey,
} from "@/lib/hypertron-viewkey";
import {
  fromBaseUnits,
  getStellarExpertTxUrl,
  toBaseUnits,
} from "@/lib/stellar-network";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/mockdata";

const fieldCls =
  "h-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-[#4A63BE] focus-visible:ring-[#4A63BE]/20";

const primaryBtnCls =
  "inline-flex h-11 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#121F46] to-[#4A63BE] px-6 font-semibold text-white shadow-[0_8px_20px_rgba(18,31,70,0.22)] hover:brightness-110";

type SendMode = "private" | "public";

function normalizeHex(value: string): string {
  return value.trim().toLowerCase().replace(/^0x/, "");
}

function isLikelyPubKey(value: string): boolean {
  const hex = normalizeHex(value);
  return /^[0-9a-f]{64}$/.test(hex);
}

function isStellarAddress(value: string): boolean {
  const trimmed = value.trim();
  return /^G[A-Z2-7]{55}$/.test(trimmed);
}

function explorerTx(hash: string) {
  return getStellarExpertTxUrl(hash);
}

export function PaymentsSendTab({
  workspace,
  session,
  profile,
}: {
  workspace: Workspace;
  session: WalletSession;
  profile: BusinessProfile;
}) {
  const [mode, setMode] = useState<SendMode>("private");
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientViewPub, setRecipientViewPub] = useState("");
  const [recipientSpendPub, setRecipientSpendPub] = useState("");
  const [memo, setMemo] = useState("");
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [spendableBaseUnits, setSpendableBaseUnits] = useState("0");
  const [noteCount, setNoteCount] = useState(0);
  const [readyNotes, setReadyNotes] = useState<StoredNoteV2[]>([]);

  const vaultName = `${workspace.name} Vault`;

  const refreshBalance = useCallback(async () => {
    setLoadingBalance(true);
    setError(null);
    try {
      const viewKeys = await deriveViewingKey(session.walletAddress);
      if (!viewKeys.ok) {
        setError(viewKeys.error);
        return;
      }
      const spendKeys = await deriveSpendKey(session.walletAddress);
      if (!spendKeys.ok) {
        setError(spendKeys.error);
        return;
      }

      await fullScan(
        session.walletAddress,
        viewKeys.keys.viewSecret,
        spendKeys.keys.spendSecret,
      );

      const leavesRes = await getPoolLeaves(0);
      const nullsRes = await getPoolNullifiers();
      const leaves = leavesRes.ok ? leavesRes.data.leaves : [];
      const nullifiers = new Set(
        (nullsRes.ok ? nullsRes.nullifiers : []).map((n) =>
          normalizeHex(n),
        ),
      );

      const v1 = await listNotes(workspace.id);
      for (const note of v1) {
        if (note.spent || !note.salt) continue;
        let leafIndex = note.leafIndex ?? null;
        if (leafIndex == null && leaves.length) {
          const found = findLeafIndex(leaves, note.commitment);
          if (found >= 0) {
            leafIndex = found;
            await updateNote(note.linkId, { leafIndex: found });
          }
        }
        if (leafIndex == null) continue;

        const { k } = await deriveNoteSecrets(
          spendKeys.keys.spendSecret,
          note.salt,
        );
        const nf = await computeNullifier(spendKeys.keys.spendSecret, k);
        if (nullifiers.has(normalizeHex(nf))) {
          await updateNote(note.linkId, { spent: true });
          continue;
        }

        await putNoteV2({
          commitment: note.commitment,
          ownerWallet: session.walletAddress,
          ownerPk: spendKeys.keys.spendPub,
          k,
          amount: note.amount,
          amountBaseUnits: note.amountBaseUnits,
          leafIndex,
          spent: false,
          origin: "collect",
          linkId: note.linkId,
          salt: note.salt,
          createdAt: note.createdAt,
        });
      }

      const unspent = await listUnspentNotesV2(session.walletAddress);
      const ready = unspent.filter((n) => n.leafIndex != null && !n.spent);
      let spendable = BigInt(0);
      for (const note of ready) {
        spendable += BigInt(note.amountBaseUnits);
      }
      setReadyNotes(ready);
      setNoteCount(ready.length);
      setSpendableBaseUnits(spendable.toString());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load treasury notes.",
      );
    } finally {
      setLoadingBalance(false);
    }
  }, [session.walletAddress, workspace.id]);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshBalance();
    });
  }, [refreshBalance]);

  const spendableLabel = useMemo(
    () => `${fromBaseUnits(spendableBaseUnits)} XLM`,
    [spendableBaseUnits],
  );

  async function copyHash() {
    if (!txHash) return;
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTxHash(null);
    setStatus(null);

    const normalizedAmount = amount.replace(/,/g, "").trim();
    if (!normalizedAmount || Number(normalizedAmount) <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    const amountBaseUnits = toBaseUnits(normalizedAmount);
    if (BigInt(amountBaseUnits) > BigInt(spendableBaseUnits)) {
      setError("Insufficient spendable balance in treasury notes.");
      return;
    }

    if (mode === "public" && !isStellarAddress(recipientAddress)) {
      setError("Enter a valid Stellar address (starts with G).");
      return;
    }

    if (mode === "private") {
      if (!isLikelyPubKey(recipientSpendPub)) {
        setError("Recipient spend pub must be a 32-byte hex key (64 hex chars).");
        return;
      }
      if (!isLikelyPubKey(recipientViewPub)) {
        setError("Recipient view pub must be a 32-byte hex key (64 hex chars).");
        return;
      }
    }

    setBusy(true);
    try {
      setStatus("Checking indexer…");
      const poolStatus = await getPoolStatus();
      if (!poolStatus.ok) {
        setError(poolStatus.error);
        return;
      }
      if (!poolStatus.status.healthy) {
        setError("Indexer is unhealthy — wait until the pool is healthy.");
        return;
      }

      const spendKeys = await deriveSpendKey(session.walletAddress);
      if (!spendKeys.ok) {
        setError(spendKeys.error);
        return;
      }
      const viewKeys = await deriveViewingKey(session.walletAddress);
      if (!viewKeys.ok) {
        setError(viewKeys.error);
        return;
      }

      await fullScan(
        session.walletAddress,
        viewKeys.keys.viewSecret,
        spendKeys.keys.spendSecret,
      );
      const unspent = await listUnspentNotesV2(session.walletAddress);
      const pick = selectNotesForAmount(unspent, amountBaseUnits);
      if (!pick.ok) {
        setError(
          pick.reason === "need_fourth"
            ? "This amount needs four notes (or a larger one). Top up or wait for another note to confirm."
            : "Not enough confirmed notes to cover this amount.",
        );
        return;
      }

      const spendableNotes = pick.notes;
      for (const note of spendableNotes) {
        if (note.leafIndex == null) {
          setError("A selected note is not confirmed on-chain yet.");
          return;
        }
      }

      setStatus("Fetching pool leaves…");
      let leavesRes = await getPoolLeaves(0);
      if (!leavesRes.ok) {
        setError(leavesRes.error);
        return;
      }

      if (mode === "private") {
        await sendPrivate({
          spendableNotes,
          amountBaseUnits,
          spendSk: spendKeys.keys.spendSecret,
          spendPub: spendKeys.keys.spendPub,
          viewPub: viewKeys.keys.viewPub,
          recipientSpendPub: normalizeHex(recipientSpendPub),
          recipientViewPub: normalizeHex(recipientViewPub),
          leaves: leavesRes.data.leaves,
          wallet: session.walletAddress,
          setStatus,
        });
      } else {
        await sendPublic({
          spendableNotes,
          amountBaseUnits,
          spendSk: spendKeys.keys.spendSecret,
          spendPub: spendKeys.keys.spendPub,
          recipientAddress: recipientAddress.trim(),
          leaves: leavesRes.data.leaves,
          wallet: session.walletAddress,
          setStatus,
          refetchLeaves: async () => {
            leavesRes = await getPoolLeaves(0);
            return leavesRes;
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setBusy(false);
      setStatus(null);
      void refreshBalance();
    }
  }

  async function sendPrivate(input: {
    spendableNotes: StoredNoteV2[];
    amountBaseUnits: string;
    spendSk: string;
    spendPub: string;
    viewPub: string;
    recipientSpendPub: string;
    recipientViewPub: string;
    leaves: string[];
    wallet: string;
    setStatus: (s: string) => void;
  }) {
    const inputV = input.spendableNotes.reduce(
      (s, n) => s + BigInt(n.amountBaseUnits),
      BigInt(0),
    );
    const payV = BigInt(input.amountBaseUnits);
    const changeV = inputV - payV;
    if (changeV < BigInt(0)) {
      setError("Insufficient note balance.");
      return;
    }

    const arity = input.spendableNotes.length;
    if (arity !== 1 && arity !== 2 && arity !== 4) {
      setError("Unsupported note set size.");
      return;
    }

    input.setStatus(
      arity === 4
        ? "Building 4-input transfer proof (this can take a minute)…"
        : arity === 2
          ? "Building 2-input transfer proof (20-30s)…"
          : "Building transfer proof (10-15s)…",
    );

    const common = {
      spendSk: input.spendSk,
      leaves: input.leaves,
      out1OwnerPk: input.recipientSpendPub,
      out1V: input.amountBaseUnits,
      out2OwnerPk: input.spendPub,
      out2V: changeV.toString(),
      recipientViewPub: input.recipientViewPub,
      selfViewPub: input.viewPub,
    };

    let submit:
      | { ok: true; hash: string }
      | { ok: false; error: string };
    let outCm2 = "";
    let out2 = { ownerPk: "", k: "", v: "" };

    if (arity === 1) {
      const note = input.spendableNotes[0];
      const proofResult = await buildTransferProof({
        ...common,
        k: note.k,
        v: note.amountBaseUnits,
        leafIndex: note.leafIndex!,
      });
      if (!proofResult.ok) {
        setError(proofResult.error);
        return;
      }
      outCm2 = proofResult.result.outCm2;
      out2 = proofResult.result.out2;
      input.setStatus("Sign transfer in Freighter…");
      submit = await submitPoolTransfer({
        fromAddress: input.wallet,
        proofHex: proofResult.result.proof,
        rootHex: proofResult.result.root,
        nullifierHex: proofResult.result.nullifier,
        outCommitment1Hex: proofResult.result.outCm1,
        outCommitment2Hex: proofResult.result.outCm2,
        note1BlobHex: proofResult.result.recipientBlob,
        note2BlobHex: proofResult.result.changeBlob,
      });
    } else {
      const proofResult = await buildTransferNProof({
        ...common,
        arity,
        notes: input.spendableNotes.map((n) => ({
          k: n.k,
          v: n.amountBaseUnits,
          leafIndex: n.leafIndex!,
        })),
      });
      if (!proofResult.ok) {
        setError(proofResult.error);
        return;
      }
      outCm2 = proofResult.result.outCm2;
      out2 = proofResult.result.out2;
      input.setStatus("Sign transfer in Freighter…");
      submit = await submitPoolTransferN({
        fromAddress: input.wallet,
        proofHex: proofResult.result.proof,
        rootHex: proofResult.result.root,
        nullifierHexes: proofResult.result.nullifiers,
        outCommitment1Hex: proofResult.result.outCm1,
        outCommitment2Hex: proofResult.result.outCm2,
        note1BlobHex: proofResult.result.recipientBlob,
        note2BlobHex: proofResult.result.changeBlob,
      });
    }

    if (!submit.ok) {
      setError(submit.error);
      return;
    }

    for (const note of input.spendableNotes) {
      await markNoteSpent(note.commitment);
      if (note.origin === "collect" && note.linkId) {
        await updateNote(note.linkId, { spent: true });
      }
    }

    if (changeV > BigInt(0)) {
      await putNoteV2({
        commitment: outCm2,
        ownerWallet: input.wallet,
        ownerPk: out2.ownerPk,
        k: out2.k,
        amount: fromBaseUnits(changeV.toString()),
        amountBaseUnits: changeV.toString(),
        leafIndex: null,
        spent: false,
        origin: "change",
        createdAt: Date.now(),
      });
    }

    setTxHash(submit.hash);
    setStatus("Private transfer submitted. Amount is hidden on-chain.");
  }

  async function sendPublic(input: {
    spendableNotes: StoredNoteV2[];
    amountBaseUnits: string;
    spendSk: string;
    spendPub: string;
    recipientAddress: string;
    leaves: string[];
    wallet: string;
    setStatus: (s: string) => void;
    refetchLeaves: () => Promise<
      | { ok: true; data: { leaves: string[] } }
      | { ok: false; error: string }
    >;
  }) {
    const inputV = input.spendableNotes.reduce(
      (s, n) => s + BigInt(n.amountBaseUnits),
      BigInt(0),
    );
    const payV = BigInt(input.amountBaseUnits);

    // Current unshield circuit is full-note (change = 0). Require an exact match.
    if (input.spendableNotes.length !== 1 || inputV !== payV) {
      setError(
        "Public send requires a single note that exactly matches the amount. Pick a matching note amount, or use Private send for partial amounts.",
      );
      return;
    }

    const note = input.spendableNotes[0];
    let leafIndex = note.leafIndex!;
    let leaves = input.leaves;

    const attempt = async (tree: string[], index: number) => {
      input.setStatus("Building unshield proof…");
      const proved = await buildUnshieldProof({
        spendSk: input.spendSk,
        k: note.k,
        amountBaseUnits: note.amountBaseUnits,
        leafIndex: index,
        leaves: tree,
        recipientFieldHex: recipientFieldHex(input.recipientAddress),
      });
      if (!proved.ok) return proved;
      input.setStatus("Sign unshield in Freighter…");
      return submitPoolUnshield({
        fromAddress: input.wallet,
        proofHex: proved.result.proof,
        rootHex: proved.result.root,
        nullifierHex: proved.result.nullifier,
        recipientAddress: input.recipientAddress,
        amountBaseUnits: proved.result.amountBaseUnits,
        changeCommitmentHex: proved.result.changeCm,
      });
    };

    let submitted = await attempt(leaves, leafIndex);
    if (
      !submitted.ok &&
      /UnknownRoot|unknown root/i.test(submitted.error)
    ) {
      input.setStatus("Root stale — refetching leaves…");
      const refreshed = await input.refetchLeaves();
      if (!refreshed.ok) {
        setError(refreshed.error);
        return;
      }
      leaves = refreshed.data.leaves;
      leafIndex = findLeafIndex(leaves, note.commitment);
      if (leafIndex < 0) {
        setError("Commitment missing after leaf refresh.");
        return;
      }
      submitted = await attempt(leaves, leafIndex);
    }

    if (!submitted.ok) {
      setError(submitted.error);
      return;
    }

    await markNoteSpent(note.commitment);
    await updateNoteV2(note.commitment, { spent: true, leafIndex });
    if (note.origin === "collect" && note.linkId) {
      await updateNote(note.linkId, { spent: true, leafIndex });
    }

    setTxHash(submitted.hash);
    setStatus("Public payout submitted to the recipient wallet.");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-5">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
              Disbursements
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
              Send a Payment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Pay from shielded treasury notes on the Hypertron pool. Private
              keeps the amount hidden; public unshields XLM to a Stellar wallet.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshBalance()}
            disabled={loadingBalance || busy}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingBalance ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Refresh balance
          </button>
        </div>

        {error ? (
          <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {txHash ? (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-800">
                Payment submitted
              </p>
              <p className="mt-0.5 truncate font-mono text-xs text-emerald-700">
                {txHash}
              </p>
              {memo.trim() ? (
                <p className="mt-1 text-xs text-emerald-700/80">
                  Memo note: {memo.trim()}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-2 rounded-xl border-emerald-200 bg-white text-emerald-800"
                onClick={() => void copyHash()}
              >
                {copied ? (
                  <CheckCheck className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? "Copied" : "Copy tx"}
              </Button>
              <a
                href={explorerTx(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-2.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-50"
              >
                Explorer
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        ) : null}

        <form onSubmit={(e) => void handleSend(e)} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Send mode
                </Label>
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                  {(
                    [
                      ["private", "Private"],
                      ["public", "Public"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMode(id)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                        mode === id
                          ? "bg-gradient-to-r from-[#121F46] to-[#4A63BE] text-white"
                          : "text-slate-600 hover:text-slate-900",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="send-amount" className="text-sm font-medium text-slate-700">
                  Amount
                </Label>
                <div className="flex overflow-hidden rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-[#4A63BE]/20">
                  <Input
                    id="send-amount"
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-11 flex-1 rounded-none border-0 focus-visible:ring-0"
                    placeholder="0.00"
                    required
                  />
                  <div className="flex h-11 items-center gap-2 border-l border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                    XLM
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Spendable:{" "}
                  <span className="font-medium text-slate-700">
                    {loadingBalance ? "…" : spendableLabel}
                  </span>{" "}
                  · {noteCount} ready note{noteCount === 1 ? "" : "s"}
                </p>
              </div>

              {mode === "public" ? (
                <div className="space-y-2">
                  <Label
                    htmlFor="recipient-g"
                    className="text-sm font-medium text-slate-700"
                  >
                    Recipient wallet
                  </Label>
                  <div className="relative">
                    <Input
                      id="recipient-g"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="G…"
                      className={cn(fieldCls, "pr-10 font-mono text-[13px]")}
                      required
                    />
                    <User className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="recipient-spend"
                      className="text-sm font-medium text-slate-700"
                    >
                      Recipient spend pub
                    </Label>
                    <Input
                      id="recipient-spend"
                      value={recipientSpendPub}
                      onChange={(e) => setRecipientSpendPub(e.target.value)}
                      placeholder="64-char hex owner_pk"
                      className={cn(fieldCls, "font-mono text-[13px]")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="recipient-view"
                      className="text-sm font-medium text-slate-700"
                    >
                      Recipient view pub
                    </Label>
                    <Input
                      id="recipient-view"
                      value={recipientViewPub}
                      onChange={(e) => setRecipientViewPub(e.target.value)}
                      placeholder="64-char hex viewing key"
                      className={cn(fieldCls, "font-mono text-[13px]")}
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label
                  htmlFor="send-memo"
                  className="text-sm font-medium text-slate-700"
                >
                  Memo{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <Input
                  id="send-memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Internal note — not written on-chain for private sends"
                  className={fieldCls}
                  maxLength={140}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-[#F8F9FC] p-5">
              <div className="flex items-start gap-2">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
                    Source &amp; rail
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900">
                    Treasury notes → recipient
                  </h3>
                </div>
                <Info className="ml-auto size-3.5 text-slate-400" />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#4A63BE] text-white">
                    <Wallet className="size-5" strokeWidth={1.9} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{vaultName}</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {loadingBalance ? "Scanning…" : spendableLabel}
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Ready
                </span>
              </div>

              <div
                className={cn(
                  "space-y-2 rounded-xl border px-4 py-3",
                  mode === "private"
                    ? "border-[#E7B66D]/55 bg-[#FBF7F0]"
                    : "border-slate-200 bg-white",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">
                    {mode === "private" ? "Private transfer" : "Public unshield"}
                  </p>
                  {mode === "private" ? (
                    <span className="rounded-md bg-[#4A63BE] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                      Amount hidden
                    </span>
                  ) : (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600 uppercase">
                      Exact note
                    </span>
                  )}
                </div>
                <div className="flex gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2.5">
                  <Shield
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      mode === "private" ? "text-[#C9A46A]" : "text-slate-400",
                    )}
                  />
                  <p className="text-xs leading-relaxed text-slate-500">
                    {mode === "private"
                      ? "Spends 1/2/4 notes via pool transfer. Recipient needs published spend + view pubs (Settings → Private settlement)."
                      : "Unshields one note whose value equals the amount to a G-address. Amount is public on exit."}
                  </p>
                </div>
              </div>

              {readyNotes.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">
                    Ready note amounts
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {readyNotes.slice(0, 8).map((note) => (
                      <button
                        key={note.commitment}
                        type="button"
                        onClick={() => setAmount(note.amount)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-[#C9A46A]/60 hover:bg-[#FBF7F0]"
                      >
                        {note.amount} XLM
                      </button>
                    ))}
                    {readyNotes.length > 8 ? (
                      <span className="px-1 text-[11px] text-slate-400">
                        +{readyNotes.length - 8} more
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {!profile.viewPub?.trim() || !profile.spendPub?.trim() ? (
                <p className="text-xs text-amber-700">
                  Enable private settlement in Settings so your change notes and
                  collect notes stay recoverable.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Freighter will ask you to sign the pool{" "}
              {mode === "private" ? "transfer" : "unshield"} transaction.
            </p>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              {status ? (
                <p className="text-xs text-slate-500">{status}</p>
              ) : null}
              <Button type="submit" disabled={busy || loadingBalance} className={primaryBtnCls}>
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send Payment"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
