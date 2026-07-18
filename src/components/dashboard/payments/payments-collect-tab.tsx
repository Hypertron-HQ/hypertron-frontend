"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Shield,
  User,
  Wallet,
  QrCode,
  CreditCard,
  Building2,
} from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { buildPaymentPreviewHref } from "@/components/dashboard/payments/payment-link-preview-utils";
import {
  EURC_LOGO_URL,
  normalizePaymentAssetCode,
  paymentAssetLogo,
  STELLAR_LOGO_URL,
  USDC_LOGO_URL,
  type PaymentAssetCode,
} from "@/lib/stellar-assets";
import {
  MethodCard,
  SectionInfo,
  usePaymentsStyles,
} from "@/components/dashboard/payments/payments-shared";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PrivacyBetaBanner } from "@/components/dashboard/privacy-beta-banner";
import { isPrivateSettlementEnabled } from "@/lib/privacy-features";
import { useDemoPath } from "@/components/demo/demo-mode-provider";
import { cn } from "@/utils";
import {
  formatPaymentLinkForDisplay,
  resolvePaymentLinkCopyUrl,
} from "@/lib/payment-link-public-url";

const EXPIRY_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "never", label: "Never" },
];

const PAYMENT_METHODS = [
  { id: "wallet", label: "Wallet", sub: "USDC on Stellar", icon: Wallet, enabled: true },
  { id: "qr", label: "QR Code", sub: "Instant payment", icon: QrCode, enabled: true },
  { id: "onramp", label: "On-Ramp", sub: "MoneyGram (partner setup)", icon: Building2, enabled: true },
  { id: "card", label: "Card", sub: "Coming soon", icon: CreditCard, enabled: false },
] as const;

const CURRENCY_OPTIONS: { value: PaymentAssetCode; label: string; logo: string }[] = [
  { value: "USDC", label: "USDC", logo: USDC_LOGO_URL },
  { value: "EURC", label: "EURC", logo: EURC_LOGO_URL },
  { value: "XLM", label: "XLM", logo: STELLAR_LOGO_URL },
];

function PaymentAssetLogo({ code, className }: { code: PaymentAssetCode; className?: string }) {
  const logo = paymentAssetLogo(code);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt=""
      aria-hidden
      className={cn("h-5 w-5 shrink-0 rounded-full object-cover", className)}
    />
  );
}

function CurrencySelectLabel({ code }: { code: PaymentAssetCode }) {
  return (
    <span className="flex items-center gap-2">
      <PaymentAssetLogo code={code} />
      {code}
    </span>
  );
}

interface PaymentsCollectTabProps {
  businessId: string;
}

export function PaymentsCollectTab({ businessId }: PaymentsCollectTabProps) {
  const { theme } = useDashboardTheme();
  const { t, inputCls, labelCls, hintCls, sectionTitle, cardCls, panelCls } = usePaymentsStyles(theme);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<PaymentAssetCode>("USDC");
  const [description, setDescription] = useState("");
  const [customer, setCustomer] = useState("");
  const [expiry, setExpiry] = useState("30");
  const [metadata, setMetadata] = useState("");
  const [methods, setMethods] = useState<Record<string, boolean>>({
    wallet: true,
    qr: true,
    onramp: true,
    card: false,
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [workflowStage, setWorkflowStage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ linkId: string; url: string; memo: string } | null>(null);
  const [vaultName, setVaultName] = useState("Treasury");
  const [vaultBalance, setVaultBalance] = useState<string | null>(null);
  const [privateSettlement, setPrivateSettlement] = useState(false);
  const privacyEnabled = isPrivateSettlementEnabled();
  const secureVaultHref = useDemoPath("/dashboard/secure-vault");

  const refreshVaultStats = useCallback(() => {
    Promise.all([
      fetch("/api/business/profile", { credentials: "same-origin" }).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/dashboard-stats?businessId=${encodeURIComponent(businessId)}`, {
        credentials: "same-origin",
      }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([profile, stats]) => {
        const base =
          (typeof profile?.name === "string" && profile.name.trim()) ||
          (typeof profile?.businessName === "string" && profile.businessName.trim()) ||
          "Hypertron";
        setVaultName(base.endsWith("Vault") ? base : `${base} Vault`);
        if (stats && typeof stats.totalReceivedXlm === "string") {
          const n = parseFloat(stats.totalReceivedXlm);
          setVaultBalance(
            Number.isFinite(n)
              ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "0.00"
          );
        }
      })
      .catch(() => {});
  }, [businessId]);

  useEffect(() => {
    refreshVaultStats();
    const onPaymentReceived = () => refreshVaultStats();
    window.addEventListener("hypertron:payment-received", onPaymentReceived);
    return () => window.removeEventListener("hypertron:payment-received", onPaymentReceived);
  }, [refreshVaultStats]);

  const previewHref = useMemo(
    () =>
      buildPaymentPreviewHref({
        amount,
        currency,
        description,
        customer,
        expiry,
        privateSettlement: privacyEnabled && privateSettlement,
        methods: Object.entries(methods)
          .filter(([, enabled]) => enabled)
          .map(([id]) => id),
        linkId: result?.linkId,
        linkUrl: result?.url,
      }),
    [amount, currency, description, customer, expiry, methods, result, privacyEnabled, privateSettlement]
  );

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const normalizedAmount = amount.replace(/,/g, "").trim();
    if (!normalizedAmount) return;

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
          amount: normalizedAmount,
          currency,
          purpose: description.trim() || undefined,
          clientName: customer.trim() || undefined,
          workflowStage: workflowStage.trim() || undefined,
          metadata: metadata.trim() || undefined,
          expiryDays: expiry,
          paymentMethods: Object.entries(methods)
            .filter(([, on]) => on)
            .map(([id]) => id),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not create a payment link right now.");
        return;
      }
      setResult({ linkId: data.linkId, url: data.url, memo: data.memo });
    } catch {
      setError("Could not create a payment link right now.");
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

  function toggleMethod(id: string) {
    setMethods((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className={cardCls}>
      {privacyEnabled ? (
        <div className="mb-5">
          <PrivacyBetaBanner compact showTestLinks={false} />
        </div>
      ) : null}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={cn("text-xl font-semibold tracking-tight sm:text-2xl", t.pageHeading)}>
            Create a Payment Link
          </h1>
          <p className={cn("mt-1 text-sm", t.pageSubheading)}>
            Collect payments in USDC, EURC, or XLM on Stellar. Funds settle to your global pool with memo attribution.
          </p>
        </div>
        <Button type="button" variant="outline" className={cn("shrink-0 gap-2 text-sm", t.outlineBtn)} asChild>
          <Link href={previewHref}>
            Preview Payment Page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {result ? (
        <div
          className={cn(
            "mb-6 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
            t.dark
              ? "border-emerald-500/35 bg-emerald-500/15"
              : "border-emerald-200 bg-emerald-50"
          )}
        >
          <div className="min-w-0">
            <p className={cn("text-sm font-medium", t.dark ? "text-emerald-200" : "text-emerald-800")}>
              Payment link ready
            </p>
            <p
              className={cn(
                "mt-0.5 truncate font-mono text-xs",
                t.dark ? "text-emerald-100/90" : "text-emerald-700"
              )}
            >
              {formatPaymentLinkForDisplay(result.url, result.linkId)}
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" className={cn("shrink-0 gap-2", t.outlineBtn)} onClick={copyLink}>
            {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      ) : null}

      <form onSubmit={handleGenerate} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="amount" className={labelCls}>
                Amount
              </Label>
              <div
                className={cn(
                  "flex overflow-hidden rounded-lg border focus-within:ring-2 focus-within:ring-blue-500/20",
                  t.dark ? "border-white/10" : "border-slate-200"
                )}
              >
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={cn(inputCls, "h-11 flex-1 rounded-none border-0 focus-visible:ring-0")}
                  required
                />
                <Select
                  value={currency}
                  onValueChange={(v) => setCurrency(normalizePaymentAssetCode(v))}
                >
                  <SelectTrigger
                    className={cn(
                      "h-11 w-[140px] shrink-0 gap-1.5 rounded-none border-0 border-l px-2.5 shadow-none focus:ring-0",
                      t.dark ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"
                    )}
                  >
                    <SelectValue>
                      <CurrencySelectLabel code={currency} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className={t.selectContent}>
                    {CURRENCY_OPTIONS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className={cn(t.selectItem, "pl-9")}
                      >
                        <CurrencySelectLabel code={opt.value} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className={labelCls}>
                  Description <span className={cn("font-normal", t.pageSubheading)}>(optional)</span>
                </Label>
                <span className={hintCls}>{description.length}/140</span>
              </div>
              <Input
                id="description"
                value={description}
                maxLength={140}
                onChange={(e) => setDescription(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer" className={labelCls}>
                Customer <span className={cn("font-normal", t.pageSubheading)}>(optional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="customer"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Enter name, email or wallet address"
                  className={cn(inputCls, "pr-10")}
                />
                <User className={cn("pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2", t.cardMuted)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={labelCls}>Payment Link Expiry</Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger className={cn("h-10 gap-2", t.selectTrigger, inputCls)}>
                  <SelectValue />
                  <Calendar className={cn("ml-auto h-4 w-4 shrink-0", t.cardMuted)} />
                </SelectTrigger>
                <SelectContent className={t.selectContent}>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className={t.selectItem}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata" className={labelCls}>
                Metadata <span className={cn("font-normal", t.pageSubheading)}>(optional)</span>
              </Label>
              <Textarea
                id="metadata"
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                placeholder="Add order ID, project ID, or any reference"
                rows={4}
                className={cn(
                  "resize-none text-sm focus:ring-2 focus:ring-blue-500/20",
                  t.dark
                    ? "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                )}
              />
            </div>
          </div>

          <div className={panelCls}>
            <div className="flex items-center gap-2">
              <h2 className={sectionTitle}>Settlement &amp; Privacy</h2>
              <SectionInfo className={t.cardMuted} />
            </div>

            <div
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border px-4 py-3",
                t.dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
              )}
            >
              <div className="flex items-center gap-3">
                <PaymentAssetLogo code={currency} className="h-10 w-10 rounded-lg" />
                <div>
                  <p className={cn("text-xs", t.pageSubheading)}>Settlement Rail</p>
                  <p className={cn("text-sm font-semibold", t.pageHeading)}>Stellar · {currency}</p>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  t.dark
                    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                )}
              >
                Active
              </span>
            </div>

            <div
              className={cn(
                "space-y-2 rounded-lg border px-4 py-3",
                privacyEnabled
                  ? t.dark
                    ? "border-amber-500/25 bg-amber-500/5"
                    : "border-amber-200 bg-amber-50/50"
                  : cn("opacity-90", t.dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white")
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("text-sm font-medium", t.pageHeading)}>Private Settlement</p>
                    {privacyEnabled ? (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-medium uppercase tracking-wide"
                      >
                        Beta · Testnet
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wide">
                        Coming soon
                      </Badge>
                    )}
                  </div>
                  <p className={cn("mt-1 text-xs leading-relaxed", t.pageSubheading)}>
                    {privacyEnabled
                      ? "Default checkout preview with hash-memo privacy + PoolManager commitments. Payers opt in at checkout."
                      : "Relayer + commitment pool privacy is not configured. Payments use standard memos to your global pool."}
                  </p>
                </div>
                {privacyEnabled ? (
                  <Switch
                    checked={privateSettlement}
                    onCheckedChange={setPrivateSettlement}
                    className="shrink-0 data-[state=checked]:bg-amber-600"
                    aria-label="Enable private settlement on payment preview"
                  />
                ) : null}
              </div>
              <div className={cn("flex gap-3 rounded-lg px-3 py-2.5", t.dark ? "bg-white/5" : "bg-slate-50")}>
                <Shield className={cn("mt-0.5 h-4 w-4 shrink-0", t.cardMuted)} />
                <p className={cn("text-xs leading-relaxed", t.pageSubheading)}>
                  {privacyEnabled ? (
                    <>
                      Test commitments in{" "}
                      <Link href={secureVaultHref} className="font-medium underline underline-offset-2">
                        Secure Vault
                      </Link>
                      . Not audited — testnet only.
                    </>
                  ) : (
                    "Proof-of-payment receipts will ship with private settlement."
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className={cn("text-xs", t.pageSubheading)}>
                Settles to global pool · attributed to your workspace via memo
              </p>
              <div
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left",
                  t.dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    t.dark ? "bg-white/10" : "bg-slate-100"
                  )}
                >
                  <Wallet className={cn("h-5 w-5", t.dark ? "text-slate-300" : "text-slate-600")} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-semibold", t.pageHeading)}>{vaultName}</p>
                  <p className={cn("text-xs", t.pageSubheading)}>Available Balance</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <p className={cn("text-sm font-semibold tabular-nums", t.pageHeading)}>
                    {vaultBalance != null ? `${vaultBalance} received` : "—"}
                  </p>
                  <p className={cn("text-[10px]", t.pageSubheading)}>all-time (settled links)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cn("space-y-3 border-t pt-6", t.dark ? "border-white/10" : "border-slate-200")}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={sectionTitle}>Payment Methods</h2>
              <SectionInfo className={t.cardMuted} />
            </div>
            <p className={cn("mt-0.5 text-xs", t.pageSubheading)}>Select how your customers can pay.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PAYMENT_METHODS.map((method) => (
              <MethodCard
                key={method.id}
                {...method}
                checked={methods[method.id]}
                onToggle={toggleMethod}
                theme={theme}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className={cn(
                "flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700",
                t.dark && "text-blue-400 hover:text-blue-300"
              )}
            >
              Advanced Options
              <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
            </button>
            {advancedOpen ? (
              <div className="max-w-xs space-y-1.5">
                <Label htmlFor="workflow" className={hintCls}>
                  Workflow stage (optional)
                </Label>
                <Input
                  id="workflow"
                  value={workflowStage}
                  onChange={(e) => setWorkflowStage(e.target.value)}
                  placeholder="e.g. pending approval"
                  className={inputCls}
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading} className="h-11 min-w-[200px] bg-blue-600 px-6 text-white hover:bg-blue-500">
              {loading ? "Generating…" : "Generate Payment Link"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
