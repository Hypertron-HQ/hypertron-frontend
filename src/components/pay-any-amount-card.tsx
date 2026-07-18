"use client";

import { useState } from "react";
import { QrCode, Copy, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { cn } from "@/utils";
import {
  formatPaymentLinkForDisplay,
  resolvePaymentLinkCopyUrl,
} from "@/lib/payment-link-public-url";
import { useQRCode } from "next-qrcode";

interface PayAnyAmountCardProps {
  businessId: string;
  onCreated?: () => void;
}

export function PayAnyAmountCard({ businessId, onCreated }: PayAnyAmountCardProps) {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const { Canvas: QRCanvas } = useQRCode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; linkId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ businessId, flexibleAmount: true }),
      });
      const data = await res.json();
      if (!res.ok) { setError("Could not create a live pay-any-amount link right now."); return; }
      setResult({ url: data.url, linkId: data.linkId });
      onCreated?.();
    } catch (err) {
      setError("Could not create a live pay-any-amount link right now.");
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!result) return;
    navigator.clipboard.writeText(resolvePaymentLinkCopyUrl(result.url, result.linkId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border p-5 shadow-sm",
        t.dark ? "border-white/10 bg-white/5" : "border-ui-border/80 bg-white"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            t.dark ? "border-amber-400/30 bg-amber-400/15" : "border-amber-200 bg-amber-50"
          )}
        >
          <QrCode className={cn("h-4 w-4", t.dark ? "text-amber-300" : "text-amber-600")} />
        </div>
        <div>
          <p className={cn("text-sm font-medium", t.pageHeading)}>Pay any amount</p>
          <p className={cn("mt-0.5 text-xs leading-relaxed", t.pageSubheading)}>
            One reusable link — clients pay any amount they choose. Private and shareable.
          </p>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {!result ? (
        <Button
          onClick={handleCreate}
          disabled={loading}
          className="w-full rounded-full border border-sky-500/30 bg-sky-600 font-semibold text-white hover:bg-sky-500"
        >
          {loading ? "Creating…" : "Create & show QR"}
        </Button>
      ) : (
        <div className="flex flex-col gap-4">
          {/* QR */}
          <div className="flex justify-center">
            <div className="rounded-xl border border-white/[0.08] bg-white p-3 shadow-lg shadow-black/30">
              <QRCanvas
                text={result.url}
                options={{ errorCorrectionLevel: "M", width: 180 }}
              />
            </div>
          </div>

          {/* URL row */}
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 min-w-0">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate font-mono text-xs text-sky-300/90 transition-colors hover:text-sky-200"
            >
              {formatPaymentLinkForDisplay(result.url, result.linkId)}
            </a>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-white/25 hover:text-white/60 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyLink}
              className={`flex-1 border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white/70 hover:text-white text-xs ${copied ? "text-emerald-400 border-emerald-500/30" : ""}`}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              {copied ? "Copied!" : "Copy link"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResult(null)}
              className="text-white/30 hover:text-white/60 hover:bg-white/[0.04] text-xs px-3"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
