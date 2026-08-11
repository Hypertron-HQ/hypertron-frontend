"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCheck,
  ChevronDown,
  Copy,
  ExternalLink,
  Info,
  Shield,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPaymentLink } from "@/lib/payment-links";
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
  "h-11 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20";

export function WorkspacePayments({ workspace }: { workspace: Workspace }) {
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
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    linkId: string;
    url: string;
    memo: string;
  } | null>(null);

  const vaultName = `${workspace.name} Vault`;

  const previewLabel = useMemo(() => {
    const parts = [
      amount.trim() || "0",
      currency,
      description.trim() || "untitled",
    ];
    return parts.join(" · ");
  }, [amount, currency, description]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const normalized = amount.replace(/,/g, "").trim();
    if (!normalized) return;

    setLoading(true);
    setError(null);

    const created = await createPaymentLink({
      businessId: workspace.id,
      amount: normalized,
      currency,
      purpose: description.trim() || undefined,
      clientName: customer.trim() || undefined,
      metadata: metadata.trim() || undefined,
      expiryDays: expiry,
      workflowStage: workflowStage.trim() || undefined,
    });

    setLoading(false);

    if (!created.ok) {
      setError(created.error);
      return;
    }

    setResult({
      linkId: created.link.linkId,
      url: created.link.url,
      memo: created.link.memo,
    });
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

  return (
    <div className="space-y-5">
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
                  ? "text-[#2563EB]"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#2563EB]" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {subTab === "send" ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-12 text-center text-sm text-slate-400">
          Send payments UI coming next — use Collect to create a payment link.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                Create a Payment Link
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Collect payments in XLM, USDC, or EURC on Stellar. Funds settle
                to your global pool with memo attribution.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 shrink-0 gap-2 border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50"
              title={previewLabel}
            >
              Preview Payment Page
              <ExternalLink className="size-3.5" />
            </Button>
          </div>

          {error ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-2 border-emerald-200 bg-white text-emerald-800"
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
          ) : null}

          <form onSubmit={handleGenerate} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
              <div className="flex flex-col gap-5">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium text-slate-700">
                    Amount
                  </Label>
                  <div className="flex overflow-hidden rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20">
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
                          <option key={opt.value} value={opt.value}>
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
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/40 p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Settlement &amp; Privacy
                  </h2>
                  <Info className="size-3.5 text-slate-400" />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
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
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Active
                  </span>
                </div>

                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">
                          Private Settlement
                        </p>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600 uppercase">
                          Beta · Testnet
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Default checkout preview with hash-memo privacy +
                        PoolManager commitments. Payers opt in at checkout.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={privateSettlement}
                      aria-label="Enable private settlement"
                      onClick={() => setPrivateSettlement((v) => !v)}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                        privateSettlement ? "bg-amber-600" : "bg-slate-300",
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
                  <div className="flex gap-3 rounded-lg bg-white/80 px-3 py-2.5">
                    <Shield className="mt-0.5 size-4 shrink-0 text-slate-400" />
                    <p className="text-xs leading-relaxed text-slate-500">
                      Test commitments in Secure Vault. Not audited — testnet
                      only.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    Settles to global pool · attributed to your workspace via
                    memo
                  </p>
                  <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <Wallet className="size-5 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {vaultName}
                      </p>
                      <p className="text-xs text-slate-500">Available Balance</p>
                    </div>
                    <div className="relative flex shrink-0 flex-col items-end gap-0.5">
                      <span className="absolute -top-1 right-0 size-1.5 rounded-full bg-red-500" />
                      <p className="text-sm font-semibold tabular-nums text-slate-900">
                        15,890.44 received
                      </p>
                      <p className="text-[10px] text-slate-400">
                        all-time (settled links)
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
                  className="flex items-center gap-1 text-sm font-medium text-[#2563EB] hover:text-[#1d4ed8]"
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

              <Button
                type="submit"
                disabled={loading}
                className="h-11 min-w-[200px] bg-[#2563EB] px-6 text-white hover:bg-[#1d4ed8]"
              >
                {loading ? "Generating…" : "Generate Payment Link"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
