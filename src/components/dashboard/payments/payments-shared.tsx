"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Info, Link2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HubAvatar } from "@/components/global/hub-avatar";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import type { DashboardTheme } from "@/lib/dashboard-theme";
import { cn } from "@/utils";
import { normalizePaymentAssetCode } from "@/lib/stellar-assets";
import { syncPendingPaymentLinks } from "@/lib/poll-payment-link-status";
import { useDemoMode } from "@/components/demo/demo-mode-provider";

export const PAYMENT_TABS = [
  { id: "collect", label: "Collect" },
  { id: "send", label: "Send" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "customers", label: "Customers" },
] as const;

export type PaymentTabId = (typeof PAYMENT_TABS)[number]["id"];

/** Tabs hidden from navigation until the feature ships. */
export const DISABLED_PAYMENT_TABS = new Set<PaymentTabId>(["subscriptions", "customers"]);

export function isPaymentTabEnabled(tab: PaymentTabId, isDemo = false): boolean {
  if (isDemo) return true;
  return !DISABLED_PAYMENT_TABS.has(tab);
}

export type TransactionStatus = "Succeeded" | "Private" | "Refunded" | "Pending" | "Failed";

export type TransactionRow = {
  id: string;
  name: string;
  date: string;
  amount: string;
  currency: string;
  status: TransactionStatus;
};

export type PaymentLinkTransaction = {
  id: string;
  linkId: string;
  name: string;
  date: string;
  amountLabel: string;
  currency: string;
  status: TransactionStatus;
  payUrl: string;
  paid: boolean;
};

export type TransactionFilter = "all" | "unpaid" | "paid";

const TX_FILTERS: { id: TransactionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unpaid", label: "Unpaid" },
  { id: "paid", label: "Paid" },
];

export const COLLECT_TRANSACTIONS: TransactionRow[] = [
  { id: "1", name: "Riya Sharma", date: "May 28, 2:14 PM", amount: "+1,000.00", currency: "USDC", status: "Succeeded" },
  { id: "2", name: "Acme Corp", date: "May 27, 11:02 AM", amount: "+500.00", currency: "USDC", status: "Succeeded" },
  { id: "3", name: "Zara Ali", date: "May 26, 4:45 PM", amount: "+750.00", currency: "USDC", status: "Private" },
  { id: "4", name: "Neha Gupta", date: "May 25, 9:30 AM", amount: "-75.00", currency: "USDC", status: "Refunded" },
];

export const SEND_TRANSACTIONS: TransactionRow[] = [
  { id: "s1", name: "Dev Contractor", date: "May 28, 10:22 AM", amount: "-2,400.00", currency: "USDC", status: "Succeeded" },
  { id: "s2", name: "CloudHost Inc", date: "May 27, 3:15 PM", amount: "-890.00", currency: "USDC", status: "Succeeded" },
  { id: "s3", name: "Marcus Lee", date: "May 26, 9:00 AM", amount: "-500.00", currency: "USDC", status: "Pending" },
  { id: "s4", name: "Legal Partners", date: "May 24, 1:45 PM", amount: "-1,200.00", currency: "USDC", status: "Private" },
];

const VOLUME_SPARKLINE = [12, 18, 14, 22, 19, 28, 24, 32, 29, 35];
const PAYMENTS_SPARKLINE = [8, 12, 10, 16, 14, 18, 15, 22, 20, 24];
const SEND_SPARKLINE = [6, 9, 11, 8, 14, 12, 16, 13, 18, 15];
const SUBS_SPARKLINE = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14];
const CUSTOMER_SPARKLINE = [18, 20, 22, 21, 24, 26, 28, 30, 32, 35];
const FLAT_SPARKLINE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function generateSparkline(value: number, count: number = 10): number[] {
  if (value <= 0 || count <= 0) return FLAT_SPARKLINE;
  const points: number[] = [];
  let current = value * 0.1;
  for (let i = 0; i < count; i++) {
    const progress = (i + 1) / count;
    const target = value * progress;
    const noise = (Math.random() - 0.5) * value * 0.15;
    current = Math.max(0, target + noise);
    points.push(Math.round(current * 100) / 100);
  }
  points[count - 1] = value;
  return points;
}

export function usePaymentsStyles(theme: DashboardTheme) {
  const t = hubThemeClasses(theme);
  return {
    t,
    inputCls: cn(
      "h-10 border text-sm focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0",
      t.dark
        ? "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/40"
        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500/40"
    ),
    labelCls: cn("text-sm font-medium", t.dark ? "text-slate-300" : "text-slate-700"),
    hintCls: cn("text-xs", t.pageSubheading),
    sectionTitle: cn("text-sm font-semibold", t.pageHeading),
    cardCls: cn("rounded-xl border p-4 lg:p-5", t.card),
    panelCls: cn(
      "flex flex-col gap-4 rounded-xl border p-5",
      t.dark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50/40"
    ),
  };
}

export function Sparkline({ points, strokeClass }: { points: number[]; strokeClass: string }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min;
  const width = 80;
  const height = 28;
  const isFlat = range === 0;
  
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = isFlat 
        ? height - 4
        : height - ((p - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="shrink-0" aria-hidden>
      <polyline
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
        className={cn(strokeClass, isFlat && "opacity-30")}
      />
    </svg>
  );
}

export function SectionInfo({ className }: { className?: string }) {
  return (
    <Info
      className={cn("h-3.5 w-3.5 shrink-0 cursor-help opacity-60", className)}
      aria-hidden
    />
  );
}

export function StatusBadge({
  status,
  dark,
}: {
  status: TransactionStatus;
  dark: boolean;
}) {
  const styles: Record<TransactionStatus, string> = {
    Succeeded: cn(
      "border-emerald-200 bg-emerald-50 text-emerald-700",
      dark && "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
    ),
    Private: cn(
      "gap-1 border-blue-200 bg-blue-50 text-blue-700",
      dark && "border-blue-500/30 bg-blue-500/15 text-blue-300"
    ),
    Refunded: cn(
      "border-red-200 bg-red-50 text-red-600",
      dark && "border-red-500/30 bg-red-500/15 text-red-300"
    ),
    Pending: cn(
      "border-amber-200 bg-amber-50 text-amber-700",
      dark && "border-amber-500/30 bg-amber-500/15 text-amber-300"
    ),
    Failed: cn(
      "border-red-200 bg-red-50 text-red-600",
      dark && "border-red-500/30 bg-red-500/15 text-red-300"
    ),
  };

  return (
    <Badge variant="outline" className={cn("rounded-md text-[11px] font-medium", styles[status])}>
      {status === "Private" ? <Lock className="h-3 w-3" /> : null}
      {status}
    </Badge>
  );
}

export function PaymentTabsNav({
  activeTab,
  onTabChange,
  theme,
}: {
  activeTab: PaymentTabId;
  onTabChange: (tab: PaymentTabId) => void;
  theme: DashboardTheme;
}) {
  const t = hubThemeClasses(theme);
  const { isDemo } = useDemoMode();

  return (
    <nav
      className={cn("flex gap-5 border-b", t.dark ? "border-white/10" : "border-slate-200")}
      aria-label="Payments sections"
    >
      {PAYMENT_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        const disabled = !isPaymentTabEnabled(tab.id, isDemo);

        if (disabled) {
          return (
            <span
              key={tab.id}
              title="Coming soon"
              aria-disabled="true"
              className={cn(
                "relative cursor-not-allowed pb-3 text-sm font-medium opacity-45",
                t.pageSubheading
              )}
            >
              {tab.label}
            </span>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative pb-3 text-sm font-medium transition-colors",
              isActive
                ? t.dark
                  ? "text-blue-400"
                  : "text-blue-600"
                : cn(t.pageSubheading, "hover:text-slate-700", t.dark && "hover:text-slate-200")
            )}
          >
            {tab.label}
            {isActive ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-600" />
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

type SidebarInsight = {
  label: string;
  value: string;
  delta?: string;
  sparkline: number[];
  strokeClass: string;
};

function getSidebarConfig(tab: PaymentTabId, dark: boolean): {
  txTitle: string;
  txRows: TransactionRow[];
  insights: SidebarInsight[];
  insightPeriod: string;
} {
  const blueStroke = dark ? "stroke-blue-400" : "stroke-blue-600";
  const greenStroke = dark ? "stroke-emerald-400" : "stroke-emerald-600";
  const violetStroke = dark ? "stroke-violet-400" : "stroke-violet-600";

  switch (tab) {
    case "send":
      return {
        txTitle: "Recent Outgoing",
        txRows: SEND_TRANSACTIONS,
        insightPeriod: "This Week",
        insights: [
          { label: "Sent Volume", value: "$8,240.00", delta: "+8.2%", sparkline: SEND_SPARKLINE, strokeClass: blueStroke },
          { label: "Payments Sent", value: "12", delta: "+3", sparkline: PAYMENTS_SPARKLINE, strokeClass: greenStroke },
        ],
      };
    case "subscriptions":
      return {
        txTitle: "Recent Renewals",
        txRows: COLLECT_TRANSACTIONS.slice(0, 3),
        insightPeriod: "This Month",
        insights: [
          { label: "MRR", value: "$4,860.00", delta: "+18%", sparkline: SUBS_SPARKLINE, strokeClass: violetStroke },
          { label: "Active Subscribers", value: "47", delta: "+6", sparkline: CUSTOMER_SPARKLINE, strokeClass: greenStroke },
        ],
      };
    case "customers":
      return {
        txTitle: "Recent Activity",
        txRows: COLLECT_TRANSACTIONS,
        insightPeriod: "This Month",
        insights: [
          { label: "Total Customers", value: "128", delta: "+14", sparkline: CUSTOMER_SPARKLINE, strokeClass: blueStroke },
          { label: "Avg. Lifetime Value", value: "$892", delta: "+9.4%", sparkline: VOLUME_SPARKLINE, strokeClass: greenStroke },
        ],
      };
    default:
      return {
        txTitle: "Transactions",
        txRows: COLLECT_TRANSACTIONS,
        insightPeriod: "This Week",
        insights: [
          { label: "Volume", value: "$12,420.00", delta: "+12.5%", sparkline: VOLUME_SPARKLINE, strokeClass: blueStroke },
          { label: "Successful Payments", value: "24", delta: "+20%", sparkline: PAYMENTS_SPARKLINE, strokeClass: greenStroke },
        ],
      };
  }
}

type LiveEvent = {
  linkId: string;
  amount: string | null;
  currency?: string;
  purpose?: string;
  clientName?: string;
  paidAt?: string;
  createdAt: string;
  url?: string;
};

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

type SendApiRow = {
  id: string;
  recipientLabel?: string | null;
  recipientAddress: string;
  amount: string;
  currency?: string;
  status: string;
  privateSend?: boolean;
  createdAt: string;
  completedAt?: string | null;
};

function mapOutgoingToTransactionRow(s: SendApiRow): TransactionRow {
  const n = parseFloat(s.amount);
  const amt = Number.isFinite(n)
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : s.amount;
  const label =
    (s.recipientLabel && s.recipientLabel.trim()) ||
    s.recipientAddress.slice(0, 8) + "…" + s.recipientAddress.slice(-4);
  const when = s.completedAt || s.createdAt;
  let status: TransactionStatus = "Pending";
  if (s.privateSend && s.status === "completed") status = "Private";
  else if (s.status === "completed") status = "Succeeded";
  else if (s.status === "failed") status = "Failed";
  else if (s.status === "scheduled") status = "Pending";

  return {
    id: s.id,
    name: label.slice(0, 24),
    date: formatEventDate(when),
    amount: `-${amt}`,
    currency: normalizePaymentAssetCode(s.currency),
    status,
  };
}

function parseSendSidebarPayload(data: unknown): {
  vaultUsdcAvailable: string;
  sendStats: { sentVolumeUsdc: string; paymentsSent: number };
  sendLiveRows: TransactionRow[];
} {
  const body = data as {
    balances?: { virtualBalanceUsdc?: string };
    stats?: { sentVolumeUsdc?: string; paymentsSent?: number };
    sends?: SendApiRow[];
  } | null;

  const usdcRaw = body?.balances?.virtualBalanceUsdc ?? "0";
  const usdcNum = parseFloat(usdcRaw);
  const vaultUsdcAvailable = Number.isFinite(usdcNum)
    ? usdcNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";

  const sentVol = body?.stats?.sentVolumeUsdc ?? "0.00";
  const paymentsSent =
    typeof body?.stats?.paymentsSent === "number" ? body.stats.paymentsSent : 0;

  const sends = Array.isArray(body?.sends) ? body.sends : [];

  return {
    vaultUsdcAvailable,
    sendStats: { sentVolumeUsdc: sentVol, paymentsSent },
    sendLiveRows: sends.slice(0, 4).map(mapOutgoingToTransactionRow),
  };
}

function formatAmountLabel(amount: string | null | undefined, paid: boolean): string {
  const raw = typeof amount === "string" ? amount.trim() : "";
  if (!raw) return paid ? "—" : "Any amount";
  const n = parseFloat(raw);
  const formatted = Number.isFinite(n)
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : raw;
  return paid ? `+${formatted}` : formatted;
}

function liveEventToTransaction(e: LiveEvent, origin: string): PaymentLinkTransaction {
  const paid = !!e.paidAt;
  const currency = normalizePaymentAssetCode(e.currency);
  const payUrl = e.url || `${origin}/pay/${e.linkId}`;
  return {
    id: e.linkId,
    linkId: e.linkId,
    name: (e.clientName || e.purpose || "Payment link").slice(0, 32),
    date: formatEventDate(paid ? e.paidAt! : e.createdAt),
    amountLabel: formatAmountLabel(e.amount, paid),
    currency,
    status: paid ? "Succeeded" : "Pending",
    payUrl,
    paid,
  };
}

function filterTransactions(items: PaymentLinkTransaction[], filter: TransactionFilter) {
  if (filter === "paid") return items.filter((t) => t.paid);
  if (filter === "unpaid") return items.filter((t) => !t.paid);
  return items;
}

export function CollectTransactionsCard({
  theme,
  transactions,
  loading,
  className,
}: {
  theme: DashboardTheme;
  transactions: PaymentLinkTransaction[];
  loading?: boolean;
  className?: string;
}) {
  const t = hubThemeClasses(theme);
  const { cardCls, sectionTitle } = usePaymentsStyles(theme);
  const [filter, setFilter] = useState<TransactionFilter>("all");

  const filtered = useMemo(() => filterTransactions(transactions, filter), [transactions, filter]);
  const counts = useMemo(
    () => ({
      all: transactions.length,
      unpaid: transactions.filter((x) => !x.paid).length,
      paid: transactions.filter((x) => x.paid).length,
    }),
    [transactions]
  );

  return (
    <div className={cn(cardCls, className)}>
      <h2 className={cn(sectionTitle, "mb-3")}>Transactions</h2>

      <nav
        className={cn("mb-4 flex gap-5 border-b", t.dark ? "border-white/10" : "border-slate-200")}
        role="tablist"
        aria-label="Transaction filters"
      >
        {TX_FILTERS.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(tab.id)}
              className={cn(
                "relative pb-2.5 text-sm font-medium transition-colors",
                active
                  ? t.dark
                    ? "text-blue-400"
                    : "text-blue-600"
                  : cn(t.pageSubheading, "hover:text-slate-700", t.dark && "hover:text-slate-200")
              )}
            >
              {tab.label}
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-600" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {loading ? (
        <p className={cn("py-6 text-center text-xs", t.pageSubheading)}>Loading transactions…</p>
      ) : filtered.length === 0 ? (
        <p className={cn("py-6 text-center text-xs", t.pageSubheading)}>
          {filter === "paid"
            ? "No paid transactions yet."
            : filter === "unpaid"
              ? "No open payment links."
              : "No payment links yet. Create one to get started."}
        </p>
      ) : (
        <ul className="max-h-[200px] space-y-4 overflow-y-auto pr-0.5">
          {filtered.map((tx) => (
            <li key={tx.id} className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    t.dark ? "bg-white/10 text-slate-300" : "bg-slate-100 text-slate-500"
                  )}
                >
                  <Link2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <Link
                    href={tx.payUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("block truncate text-sm font-medium hover:underline", t.pageHeading)}
                    title={tx.payUrl}
                  >
                    {tx.name}
                  </Link>
                  <p className={cn("whitespace-nowrap text-[11px]", t.pageSubheading)}>{tx.date}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    tx.paid
                      ? t.dark
                        ? "text-slate-100"
                        : "text-slate-900"
                      : t.pageHeading
                  )}
                >
                  {tx.amountLabel} {tx.currency}
                </p>
                <StatusBadge status={tx.status} dark={t.dark} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PaymentsSidebar({
  tab,
  theme,
  businessId,
}: {
  tab: PaymentTabId;
  theme: DashboardTheme;
  businessId?: string;
}) {
  const t = hubThemeClasses(theme);
  const { cardCls, sectionTitle } = usePaymentsStyles(theme);
  const mockConfig = getSidebarConfig(tab, t.dark);

  const [totalReceived, setTotalReceived] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [liveTxRows, setLiveTxRows] = useState<TransactionRow[] | null>(null);
  const [sendLiveRows, setSendLiveRows] = useState<TransactionRow[]>([]);
  const [sendStats, setSendStats] = useState({ sentVolumeUsdc: "0.00", paymentsSent: 0 });
  const [vaultUsdcAvailable, setVaultUsdcAvailable] = useState<string | null>(null);
  const [sendSidebarReady, setSendSidebarReady] = useState(false);
  const [linkTransactions, setLinkTransactions] = useState<PaymentLinkTransaction[] | null>(null);
  const [txLoading, setTxLoading] = useState(false);

  const loadSendSidebar = (bid: string) => {
    return fetch(`/api/payment-send?businessId=${encodeURIComponent(bid)}`, {
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => parseSendSidebarPayload(data));
  };

  useEffect(() => {
    if (!businessId || tab !== "send") {
      setSendSidebarReady(false);
      return;
    }

    let cancelled = false;
    setTxLoading(true);
    setSendSidebarReady(false);

    loadSendSidebar(businessId)
      .then((parsed) => {
        if (cancelled) return;
        setVaultUsdcAvailable(parsed.vaultUsdcAvailable);
        setSendStats(parsed.sendStats);
        setSendLiveRows(parsed.sendLiveRows);
      })
      .catch(() => {
        if (cancelled) return;
        setVaultUsdcAvailable("0.00");
        setSendStats({ sentVolumeUsdc: "0.00", paymentsSent: 0 });
        setSendLiveRows([]);
      })
      .finally(() => {
        if (!cancelled) {
          setTxLoading(false);
          setSendSidebarReady(true);
        }
      });

    const onSent = () => {
      if (cancelled || !businessId) return;
      loadSendSidebar(businessId).then((parsed) => {
        if (cancelled) return;
        setVaultUsdcAvailable(parsed.vaultUsdcAvailable);
        setSendStats(parsed.sendStats);
        setSendLiveRows(parsed.sendLiveRows);
        setSendSidebarReady(true);
      });
    };
    window.addEventListener("hypertron:payment-sent", onSent);
    return () => {
      cancelled = true;
      window.removeEventListener("hypertron:payment-sent", onSent);
    };
  }, [businessId, tab]);

  const applyCollectPayload = useCallback(
    (stats: unknown, eventsBody: unknown) => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const statsData = stats as {
        totalReceivedXlm?: string;
        completed?: number;
        pending?: number;
      } | null;

      if (statsData && typeof statsData.totalReceivedXlm === "string") {
        const n = parseFloat(statsData.totalReceivedXlm);
        setTotalReceived(
          Number.isFinite(n)
            ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "0.00"
        );
        setCompletedCount(typeof statsData.completed === "number" ? statsData.completed : null);
        setPendingCount(typeof statsData.pending === "number" ? statsData.pending : null);
      }

      const events = ((eventsBody as { events?: LiveEvent[] } | null)?.events ?? []) as LiveEvent[];
      const sorted = [...events].sort((a, b) => {
        const ta = new Date(a.paidAt || a.createdAt).getTime();
        const tb = new Date(b.paidAt || b.createdAt).getTime();
        return tb - ta;
      });
      setLinkTransactions(sorted.map((e) => liveEventToTransaction(e, origin)));
      const paid = sorted.filter((e) => e.paidAt).slice(0, 4);
      setLiveTxRows(
        paid.map((e) => ({
          id: e.linkId,
          name: (e.clientName || e.purpose || "Payment").slice(0, 24),
          date: formatEventDate(e.paidAt!),
          amount: `+${parseFloat(e.amount || "0").toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          currency: normalizePaymentAssetCode(e.currency),
          status: "Succeeded" as const,
        }))
      );
      return sorted.filter((e) => !e.paidAt).map((e) => e.linkId);
    },
    []
  );

  const loadCollectSidebar = useCallback(
    async (bid: string, options?: { syncPending?: boolean }) => {
      const [stats, eventsBody] = await Promise.all([
        fetch(`/api/dashboard-stats?businessId=${encodeURIComponent(bid)}`, {
          credentials: "same-origin",
        }).then((r) => (r.ok ? r.json() : null)),
        fetch(`/api/events?businessId=${encodeURIComponent(bid)}`, {
          credentials: "same-origin",
        }).then((r) => (r.ok ? r.json() : null)),
      ]);

      const pendingIds = applyCollectPayload(stats, eventsBody);

      if (options?.syncPending !== false && pendingIds.length > 0) {
        const { confirmed } = await syncPendingPaymentLinks(pendingIds);
        if (confirmed.length > 0) {
          const [freshStats, freshEvents] = await Promise.all([
            fetch(`/api/dashboard-stats?businessId=${encodeURIComponent(bid)}`, {
              credentials: "same-origin",
            }).then((r) => (r.ok ? r.json() : null)),
            fetch(`/api/events?businessId=${encodeURIComponent(bid)}`, {
              credentials: "same-origin",
            }).then((r) => (r.ok ? r.json() : null)),
          ]);
          applyCollectPayload(freshStats, freshEvents);
        }
      }
    },
    [applyCollectPayload]
  );

  useEffect(() => {
    if (!businessId || tab !== "collect") return;
    let cancelled = false;
    setTxLoading(true);

    loadCollectSidebar(businessId)
      .catch(() => {
        if (!cancelled) setLinkTransactions([]);
      })
      .finally(() => {
        if (!cancelled) setTxLoading(false);
      });

    const pollPending = () => {
      if (cancelled || !businessId) return;
      loadCollectSidebar(businessId).catch(() => {});
    };

    const intervalId = window.setInterval(pollPending, 20_000);
    const onPaymentReceived = () => pollPending();
    window.addEventListener("hypertron:payment-received", onPaymentReceived);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("hypertron:payment-received", onPaymentReceived);
    };
  }, [businessId, tab, loadCollectSidebar]);

  const config = useMemo(() => {
    if (tab === "send" && businessId && sendSidebarReady) {
      const vol = parseFloat(sendStats.sentVolumeUsdc) || 0;
      const paymentsCount = sendStats.paymentsSent || 0;
      return {
        txTitle: "Recent Outgoing",
        txRows: sendLiveRows,
        insightPeriod: "All time",
        insights: [
          {
            label: "Sent Volume",
            value: `$${sendStats.sentVolumeUsdc}`,
            delta: undefined,
            sparkline: vol > 0 ? generateSparkline(vol) : FLAT_SPARKLINE,
            strokeClass: mockConfig.insights[0]?.strokeClass ?? "",
          },
          {
            label: "Payments Sent",
            value: String(sendStats.paymentsSent),
            delta: undefined,
            sparkline: paymentsCount > 0 ? generateSparkline(paymentsCount) : FLAT_SPARKLINE,
            strokeClass: mockConfig.insights[1]?.strokeClass ?? "",
          },
        ],
      };
    }
    if (tab !== "collect" || !liveTxRows) return mockConfig;
    const volumeNum = totalReceived != null ? parseFloat(totalReceived) : 0;
    const paymentsNum = completedCount ?? 0;
    return {
      ...mockConfig,
      txRows: liveTxRows,
      insights: [
        {
          label: "Volume",
          value: totalReceived != null ? `$${totalReceived}` : mockConfig.insights[0]?.value ?? "—",
          delta: undefined,
          sparkline: volumeNum > 0 ? generateSparkline(volumeNum) : FLAT_SPARKLINE,
          strokeClass: mockConfig.insights[0]?.strokeClass ?? "",
        },
        {
          label: "Successful Payments",
          value: completedCount != null ? String(completedCount) : mockConfig.insights[1]?.value ?? "—",
          delta: pendingCount != null && pendingCount > 0 ? `${pendingCount} pending` : undefined,
          sparkline: paymentsNum > 0 ? generateSparkline(paymentsNum) : FLAT_SPARKLINE,
          strokeClass: mockConfig.insights[1]?.strokeClass ?? "",
        },
      ],
    };
  }, [
    tab,
    businessId,
    sendSidebarReady,
    liveTxRows,
    sendLiveRows,
    sendStats,
    mockConfig,
    totalReceived,
    completedCount,
    pendingCount,
  ]);

  const useLiveTreasury = tab === "collect" && businessId && totalReceived != null;
  const useLiveSendVault = tab === "send" && businessId && sendSidebarReady;
  const sendSidebarLoading = tab === "send" && businessId && !sendSidebarReady;

  return (
    <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-4 lg:self-start">
      <div className={cn(cardCls, "shrink-0")}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className={sectionTitle}>Treasury Vault</h2>
            <SectionInfo className={t.cardMuted} />
          </div>
          <Link
            href="/dashboard/withdraw"
            className={cn(
              "text-xs font-medium text-blue-600 hover:text-blue-700",
              t.dark && "text-blue-400 hover:text-blue-300"
            )}
          >
            View all
          </Link>
        </div>
        <p className={cn("text-2xl font-semibold tracking-tight", t.pageHeading)}>
          {sendSidebarLoading
            ? "…"
            : useLiveSendVault
              ? vaultUsdcAvailable ?? "0.00"
              : useLiveTreasury
                ? totalReceived
                : "—"}{" "}
          <span className={cn("text-base font-normal", t.pageSubheading)}>
            {tab === "send" ? "USDC available" : "received"}
          </span>
        </p>
        <p className={cn("mt-0.5 text-xs", t.pageSubheading)}>
          {tab === "send"
            ? "Spendable from committed payments"
            : "Global pool · memo attribution"}
        </p>
        {tab === "send" ? (
          <div className={cn("mt-4 space-y-1.5 border-t pt-4 text-sm", t.cardDivider)}>
            <div className="flex justify-between">
              <span className={t.cardRowLabel}>Payments sent</span>
              <span className={cn("font-medium", t.cardRowValueStrong)}>
                {sendSidebarLoading ? "…" : sendStats.paymentsSent}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={t.cardRowLabel}>Sent volume</span>
              <span className={cn("font-medium", t.cardRowValueStrong)}>
                {sendSidebarLoading ? "…" : `$${sendStats.sentVolumeUsdc}`}
              </span>
            </div>
          </div>
        ) : (
          <div className={cn("mt-4 space-y-1.5 border-t pt-4 text-sm", t.cardDivider)}>
            <div className="flex justify-between">
              <span className={t.cardRowLabel}>Paid links</span>
              <span className={cn("font-medium", t.cardRowValueStrong)}>
                {completedCount != null ? completedCount : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={t.cardRowLabel}>Open links</span>
              <span className={cn("font-medium", t.cardRowValueStrong)}>
                {pendingCount != null ? pendingCount : "—"}
              </span>
            </div>
          </div>
        )}
        <Button
          variant="outline"
          className={cn(
            "mt-4 w-full border-blue-200 text-blue-600 hover:bg-blue-50",
            t.dark && "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
          )}
          asChild
        >
          <Link href="/dashboard/withdraw">Withdraw / Redeem</Link>
        </Button>
      </div>

      {tab === "collect" && businessId ? (
        <CollectTransactionsCard
          theme={theme}
          transactions={linkTransactions ?? []}
          loading={txLoading && linkTransactions == null}
          className="shrink-0"
        />
      ) : (
        <div className={cn(cardCls, "shrink-0")}>
          <div className="mb-4 flex shrink-0 items-center justify-between">
            <h2 className={sectionTitle}>{config.txTitle}</h2>
            <button
              type="button"
              className={cn(
                "text-xs font-medium text-blue-600 hover:text-blue-700",
                t.dark && "text-blue-400 hover:text-blue-300"
              )}
            >
              View all
            </button>
          </div>
          <ul className="max-h-[200px] space-y-4 overflow-y-auto pr-0.5">
            {sendSidebarLoading && tab === "send" ? (
              <li className={cn("py-6 text-center text-xs", t.pageSubheading)}>Loading outgoing…</li>
            ) : config.txRows.length === 0 && tab === "send" && sendSidebarReady ? (
              <li className={cn("py-6 text-center text-xs", t.pageSubheading)}>
                No outgoing payments yet.
              </li>
            ) : (
              config.txRows.map((tx) => (
                <li key={tx.id} className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <HubAvatar value={tx.id} size={36} />
                    <div className="min-w-0">
                      <p className={cn("truncate text-sm font-medium", t.pageHeading)}>{tx.name}</p>
                      <p className={cn("whitespace-nowrap text-[11px]", t.pageSubheading)}>{tx.date}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        tx.amount.startsWith("-")
                          ? "text-red-600"
                          : t.dark
                            ? "text-slate-100"
                            : "text-slate-900"
                      )}
                    >
                      {tx.amount} {tx.currency}
                    </p>
                    <StatusBadge status={tx.status} dark={t.dark} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      <div className={cn(cardCls, "shrink-0")}>
        <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className={sectionTitle}>
              {tab === "customers" ? "Customer Insights" : tab === "subscriptions" ? "Subscription Metrics" : "Payment Insights"}
            </h2>
            <SectionInfo className={t.cardMuted} />
          </div>
          <Select defaultValue="week">
            <SelectTrigger
              className={cn(
                "h-8 w-auto gap-1 border-0 bg-transparent px-2 text-xs shadow-none",
                t.pageSubheading
              )}
            >
              <SelectValue placeholder={config.insightPeriod} />
            </SelectTrigger>
            <SelectContent className={t.selectContent}>
              <SelectItem value="week" className={t.selectItem}>
                This Week
              </SelectItem>
              <SelectItem value="month" className={t.selectItem}>
                This Month
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-5">
          {config.insights.map((insight) => (
            <div key={insight.label} className="flex items-end justify-between gap-3">
              <div>
                <p className={cn("text-xs", t.pageSubheading)}>{insight.label}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={cn("text-lg font-semibold", t.pageHeading)}>{insight.value}</span>
                  {insight.delta ? (
                    <span className="text-xs font-medium text-emerald-600">{insight.delta}</span>
                  ) : null}
                </div>
              </div>
              <Sparkline points={insight.sparkline} strokeClass={insight.strokeClass} />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function MethodCard({
  id,
  label,
  sub,
  icon: Icon,
  enabled,
  checked,
  onToggle,
  theme,
}: {
  id: string;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  checked: boolean;
  onToggle: (id: string) => void;
  theme: DashboardTheme;
}) {
  const t = hubThemeClasses(theme);

  return (
    <button
      key={id}
      type="button"
      disabled={!enabled}
      onClick={() => enabled && onToggle(id)}
      className={cn(
        "relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
        !enabled && "cursor-not-allowed opacity-50",
        checked && enabled
          ? t.dark
            ? "border-blue-500/50 bg-blue-500/10"
            : "border-blue-300 bg-blue-50/60"
          : t.dark
            ? "border-white/10 bg-white/5 hover:border-white/20"
            : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      {checked && enabled ? (
        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : null}
      <Icon className={cn("h-4 w-4", t.dark ? "text-slate-300" : "text-slate-600")} />
      <div>
        <p className={cn("text-sm font-medium", t.pageHeading)}>{label}</p>
        <p className={cn("text-[11px]", t.pageSubheading)}>{sub}</p>
      </div>
    </button>
  );
}
