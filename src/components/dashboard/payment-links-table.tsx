"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCheck,
  Copy,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import {
  AppSurface,
  EmptyState,
  Money,
  MonoId,
  SectionLabel,
  StatusBadge,
  type StatusTone,
} from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import {
  getPaymentLinkStatus,
  listPaymentLinks,
  type PaymentLinkListItem,
  type PaymentLinkStatus,
} from "@/lib/payment-links";
import { settleClaimedPaymentLinks } from "@/lib/settle-claimed-links";

const STATUS_TONE: Record<PaymentLinkStatus, StatusTone> = {
  paid: "paid",
  pending: "pending",
  expired: "expired",
};

const STATUS_LABEL: Record<PaymentLinkStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  expired: "Expired",
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
  walletAddress,
  refreshKey = 0,
}: {
  businessId: string;
  walletAddress?: string;
  refreshKey?: number;
}) {
  const [links, setLinks] = useState<PaymentLinkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const settlingRef = useRef(false);

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

    if (!walletAddress || settlingRef.current) return;
    const needsConfirm = result.links.some(
      (link) =>
        link.claimedAt &&
        link.claimOutCommitment &&
        !link.paidAt &&
        !link.confirmedAt,
    );
    if (!needsConfirm) return;

    settlingRef.current = true;
    try {
      const settled = await settleClaimedPaymentLinks({
        walletAddress,
        links: result.links,
      });
      if (settled.confirmed === 0) return;

      const again = await listPaymentLinks(businessId);
      if (again.ok) setLinks(again.links);
    } finally {
      settlingRef.current = false;
    }
  }, [businessId, walletAddress]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load, refreshKey]);

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
    <AppSurface padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div>
          <SectionLabel>Records</SectionLabel>
          <h2 className="mt-1 font-display text-base font-semibold tracking-tight text-foreground">
            Payment links
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Status for every link in this workspace.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2"
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
        <div className="px-4 py-4 text-sm text-destructive sm:px-5">{error}</div>
      ) : null}

      {loading && links.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-10 text-sm text-muted-foreground sm:px-5">
          <LoaderCircle className="size-4 animate-spin" />
          Loading payment links…
        </div>
      ) : null}

      {!loading && !error && links.length === 0 ? (
        <div className="px-4 py-6 sm:px-5">
          <EmptyState
            title="No payment links yet"
            description="Generate one above to see it here."
          />
        </div>
      ) : null}

      {links.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
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
                return (
                  <tr
                    key={link.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3.5 sm:px-5">
                      <p className="font-medium text-foreground">
                        {link.purpose?.trim() || "Untitled link"}
                      </p>
                      <p className="mt-0.5">
                        <MonoId>
                          {shortId(link.id)}
                          {link.linkMemo ? ` · ${link.linkMemo}` : ""}
                        </MonoId>
                      </p>
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap">
                      <Money
                        value={formatAmount(link.amount, link.currency).replace(
                          ` ${link.currency}`,
                          "",
                        )}
                        unit={link.currency}
                        size="sm"
                      />
                    </td>
                    <td className="max-w-[160px] truncate px-3 py-3.5 text-muted-foreground">
                      {link.clientName?.trim() || "—"}
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge tone={STATUS_TONE[status]}>
                        {STATUS_LABEL[status]}
                      </StatusBadge>
                      {status === "paid" && link.paidAt ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {formatWhen(link.paidAt)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3.5 whitespace-nowrap text-muted-foreground">
                      {formatWhen(link.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 sm:px-5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 px-2.5 text-xs"
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
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground transition hover:bg-muted"
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
    </AppSurface>
  );
}
