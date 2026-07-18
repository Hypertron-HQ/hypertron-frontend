"use client";

import { useMemo, useState } from "react";
import { Building2, CheckCircle2, ExternalLink, Loader2, QrCode, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckoutBrandPanel,
  CheckoutPayerDetails,
  CheckoutTrustFooter,
  OnRampCheckoutPanel,
  payCheckoutStyles,
  QrCheckoutPanel,
  type PayCheckoutStyles,
  type PayCheckoutTabId,
} from "@/components/dashboard/payments/payment-checkout-shared";
import { isPrivateSettlementEnabled } from "@/lib/privacy-features";
import { normalizePaymentAssetCode, STELLAR_LOGO_URL, USDC_LOGO_URL, EURC_LOGO_URL, type PaymentAssetCode } from "@/lib/stellar-assets";
import { cn } from "@/utils";

const TAB_META = [
  { id: "wallet" as const, label: "Wallet", Icon: Wallet },
  { id: "qr" as const, label: "QR Code", Icon: QrCode },
  { id: "onramp" as const, label: "On-Ramp", Icon: Building2 },
];

export type LiveCheckoutLink = {
  id: string;
  amount: string;
  currency: PaymentAssetCode;
  purpose: string | null;
  paymentMethods: string[];
  expiresAt: string | null;
  destinationAddress: string;
};

export type PaymentLiveCheckoutProps = {
  link: LiveCheckoutLink;
  businessName: string;
  /** Custom merchant logo; when omitted, Avvvatar is generated from `link.id`. */
  logoUrl?: string | null;
  displayAmount: string;
  isAnyAmount: boolean;
  customAmount: string;
  onCustomAmountChange: (v: string) => void;
  payPageUrl: string;
  kycName: string;
  kycEmail: string;
  onKycNameChange: (v: string) => void;
  onKycEmailChange: (v: string) => void;
  kycComplete: boolean;
  publicKey: string | null;
  onConnect: () => void;
  isConnecting: boolean;
  canPay: boolean;
  onPay: () => void;
  payStatus: "idle" | "building" | "signing" | "submitting" | "success" | "error";
  payError: string | null;
  txHash: string | null;
  explorerUrl: string | null;
  confirmationStatus?: "idle" | "confirming" | "confirmed" | "timeout";
  networkLabel: string;
};

function StellarRailIcon({ currency, className }: { currency: PaymentAssetCode; className?: string }) {
  return (
    <div className={cn("relative shrink-0", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STELLAR_LOGO_URL}
        alt="Stellar"
        width={36}
        height={36}
        className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200"
      />
      {currency === "USDC" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={USDC_LOGO_URL}
          alt="USDC"
          width={16}
          height={16}
          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full object-cover ring-2 ring-white"
        />
      ) : currency === "EURC" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={EURC_LOGO_URL}
          alt="EURC"
          width={16}
          height={16}
          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full object-cover ring-2 ring-white"
        />
      ) : null}
    </div>
  );
}

function AmountHeader({
  amount,
  currency,
  fiatApproxLabel,
  isAnyAmount,
  customAmount,
  onCustomAmountChange,
  styles: s,
}: {
  amount: string;
  currency: PaymentAssetCode;
  fiatApproxLabel: string | null;
  isAnyAmount: boolean;
  customAmount: string;
  onCustomAmountChange: (v: string) => void;
  styles: PayCheckoutStyles;
}) {
  return (
    <div className="shrink-0">
      <p className={cn("text-sm", s.muted)}>Amount to pay</p>
      {isAnyAmount ? (
        <div className="mt-2">
          <Label htmlFor="pay-amount-live" className={cn("text-xs font-medium", s.label)}>
            Enter amount ({currency})
          </Label>
          <div className="mt-1.5 flex overflow-hidden rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20">
            <Input
              id="pay-amount-live"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 10"
              value={customAmount}
              onChange={(e) => onCustomAmountChange(e.target.value.trim())}
              className="h-11 flex-1 rounded-none border-0 bg-white text-lg font-semibold focus-visible:ring-0"
            />
            <span className="flex items-center border-l border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
              {currency}
            </span>
          </div>
        </div>
      ) : (
        <>
          <p className={cn("mt-0.5 text-2xl font-semibold leading-tight tracking-tight", s.heading)}>
            {amount} <span className={cn("text-lg font-medium", s.muted)}>{currency}</span>
          </p>
          {fiatApproxLabel ? (
            <span className={cn("mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-xs", s.usdBadge)}>
              {fiatApproxLabel}
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}

function PayWithTabs({
  tabs,
  activeTab,
  onChange,
  styles: s,
}: {
  tabs: typeof TAB_META;
  activeTab: PayCheckoutTabId;
  onChange: (tab: PayCheckoutTabId) => void;
  styles: PayCheckoutStyles;
}) {
  return (
    <div className="mt-1 shrink-0 space-y-2.5">
      <p className={cn("text-sm font-medium", s.label)}>Pay with</p>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.Icon;
          const active = activeTab === tab.id;
          const activeCls = tab.id === "onramp" ? s.tabActiveOnramp : s.tabActiveWallet;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                active ? activeCls : s.tabInactive
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PaymentLiveCheckout(props: PaymentLiveCheckoutProps) {
  const s = payCheckoutStyles();
  const {
    link,
    businessName,
    logoUrl,
    displayAmount,
    isAnyAmount,
    customAmount,
    onCustomAmountChange,
    payPageUrl,
    kycName,
    kycEmail,
    onKycNameChange,
    onKycEmailChange,
    kycComplete,
    publicKey,
    onConnect,
    isConnecting,
    canPay,
    onPay,
    payStatus,
    payError,
    txHash,
    explorerUrl,
    confirmationStatus = "idle",
    networkLabel,
  } = props;

  const enabledIds = link.paymentMethods.length ? link.paymentMethods : ["wallet", "qr"];
  const tabs = TAB_META.filter((t) => enabledIds.includes(t.id));
  const [activeTab, setActiveTab] = useState<PayCheckoutTabId>(tabs[0]?.id ?? "wallet");
  const [privateEnabled, setPrivateEnabled] = useState(false);
  const privacyAvailable = isPrivateSettlementEnabled();

  const expiresAt = link.expiresAt ? new Date(link.expiresAt) : null;
  const description = link.purpose?.trim() || "Payment";
  const fiatApproxLabel =
    displayAmount && Number.isFinite(Number(displayAmount))
      ? (() => {
          const formatted = Number(displayAmount).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          if (link.currency === "USDC") return `≈ $${formatted} USD`;
          if (link.currency === "EURC") return `≈ €${formatted} EUR`;
          return null;
        })()
      : null;

  const isProcessing =
    payStatus === "building" || payStatus === "signing" || payStatus === "submitting";
  const processingLabel =
    payStatus === "building"
      ? "Building transaction…"
      : payStatus === "signing"
        ? "Confirm in Freighter…"
        : "Submitting to Stellar…";

  const vaultName = useMemo(() => {
    const base = businessName.trim() || "Hypertron";
    return base.endsWith("Vault") ? base : `${base} Vault`;
  }, [businessName]);

  return (
    <div
      className={cn(
        "payment-customer-preview payment-live-checkout flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200",
        s.shell
      )}
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <CheckoutBrandPanel
          businessName={businessName}
          description={description}
          logoUrl={logoUrl}
          avatarSeed={link.id}
          styles={s}
        />

        <div className={cn("payment-preview-checkout flex min-h-0 flex-col overflow-hidden p-6 sm:p-7", s.checkout)}>
          <AmountHeader
            amount={displayAmount}
            currency={link.currency}
            fiatApproxLabel={fiatApproxLabel}
            isAnyAmount={isAnyAmount}
            customAmount={customAmount}
            onCustomAmountChange={onCustomAmountChange}
            styles={s}
          />

          <PayWithTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} styles={s} />

          <CheckoutPayerDetails
            styles={s}
            kycName={kycName}
            kycEmail={kycEmail}
            onKycNameChange={onKycNameChange}
            onKycEmailChange={onKycEmailChange}
            kycComplete={kycComplete}
          />

          <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
            {activeTab === "wallet" ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className={cn("mt-1 flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3", s.card)}>
                  <div className="flex min-w-0 items-center gap-3">
                    <StellarRailIcon currency={link.currency} />
                    <div className="min-w-0">
                      <p className={cn("truncate text-sm font-medium", s.cardTitle)}>
                        {link.currency} on Stellar
                      </p>
                      <p className={cn("text-xs", s.cardMeta)}>{networkLabel}</p>
                    </div>
                  </div>
                  <Badge className={cn("shrink-0 text-[11px]", s.emeraldBadge)}>Fast &amp; low fees</Badge>
                </div>

                {payStatus === "success" && txHash && explorerUrl ? (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />
                    <p className="mt-1.5 text-sm font-semibold text-emerald-800">Payment sent</p>
                    {confirmationStatus === "confirming" ? (
                      <p className="mt-1.5 inline-flex items-center justify-center gap-1.5 text-xs text-emerald-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Confirming with merchant…
                      </p>
                    ) : confirmationStatus === "confirmed" ? (
                      <p className="mt-1.5 text-xs font-medium text-emerald-700">
                        Payment recorded — the merchant has been notified.
                      </p>
                    ) : confirmationStatus === "timeout" ? (
                      <p className="mt-1.5 text-xs text-emerald-800/80">
                        On-chain payment succeeded. Merchant confirmation may take a minute.
                      </p>
                    ) : null}
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                    >
                      View transaction <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => (publicKey ? onPay() : onConnect())}
                    disabled={
                      !kycComplete ||
                      isConnecting ||
                      isProcessing ||
                      (publicKey ? !canPay : false)
                    }
                    className="mt-3 h-10 w-full gap-2 bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {processingLabel}
                      </>
                    ) : isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting…
                      </>
                    ) : payStatus === "error" && publicKey ? (
                      `Retry · ${displayAmount} ${link.currency}`
                    ) : publicKey ? (
                      <>
                        <Wallet className="h-4 w-4" />
                        Pay {displayAmount} {link.currency}
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4" />
                        Pay with Stellar Wallet
                      </>
                    )}
                  </Button>
                )}

                {payStatus === "error" && payError ? (
                  <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {payError}
                  </p>
                ) : null}

                <CheckoutTrustFooter styles={s} />
              </div>
            ) : activeTab === "qr" ? (
              <QrCheckoutPanel
                styles={s}
                currency={link.currency}
                payPageUrl={payPageUrl}
                copyAddress={link.destinationAddress}
                privateEnabled={privateEnabled}
                onPrivateChange={setPrivateEnabled}
                privateSwitchDisabled={!privacyAvailable}
                expiresAt={expiresAt}
                detailsComplete={kycComplete}
              />
            ) : (
              <OnRampCheckoutPanel vaultName={vaultName} styles={s} currency={link.currency} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
