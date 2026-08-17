"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCheck,
  ChevronDown,
  Copy,
  Info,
  Shield,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AppSurface,
  EmptyState,
  StatusBadge,
} from "@/components/dashboard/ui";
import { PaymentLinksTable } from "@/components/dashboard/payment-links-table";
import type { WalletSession } from "@/lib/auth";
import {
  getBusinessProfile,
  updateBusinessProfile,
  type BusinessProfile,
} from "@/lib/business";
import { putNote } from "@/lib/hypertron-note-store";
import { buildDepositProof } from "@/lib/hypertron-prover";
import {
  deriveNoteSecrets,
  deriveViewingKey,
  deriveSpendKey,
  randomSaltHex,
} from "@/lib/hypertron-viewkey";
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
  "h-11 rounded-lg border border-input bg-card text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20";

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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    linkId: string;
    url: string;
    memo: string;
  } | null>(null);
  const [linksRefreshKey, setLinksRefreshKey] = useState(0);

  const vaultName = `${workspace.name} Vault`;

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
      let shield:
        | {
            shieldSalt: string;
            shieldCommitment: string;
            shieldProof: string;
            amountBaseUnits: string;
          }
        | undefined;

      if (privateSettlement) {
        if (!profile.viewPub?.trim() || !profile.spendPub?.trim()) {
          const enabled = await ensurePrivatePubs();
          if (!enabled.ok) {
            setError(enabled.error);
            return;
          }
        }

        setStatus("Building deposit proof…");
        const spendKeys = await deriveSpendKey(session.walletAddress);
        if (!spendKeys.ok) {
          setError(spendKeys.error);
          return;
        }
        const salt = randomSaltHex();
        const { ownerPk, k } = await deriveNoteSecrets(
          spendKeys.keys.spendSecret,
          salt,
        );
        const proved = await buildDepositProof(normalized, { ownerPk, k });
        if (!proved.ok) {
          setError(proved.error);
          return;
        }
        shield = {
          shieldSalt: salt,
          shieldCommitment: proved.result.commitment,
          shieldProof: proved.result.proof,
          amountBaseUnits: proved.result.amountBaseUnits,
        };
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
        shieldSalt: shield?.shieldSalt,
        shieldCommitment: shield?.shieldCommitment,
        shieldProof: shield?.shieldProof,
      });

      if (!created.ok) {
        setError(created.error);
        return;
      }

      if (shield) {
        await putNote({
          linkId: created.link.linkId,
          businessId: workspace.id,
          salt: shield.shieldSalt,
          amount: normalized,
          amountBaseUnits: shield.amountBaseUnits,
          commitment: shield.shieldCommitment,
          leafIndex: null,
          paidAt: null,
          spent: false,
          createdAt: Date.now(),
        });
      }

      setResult({
        linkId: created.link.linkId,
        url: created.link.url,
        memo: created.link.memo,
      });
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

  return (
    <div className="space-y-5">
      <nav
        className="flex gap-5 border-b border-border"
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
                className="relative cursor-not-allowed pb-3 text-sm font-medium text-muted-foreground/50"
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
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {subTab === "send" ? (
        <EmptyState
          title="Send is not available yet"
          description="Use Collect to create a payment link. Multi-input private send will land after the transfer_n checkout path is wired."
        />
      ) : (
        <>
          <AppSurface className="p-4 lg:p-5">
            <div className="mb-6">
              <h1 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Create a payment link
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Collect XLM, USDC, or EURC on Stellar. Choose transparent
                settlement or shielded pool settlement for XLM.
              </p>
            </div>

            {error ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {result ? (
              <div className="mb-6 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-900">
                    Payment link ready
                  </p>
                  <p className="mt-0.5 truncate dash-mono text-xs text-blue-800">
                    {result.url}
                  </p>
                  {result.memo ? (
                    <p className="mt-1 dash-mono text-[11px] text-blue-800/80">
                      memo {result.memo}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 gap-2"
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
                    <Label htmlFor="amount">Amount</Label>
                    <div className="flex overflow-hidden rounded-lg border border-input focus-within:ring-2 focus-within:ring-ring/20">
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
                      <label className="relative flex h-11 w-[148px] shrink-0 items-center gap-2 border-l border-input bg-muted/50 px-2.5">
                        <TokenLogo currency={currency} className="size-5" />
                        <select
                          value={currency}
                          onChange={(e) =>
                            setCurrency(e.target.value as Currency)
                          }
                          className="h-full w-full appearance-none bg-transparent pr-5 text-sm font-medium text-foreground outline-none"
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
                        <ChevronDown className="pointer-events-none absolute right-2 size-3.5 text-muted-foreground" />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">
                        Description{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </Label>
                      <span className="text-xs text-muted-foreground">
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
                    <Label htmlFor="customer">
                      Customer{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="customer"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        placeholder="Name, email, or wallet"
                        className={cn(fieldCls, "pr-10")}
                      />
                      <User className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry">Link expiry</Label>
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
                      <Calendar className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metadata">
                      Metadata{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <textarea
                      id="metadata"
                      value={metadata}
                      onChange={(e) => setMetadata(e.target.value)}
                      placeholder="Order ID, project ID, or reference"
                      rows={4}
                      className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                </div>

                <div
                  className={cn(
                    "flex flex-col gap-4 rounded-xl border p-5",
                    privateSettlement
                      ? "border-[color:var(--shielded-border)] bg-[color:var(--shielded)]/40"
                      : "border-border bg-muted/40",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">
                      Settlement rail
                    </h2>
                    <Info className="size-3.5 text-muted-foreground" />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
                    <div className="flex items-center gap-3">
                      <TokenLogo
                        currency={currency}
                        className="size-10 rounded-lg"
                      />
                      <div>
                        <p className="text-xs text-muted-foreground">Asset</p>
                        <p className="text-sm font-semibold text-foreground">
                          Stellar · {currency}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone={privateSettlement ? "shielded" : "paid"}>
                      {privateSettlement ? "Shielded" : "Transparent"}
                    </StatusBadge>
                  </div>

                  <div
                    className={cn(
                      "space-y-2 rounded-lg border px-4 py-3",
                      privateSettlement
                        ? "border-[color:var(--shielded-border)] bg-card/80"
                        : "border-border bg-card",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            Private settlement
                          </p>
                          <StatusBadge tone="neutral">Beta · Testnet</StatusBadge>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {privateSettlement
                            ? profile.viewPub?.trim() && profile.spendPub?.trim()
                              ? "You pre-mint the note; the customer funds the pool deposit. Deposit amount stays public on-chain."
                              : "First use asks Freighter for viewing + spend keys, then pre-mints the note."
                            : "Public Stellar payment to your Freighter wallet with memo attribution."}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={privateSettlement}
                        aria-label="Enable private settlement"
                        onClick={() =>
                          setPrivateSettlementOn(!privateSettlement)
                        }
                        className={cn(
                          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                          privateSettlement ? "bg-amber-600" : "bg-muted-foreground/30",
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
                    <div className="flex gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
                      <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {privateSettlement
                          ? "XLM only on the live testnet pool. Not audited."
                          : "Payer sends a classic Freighter payment. Privacy pool stays off."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {privateSettlement
                        ? "Checkout invokes pool deposit on the Hypertron transfer contract."
                        : "Settles to your wallet · attributed via memo"}
                    </p>
                    <div className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Wallet className="size-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {vaultName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {privateSettlement
                            ? "Shielded pool (testnet)"
                            : "Transparent settlement"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setAdvancedOpen((o) => !o)}
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Advanced options
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
                        className="text-xs text-muted-foreground"
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
                    <p className="text-xs text-muted-foreground">{status}</p>
                  ) : null}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 min-w-[200px] px-6"
                  >
                    {loading ? "Generating…" : "Generate payment link"}
                  </Button>
                </div>
              </div>
            </form>
          </AppSurface>

          <PaymentLinksTable
            businessId={workspace.id}
            walletAddress={session.walletAddress}
            refreshKey={linksRefreshKey}
          />
        </>
      )}
    </div>
  );
}
