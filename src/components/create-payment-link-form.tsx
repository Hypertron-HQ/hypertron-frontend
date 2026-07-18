"use client";

import { useState } from "react";
import { Link2, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { cn } from "@/utils";
import {
  formatPaymentLinkForDisplay,
  resolvePaymentLinkCopyUrl,
} from "@/lib/payment-link-public-url";

interface CreatePaymentLinkFormProps {
  businessId: string;
  onCreated?: () => void;
}

export function CreatePaymentLinkForm({ businessId, onCreated }: CreatePaymentLinkFormProps) {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const inputCls = cn(
    "h-9 border focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0",
    t.dark
      ? "border-white/10 bg-white/10 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/40"
      : "border-ui-border/80 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500/40"
  );
  const labelCls = cn("text-xs", t.dark ? "text-slate-400" : "text-slate-600");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [clientName, setClientName] = useState("");
  const [workflowStage, setWorkflowStage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    linkId: string;
    url: string;
    memo: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount.trim()) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          businessId,
          amount: amount.trim(),
          purpose: purpose.trim() || undefined,
          clientName: clientName.trim() || undefined,
          workflowStage: workflowStage.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError("Could not create a live payment link right now."); return; }
      setResult({ linkId: data.linkId, url: data.url, memo: data.memo });
      setAmount(""); setPurpose(""); setClientName(""); setWorkflowStage("");
      onCreated?.();
    } catch (err) {
      setError("Could not create a live payment link right now.");
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
            t.dark ? "border-white/10 bg-white/10" : "border-ui-border/80 bg-slate-50"
          )}
        >
          <Link2 className={cn("h-4 w-4", t.dark ? "text-slate-300" : "text-slate-600")} />
        </div>
        <div>
          <p className={cn("text-sm font-medium", t.pageHeading)}>Create payment link</p>
          <p className={cn("mt-0.5 text-xs leading-relaxed", t.pageSubheading)}>
            Fixed amount with optional client details. Share the link to receive payment.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* Amount — prominent */}
        <div className="space-y-1.5">
          <Label htmlFor="amount" className={labelCls}>Amount (XLM) <span className="text-red-400">*</span></Label>
          <Input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 100"
            required
            className={inputCls}
          />
        </div>

        {/* Optional fields — 2 col */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="purpose" className={labelCls}>Purpose</Label>
            <Input
              id="purpose"
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Invoice #123"
              className={cn(inputCls, "text-sm")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clientName" className={labelCls}>Client name</Label>
            <Input
              id="clientName"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Acme Corp"
              className={cn(inputCls, "text-sm")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="workflowStage" className={labelCls}>Workflow stage</Label>
          <Input
            id="workflowStage"
            type="text"
            value={workflowStage}
            onChange={(e) => setWorkflowStage(e.target.value)}
            placeholder="e.g. pending, signed, delivered"
            className={cn(inputCls, "text-sm")}
          />
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="mt-1 w-full border border-ui-border/80 bg-blue-600 text-white shadow-none hover:bg-blue-700"
        >
          {loading ? "Creating…" : "Create payment link"}
        </Button>
      </form>

      {/* Result */}
      {result && (
        <div
          className={cn(
            "rounded-lg border p-3.5 space-y-3",
            t.dark ? "border-emerald-500/30 bg-emerald-500/15" : "border-emerald-200 bg-emerald-50"
          )}
        >
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCheck className="h-4 w-4" />
            <span className="text-xs font-medium">Link created</span>
          </div>
          <p className={cn("text-xs", t.pageSubheading)}>
            Memo for client:{" "}
            <code
              className={cn(
                "rounded px-1.5 py-0.5 font-mono",
                t.dark ? "bg-white/10 text-slate-200" : "bg-slate-100 text-slate-700"
              )}
            >
              {result.memo}
            </code>
          </p>
          <div className="flex items-center gap-2 min-w-0">
            <input
              readOnly
              value={formatPaymentLinkForDisplay(result.url, result.linkId)}
              className={cn(
                "min-w-0 flex-1 truncate rounded-md border px-2.5 py-1.5 font-mono text-xs outline-none",
                t.dark
                  ? "border-white/10 bg-white/10 text-sky-300"
                  : "border-ui-border/80 bg-white text-blue-700"
              )}
            />
            <Button
              type="button"
              size="sm"
              onClick={copyLink}
              className={cn(
                "h-8 shrink-0 border text-xs",
                copied
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400"
                  : t.dark
                    ? "border-white/10 bg-white/10 text-slate-300 hover:bg-white/15"
                    : "border-ui-border/80 bg-white text-slate-600 hover:bg-slate-50"
              )}
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
