"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  Key,
  Pencil,
  Plus,
  Settings,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { Button } from "@/components/ui/button";
import { fallbackBusiness } from "@/data/fallback";
import { PaymentPreviewCustomerCard } from "@/components/dashboard/payments/payment-preview-customer-card";
import {
  computeExpiryDate,
  expiryLabel,
  formatPreviewDateTime,
  formatUsdFromUsdc,
  parsePaymentPreviewSearchParams,
} from "@/components/dashboard/payments/payment-link-preview-utils";
import { cn } from "@/utils";

const CUSTOMER_FEATURES = [
  "Clean, secure payment page",
  "Pay with wallet, QR or on-ramp",
  "Private on-chain settlement (opt-in)",
  "Instant confirmation & receipt",
] as const;

export function PaymentLinkPreviewPage() {
  const searchParams = useSearchParams();
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const preview = useMemo(
    () => parsePaymentPreviewSearchParams(searchParams),
    [searchParams]
  );

  const [copied, setCopied] = useState(false);

  const businessName = fallbackBusiness.name?.trim() || "Acme Labs";
  const createdAt = useMemo(() => new Date(), []);
  const expiresAt = useMemo(
    () => computeExpiryDate(preview.expiry, createdAt),
    [preview.expiry, createdAt]
  );
  const linkId = preview.linkId ?? "pay_preview_demo";
  const usdApprox = formatUsdFromUsdc(preview.amount);

  const cardCls = cn("rounded-xl border p-4 lg:p-5", t.card);
  const labelCls = cn("text-xs", t.pageSubheading);
  const valueCls = cn("text-sm font-medium", t.pageHeading);

  async function shareLink() {
    const url = preview.linkUrl;
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard/payment-links"
            className={cn(
              "inline-flex w-fit items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700",
              t.dark && "text-blue-400 hover:text-blue-300"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Payment Links
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className={cn("gap-2", t.outlineBtn)}>
              <Key className="h-3.5 w-3.5" />
              API Keys
            </Button>
            <Button variant="outline" size="sm" className={cn("gap-2", t.outlineBtn)} asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-3.5 w-3.5" />
                Settings
              </Link>
            </Button>
            <Button size="sm" className="gap-2 bg-blue-600 text-white hover:bg-blue-500" asChild>
              <Link href="/dashboard/payment-links">
                <Plus className="h-3.5 w-3.5" />
                New Payment
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className={cn("text-xl font-semibold tracking-tight sm:text-2xl", t.pageHeading)}>
              Preview Payment Page
            </h1>
            <p className={cn("mt-1 text-sm", t.pageSubheading)}>
              This is how your customers will see and pay.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className={cn("gap-2", t.outlineBtn)} asChild>
              <Link href="/dashboard/payment-links">
                <Pencil className="h-3.5 w-3.5" />
                Edit Payment
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn("gap-2", t.outlineBtn)}
              disabled={!preview.linkUrl}
              onClick={() => void shareLink()}
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Share Link"}
            </Button>
          </div>
        </div>
      </div>

      <p className={cn("mb-3 text-[11px] font-semibold uppercase tracking-wider", t.pageSubheading)}>
        Customer checkout preview
      </p>

      <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <PaymentPreviewCustomerCard
          preview={preview}
          businessName={businessName}
          linkId={linkId}
          usdApprox={usdApprox}
          expiresAt={expiresAt}
          className="h-full min-h-[620px]"
        />

        {/* Right sidebar */}
        <aside className="flex min-w-0 flex-col gap-4">
          <div className={cardCls}>
            <h2 className={cn("mb-4 text-sm font-semibold", t.pageHeading)}>Payment Summary</h2>
            <dl className="space-y-3">
              <div className="flex justify-between gap-3">
                <dt className={labelCls}>Amount</dt>
                <dd className={valueCls}>{preview.amount} USDC</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className={labelCls}>Description</dt>
                <dd className={cn(valueCls, "text-right")}>{preview.description}</dd>
              </div>
              {preview.customer ? (
                <div className="flex justify-between gap-3">
                  <dt className={labelCls}>Customer</dt>
                  <dd className={cn(valueCls, "text-right")}>{preview.customer}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className={labelCls}>Payment Link ID</dt>
                <dd className={cn(valueCls, "font-mono text-xs")}>{linkId}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className={labelCls}>Created</dt>
                <dd className={valueCls}>{formatPreviewDateTime(createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className={labelCls}>Expires</dt>
                <dd className={valueCls}>
                  {expiresAt ? formatPreviewDateTime(expiresAt) : expiryLabel(preview.expiry)}
                </dd>
              </div>
            </dl>
          </div>

          <div className={cardCls}>
            <h2 className={cn("mb-4 text-sm font-semibold", t.pageHeading)}>
              What your customer sees
            </h2>
            <ul className="space-y-2.5">
              {CUSTOMER_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span className={cn("text-sm", t.dark ? "text-slate-300" : "text-slate-700")}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {preview.privateSettlement ? (
            <div
              className={cn(
                "rounded-xl border p-4 lg:p-5",
                t.dark
                  ? "border-blue-500/30 bg-blue-500/10"
                  : "border-blue-100 bg-blue-50/80"
              )}
            >
              <div className="flex gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    t.dark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-600"
                  )}
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      t.dark ? "text-blue-200" : "text-blue-800"
                    )}
                  >
                    Private Settlement (Enabled)
                  </p>
                  <p className={cn("mt-1 text-xs leading-relaxed", t.pageSubheading)}>
                    Customer payments are settled with opt-in privacy. A verification proof will
                    be generated.
                  </p>
                  <button
                    type="button"
                    className={cn(
                      "mt-2 text-xs font-medium text-blue-600 hover:text-blue-700",
                      t.dark && "text-blue-400"
                    )}
                  >
                    Learn more →
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      <p className={cn("text-center text-xs leading-relaxed", t.pageSubheading)}>
        By completing this payment, you agree to Hypertron&apos;s{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
