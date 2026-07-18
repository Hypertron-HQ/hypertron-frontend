"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, ExternalLink, RefreshCw, CheckCircle2, Clock, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { cn } from "@/utils";
import {
  formatPaymentLinkForDisplay,
  resolvePaymentLinkCopyUrl,
} from "@/lib/payment-link-public-url";
import { getExplorerTxUrl } from "@/lib/stellar-explorer";
import { useMockDashboardData } from "@/components/demo/demo-mode-provider";
import { fallbackPaymentLinks } from "@/data/fallback";

function truncate(str: string, head = 28, tail = 10) {
  if (str.length <= head + tail + 3) return str;
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}

export interface PaymentLinkItem {
  id: string;
  url: string;
  amount: string | null;
  purpose: string | null;
  clientName: string | null;
  workflowStage: string | null;
  linkMemo: string;
  paidAt: string | null;
  paymentTxHash: string | null;
  commitmentTxHash: string | null;
  createdAt: string;
}

interface PaymentLinkListProps {
  businessId: string;
}

export function PaymentLinkList({ businessId }: PaymentLinkListProps) {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const useMock = useMockDashboardData();
  const [links, setLinks] = useState<PaymentLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [checking, setChecking] = useState<string | null>(null);
  const [statusHint, setStatusHint] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (useMock) {
        setLinks(fallbackPaymentLinks);
        return;
      }

      const res = await fetch(`/api/payment-link?businessId=${encodeURIComponent(businessId)}`, {
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : `Failed to load links (${res.status})`
        );
      }
      setLinks(Array.isArray(data?.links) ? data.links : []);
    } catch (e) {
      setLinks([]);
      setError(e instanceof Error ? e.message : "Could not load payment links");
    } finally {
      setLoading(false);
    }
  }, [businessId, useMock]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  async function checkStatus(linkId: string) {
    setChecking(linkId);
    setStatusHint(null);
    try {
      const res = await fetch(`/api/payment-link/${linkId}/status`);
      const data = await res.json();
      await fetchLinks();
      if (data.status === "pending" && data.hint) setStatusHint(data.hint);
    } catch { /* ignore */ }
    finally { setChecking(null); }
  }

  function copyLink(url: string, linkId: string) {
    navigator.clipboard.writeText(resolvePaymentLinkCopyUrl(url, linkId));
    setCopied(url);
    setTimeout(() => setCopied(null), 1800);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border shadow-sm",
        t.dark ? "border-white/10 bg-white/5" : "border-ui-border/80 bg-white"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between border-b px-5 py-4",
          t.dark ? "border-white/10" : "border-ui-border/70"
        )}
      >
        <div>
          <p className={cn("text-sm font-medium", t.pageHeading)}>Your payment links</p>
          <p className={cn("mt-0.5 text-xs", t.pageSubheading)}>
            {loading ? "Loading…" : `${links.length} link${links.length !== 1 ? "s" : ""} · payments go to your verified balance`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchLinks}
          disabled={loading}
          className={cn(
            "h-8 gap-1.5 border text-xs",
            t.dark
              ? "border-white/10 text-slate-300 hover:bg-white/10 hover:text-slate-100"
              : "border-ui-border/80 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Body */}
      <div className="px-5 py-3">
        {error && (
          <p className="text-destructive text-xs rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 mb-3">
            {error}
          </p>
        )}
        
        {statusHint && (
          <p
            className={cn(
              "mb-3 rounded-lg border px-3 py-2 text-xs",
              t.dark ? "border-white/10 bg-white/5 text-slate-400" : "border-ui-border/80 bg-slate-50 text-slate-600"
            )}
          >
            {statusHint}
          </p>
        )}

        {!loading && links.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Link2 className={cn("h-8 w-8", t.emptyIcon)} />
            <p className={cn("text-sm", t.emptyTitle)}>No payment links yet.</p>
            <p className={cn("text-xs", t.emptyBody)}>Create one using the forms above.</p>
          </div>
        )}

        {links.length > 0 && (
          <ul className={cn("divide-y", t.dark ? "divide-white/10" : "divide-ui-border/70")}>
            {links.map((link) => (
              <li key={link.id} className="flex flex-col gap-2 py-3.5">
                {/* Top row */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Amount */}
                  <span className={cn("text-sm font-semibold", t.pageHeading)}>
                    {link.amount ? `${link.amount} XLM` : "Any amount"}
                  </span>

                  {/* Status badge */}
                  {link.paidAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[11px] font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400/80 px-2 py-0.5 text-[11px] font-medium">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}

                  {/* Purpose / client */}
                  {link.purpose && (
                    <span className={cn("text-xs", t.pageSubheading)}>· {link.purpose}</span>
                  )}
                  {link.clientName && (
                    <span className={cn("text-xs", t.cardMuted)}>({link.clientName})</span>
                  )}

                  {/* Check status — pushed right */}
                  <button
                    onClick={() => checkStatus(link.id)}
                    disabled={checking === link.id}
                    className={cn(
                      "ml-auto text-[11px] transition-colors disabled:opacity-50",
                      t.dark ? "text-slate-500 hover:text-slate-200" : "text-slate-400 hover:text-slate-700"
                    )}
                  >
                    {checking === link.id ? "Checking…" : "Check status"}
                  </button>
                </div>

                {/* Bottom row — URL */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex min-w-0 items-center gap-1 font-mono text-xs transition-colors",
                      t.dark ? "text-sky-300 hover:text-sky-200" : "text-blue-700 hover:text-blue-900"
                    )}
                    title={formatPaymentLinkForDisplay(link.url, link.id)}
                  >
                    <span className="truncate">{truncate(formatPaymentLinkForDisplay(link.url, link.id))}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                  </a>

                  <button
                    onClick={() => copyLink(link.url, link.id)}
                    title="Copy link"
                    className={cn(
                      "ml-0.5 transition-colors",
                      t.dark ? "text-slate-500 hover:text-slate-200" : "text-slate-400 hover:text-slate-700"
                    )}
                  >
                    <Copy className={`h-3.5 w-3.5 ${copied === link.url ? "text-emerald-400" : ""}`} />
                  </button>

                  {link.paidAt && link.commitmentTxHash && (
                    <a
                      href={getExplorerTxUrl(link.commitmentTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "ml-2 text-[11px] transition-colors",
                        t.dark ? "text-sky-300 hover:text-sky-200" : "text-blue-700 hover:text-blue-900"
                      )}
                    >
                      On-chain proof ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
