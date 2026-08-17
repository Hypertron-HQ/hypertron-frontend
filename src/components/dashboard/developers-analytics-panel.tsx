"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  getPaymentLinkStatus,
  listPaymentLinks,
  type PaymentLinkListItem,
} from "@/lib/payment-links";
import { getStellarExpertTxUrl } from "@/lib/stellar-network";
import { cn } from "@/lib/utils";

function formatAmount(amount: string | null, currency: string) {
  if (amount == null || amount === "") return `— ${currency}`;
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${amount} ${currency}`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 7 })} ${currency}`;
}

function dayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  return d.toISOString().slice(0, 10);
}

function relativeTime(iso: string | null) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function DevelopersAnalyticsPanel({
  businessId,
}: {
  businessId: string;
}) {
  const [links, setLinks] = useState<PaymentLinkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listPaymentLinks(businessId);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      setLinks([]);
      return;
    }
    setLinks(result.links);
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const paid = links.filter((l) => getPaymentLinkStatus(l) === "paid");
    const pending = links.filter((l) => getPaymentLinkStatus(l) === "pending");
    const expired = links.filter((l) => getPaymentLinkStatus(l) === "expired");

    const volumeByCurrency = new Map<string, number>();
    for (const link of paid) {
      const cur = (link.currency || "XLM").toUpperCase();
      const amt = Number(link.amount || 0);
      if (!Number.isFinite(amt)) continue;
      volumeByCurrency.set(cur, (volumeByCurrency.get(cur) ?? 0) + amt);
    }

    const last7: { day: string; count: number; volume: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      last7.push({ day: key, count: 0, volume: 0 });
    }
    const byDay = new Map(last7.map((x) => [x.day, x]));
    for (const link of paid) {
      const key = dayKey(link.paidAt || link.claimedAt || link.createdAt);
      const bucket = byDay.get(key);
      if (!bucket) continue;
      bucket.count += 1;
      const amt = Number(link.amount || 0);
      if (Number.isFinite(amt)) bucket.volume += amt;
    }

    const settled = paid.length;
    const attempted = settled + expired.length;
    const successRate =
      attempted === 0 ? 100 : Math.round((settled / (settled + expired.length || 1)) * 100);

    const recent = [...links].sort((a, b) => {
      const ta = new Date(a.paidAt || a.claimedAt || a.createdAt).getTime();
      const tb = new Date(b.paidAt || b.claimedAt || b.createdAt).getTime();
      return tb - ta;
    });

    const primaryCurrency =
      [...volumeByCurrency.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "XLM";
    const primaryVolume = volumeByCurrency.get(primaryCurrency) ?? 0;

    return {
      paid,
      pending,
      expired,
      volumeByCurrency,
      last7,
      maxDayCount: Math.max(1, ...last7.map((d) => d.count)),
      successRate,
      recent,
      primaryCurrency,
      primaryVolume,
      settled,
    };
  }, [links]);

  if (loading && links.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-[#E7B66D]/35 bg-white px-5 py-12 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin text-[#4A63BE]" />
        Loading payment analytics…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0F1939]">
            Payment analytics
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Live Collect links for this workspace — paid via Freighter / pool.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E7B66D]/45 bg-white px-3 text-xs font-medium text-[#0F1939] hover:bg-[#FBF7F0]"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          eyebrow="Collected"
          value={`${stats.primaryVolume.toLocaleString(undefined, {
            maximumFractionDigits: 4,
          })} ${stats.primaryCurrency}`}
          detail={`${stats.settled} settled payments`}
          icon={<Wallet className="size-4" />}
          iconClass="bg-[#EEF2FF] text-[#4A63BE]"
        />
        <Metric
          eyebrow="Pending"
          value={String(stats.pending.length)}
          detail="Open unpaid links"
          icon={<Clock3 className="size-4" />}
          iconClass="bg-[#FBF7F0] text-[#C9A46A]"
        />
        <Metric
          eyebrow="Success rate"
          value={`${stats.successRate}%`}
          detail={`${stats.expired.length} expired`}
          icon={<TrendingUp className="size-4" />}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <Metric
          eyebrow="Total links"
          value={String(links.length)}
          detail={`${stats.paid.length} paid · ${stats.pending.length} pending`}
          icon={<CheckCircle2 className="size-4" />}
          iconClass="bg-[#EEF2FF] text-[#4A63BE]"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_360px]">
        <div className="rounded-2xl border border-[#E7B66D]/35 bg-white p-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#C9A46A] uppercase">
            Last 7 days
          </p>
          <h3 className="mt-1 text-base font-semibold text-[#0F1939]">
            Settled payments
          </h3>
          <div className="mt-6 flex h-40 items-end gap-2">
            {stats.last7.map((day) => {
              const height = Math.max(
                4,
                Math.round((day.count / stats.maxDayCount) * 100),
              );
              const label = new Date(day.day + "T12:00:00").toLocaleDateString(
                undefined,
                { weekday: "short" },
              );
              return (
                <div
                  key={day.day}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <span className="text-[10px] font-medium text-slate-500">
                    {day.count || ""}
                  </span>
                  <div className="flex h-28 w-full items-end justify-center">
                    <div
                      className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-[#121F46] to-[#4A63BE]"
                      style={{ height: `${height}%` }}
                      title={`${day.count} paid · ${day.volume.toLocaleString()} vol`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E7B66D]/35 bg-white p-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#C9A46A] uppercase">
            By currency
          </p>
          <h3 className="mt-1 text-base font-semibold text-[#0F1939]">
            Settled volume
          </h3>
          {stats.volumeByCurrency.size === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No settled payments yet.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {[...stats.volumeByCurrency.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([currency, volume]) => {
                  const max = Math.max(
                    ...[...stats.volumeByCurrency.values()],
                    1,
                  );
                  const pct = Math.round((volume / max) * 100);
                  return (
                    <li key={currency}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-[#0F1939]">
                          {currency}
                        </span>
                        <span className="font-medium text-slate-600">
                          {volume.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#121F46] to-[#4A63BE]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E7B66D]/35 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-[#0F1939]">
            Recent payments
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Wallet Collect activity for this workspace.
          </p>
        </div>
        {stats.recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            No payment links yet. Create one from Payments.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {stats.recent.slice(0, 12).map((link) => {
              const status = getPaymentLinkStatus(link);
              const tx =
                link.paymentTxHash?.trim() || link.claimTxHash?.trim() || null;
              return (
                <li
                  key={link.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
                        status === "paid"
                          ? "bg-emerald-50 text-emerald-600"
                          : status === "expired"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-[#FBF7F0] text-[#C9A46A]",
                      )}
                    >
                      {status === "paid" ? (
                        <CheckCircle2 className="size-4" />
                      ) : status === "expired" ? (
                        <XCircle className="size-4" />
                      ) : (
                        <Clock3 className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F1939]">
                        {link.purpose?.trim() ||
                          link.clientName?.trim() ||
                          "Payment link"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {relativeTime(
                          link.paidAt || link.claimedAt || link.createdAt,
                        )}
                        {link.clientName ? ` · ${link.clientName}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="text-sm font-semibold text-[#0F1939]">
                      {formatAmount(link.amount, link.currency)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                        status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : status === "expired"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-50 text-amber-800",
                      )}
                    >
                      {status === "paid"
                        ? "Paid"
                        : status === "expired"
                          ? "Expired"
                          : "Pending"}
                    </span>
                    {tx ? (
                      <a
                        href={getStellarExpertTxUrl(tx)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center gap-1 rounded-xl border border-[#E7B66D]/40 px-2.5 text-[11px] font-medium text-[#0F1939] hover:bg-[#FBF7F0]"
                      >
                        Explorer
                        <ArrowUpRight className="size-3.5" />
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Metric({
  eyebrow,
  value,
  detail,
  icon,
  iconClass,
}: {
  eyebrow: string;
  value: string;
  detail: string;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E7B66D]/35 bg-white px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-[#C9A46A] uppercase">
          {eyebrow}
        </p>
        <span
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-lg",
            iconClass,
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-[#0F1939]">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
