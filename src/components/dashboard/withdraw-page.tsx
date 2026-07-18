"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet,
  History,
  TrendingUp,
  Shield,
  ShieldCheck,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Send,
  RefreshCw,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/utils";
import { getExplorerTxUrl } from "@/lib/stellar-explorer";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { WorkspaceTreasuryBodySkeleton } from "@/components/dashboard/workspace-hub/hub-content-skeletons";
import { VaultSetup } from "@/components/dashboard/vault-setup";
import { fallbackBalance, fallbackWithdrawals } from "@/data/fallback";

interface WithdrawPageProps {
  businessId: string;
  walletAddress: string | null;
  receiveAddress: string | null;
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
  contractTxHash: string | null;
  createdAt: string;
};

function useWithdrawStyles(theme: "light" | "dark") {
  const t = hubThemeClasses(theme);
  return useMemo(
    () => ({
      t,
      panel: cn(
        "rounded-2xl border p-5",
        t.dark
          ? "border-white/10 bg-white/[0.02]"
          : "border-slate-200 bg-white shadow-sm"
      ),
      panelHeader: cn(
        "flex items-center gap-2 mb-4",
        t.dark ? "text-white" : "text-slate-900"
      ),
      sectionTitle: cn(
        "text-sm font-semibold",
        t.dark ? "text-white" : "text-slate-900"
      ),
      label: cn("text-xs font-medium", t.dark ? "text-white/50" : "text-slate-500"),
      value: cn("text-2xl font-bold tracking-tight", t.dark ? "text-white" : "text-slate-900"),
      muted: cn("text-xs", t.dark ? "text-white/40" : "text-slate-500"),
      input: cn(
        "h-10 rounded-lg border text-sm",
        t.dark
          ? "border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/25"
          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
      ),
      selectTrigger: cn(
        "h-10 rounded-lg border text-sm",
        t.dark
          ? "border-white/10 bg-white/5 text-white"
          : "border-slate-200 bg-white text-slate-900"
      ),
      iconBox: cn(
        "flex h-9 w-9 items-center justify-center rounded-lg",
        t.dark ? "bg-white/5 border border-white/10" : "bg-slate-100"
      ),
    }),
    [t, theme]
  );
}

function StatusBadge({ status, dark }: { status: string; dark: boolean }) {
  if (status === "completed") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
          dark
            ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
            : "bg-emerald-50 border border-emerald-200 text-emerald-700"
        )}
      >
        <CheckCircle2 className="h-3 w-3" /> Complete
      </span>
    );
  }
  if (status === "pending" || status === "pending_signature") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
          dark
            ? "bg-amber-500/15 border border-amber-500/25 text-amber-400"
            : "bg-amber-50 border border-amber-200 text-amber-700"
        )}
      >
        <Clock className="h-3 w-3" /> {status === "pending_signature" ? "Awaiting signature" : "Processing"}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        dark
          ? "bg-red-500/15 border border-red-500/25 text-red-400"
          : "bg-red-50 border border-red-200 text-red-700"
      )}
    >
      <XCircle className="h-3 w-3" /> {status}
    </span>
  );
}

function QuickStatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  styles,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Wallet;
  trend?: { value: string; positive: boolean };
  styles: ReturnType<typeof useWithdrawStyles>;
}) {
  return (
    <div className={styles.panel}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className={styles.iconBox}>
          <Icon className={cn("h-4 w-4", styles.t.dark ? "text-blue-400" : "text-blue-600")} />
        </div>
        {trend && (
          <span
            className={cn(
              "text-[11px] font-semibold",
              trend.positive ? "text-emerald-500" : "text-red-500"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <p className={styles.value}>{value}</p>
      <div className="flex items-center justify-between mt-1">
        <span className={styles.label}>{label}</span>
        {sub && <span className={styles.muted}>{sub}</span>}
      </div>
    </div>
  );
}

export function WithdrawPage({ businessId, walletAddress, receiveAddress }: WithdrawPageProps) {
  const { theme } = useDashboardTheme();
  const s = useWithdrawStyles(theme);

  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"USDC" | "XLM">("USDC");
  const [recipient, setRecipient] = useState(walletAddress || receiveAddress || "");
  const [memo, setMemo] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pendingXdr, setPendingXdr] = useState<string | null>(null);
  const [pendingWithdrawalId, setPendingWithdrawalId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchVaultInfo = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/vault/treasury?businessId=${businessId}`, {
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        setVaultInfo(data);
        setUsingFallback(false);
        return;
      }
    } catch (e) {
      console.error("Failed to fetch vault info:", e);
    }
    setVaultInfo({
      hasVault: true,
      vaultAddress: null,
      vaultType: "custodial",
      vaultName: "Treasury Vault",
      balance: { xlm: fallbackBalance.virtualBalanceXlm, usdc: "0.00", xlmRaw: parseFloat(fallbackBalance.virtualBalanceXlm), usdcRaw: 0 },
      network: "testnet",
    });
    setUsingFallback(true);
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
        return;
      }
    } catch (e) {
      console.error("Failed to fetch withdrawals:", e);
    }
    setWithdrawals(fallbackWithdrawals);
  }, [businessId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchVaultInfo(), fetchWithdrawals()]).finally(() => setLoading(false));
  }, [fetchVaultInfo, fetchWithdrawals]);

  useEffect(() => {
    if ((walletAddress || receiveAddress) && !recipient) {
      setRecipient(walletAddress || receiveAddress || "");
    }
  }, [walletAddress, receiveAddress, recipient]);

  const available = currency === "XLM" ? vaultInfo?.balance?.xlmRaw : vaultInfo?.balance?.usdcRaw;
  const availableStr = currency === "XLM" ? vaultInfo?.balance?.xlm : vaultInfo?.balance?.usdc;

  const completedWithdrawals = withdrawals.filter((w) => w.status === "completed");
  const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + parseFloat(w.amount || "0"), 0);

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

    if (parseFloat(amt) > (available || 0)) {
      setError(`Insufficient balance. Available: ${availableStr} ${currency}`);
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

      setSuccess(`Withdrawal complete!`);
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

  function copyAddress() {
    if (vaultInfo?.vaultAddress) {
      navigator.clipboard.writeText(vaultInfo.vaultAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return <WorkspaceTreasuryBodySkeleton />;
  }

  const needsVaultSetup = !usingFallback && vaultInfo && !vaultInfo.hasVault;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      {needsVaultSetup ? (
        <VaultSetup
          businessId={businessId}
          userWalletAddress={walletAddress}
          onVaultCreated={() => {
            fetchVaultInfo();
            fetchWithdrawals();
          }}
        />
      ) : null}

      {usingFallback && (
        <div
          className={cn(
            "rounded-xl border p-3 text-xs",
            s.t.dark
              ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
              : "border-amber-200 bg-amber-50 text-amber-700"
          )}
        >
          Showing demo data. Connect your wallet and configure a vault for live balances.
        </div>
      )}

      <div
        className={cn(
          "grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]",
          needsVaultSetup && "pointer-events-none select-none opacity-50"
        )}
      >
        {/* Main content */}
        <div className="flex flex-col gap-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickStatCard
              label="USDC Balance"
              value={`$${vaultInfo?.balance?.usdc || "0.00"}`}
              icon={Wallet}
              styles={s}
            />
            <QuickStatCard
              label="XLM Balance"
              value={vaultInfo?.balance?.xlm || "0.0000"}
              sub="XLM"
              icon={TrendingUp}
              styles={s}
            />
            <QuickStatCard
              label="Total Withdrawn"
              value={totalWithdrawn.toFixed(2)}
              sub={`${completedWithdrawals.length} transactions`}
              icon={ArrowUpRight}
              styles={s}
            />
          </div>

          {/* Withdraw Form */}
          <div className={s.panel}>
            <div className={s.panelHeader}>
              <div className={s.iconBox}>
                <Send className={cn("h-4 w-4", s.t.dark ? "text-white/60" : "text-slate-600")} />
              </div>
              <div>
                <h2 className={s.sectionTitle}>Withdraw Funds</h2>
                <p className={s.muted}>
                  {needsVaultSetup
                    ? "Available after vault setup"
                    : vaultInfo?.vaultType === "hybrid"
                      ? "Requires Freighter signature to complete"
                      : vaultInfo?.vaultType === "external"
                        ? "External vault — manage funds in your wallet app"
                        : "Transfer funds to any Stellar address"}
                </p>
              </div>
            </div>

            {needsVaultSetup ? (
              <p className={cn("text-sm", s.muted)}>
                Set up your workspace vault to unlock withdrawals from on-chain balances.
              </p>
            ) : vaultInfo?.vaultType === "external" ? (
              <p className={cn("text-sm", s.muted)}>
                This workspace uses an external wallet. Open Freighter or your wallet app to move funds.
              </p>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className={s.label}>Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={!!pendingXdr}
                      className={cn(s.input, "flex-1")}
                    />
                    <Select value={currency} onValueChange={(v) => setCurrency(v as "USDC" | "XLM")}>
                      <SelectTrigger className={cn(s.selectTrigger, "w-24")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="XLM">XLM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className={s.muted}>
                    Available: {availableStr || "0"} {currency}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className={s.label}>Recipient Address</Label>
                  <Input
                    type="text"
                    placeholder="G..."
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={!!pendingXdr}
                    className={cn(s.input, "font-mono text-xs")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={s.label}>Memo (optional)</Label>
                <Input
                  type="text"
                  placeholder="Payment reference..."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  maxLength={28}
                  disabled={!!pendingXdr}
                  className={s.input}
                />
              </div>

              {error && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2",
                    s.t.dark
                      ? "border-red-500/20 bg-red-500/10 text-red-400"
                      : "border-red-200 bg-red-50 text-red-700"
                  )}
                >
                  <XCircle className="h-4 w-4 shrink-0" />
                  <p className="text-xs">{error}</p>
                </div>
              )}

              {success && (
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2",
                    s.t.dark
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <p className="text-xs">{success}</p>
                </div>
              )}

              {pendingXdr ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleFreighterSign}
                  disabled={signing}
                  className={cn(
                    "h-11 w-full rounded-xl border-0 font-semibold shadow-none",
                    "disabled:pointer-events-none disabled:opacity-100",
                    s.t.dark
                      ? "enabled:bg-emerald-600 enabled:text-white enabled:hover:bg-emerald-700 disabled:bg-white/10 disabled:text-slate-400"
                      : "enabled:bg-emerald-600 enabled:text-white enabled:hover:bg-emerald-700 disabled:bg-emerald-50 disabled:text-emerald-400"
                  )}
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
                  variant="ghost"
                  disabled={submitting || !available || available <= 0}
                  className={cn(
                    "h-11 w-full rounded-xl border-0 font-semibold shadow-none",
                    "disabled:pointer-events-none disabled:opacity-100",
                    s.t.dark
                      ? "enabled:bg-blue-600 enabled:text-white enabled:hover:bg-blue-700 disabled:bg-white/10 disabled:text-slate-400"
                      : "enabled:bg-blue-600 enabled:text-white enabled:hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-500"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Withdraw {currency}
                    </>
                  )}
                </Button>
              )}
            </form>
            )}
          </div>

          {/* Withdrawal History */}
          <div className={s.panel}>
            <div className={s.panelHeader}>
              <History className={cn("h-4 w-4", s.t.dark ? "text-white/40" : "text-slate-400")} />
              <h2 className={s.sectionTitle}>Recent Withdrawals</h2>
              <span className={s.muted}>{withdrawals.length} total</span>
            </div>

            {withdrawals.length === 0 ? (
              <div className="py-8 text-center">
                <ArrowUpRight className={cn("h-8 w-8 mx-auto mb-2", s.t.dark ? "text-white/20" : "text-slate-300")} />
                <p className={s.muted}>No withdrawals yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {withdrawals.slice(0, 8).map((w) => (
                  <div
                    key={w.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-3 transition-colors",
                      s.t.dark ? "hover:bg-white/5" : "hover:bg-slate-50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full",
                        w.status === "completed"
                          ? s.t.dark
                            ? "bg-emerald-500/15"
                            : "bg-emerald-100"
                          : s.t.dark
                            ? "bg-amber-500/15"
                            : "bg-amber-100"
                      )}
                    >
                      <ArrowUpRight
                        className={cn(
                          "h-4 w-4",
                          w.status === "completed"
                            ? s.t.dark
                              ? "text-emerald-400"
                              : "text-emerald-600"
                            : s.t.dark
                              ? "text-amber-400"
                              : "text-amber-600"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", s.t.dark ? "text-white" : "text-slate-900")}>
                        {w.amount} XLM
                      </p>
                      <p className={cn("text-xs truncate", s.muted)}>
                        To {w.recipientAddress.slice(0, 8)}...{w.recipientAddress.slice(-4)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={w.status} dark={s.t.dark} />
                      {w.payoutTxHash && (
                        <a
                          href={getExplorerTxUrl(w.payoutTxHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            s.t.dark ? "hover:bg-white/10 text-white/40" : "hover:bg-slate-100 text-slate-400"
                          )}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {withdrawals.length > 8 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <Button variant="ghost" className="w-full justify-center gap-2 text-xs">
                  View all withdrawals
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          {/* Vault Info Card */}
          <div className={s.panel}>
            <div className={s.panelHeader}>
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  vaultInfo?.hasVault
                    ? s.t.dark
                      ? "bg-emerald-500/15 border border-emerald-500/25"
                      : "bg-emerald-100"
                    : s.t.dark
                      ? "bg-white/5 border border-white/10"
                      : "bg-slate-100"
                )}
              >
                {vaultInfo?.vaultType === "hybrid" ? (
                  <ShieldCheck
                    className={cn("h-4 w-4", vaultInfo?.hasVault ? "text-emerald-500" : s.t.dark ? "text-white/40" : "text-slate-400")}
                  />
                ) : (
                  <Shield
                    className={cn("h-4 w-4", vaultInfo?.hasVault ? "text-emerald-500" : s.t.dark ? "text-white/40" : "text-slate-400")}
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className={s.sectionTitle}>{vaultInfo?.vaultName || "Treasury Vault"}</h3>
                <p className={cn("text-xs capitalize", s.muted)}>
                  {vaultInfo?.vaultType || "Not configured"} vault
                </p>
              </div>
              {vaultInfo?.hasVault && (
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full",
                    s.t.dark
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-emerald-100 text-emerald-700"
                  )}
                >
                  Active
                </span>
              )}
            </div>

            {vaultInfo?.vaultAddress && (
              <div className="space-y-3">
                <div>
                  <p className={cn("text-xs mb-1.5", s.muted)}>Vault Address</p>
                  <div className="flex items-center gap-2">
                    <code
                      className={cn(
                        "flex-1 truncate rounded-lg px-3 py-2 font-mono text-xs",
                        s.t.dark ? "bg-white/5 text-white/70" : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {vaultInfo.vaultAddress}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAddress}
                      className="h-8 w-8 p-0 shrink-0"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className={cn("h-3.5 w-3.5", s.t.dark ? "text-white/40" : "text-slate-400")} />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={s.muted}>Network</span>
                  <span
                    className={cn(
                      "text-xs font-medium capitalize",
                      s.t.dark ? "text-white/70" : "text-slate-700"
                    )}
                  >
                    {vaultInfo.network}
                  </span>
                </div>
              </div>
            )}

            {!vaultInfo?.hasVault && !needsVaultSetup && (
              <div className="mt-2">
                <Link href="/dashboard/settings">
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-center gap-2",
                      s.t.dark && "border-white/10 hover:bg-white/5"
                    )}
                  >
                    <Wallet className="h-4 w-4" />
                    Create Vault
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={s.panel}>
            <h3 className={cn(s.sectionTitle, "mb-3")}>Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/dashboard/payment-links" className="block">
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-3 transition-colors",
                    s.t.dark ? "hover:bg-white/5" : "hover:bg-slate-50"
                  )}
                >
                  <div className={cn(s.iconBox, "h-8 w-8")}>
                    <ArrowDownLeft className={cn("h-3.5 w-3.5", s.t.dark ? "text-blue-400" : "text-blue-600")} />
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", s.t.dark ? "text-white" : "text-slate-900")}>
                      Receive Funds
                    </p>
                    <p className={s.muted}>Create a payment link</p>
                  </div>
                  <ChevronRight className={cn("h-4 w-4", s.t.dark ? "text-white/30" : "text-slate-300")} />
                </div>
              </Link>

              <Link href="/dashboard/payment-links?tab=send" className="block">
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-3 transition-colors",
                    s.t.dark ? "hover:bg-white/5" : "hover:bg-slate-50"
                  )}
                >
                  <div className={cn(s.iconBox, "h-8 w-8")}>
                    <Send className={cn("h-3.5 w-3.5", s.t.dark ? "text-purple-400" : "text-purple-600")} />
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", s.t.dark ? "text-white" : "text-slate-900")}>
                      Send Payment
                    </p>
                    <p className={s.muted}>Pay to any wallet</p>
                  </div>
                  <ChevronRight className={cn("h-4 w-4", s.t.dark ? "text-white/30" : "text-slate-300")} />
                </div>
              </Link>
            </div>
          </div>

          {/* Help Card */}
          <div
            className={cn(
              "rounded-2xl border p-4",
              s.t.dark
                ? "border-blue-500/20 bg-blue-500/5"
                : "border-blue-200 bg-blue-50"
            )}
          >
            <div className="flex items-start gap-3">
              <Info className={cn("h-4 w-4 mt-0.5 shrink-0", s.t.dark ? "text-blue-400" : "text-blue-600")} />
              <div>
                <p className={cn("text-xs font-medium mb-1", s.t.dark ? "text-blue-300" : "text-blue-800")}>
                  {vaultInfo?.vaultType === "hybrid" ? "Hybrid Vault Security" : "About Withdrawals"}
                </p>
                <p className={cn("text-xs leading-relaxed", s.t.dark ? "text-blue-300/70" : "text-blue-700/80")}>
                  {vaultInfo?.vaultType === "hybrid"
                    ? "Both you and Hypertron must sign withdrawals. This ensures maximum security for your funds."
                    : "Withdrawals are processed on the Stellar network. Funds typically arrive within seconds."}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
