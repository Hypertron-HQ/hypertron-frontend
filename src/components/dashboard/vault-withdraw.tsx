"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  History,
  Wallet,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getExplorerTxUrl } from "@/lib/stellar-explorer";

interface VaultWithdrawProps {
  businessId: string;
  userWalletAddress: string | null;
}

type VaultInfo = {
  hasVault: boolean;
  vaultAddress: string | null;
  vaultType: "custodial" | "hybrid" | "external" | null;
  vaultName: string | null;
  balance: {
    xlm: string;
    usdc: string;
    xlmRaw: number;
    usdcRaw: number;
  } | null;
  network: string;
};

type Withdrawal = {
  id: string;
  amount: string;
  recipientAddress: string;
  status: string;
  payoutTxHash: string | null;
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
  if (status === "pending" || status === "pending_signature") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/80 px-2 py-0.5 text-[11px] font-medium">
        <Clock className="h-3 w-3" /> {status === "pending_signature" ? "Awaiting signature" : "Processing"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400/80 px-2 py-0.5 text-[11px] font-medium">
      <XCircle className="h-3 w-3" /> {status}
    </span>
  );
}

export function VaultWithdraw({ businessId, userWalletAddress }: VaultWithdrawProps) {
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USDC" | "XLM">("USDC");
  const [recipient, setRecipient] = useState(userWalletAddress || "");
  const [memo, setMemo] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pendingXdr, setPendingXdr] = useState<string | null>(null);
  const [pendingWithdrawalId, setPendingWithdrawalId] = useState<string | null>(null);

  const fetchVaultInfo = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/vault/treasury?businessId=${businessId}`, {
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        setVaultInfo(data);
      }
    } catch (e) {
      console.error("Failed to fetch vault info:", e);
    }
  }, [businessId]);

  const fetchWithdrawals = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/withdraw?businessId=${businessId}`, {
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (e) {
      console.error("Failed to fetch withdrawals:", e);
    }
  }, [businessId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchVaultInfo(), fetchWithdrawals()]).finally(() => setLoading(false));
  }, [fetchVaultInfo, fetchWithdrawals]);

  useEffect(() => {
    if (userWalletAddress && !recipient) {
      setRecipient(userWalletAddress);
    }
  }, [userWalletAddress, recipient]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setPendingXdr(null);
    setPendingWithdrawalId(null);

    const amt = amount.trim();
    if (!amt || parseFloat(amt) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    const rec = recipient.trim();
    if (!rec || !rec.startsWith("G") || rec.length !== 56) {
      setError("Enter a valid Stellar address (G...)");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/vault/treasury/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          businessId,
          amount: amt,
          currency,
          recipientAddress: rec,
          memo: memo.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Withdrawal failed");
        return;
      }

      if (data.mode === "hybrid" && data.xdr) {
        setPendingXdr(data.xdr);
        setPendingWithdrawalId(data.withdrawalId);
        setSuccess("Transaction ready. Sign with Freighter to complete.");
      } else if (data.mode === "custodial" && data.txHash) {
        setSuccess(`${data.amount} ${data.currency} sent successfully`);
        setAmount("");
        await fetchVaultInfo();
        await fetchWithdrawals();
      }
    } catch (e) {
      setError("Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFreighterSign() {
    if (!pendingXdr || !pendingWithdrawalId) return;

    setSigning(true);
    setError(null);

    try {
      const freighterApi = await import("@stellar/freighter-api");

      const network = vaultInfo?.network === "public" ? "PUBLIC" : "TESTNET";
      const networkPassphrase =
        network === "PUBLIC"
          ? "Public Global Stellar Network ; September 2015"
          : "Test SDF Network ; September 2015";

      const { signedTxXdr } = await freighterApi.signTransaction(pendingXdr, {
        networkPassphrase,
      });

      const confirmRes = await fetch("/api/vault/treasury/withdraw", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          withdrawalId: pendingWithdrawalId,
          signedXdr: signedTxXdr,
        }),
      });

      const confirmData = await confirmRes.json();

      if (!confirmRes.ok) {
        setError(confirmData.error || "Failed to submit transaction");
        return;
      }

      setSuccess(`Withdrawal complete! Tx: ${confirmData.txHash?.slice(0, 16)}...`);
      setPendingXdr(null);
      setPendingWithdrawalId(null);
      setAmount("");
      await fetchVaultInfo();
      await fetchWithdrawals();
    } catch (e: any) {
      if (e?.message?.includes("User declined")) {
        setError("Transaction cancelled");
      } else {
        setError(e?.message || "Failed to sign with Freighter");
      }
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-white/30" />
      </div>
    );
  }

  if (!vaultInfo?.hasVault) {
    return (
      <div className="rounded-2xl border border-white/[0.12] bg-transparent p-6 backdrop-blur-xl text-center">
        <Wallet className="h-8 w-8 text-white/30 mx-auto mb-3" />
        <p className="text-white/60 text-sm">No vault configured</p>
        <p className="text-white/30 text-xs mt-1">Create a vault in Settings to enable withdrawals.</p>
      </div>
    );
  }

  if (vaultInfo.vaultType === "external") {
    return (
      <div className="rounded-2xl border border-white/[0.12] bg-transparent p-6 backdrop-blur-xl text-center">
        <Wallet className="h-8 w-8 text-purple-400/60 mx-auto mb-3" />
        <p className="text-white/60 text-sm">External Wallet Mode</p>
        <p className="text-white/30 text-xs mt-1">
          Manage withdrawals directly from your own wallet app.
        </p>
      </div>
    );
  }

  const available = currency === "XLM" ? vaultInfo.balance?.xlmRaw : vaultInfo.balance?.usdcRaw;
  const availableStr = currency === "XLM" ? vaultInfo.balance?.xlm : vaultInfo.balance?.usdc;

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="rounded-2xl border border-white/[0.12] bg-transparent p-6 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-white/[0.06]">
            {vaultInfo.vaultType === "hybrid" ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ) : (
              <Wallet className="h-4 w-4 text-cyan-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{vaultInfo.vaultName}</p>
            <p className="text-xs text-white/35 mt-0.5 capitalize">
              {vaultInfo.vaultType} vault
              {vaultInfo.vaultType === "hybrid" && " · Requires your Freighter signature"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setCurrency("USDC")}
            className={`rounded-xl border p-4 text-left transition-colors ${
              currency === "USDC"
                ? "border-cyan-500/40 bg-cyan-500/5"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <p className="text-xs text-white/40">USDC Available</p>
            <p className="text-2xl font-bold text-white mt-1">
              {vaultInfo.balance?.usdc || "0.00"}
            </p>
          </button>
          <button
            onClick={() => setCurrency("XLM")}
            className={`rounded-xl border p-4 text-left transition-colors ${
              currency === "XLM"
                ? "border-cyan-500/40 bg-cyan-500/5"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <p className="text-xs text-white/40">XLM Available</p>
            <p className="text-2xl font-bold text-white mt-1">
              {vaultInfo.balance?.xlm || "0.0000"}
            </p>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.12] bg-transparent p-6 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08]">
            <ArrowUpRight className="h-4 w-4 text-white/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Withdraw {currency}</p>
            <p className="text-xs text-white/35 mt-0.5">
              {vaultInfo.vaultType === "hybrid"
                ? "You'll need to sign with Freighter to complete"
                : "Funds sent directly from your vault"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="withdraw-amount" className="text-xs text-white/50">
                Amount ({currency})
              </Label>
              <Input
                id="withdraw-amount"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!!pendingXdr}
                className="h-9 border border-white/[0.1] bg-white/[0.04] text-foreground placeholder:text-muted-foreground focus:border-white/25 focus:ring-0"
              />
              <p className="text-[10px] text-white/30">Available: {availableStr} {currency}</p>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="withdraw-recipient" className="text-xs text-white/50">
                Recipient address
              </Label>
              <Input
                id="withdraw-recipient"
                type="text"
                placeholder="G..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                disabled={!!pendingXdr}
                className="h-9 border border-white/[0.1] bg-white/[0.04] font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-white/25 focus:ring-0"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="withdraw-memo" className="text-xs text-white/50">
                Memo (optional)
              </Label>
              <Input
                id="withdraw-memo"
                type="text"
                placeholder="Payment reference..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength={28}
                disabled={!!pendingXdr}
                className="h-9 border border-white/[0.1] bg-white/[0.04] text-xs text-foreground placeholder:text-muted-foreground focus:border-white/25 focus:ring-0"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <p className="text-emerald-400 text-xs">{success}</p>
            </div>
          )}

          {pendingXdr ? (
            <Button
              type="button"
              onClick={handleFreighterSign}
              disabled={signing}
              className="w-full rounded-full border border-emerald-500/30 bg-emerald-500/20 font-semibold text-emerald-300 hover:bg-emerald-500/30"
            >
              {signing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Sign with Freighter
                </>
              )}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitting || !available || available <= 0}
              className="w-full rounded-full border border-white/10 bg-foreground font-semibold text-background hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Withdraw ${currency}`
              )}
            </Button>
          )}
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.12] bg-transparent backdrop-blur-xl">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.06]">
          <History className="h-4 w-4 text-white/30" />
          <p className="text-sm font-medium text-white">Withdrawal history</p>
          <span className="text-xs text-white/25">
            {withdrawals.length} record{withdrawals.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="px-5 py-3">
          {withdrawals.length === 0 ? (
            <p className="text-white/25 text-sm py-6 text-center">No withdrawals yet.</p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {withdrawals.slice(0, 10).map((w) => (
                <li key={w.id} className="py-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="text-sm font-semibold text-white">{w.amount}</span>
                  <StatusBadge status={w.status} />
                  <div className="flex items-center gap-2 ml-auto">
                    {w.payoutTxHash && (
                      <a
                        href={getExplorerTxUrl(w.payoutTxHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400/80 transition-colors hover:text-cyan-300"
                      >
                        View tx ↗
                      </a>
                    )}
                    <span className="text-[11px] text-white/25">
                      {new Date(w.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
