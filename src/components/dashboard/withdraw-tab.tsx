"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, CheckCircle2, Clock, XCircle, Lock, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getExplorerTxUrl } from "@/lib/stellar-explorer";
import { fallbackBalance, fallbackWithdrawals } from "@/data/fallback";

interface WithdrawTabProps {
  businessId: string;
  walletAddress: string | null;
  receiveAddress: string | null;
}

type Withdrawal = {
  id: string;
  amount: string;
  recipientAddress: string;
  status: string;
  payoutTxHash: string | null;
  contractTxHash: string | null;
  createdAt: string;
};

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[11px] font-medium">
        <CheckCircle2 className="h-3 w-3" /> Complete
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/80 px-2 py-0.5 text-[11px] font-medium">
        <Clock className="h-3 w-3" /> Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400/80 px-2 py-0.5 text-[11px] font-medium">
      <XCircle className="h-3 w-3" /> {status}
    </span>
  );
}

export function WithdrawTab({ businessId, walletAddress, receiveAddress }: WithdrawTabProps) {
  const [balance, setBalance] = useState<{ virtualBalanceXlm: string; unspentCount: number } | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [amount, setAmount] = useState("");
  const defaultRecipient = walletAddress ?? receiveAddress ?? "";
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchBalance = useCallback(async () => {
    setBalance(fallbackBalance);
    setUsingFallback(true);
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    setWithdrawals(fallbackWithdrawals);
    setUsingFallback(true);
  }, []);

  useEffect(() => { setRecipient(walletAddress ?? receiveAddress ?? ""); }, [walletAddress, receiveAddress]);

  useEffect(() => {
    if (!businessId) {
      setBalance(fallbackBalance);
      setWithdrawals(fallbackWithdrawals);
      setUsingFallback(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([fetchBalance(), fetchWithdrawals()]).finally(() => setLoading(false));
  }, [businessId, fetchBalance, fetchWithdrawals]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null);
    const amt = amount.trim();
    if (!amt || parseFloat(amt) <= 0) { setError("Enter a valid amount."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ businessId, amount: amt, recipientAddress: recipient.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError("Withdrawal request could not be completed right now."); return; }
      setSuccess(data.payoutTxHash
        ? `${data.amount} XLM sent · tx: ${data.payoutTxHash.slice(0, 16)}…`
        : `${data.amount ?? amt} XLM sent successfully.`
      );
      setAmount("");
      await fetchBalance();
      await fetchWithdrawals();
    } catch { setError("Request failed"); }
    finally { setSubmitting(false); }
  }

  const balanceNum = balance ? parseFloat(balance.virtualBalanceXlm) : 0;

  if (loading) {
    return <p className="text-white/30 text-sm">Loading balance…</p>;
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">

      {usingFallback && (
        <p className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200">
          Showing fallback demo vault data while live data is unavailable.
        </p>
      )}

      {/* ── Balance card ── */}
      <div className="rounded-2xl border border-white/[0.12] bg-transparent p-6 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.06]">
            <Lock className="h-4 w-4 text-cyan-300/90" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">Verified balance</p>
            <p className="text-xs text-white/35 mt-0.5">Funds securely pooled — client wallets are never exposed.</p>
          </div>
        </div>

        <div className="mt-5 flex items-end gap-3">
          <p className="text-4xl font-bold tracking-tight text-white">
            {balance?.virtualBalanceXlm ?? "0"}
            <span className="ml-2 text-lg font-medium text-white/40">XLM</span>
          </p>
        </div>
        <p className="mt-1.5 text-xs text-white/30">
          {balance?.unspentCount ?? 0} payment{(balance?.unspentCount ?? 0) !== 1 ? "s" : ""} available to withdraw
        </p>
      </div>

      {/* ── Withdraw form ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.12] bg-transparent p-6 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08]">
            <ArrowUpRight className="h-4 w-4 text-white/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Withdraw funds</p>
            <p className="text-xs text-white/35 mt-0.5">Hypertron reroutes funds privately through the secure vault before delivery.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="withdraw-amount" className="text-xs text-white/50">Amount (XLM)</Label>
              <Input
                id="withdraw-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 border border-white/[0.1] bg-white/[0.04] text-foreground placeholder:text-muted-foreground focus:border-white/25 focus:ring-0"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="withdraw-recipient" className="text-xs text-white/50">Recipient address (G...)</Label>
              <Input
                id="withdraw-recipient"
                type="text"
                placeholder={defaultRecipient || "GXXXXXX…"}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="h-9 border border-white/[0.1] bg-white/[0.04] font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-white/25 focus:ring-0"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <p className="text-emerald-400 text-xs">{success}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={true}
            className="w-full rounded-full border border-white/10 bg-foreground font-semibold text-background hover:opacity-90 disabled:opacity-40"
          >
            Demo mode
          </Button>

          <p className="text-center text-xs text-white/25">Demo mode: withdrawal actions are disabled.</p>
        </form>
      </div>

      {/* ── History ── */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-transparent backdrop-blur-xl">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.06]">
          <History className="h-4 w-4 text-white/30" />
          <p className="text-sm font-medium text-white">Withdrawal history</p>
          <span className="text-xs text-white/25">{withdrawals.length} record{withdrawals.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="px-5 py-3">
          {withdrawals.length === 0 ? (
            <p className="text-white/25 text-sm py-6 text-center">No withdrawals yet.</p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {withdrawals.map((w) => (
                <li key={w.id} className="py-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="text-sm font-semibold text-white">{w.amount} XLM</span>
                  <StatusBadge status={w.status} />
                  <div className="flex items-center gap-2 ml-auto">
                    {w.contractTxHash && (
                      <a href={getExplorerTxUrl(w.contractTxHash)} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400/80 transition-colors hover:text-cyan-300">
                        Contract ↗
                      </a>
                    )}
                    {w.payoutTxHash && (
                      <a href={getExplorerTxUrl(w.payoutTxHash)} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400/80 transition-colors hover:text-cyan-300">
                        Payout ↗
                      </a>
                    )}
                    <span className="text-[11px] text-white/25">
                      {new Date(w.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
