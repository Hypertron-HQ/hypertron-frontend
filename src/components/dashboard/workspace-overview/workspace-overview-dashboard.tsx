"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Wallet,
  Clock,
  Link2,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  CreditCard,
  BarChart3,
  Sparkles,
  Inbox,
  Loader2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { useDemoMode } from "@/components/demo/demo-mode-provider";
import {
  DEMO_COMPLIANCE_NEWS,
  DEMO_EXPENSES,
  DEMO_OPERATIONS,
  DEMO_PAYMENT_BREAKDOWN,
  DEMO_REGULATORY,
  DEMO_TREASURY_SERIES,
} from "@/lib/demo-overview-data";
import { normalizePaymentAssetCode, STELLAR_LOGO_URL, USDC_LOGO_URL, type PaymentAssetCode } from "@/lib/stellar-assets";

const HYPERTRON_CHART = {
  blue: "#60a5fa",
  blueFill: "rgba(96, 165, 250, 0.14)",
  amber: "#fbbf24",
  red: "#fca5a5",
  sky: "#7dd3fc",
} as const;

type DashboardStats = {
  totalReceivedXlm: string;
  linkCount: number;
  completed: number;
  pending: number;
};

type VaultInfo = {
  hasVault: boolean;
  balance: {
    xlm: string;
    usdc: string;
    xlmRaw: number;
    usdcRaw: number;
  } | null;
};

type LiveEvent = {
  linkId: string;
  amount: string | null;
  currency?: string;
  purpose?: string;
  clientName?: string;
  paidAt?: string;
  createdAt: string;
};

type WorkspaceOverviewDashboardProps = {
  businessId: string | null;
  workspaceName: string;
  userName: string;
  userInitials: string;
};

const overviewStyles = {
  panel: "rounded-2xl border border-slate-200/90 bg-white shadow-sm",
  title: "text-slate-900",
  muted: "text-slate-500",
  tick: "rgba(45, 52, 130, 0.45)",
} as const;

function TokenIcon({
  token,
  size = "md",
}: {
  token: PaymentAssetCode;
  size?: "sm" | "md";
}) {
  const src = token === "USDC" ? USDC_LOGO_URL : STELLAR_LOGO_URL;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size === "sm" ? 14 : 16}
      height={size === "sm" ? 14 : 16}
      className={cn(
        "shrink-0 rounded-full object-contain",
        size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
      )}
    />
  );
}

function TokenInline({
  token,
  children,
  size = "md",
}: {
  token: PaymentAssetCode;
  children: ReactNode;
  size?: "sm" | "md";
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <TokenIcon token={token} size={size} />
      {children}
    </span>
  );
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildTreasurySeries(events: LiveEvent[]): { date: string; value: number }[] {
  const paid = events.filter((e) => e.paidAt && e.amount);
  if (paid.length === 0) return [];

  const byDay = new Map<string, number>();
  for (const e of paid) {
    const d = new Date(e.paidAt!);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    const amt = parseFloat(String(e.amount));
    if (!Number.isFinite(amt)) continue;
    byDay.set(key, (byDay.get(key) ?? 0) + amt);
  }

  const days = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));
  if (days.length < 2) return [];

  let cumulative = 0;
  return days.map(([iso, value]) => {
    cumulative += value;
    const d = new Date(`${iso}T12:00:00`);
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { date, value: cumulative };
  });
}

function ChartEmptyState({ message, compact }: { message: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1.5 px-4 text-center",
        compact ? "min-h-[7rem]" : "min-h-[10rem]"
      )}
    >
      <BarChart3 className={cn("text-slate-300", compact ? "h-6 w-6" : "h-8 w-8")} />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}

function ComingSoonState({ title, compact }: { title?: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 text-center",
        compact ? "py-4" : "flex-1 py-8"
      )}
    >
      <Sparkles className={cn("text-slate-300", compact ? "h-6 w-6" : "h-7 w-7")} />
      {title ? <p className="text-sm font-semibold text-slate-700">{title}</p> : null}
      <p className="text-sm text-slate-500">Coming soon</p>
    </div>
  );
}

type PaymentSlice = {
  name: string;
  count: number;
  pct: number;
  color: string;
  volume?: number;
};

function formatPaymentVolume(amount: number): string {
  if (amount >= 10_000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function buildPaymentSlices(
  items: { name: string; count: number; color: string; volume?: number }[]
): PaymentSlice[] {
  const active = items.filter((s) => s.count > 0);
  const total = active.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return [];

  return active.map((s) => ({
    name: s.name,
    count: s.count,
    volume: s.volume,
    color: s.color,
    pct: Math.round((s.count / total) * 100),
  }));
}

function PaymentsBreakdownPanel({
  slices,
  loading,
  paymentsHref,
  styles,
}: {
  slices: PaymentSlice[];
  loading?: boolean;
  paymentsHref: string;
  styles: typeof overviewStyles;
}) {
  const totalCount = slices.reduce((sum, s) => sum + s.count, 0);
  const totalVolume = slices.reduce((sum, s) => sum + (s.volume ?? 0), 0);
  const completed = slices.find((s) => s.name === "Completed");
  const conversionRate =
    completed && totalCount > 0 ? Math.round((completed.count / totalCount) * 100) : null;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className={cn("text-sm font-semibold", styles.title)}>Payments</h2>
          <p className={cn("text-xs", styles.muted)}>Status breakdown</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs text-slate-500">
          <Link href={paymentsHref}>
            View all
            <ArrowUpRight className="ml-0.5 h-3 w-3" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      ) : slices.length === 0 ? (
        <ChartEmptyState message="Not enough data" />
      ) : (
        <>
          <div className="flex items-center gap-5">
            <div className="relative mx-auto h-44 w-44 shrink-0 sm:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="count"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {slices.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                      fontSize: 12,
                    }}
                    formatter={(value: number, _name, item) => {
                      const slice = item.payload as PaymentSlice;
                      const vol = slice.volume ? ` · ${formatPaymentVolume(slice.volume)}` : "";
                      return [`${value} (${slice.pct}%)${vol}`, slice.name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={cn("text-2xl font-semibold tabular-nums tracking-tight", styles.title)}>
                  {totalCount}
                </span>
                <span className={cn("text-[10px] font-medium uppercase tracking-wide", styles.muted)}>
                  payments
                </span>
                {totalVolume > 0 ? (
                  <span className="mt-0.5 text-xs font-semibold text-blue-600">
                    {formatPaymentVolume(totalVolume)}
                  </span>
                ) : null}
              </div>
            </div>

            <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
              {slices.map((s) => (
                <li
                  key={s.name}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-50/80 px-2.5 py-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: s.color }}
                    />
                    <span className={cn("truncate text-xs font-medium", styles.title)}>{s.name}</span>
                  </span>
                  <div className="shrink-0 text-right">
                    <p className={cn("text-xs font-semibold tabular-nums", styles.title)}>
                      {s.count}
                      <span className={cn("ml-1.5 font-normal", styles.muted)}>{s.pct}%</span>
                    </p>
                    {s.volume != null && s.volume > 0 ? (
                      <p className="text-[10px] tabular-nums text-slate-400">
                        {formatPaymentVolume(s.volume)}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {conversionRate != null || totalVolume > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-[11px]">
              {conversionRate != null ? (
                <span className={styles.muted}>
                  Success rate{" "}
                  <strong className={cn("font-semibold text-emerald-600", styles.title)}>
                    {conversionRate}%
                  </strong>
                </span>
              ) : null}
              {totalVolume > 0 ? (
                <span className={styles.muted}>
                  Volume{" "}
                  <strong className={cn("font-semibold", styles.title)}>
                    {formatPaymentVolume(totalVolume)}
                  </strong>
                </span>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  loading,
  styles,
}: {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  icon: typeof Wallet;
  loading?: boolean;
  styles: typeof overviewStyles;
}) {
  return (
    <div className={cn(styles.panel, "flex flex-col gap-2 p-3")}>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className={cn("text-[11px] font-medium", styles.muted)}>{label}</span>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      ) : (
        <p className={cn("text-lg font-semibold tabular-nums tracking-tight", styles.title)}>{value}</p>
      )}
      <p className={cn("text-[10px] leading-snug", styles.muted)}>{sub}</p>
    </div>
  );
}

export function WorkspaceOverviewDashboard({
  businessId,
  workspaceName: _workspaceName,
  userName: _userName,
  userInitials: _userInitials,
}: WorkspaceOverviewDashboardProps) {
  const styles = overviewStyles;
  const { isDemo, demoPath } = useDemoMode();
  const areaFill = HYPERTRON_CHART.blueFill;
  const areaStroke = HYPERTRON_CHART.blue;

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vault, setVault] = useState<VaultInfo | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);

  const loadData = useCallback(async () => {
    if (!businessId) {
      setStats(null);
      setVault(null);
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [statsRes, vaultRes, eventsRes] = await Promise.all([
        fetch(`/api/dashboard-stats?businessId=${encodeURIComponent(businessId)}`, {
          credentials: "same-origin",
        }),
        fetch(`/api/vault/treasury?businessId=${encodeURIComponent(businessId)}`, {
          credentials: "same-origin",
        }),
        fetch(`/api/events?businessId=${encodeURIComponent(businessId)}`, {
          credentials: "same-origin",
        }),
      ]);

      if (statsRes.ok) {
        setStats((await statsRes.json()) as DashboardStats);
      } else {
        setStats({ totalReceivedXlm: "0.0000", linkCount: 0, completed: 0, pending: 0 });
      }

      if (vaultRes.ok) {
        setVault((await vaultRes.json()) as VaultInfo);
      } else {
        setVault({ hasVault: false, balance: null });
      }

      if (eventsRes.ok) {
        const body = (await eventsRes.json()) as { events?: LiveEvent[] };
        setEvents(Array.isArray(body.events) ? body.events : []);
      } else {
        setEvents([]);
      }
    } catch {
      setStats({ totalReceivedXlm: "0.0000", linkCount: 0, completed: 0, pending: 0 });
      setVault({ hasVault: false, balance: null });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const treasurySeries = useMemo(() => {
    const fromEvents = buildTreasurySeries(events);
    if (fromEvents.length >= 2) return fromEvents;
    if (isDemo) return [...DEMO_TREASURY_SERIES];
    return fromEvents;
  }, [events, isDemo]);

  const assetBreakdown = useMemo(() => {
    if (vault?.hasVault && vault.balance) {
      return [
        { token: "USDC" as const, value: `$${vault.balance.usdc}` },
        { token: "XLM" as const, value: vault.balance.xlm },
      ];
    }
    return [];
  }, [vault]);

  const treasuryKpi = useMemo((): { value: ReactNode; sub: ReactNode } => {
    const fallbackSub = vault?.hasVault ? "Vault balance" : "Received via payment links";

    if (vault?.hasVault && vault.balance) {
      const usdc = vault.balance.usdcRaw;
      const xlm = vault.balance.xlmRaw;
      if (usdc > 0 || xlm > 0) {
        if (usdc > 0 && xlm > 0) {
          return {
            value: <TokenInline token="USDC">${vault.balance.usdc}</TokenInline>,
            sub: (
              <TokenInline token="XLM" size="sm">
                {vault.balance.xlm} XLM · Vault balance
              </TokenInline>
            ),
          };
        }
        if (usdc > 0) {
          return {
            value: <TokenInline token="USDC">${vault.balance.usdc}</TokenInline>,
            sub: fallbackSub,
          };
        }
        return {
          value: (
            <TokenInline token="XLM">
              {vault.balance.xlm} XLM
            </TokenInline>
          ),
          sub: fallbackSub,
        };
      }
    }

    const received = parseFloat(stats?.totalReceivedXlm ?? "0");
    if (Number.isFinite(received) && received > 0) {
      return {
        value: (
          <TokenInline token="XLM">
            {stats!.totalReceivedXlm} XLM
          </TokenInline>
        ),
        sub: fallbackSub,
      };
    }

    return { value: "$0.00", sub: fallbackSub };
  }, [vault, stats]);

  const paymentStatus = useMemo((): PaymentSlice[] => {
    if (isDemo) {
      return buildPaymentSlices(DEMO_PAYMENT_BREAKDOWN);
    }

    const completed = stats?.completed ?? 0;
    const pending = stats?.pending ?? 0;
    return buildPaymentSlices([
      { name: "Completed", count: completed, color: HYPERTRON_CHART.blue },
      { name: "Pending", count: pending, color: HYPERTRON_CHART.amber },
    ]);
  }, [stats, isDemo]);

  const recentActivity = useMemo(() => {
    return [...events]
      .sort((a, b) => {
        const ta = new Date(a.paidAt || a.createdAt).getTime();
        const tb = new Date(b.paidAt || b.createdAt).getTime();
        return tb - ta;
      })
      .slice(0, 5)
      .map((e) => {
        const paid = Boolean(e.paidAt);
        const label = (e.clientName || e.purpose || "Payment link").trim();
        const amt = e.amount ? parseFloat(String(e.amount)) : NaN;
        const currency: PaymentAssetCode = normalizePaymentAssetCode(e.currency);
        const amountStr = Number.isFinite(amt)
          ? amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : null;

        return {
          id: e.linkId,
          icon: paid ? CreditCard : Clock,
          currency: paid ? currency : undefined,
          text: paid
            ? amountStr
              ? `Payment received — ${amountStr} ${currency} from ${label}`
              : `Payment received from ${label}`
            : `Payment link created — ${label}`,
          time: formatTimeAgo(e.paidAt || e.createdAt),
        };
      });
  }, [events]);

  const d = stats ?? { totalReceivedXlm: "0.0000", linkCount: 0, completed: 0, pending: 0 };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total Treasury"
          value={treasuryKpi.value}
          sub={treasuryKpi.sub}
          icon={Wallet}
          loading={loading}
          styles={styles}
        />
        <KpiCard
          label="Total Received"
          value={
            <TokenInline token="XLM">
              {d.totalReceivedXlm} XLM
            </TokenInline>
          }
          sub="All-time from payment links"
          icon={TrendingUp}
          loading={loading}
          styles={styles}
        />
        <KpiCard
          label="Payment Links"
          value={String(d.linkCount)}
          sub="Active links"
          icon={Link2}
          loading={loading}
          styles={styles}
        />
        <KpiCard
          label="Completed"
          value={String(d.completed)}
          sub="Successful payments"
          icon={CheckCircle2}
          loading={loading}
          styles={styles}
        />
        <KpiCard
          label="Pending"
          value={String(d.pending)}
          sub="Awaiting payment"
          icon={Clock}
          loading={loading}
          styles={styles}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className={cn(styles.panel, "lg:col-span-5 p-4")}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className={cn("text-sm font-semibold", styles.title)}>Treasury Overview</h2>
              <p className={cn("text-xs", styles.muted)}>Cumulative received over time</p>
            </div>
            <TrendingUp className={cn("h-4 w-4", styles.muted)} />
          </div>
          <div className="h-40">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              </div>
            ) : treasurySeries.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={treasurySeries}>
                  <defs>
                    <linearGradient id="treasuryFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={areaFill} stopOpacity={1} />
                      <stop offset="100%" stopColor={areaFill} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: styles.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                    }}
                    formatter={(v: number) => [v.toLocaleString(), "Received"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={areaStroke}
                    fill="url(#treasuryFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message="Not enough data" compact />
            )}
          </div>
          {assetBreakdown.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              {assetBreakdown.map((a) => (
                <div key={a.token}>
                  <p className={cn("mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide", styles.muted)}>
                    <TokenIcon token={a.token} size="sm" />
                    {a.token}
                  </p>
                  <p className={cn("text-xs font-semibold tabular-nums", styles.title)}>{a.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className={cn(styles.panel, "lg:col-span-4 flex flex-col p-4")}>
          <h2 className={cn("text-sm font-semibold", styles.title)}>Operations Overview</h2>
          {isDemo ? (
            <>
              <ul className="mt-3 flex flex-1 flex-col gap-3">
                {DEMO_OPERATIONS.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-2 text-sm">
                    <span className={styles.title}>{item.label}</span>
                    <span className={cn("text-xs", styles.muted)}>{item.count}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg border border-red-200/80 bg-red-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-red-700">Tasks Overdue</p>
                <p className="text-[11px] text-red-600/90">5 action needed</p>
              </div>
            </>
          ) : (
            <ComingSoonState compact />
          )}
        </div>

        <div className={cn(styles.panel, "lg:col-span-3 flex flex-col p-4")}>
          <h2 className={cn("text-sm font-semibold", styles.title)}>Recent Activity</h2>
          {loading ? (
            <div className="flex flex-1 items-center justify-center py-5">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-5 text-center">
              <Inbox className="h-7 w-7 text-slate-300" />
              <p className="text-sm text-slate-500">No recent activity</p>
            </div>
          ) : (
            <ul className="mt-3 flex flex-1 flex-col gap-2">
              {recentActivity.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100">
                    {item.currency ? (
                      <TokenIcon token={item.currency} size="sm" />
                    ) : (
                      <item.icon className="h-3 w-3 text-slate-500" strokeWidth={1.75} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn("line-clamp-2 text-[11px] leading-snug", styles.title)}
                      title={item.text}
                    >
                      {item.text}
                    </p>
                    <p className={cn("mt-0.5 text-[10px]", styles.muted)}>{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className={cn(styles.panel, "p-5")}>
          <PaymentsBreakdownPanel
            slices={paymentStatus}
            loading={loading}
            paymentsHref={demoPath("/dashboard/payment-links")}
            styles={styles}
          />
        </div>

        <div className={cn(styles.panel, "p-5")}>
          <h2 className={cn("text-sm font-semibold", styles.title)}>Top Expenses</h2>
          {isDemo ? (
            <div className="mt-4 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...DEMO_EXPENSES]} layout="vertical" margin={{ left: 4, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tick={{ fill: styles.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Bar dataKey="value" fill={HYPERTRON_CHART.blue} radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ComingSoonState />
          )}
        </div>

        <div className={cn(styles.panel, "p-5")}>
          <h2 className={cn("text-sm font-semibold", styles.title)}>Compliance News</h2>
          {isDemo ? (
            <ul className="mt-4 flex flex-col gap-3">
              {DEMO_COMPLIANCE_NEWS.map((n) => (
                <li key={n.title} className="flex flex-col gap-1.5">
                  <span
                    className={cn(
                      "w-fit rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                      n.color
                    )}
                  >
                    {n.level}
                  </span>
                  <p className={cn("text-xs leading-snug", styles.title)}>{n.title}</p>
                </li>
              ))}
            </ul>
          ) : (
            <ComingSoonState />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap gap-6">
          {isDemo ? (
            <>
              <div>
                <p className={cn("text-[10px] font-semibold uppercase tracking-wide", styles.muted)}>
                  Regulatory Watch
                </p>
                <div className="mt-1 flex flex-wrap gap-4 text-xs">
                  <span className={styles.title}>
                    New Regulations <strong className="text-blue-600">{DEMO_REGULATORY.regulations}</strong>
                  </span>
                  <span className={styles.title}>
                    Updates <strong className="text-blue-600">{DEMO_REGULATORY.updates}</strong>
                  </span>
                  <span className={styles.title}>
                    Deadlines <strong className="text-amber-600">{DEMO_REGULATORY.deadlines}</strong>
                  </span>
                </div>
              </div>
              <div className="hidden h-10 w-px bg-slate-200 sm:block" />
              <div>
                <p className={cn("text-[10px] font-semibold uppercase tracking-wide", styles.muted)}>
                  Risk Overview
                </p>
                <div className="mt-1 flex flex-wrap gap-4 text-xs">
                  <span className={styles.title}>
                    High <strong className="text-red-500">{DEMO_REGULATORY.highRisk}</strong>
                  </span>
                  <span className={styles.title}>
                    Medium <strong className="text-amber-500">{DEMO_REGULATORY.mediumRisk}</strong>
                  </span>
                  <span className={styles.title}>
                    Low <strong className="text-emerald-500">{DEMO_REGULATORY.lowRisk}</strong>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <p className={cn("text-[10px] font-semibold uppercase tracking-wide", styles.muted)}>
                Regulatory Watch & Risk Overview
              </p>
              <p className={cn("text-sm", styles.muted)}>Coming soon</p>
            </div>
          )}
        </div>
        <Button asChild variant="outline" className="rounded-lg border-slate-200">
          <Link href={demoPath("/dashboard/compliance-analysis")}>
            View Risk Report
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
