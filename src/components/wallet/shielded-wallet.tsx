"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Shield, Wallet, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FREIGHTER_INSTALL_URL } from "@/lib/freighter-connect";
import { connectFreighterWallet } from "@/lib/freighter-tx";
import {
  deriveViewingKey,
  deriveSpendKey,
  randomSaltHex,
  deriveNoteSecrets,
} from "@/lib/hypertron-viewkey";
import { buildDepositProof } from "@/lib/hypertron-prover";
import { submitPoolDeposit } from "@/lib/hypertron-pool";
import {
  putNoteV2,
  listUnspentNotesV2,
  getWalletBalance,
  type StoredNoteV2,
} from "@/lib/hypertron-note-store-v2";
import { fullScan, type ScanState } from "@/lib/hypertron-note-scan";
import {
  fromBaseUnits,
  getStellarExpertTxUrl,
} from "@/lib/stellar-network";
import { cn } from "@/lib/utils";

const DENOMINATIONS = ["100", "500", "1000"];

export function ShieldedWallet() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [viewSecret, setViewSecret] = useState<string | null>(null);
  const [spendSecret, setSpendSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [notes, setNotes] = useState<StoredNoteV2[]>([]);
  const [balance, setBalance] = useState<{
    totalBaseUnits: string;
    spendableBaseUnits: string;
    largestNoteBaseUnits: string;
    noteCount: number;
    spendableCount: number;
  } | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!wallet) return;
    const [bal, notesList] = await Promise.all([
      getWalletBalance(wallet),
      listUnspentNotesV2(wallet),
    ]);
    setBalance(bal);
    setNotes(notesList);
  }, [wallet]);

  const doScan = useCallback(async () => {
    if (!wallet || !viewSecret || !spendSecret) return;
    setScanState("scanning");
    const result = await fullScan(wallet, viewSecret, spendSecret);
    setScanState(result.state);
    if (result.error) setError(result.error);
    await refreshBalance();
  }, [wallet, viewSecret, spendSecret, refreshBalance]);

  useEffect(() => {
    if (wallet && viewSecret && spendSecret) {
      void doScan();
    }
  }, [wallet, viewSecret, spendSecret, doScan]);

  async function handleConnect() {
    setError(null);
    setBusy(true);
    setStatus("Connecting wallet…");

    try {
      const result = await connectFreighterWallet();
      if (!result.ok) {
        setError(result.error);
        setBusy(false);
        setStatus(null);
        return;
      }

      setWallet(result.address);
      setStatus("Deriving viewing key…");

      const vkResult = await deriveViewingKey(result.address);
      if (!vkResult.ok) {
        setError(vkResult.error);
        setBusy(false);
        setStatus(null);
        return;
      }

      setViewSecret(vkResult.keys.viewSecret);
      setStatus("Deriving spend key…");

      const skResult = await deriveSpendKey(result.address);
      if (!skResult.ok) {
        setError(skResult.error);
        setBusy(false);
        setStatus(null);
        return;
      }

      setSpendSecret(skResult.keys.spendSecret);
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleTopUp(amountDisplay: string) {
    if (!wallet || !spendSecret) return;

    setBusy(true);
    setError(null);
    setStatus("Building deposit proof…");
    setTxHash(null);

    try {
      const salt = randomSaltHex();
      const secrets = await deriveNoteSecrets(spendSecret, salt);

      const proofResult = await buildDepositProof(amountDisplay, secrets);
      if (!proofResult.ok) {
        setError(proofResult.error);
        return;
      }

      setStatus("Sign deposit in Freighter…");

      const submitResult = await submitPoolDeposit({
        fromAddress: wallet,
        amountBaseUnits: proofResult.result.amountBaseUnits,
        commitmentHex: proofResult.result.commitment,
        proofHex: proofResult.result.proof,
      });

      if (!submitResult.ok) {
        setError(submitResult.error);
        return;
      }

      setTxHash(submitResult.hash);

      const note: StoredNoteV2 = {
        commitment: proofResult.result.commitment,
        ownerWallet: wallet,
        ownerPk: proofResult.result.ownerPk,
        k: proofResult.result.k,
        amount: amountDisplay,
        amountBaseUnits: proofResult.result.amountBaseUnits,
        leafIndex: null,
        spent: false,
        origin: "topup",
        salt,
        createdAt: Date.now(),
      };

      await putNoteV2(note);
      setStatus("Deposit submitted. Waiting for confirmation…");

      await new Promise((r) => setTimeout(r, 3000));
      await doScan();

      setStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Top-up failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-svh bg-[#F8FAFC] px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-100">
            <Shield className="size-7 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Shielded Wallet
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Shield XLM to pay merchants privately.
          </p>
        </div>

        {!wallet ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm text-slate-600">
              Connect your Freighter wallet to view and manage your shielded
              balance.
            </p>
            <Button
              type="button"
              className="h-11 w-full bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
              onClick={handleConnect}
              disabled={busy}
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {status || "Connecting…"}
                </span>
              ) : (
                <>
                  <Wallet className="mr-2 size-4" />
                  Connect Freighter
                </>
              )}
            </Button>
            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{error}</p>
                {error.toLowerCase().includes("install") && (
                  <a
                    href={FREIGHTER_INSTALL_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block font-medium text-[#2563EB] underline"
                  >
                    Install Freighter
                  </a>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="truncate text-xs font-mono text-slate-500">
                {wallet}
              </p>
            </div>

            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-amber-700/80 uppercase">
                    Shielded Balance
                  </p>
                  {scanState === "scanning" ? (
                    <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-slate-400">
                      <Loader2 className="size-5 animate-spin" />
                      Scanning…
                    </p>
                  ) : (
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                      {balance
                        ? `${fromBaseUnits(balance.spendableBaseUnits)} XLM`
                        : "—"}
                    </p>
                  )}
                  {balance && balance.spendableCount > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      {balance.spendableCount} note(s) · largest:{" "}
                      {fromBaseUnits(balance.largestNoteBaseUnits)} XLM
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => void doScan()}
                  disabled={scanState === "scanning"}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <RefreshCw
                    className={cn(
                      "size-4",
                      scanState === "scanning" && "animate-spin",
                    )}
                  />
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-medium text-slate-700">
                Top up with XLM
              </p>
              <p className="mb-4 text-xs text-slate-500">
                Choose a denomination to shield. Deposits are public; payments
                from shielded balance are private.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {DENOMINATIONS.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    className="h-12 text-base font-semibold"
                    onClick={() => void handleTopUp(amount)}
                    disabled={busy}
                  >
                    {amount} XLM
                  </Button>
                ))}
              </div>

              {busy && status && (
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="size-4 animate-spin" />
                  {status}
                </p>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {txHash && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-800">
                    Deposit submitted
                  </p>
                  <a
                    href={getStellarExpertTxUrl(txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                  >
                    View on explorer
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
            </div>

            {notes.length > 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-3 text-sm font-medium text-slate-700">
                  Your notes
                </p>
                <ul className="divide-y divide-slate-100">
                  {notes.slice(0, 10).map((note) => (
                    <li
                      key={note.commitment}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {note.amount} XLM
                        </p>
                        <p className="text-xs text-slate-500">
                          {note.origin} ·{" "}
                          {note.leafIndex != null ? "confirmed" : "pending"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          note.spent
                            ? "bg-slate-100 text-slate-500"
                            : note.leafIndex != null
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {note.spent
                          ? "spent"
                          : note.leafIndex != null
                            ? "ready"
                            : "pending"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
