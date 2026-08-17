"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCheck,
  Copy,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPaymentLinkStatus,
  listPaymentLinks,
  type PaymentLinkListItem,
  type PaymentLinkStatus,
} from "@/lib/payment-links";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<
  PaymentLinkStatus,
  { label: string; className: string }
> = {
  paid: {
    label: "Paid",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  pending: {
    label: "Pending",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  expired: {
    label: "Expired",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

function formatAmount(amount: string | null, currency: string) {
  if (amount == null || amount === "") return `— ${currency}`;
  return `${amount} ${currency}`;
}

function formatWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function shortId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export function PaymentLinksTable({
  businessId,
  refreshKey = 0,
}: {
  businessId: string;
  /** Bump after creating a link to refetch. */
  refreshKey?: number;
}) {
  const [links, setLinks] = useState<PaymentLinkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await listPaymentLinks(businessId);
    if (!result.ok) {
      setError(result.error);
      setLinks([]);
      setLoading(false);
      return;
    }
    setError(null);
    setLinks(result.links);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load, refreshKey]);

  // Light poll while any link is still unpaid/unexpired so Collect stays current.
  useEffect(() => {
    const hasPending = links.some(
      (link) => getPaymentLinkStatus(link) === "pending",
    );
    if (!hasPending) return;

    const id = window.setInterval(() => {
      void load();
    }, 12_000);
    return () => window.clearInterval(id);
  }, [links, load]);

  async function copyUrl(link: PaymentLinkListItem) {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
            Workspace links
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950">
            Payment links
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            All links for this workspace and their payment status.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="px-4 py-4 text-sm text-rose-700 sm:px-5">{error}</div>
      ) : null}

      {loading && links.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-10 text-sm text-slate-500 sm:px-5">
          <LoaderCircle className="size-4 animate-spin" />
          Loading payment links…
        </div>
      ) : null}

      {!loading && !error && links.length === 0 ? (
        <div className="mx-4 my-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center text-sm text-slate-400 sm:mx-5">
          No payment links yet. Generate one above to see it here.
        </div>
      ) : null}

      {links.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] tracking-[0.08em] text-slate-400 uppercase">
                <th className="px-4 py-3 font-semibold sm:px-5">Link</th>
                <th className="px-3 py-3 font-semibold">Amount</th>
                <th className="px-3 py-3 font-semibold">Customer</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold sm:px-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => {
                const status = getPaymentLinkStatus(link);
                const style = STATUS_STYLES[status];
                return (
                  <tr
                    key={link.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-3.5 sm:px-5">
                      <p className="font-medium text-slate-900">
                        {link.purpose?.trim() || "Untitled link"}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                        {shortId(link.id)}
                        {link.linkMemo ? ` · ${link.linkMemo}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap font-medium text-slate-900">
                      {formatAmount(link.amount, link.currency)}
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-3.5 text-slate-600">
                      {link.clientName?.trim() || "—"}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          style.className,
                        )}
                      >
                        {style.label}
                      </span>
                      {status === "paid" && link.paidAt ? (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatWhen(link.paidAt)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-slate-500">
                      {formatWhen(link.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 rounded-xl border-slate-200 bg-white px-2.5 text-xs text-slate-700"
                          onClick={() => void copyUrl(link)}
                        >
                          {copiedId === link.id ? (
                            <CheckCheck className="size-3.5" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                          {copiedId === link.id ? "Copied" : "Copy"}
                        </Button>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Open
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
