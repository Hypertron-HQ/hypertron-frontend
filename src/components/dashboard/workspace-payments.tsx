"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCheck,
  ChevronDown,
  Copy,
  ExternalLink,
  Info,
  Mail,
  Shield,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaymentLinksTable } from "@/components/dashboard/payment-links-table";
import { PaymentsSendTab } from "@/components/dashboard/payments-send-tab";
import type { WalletSession } from "@/lib/auth";
import {
  getBusinessProfile,
  updateBusinessProfile,
  type BusinessProfile,
} from "@/lib/business";
import { deriveViewingKey, deriveSpendKey } from "@/lib/hypertron-viewkey";
import {
  createPaymentLink,
  extractCustomerEmail,
  sendPaymentLinkInvoice,
} from "@/lib/payment-links";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/mockdata";

type Currency = "XLM" | "USDC" | "EURC";
type PaymentsSubTab = "collect" | "send" | "subscriptions" | "customers";

const SUB_TABS: { id: PaymentsSubTab; label: string; enabled: boolean }[] = [
  { id: "collect", label: "Collect", enabled: true },
  { id: "send", label: "Send", enabled: true },
  { id: "subscriptions", label: "Subscriptions", enabled: false },
  { id: "customers", label: "Customers", enabled: false },
];

const EXPIRY_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "never", label: "Never" },
] as const;

/** CoinGecko CDN logos (coin-images.coingecko.com). */
const CURRENCY_OPTIONS: { value: Currency; logo: string }[] = [
  {
    value: "XLM",
    logo: "https://coin-images.coingecko.com/coins/images/100/small/fmpFRHHQ_400x400.jpg",
  },
  {
    value: "USDC",
    logo: "https://coin-images.coingecko.com/coins/images/6319/small/USDC.png",
  },
  {
    value: "EURC",
    logo: "https://coin-images.coingecko.com/coins/images/26045/small/EURC.png",
  },
];

function TokenLogo({
  currency,
  className,
}: {
  currency: Currency;
  className?: string;
}) {
  const logo = CURRENCY_OPTIONS.find((c) => c.value === currency)?.logo;
  if (!logo) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={currency}
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  );
}

const fieldCls =
  "h-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-[#4A63BE] focus-visible:ring-[#4A63BE]/20";

const secondaryBtnCls =
  "h-10 shrink-0 gap-2 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50";

const primaryBtnCls =
  "h-11 min-w-[200px] rounded-xl bg-gradient-to-r from-[#121F46] to-[#4A63BE] px-6 font-semibold text-white shadow-[0_8px_20px_rgba(18,31,70,0.22)] hover:brightness-110";

export function WorkspacePayments({
  workspace,
  session,
  profile,
  onProfileUpdated,
}: {
  workspace: Workspace;
  session: WalletSession;
  profile: BusinessProfile;
  onProfileUpdated?: (profile: BusinessProfile) => void;
}) {
  const [subTab, setSubTab] = useState<PaymentsSubTab>("collect");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("XLM");
  const [description, setDescription] = useState("");
  const [customer, setCustomer] = useState("");
  const [expiry, setExpiry] = useState("30");
  const [metadata, setMetadata] = useState("");
  const [privateSettlement, setPrivateSettlement] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [workflowStage, setWorkflowStage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mailState, setMailState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [mailMessage, setMailMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    linkId: string;
    url: string;
    memo: string;
  } | null>(null);
  const [linksRefreshKey, setLinksRefreshKey] = useState(0);

  const vaultName = `${workspace.name} Vault`;

  const previewLabel = useMemo(() => {
    const parts = [
      amount.trim() || "0",
      currency,
      description.trim() || "untitled",
    ];
    return parts.join(" · ");
  }, [amount, currency, description]);

  function setPrivateSettlementOn(next: boolean) {
    setPrivateSettlement(next);
    if (next && currency !== "XLM") {
      setCurrency("XLM");
    }
  }

  async function ensurePrivatePubs(): Promise<
    { ok: true } | { ok: false; error: string }
  > {
    const current = await getBusinessProfile();
    if (
      current.ok &&
      current.profile.viewPub?.trim() &&
      current.profile.spendPub?.trim()
    ) {
      onProfileUpdated?.(current.profile);
      return { ok: true };
    }
    setStatus("Sign in Freighter to enable private settlement…");
    const viewDerived = await deriveViewingKey(session.walletAddress);
    if (!viewDerived.ok) return { ok: false, error: viewDerived.error };
    const spendDerived = await deriveSpendKey(session.walletAddress);
    if (!spendDerived.ok) return { ok: false, error: spendDerived.error };
    const updated = await updateBusinessProfile({
      viewPub: viewDerived.keys.viewPub,
      spendPub: spendDerived.keys.spendPub,
    });
    if (!updated.ok) return { ok: false, error: updated.error };
    onProfileUpdated?.(updated.profile);
    return { ok: true };
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const normalized = amount.replace(/,/g, "").trim();
    if (!normalized) return;

    if (privateSettlement && currency !== "XLM") {
      setError(
        "Private Settlement uses the XLM testnet pool. Switch currency to XLM.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      if (privateSettlement) {
        if (!profile.viewPub?.trim() || !profile.spendPub?.trim()) {
          const enabled = await ensurePrivatePubs();
          if (!enabled.ok) {
            setError(enabled.error);
            return;
          }
        }
      }

      setStatus("Creating payment link…");
      const created = await createPaymentLink({
        businessId: workspace.id,
        amount: normalized,
        currency,
        purpose: description.trim() || undefined,
        clientName: customer.trim() || undefined,
        note: metadata.trim() || undefined,
        privateSettlement,
        expiryDays: expiry,
        workflowStage: workflowStage.trim() || undefined,
      });

      if (!created.ok) {
        setError(created.error);
        return;
      }

      setResult({
        linkId: created.link.linkId,
        url: created.link.url,
        memo: created.link.memo,
      });
      setMailState("idle");
      setMailMessage(null);
      setLinksRefreshKey((key) => key + 1);
    } finally {
      setLoading(false);
      setStatus(null);
    }
  }

  async function copyLink() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  const customerEmail = extractCustomerEmail(customer);
  const canSendMail = Boolean(result && customerEmail);

  async function sendMail() {
    if (!result || !customerEmail || mailState === "sending") return;
    setMailState("sending");
    setMailMessage(null);
    const sent = await sendPaymentLinkInvoice(result.linkId, customerEmail);
    if (!sent.ok) {
      setMailState("error");
      setMailMessage(sent.error);
      return;
    }
    setMailState("sent");
    setMailMessage(`Invoice sent to ${sent.to}`);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C9A46A] uppercase">
          Payments
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
          {workspace.name} Payments
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create links, settle on Stellar, and track status for this workspace.
        </p>
      </div>

      <nav
        className="flex gap-5 border-b border-slate-200"
        aria-label="Payments sections"
      >
        {SUB_TABS.map((tab) => {
          const active = subTab === tab.id;
          if (!tab.enabled) {
            return (
              <span
                key={tab.id}
                title="Coming soon"
                aria-disabled="true"
                className="relative cursor-not-allowed pb-3 text-sm font-medium text-slate-400 opacity-45"
              >
                {tab.label}
              </span>
            );
          }
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={cn(
                "relative pb-3 text-sm font-medium transition-colors",
                active
                  ? "text-[#0F1939]"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-[#121F46] to-[#4A63BE]" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {subTab === "send" ? (
        <PaymentsSendTab
          workspace={workspace}
          session={session}
          profile={profile}
        />
      ) : (
        <>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-5">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
                No-code collection
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Create a Payment Link
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Collect payments in XLM, USDC, or EURC on Stellar. Funds settle
                to your global pool with memo attribution.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className={secondaryBtnCls}
              title={previewLabel}
            >
              Preview Payment Page
              <ExternalLink className="size-3.5" />
            </Button>
          </div>

          {error ? (
            <div className="mb-6 rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-800">
                  Payment link ready
                </p>
                <p className="mt-0.5 truncate font-mono text-xs text-emerald-700">
                  {result.url}
                </p>
                {result.memo ? (
                  <p className="mt-1 font-mono text-[11px] text-emerald-700/80">
                    memo {result.memo}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canSendMail || mailState === "sending"}
                    title={
                      canSendMail
                        ? `Email invoice to ${customerEmail}`
                        : "Add a customer email to send this invoice"
                    }
                    className="h-8 shrink-0 gap-2 rounded-xl border-emerald-200 bg-white text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={sendMail}
                  >
                    {mailState === "sent" ? (
                      <CheckCheck className="size-4" />
                    ) : (
                      <Mail className="size-4" />
                    )}
                    {mailState === "sending"
                      ? "Sending…"
                      : mailState === "sent"
                        ? "Sent"
                        : "Send mail"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 gap-2 rounded-xl border-emerald-200 bg-white text-emerald-800"
                    onClick={copyLink}
                  >
                    {copied ? (
                      <CheckCheck className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                </div>
                {mailMessage ? (
                  <p
                    className={
                      mailState === "error"
                        ? "max-w-[260px] text-right text-[11px] text-rose-700"
                        : "max-w-[260px] text-right text-[11px] text-emerald-800"
                    }
                  >
                    {mailMessage}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <form onSubmit={handleGenerate} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
              <div className="flex flex-col gap-5">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                    Amount
                  </Label>
                  <div className="flex overflow-hidden rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-[#4A63BE]/20">
                    <Input
                      id="amount"
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-11 flex-1 rounded-none border-0 focus-visible:ring-0"
                      placeholder="0.00"
                      required
                    />
                    <label className="relative flex h-11 w-[148px] shrink-0 items-center gap-2 border-l border-slate-200 bg-slate-50 px-2.5">
                      <TokenLogo currency={currency} className="size-5" />
                      <select
                        value={currency}
                        onChange={(e) =>
                          setCurrency(e.target.value as Currency)
                        }
                        className="h-full w-full appearance-none bg-transparent pr-5 text-sm font-medium text-slate-700 outline-none"
                        aria-label="Currency"
                      >
                        {CURRENCY_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            disabled={
                              privateSettlement && opt.value !== "XLM"
                            }
                          >
                            {opt.value}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 size-3.5 text-slate-400" />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-slate-700"
                    >
                      Description{" "}
                      <span className="font-normal text-slate-400">
                        (optional)
                      </span>
                    </Label>
                    <span className="text-xs text-slate-400">
                      {description.length}/140
                    </span>
                  </div>
                  <Input
                    id="description"
                    value={description}
                    maxLength={140}
                    onChange={(e) => setDescription(e.target.value)}
                    className={fieldCls}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="customer"
                    className="text-sm font-medium text-slate-700"
                  >
                    Customer{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="customer"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      placeholder="Enter name, email or wallet address"
                      className={cn(fieldCls, "pr-10")}
                    />
                    <User className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="expiry"
                    className="text-sm font-medium text-slate-700"
                  >
                    Payment Link Expiry
                  </Label>
                  <div className="relative">
                    <select
                      id="expiry"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className={cn(
                        fieldCls,
                        "w-full appearance-none px-3 pr-10 outline-none",
                      )}
                    >
                      {EXPIRY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <Calendar className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="metadata"
                    className="text-sm font-medium text-slate-700"
                  >
                    Metadata{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </Label>
                  <textarea
                    id="metadata"
                    value={metadata}
                    onChange={(e) => setMetadata(e.target.value)}
                    placeholder="Add order ID, project ID, or any reference"
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#4A63BE] focus:ring-2 focus:ring-[#4A63BE]/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-[#F8F9FC] p-5">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
                      Settlement &amp; Privacy
                    </p>
                    <h2 className="mt-1 text-sm font-semibold text-slate-900">
                      How this link settles
                    </h2>
                  </div>
                  <Info className="ml-auto size-3.5 text-slate-400" />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <TokenLogo
                      currency={currency}
                      className="size-10 rounded-lg"
                    />
                    <div>
                      <p className="text-xs text-slate-500">Settlement Rail</p>
                      <p className="text-sm font-semibold text-slate-900">
                        Stellar · {currency}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Active
                  </span>
                </div>

                <div className="space-y-2 rounded-xl border border-[#E7B66D]/55 bg-[#FBF7F0] px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">
                          Private Settlement
                        </p>
                        <span className="rounded-md bg-[#4A63BE] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                          Beta · Testnet
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {privateSettlement
                          ? profile.viewPub?.trim() && profile.spendPub?.trim()
                            ? "Customer shields their own XLM, then pays you with a private transfer. Payment amount stays hidden."
                            : "First use will ask Freighter for viewing + spend keys so you can receive private notes."
                          : "Public Stellar payment straight to your Freighter wallet (G…) with memo attribution."}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={privateSettlement}
                      aria-label="Enable private settlement"
                      onClick={() => setPrivateSettlementOn(!privateSettlement)}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                        privateSettlement ? "bg-[#C9A46A]" : "bg-slate-300",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                          privateSettlement && "translate-x-5",
                        )}
                      />
                    </button>
                  </div>
                  <div className="flex gap-3 rounded-xl border border-[#E7B66D]/25 bg-white/90 px-3 py-2.5">
                    <Shield className="mt-0.5 size-4 shrink-0 text-[#C9A46A]" />
                    <p className="text-xs leading-relaxed text-slate-500">
                      {privateSettlement
                        ? "XLM only on the live testnet pool. Not audited — testnet only."
                        : "Payer sends a classic Freighter payment. Privacy pool stays off."}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    {privateSettlement
                      ? "Checkout requires a shielded balance, then a private pool transfer to you."
                      : "Settles to your wallet · attributed via memo (not the privacy pool)"}
                  </p>
                  <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#4A63BE] text-white">
                      <Wallet className="size-5" strokeWidth={1.9} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {vaultName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {privateSettlement
                          ? "Shielded pool (testnet)"
                          : "Transparent settlement"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 pt-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((o) => !o)}
                  className="flex items-center gap-1 text-sm font-medium text-[#4A63BE] hover:text-[#121F46]"
                >
                  Advanced Options
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      advancedOpen && "rotate-180",
                    )}
                  />
                </button>
                {advancedOpen ? (
                  <div className="max-w-xs space-y-1.5">
                    <Label
                      htmlFor="workflow"
                      className="text-xs text-slate-500"
                    >
                      Workflow stage (optional)
                    </Label>
                    <Input
                      id="workflow"
                      value={workflowStage}
                      onChange={(e) => setWorkflowStage(e.target.value)}
                      placeholder="e.g. pending approval"
                      className={fieldCls}
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {status ? (
                  <p className="text-xs text-slate-500">{status}</p>
                ) : null}
                <Button
                  type="submit"
                  disabled={loading}
                  className={primaryBtnCls}
                >
                  {loading ? "Generating…" : "Generate Payment Link"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <PaymentLinksTable
          businessId={workspace.id}
          refreshKey={linksRefreshKey}
        />
        </>
      )}
    </div>
  );
}
