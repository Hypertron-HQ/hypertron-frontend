"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCheck,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  Shield,
  User,
  Wallet,
  Zap,
  Building2,
} from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import {
  MethodCard,
  SectionInfo,
  usePaymentsStyles,
} from "@/components/dashboard/payments/payments-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { USDC_LOGO_URL, type PaymentAssetCode } from "@/lib/stellar-assets";
import { cn } from "@/utils";

type SavedContact = {
  id: string;
  name: string;
  detail: string;
  type: "wallet";
};

const DELIVERY_METHODS = [
  { id: "wallet", label: "Stellar Wallet", sub: "Instant on-chain", icon: Wallet, enabled: true },
  { id: "email", label: "Email Link", sub: "Claim via secure link", icon: Mail, enabled: false },
  { id: "priority", label: "Priority Rail", sub: "Faster settlement", icon: Zap, enabled: true },
  { id: "bank", label: "Bank Transfer", sub: "Coming soon", icon: Building2, enabled: false },
] as const;

const STELLAR_NETWORK_FEE_LABEL = "~0.00001 XLM (from pool)";

type SendSuccess = {
  payoutTxHash: string;
  explorerUrl?: string;
  status: string;
  scheduledAt?: string;
};

interface PaymentsSendTabProps {
  businessId: string;
}

export function PaymentsSendTab({ businessId }: PaymentsSendTabProps) {
  const { theme } = useDashboardTheme();
  const { t, inputCls, labelCls, hintCls, sectionTitle, cardCls, panelCls } = usePaymentsStyles(theme);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [currency] = useState<PaymentAssetCode>("USDC");
  const [memo, setMemo] = useState("");
  const [timing, setTiming] = useState<"now" | "schedule">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [privateSend, setPrivateSend] = useState(false);
  const [methods, setMethods] = useState<Record<string, boolean>>({
    wallet: true,
    email: false,
    priority: false,
    bank: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SendSuccess | null>(null);
  const [copied, setCopied] = useState(false);

  const [vaultName, setVaultName] = useState("Vault");
  const [availableUsdc, setAvailableUsdc] = useState<string | null>(null);
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setBalanceLoading(true);
    fetch(`/api/payment-send?businessId=${encodeURIComponent(businessId)}`, {
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (typeof data.vaultName === "string") setVaultName(data.vaultName);
        const usdc = data.balances?.virtualBalanceUsdc;
        if (typeof usdc === "string") {
          const n = parseFloat(usdc);
          setAvailableUsdc(
            Number.isFinite(n)
              ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : "0.00"
          );
        }
        if (Array.isArray(data.contacts)) {
          setContacts(
            data.contacts.map((c: SavedContact) => ({
              id: c.id,
              name: c.name,
              detail: c.detail,
              type: "wallet" as const,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBalanceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const activeDelivery = DELIVERY_METHODS.find((m) => methods[m.id])?.id ?? "wallet";

  const filteredContacts = useMemo(() => {
    const q = recipient.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.detail.toLowerCase().includes(q)
    );
  }, [recipient, contacts]);

  function selectContact(contact: SavedContact) {
    setRecipient(`${contact.name} · ${contact.detail}`);
  }

  function selectDeliveryMethod(id: string) {
    const method = DELIVERY_METHODS.find((m) => m.id === id);
    if (!method?.enabled) return;
    setMethods({ wallet: false, email: false, priority: false, bank: false, [id]: true });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch("/api/payment-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          businessId,
          amount: amount.replace(/,/g, "").trim(),
          currency,
          recipient,
          memo,
          deliveryMethod: activeDelivery,
          privateSend,
          timing,
          scheduledAt: timing === "schedule" ? scheduleDate : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not send payment.");
        return;
      }

      setSuccess({
        payoutTxHash: data.payoutTxHash ?? "",
        explorerUrl: data.explorerUrl,
        status: data.status ?? "completed",
        scheduledAt: data.scheduledAt,
      });

      if (data.status === "completed" || data.status === "scheduled") {
        const balRes = await fetch(`/api/balance?businessId=${encodeURIComponent(businessId)}`, {
          credentials: "same-origin",
        });
        if (balRes.ok) {
          const bal = await balRes.json();
          const n = parseFloat(bal.virtualBalanceUsdc ?? "0");
          if (Number.isFinite(n)) {
            setAvailableUsdc(
              n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            );
          }
        }
        window.dispatchEvent(new CustomEvent("hypertron:payment-sent"));
      }
    } catch {
      setError("Could not send payment. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyReceipt() {
    if (!success?.payoutTxHash) return;
    const line = `${success.payoutTxHash} — Sent ${amount} ${currency} to ${recipient}`;
    navigator.clipboard.writeText(line);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const amountNum = parseFloat(amount.replace(/,/g, "") || "0");
  const availableNum = parseFloat((availableUsdc ?? "0").replace(/,/g, ""));
  const insufficient =
    Number.isFinite(amountNum) &&
    amountNum > 0 &&
    Number.isFinite(availableNum) &&
    amountNum > availableNum;

  return (
    <div className={cardCls}>
      <div className="mb-5">
        <h1 className={cn("text-xl font-semibold tracking-tight sm:text-2xl", t.pageHeading)}>
          Send a Payment
        </h1>
        <p className={cn("mt-1 text-sm", t.pageSubheading)}>
          Transfer USDC from your vault to Stellar wallets. Funds are paid from the global pool using your
          attributed balance.
        </p>
      </div>

      {error ? (
        <div
          className={cn(
            "mb-4 rounded-lg border px-4 py-3 text-sm",
            t.dark ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-800"
          )}
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className={cn(
            "mb-6 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
            t.dark ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50/80"
          )}
        >
          <div className="min-w-0">
            <p className={cn("text-sm font-medium", t.dark ? "text-emerald-200" : "text-emerald-800")}>
              {success.status === "scheduled" ? "Payment scheduled" : "Payment sent successfully"}
            </p>
            <p className={cn("mt-0.5 text-xs break-all", t.pageSubheading)}>
              {amount} {currency} → {recipient || "recipient"}
              {success.payoutTxHash ? ` · ${success.payoutTxHash.slice(0, 12)}…` : null}
            </p>
            {success.status === "scheduled" && success.scheduledAt ? (
              <p className={cn("mt-1 text-[11px]", t.pageSubheading)}>
                Scheduled for {new Date(success.scheduledAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            {success.explorerUrl ? (
              <Button type="button" size="sm" variant="outline" className={cn("gap-2", t.outlineBtn)} asChild>
                <Link href={success.explorerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Explorer
                </Link>
              </Button>
            ) : null}
            {success.payoutTxHash ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={cn("gap-2", t.outlineBtn)}
                onClick={copyReceipt}
              >
                {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy receipt"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSend} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="recipient" className={labelCls}>
                Recipient
              </Label>
              <div className="relative">
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Name, email, or Stellar wallet address"
                  className={cn(inputCls, "pr-10")}
                  required
                  autoComplete="off"
                />
                <User className={cn("pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2", t.cardMuted)} />
              </div>
              {filteredContacts.length > 0 ? (
                <ul
                  className={cn(
                    "overflow-hidden rounded-lg border text-sm shadow-sm",
                    t.dark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white"
                  )}
                  role="listbox"
                >
                  {filteredContacts.map((contact) => (
                    <li key={contact.id}>
                      <button
                        type="button"
                        role="option"
                        onClick={() => selectContact(contact)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors",
                          t.dark ? "hover:bg-white/10" : "hover:bg-slate-50"
                        )}
                      >
                        <span className={cn("font-medium", t.pageHeading)}>{contact.name}</span>
                        <span className={cn("truncate text-xs font-mono", t.pageSubheading)}>{contact.detail}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : recipient.length >= 2 && contacts.length === 0 ? (
                <p className={hintCls}>No saved contacts — add employees with wallet addresses in your team settings.</p>
              ) : recipient.length >= 2 ? (
                <p className={hintCls}>No saved contacts match — you can still send to a G… address.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="send-amount" className={labelCls}>
                Amount
              </Label>
              <div
                className={cn(
                  "flex overflow-hidden rounded-lg border focus-within:ring-2 focus-within:ring-blue-500/20",
                  t.dark ? "border-white/10" : "border-slate-200",
                  insufficient && "border-red-300 focus-within:ring-red-500/20"
                )}
              >
                <Input
                  id="send-amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={cn(inputCls, "h-11 flex-1 rounded-none border-0 focus-visible:ring-0")}
                  required
                />
                <div
                  className={cn(
                    "flex items-center gap-2 border-l px-3 text-sm font-medium",
                    t.dark ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={USDC_LOGO_URL} alt="" aria-hidden className="h-5 w-5 rounded-full object-cover" />
                  USDC
                </div>
              </div>
              <p className={hintCls}>
                Available:{" "}
                {balanceLoading ? (
                  <span className={t.pageSubheading}>…</span>
                ) : (
                  <span className={cn("font-medium", insufficient ? "text-red-600" : "text-emerald-600")}>
                    {availableUsdc ?? "0.00"} USDC
                  </span>
                )}
              </p>
              {insufficient ? (
                <p className="text-xs text-red-600">Amount exceeds available vault balance.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="memo" className={labelCls}>
                  Memo / Note <span className={cn("font-normal", t.pageSubheading)}>(optional)</span>
                </Label>
                <span className={hintCls}>{memo.length}/200</span>
              </div>
              <Textarea
                id="memo"
                value={memo}
                maxLength={200}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Add a note visible to the recipient"
                rows={3}
                className={cn(
                  "resize-none text-sm focus:ring-2 focus:ring-blue-500/20",
                  t.dark
                    ? "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                )}
              />
            </div>

            <div className="space-y-3">
              <Label className={labelCls}>When to send</Label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: "now" as const, label: "Send now", sub: "Arrives in ~3 seconds", icon: Zap },
                    { id: "schedule" as const, label: "Schedule", sub: "Pick date & time", icon: Clock },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = timing === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTiming(opt.id)}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                        active
                          ? t.dark
                            ? "border-blue-500/50 bg-blue-500/10"
                            : "border-blue-300 bg-blue-50/60"
                          : t.dark
                            ? "border-white/10 bg-white/5 hover:border-white/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-blue-600" : t.cardMuted)} />
                      <div>
                        <p className={cn("text-sm font-medium", t.pageHeading)}>{opt.label}</p>
                        <p className={cn("text-[11px]", t.pageSubheading)}>{opt.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {timing === "schedule" ? (
                <div className="relative">
                  <Input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className={cn(inputCls, "pr-10")}
                    required
                  />
                  <Calendar className={cn("pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2", t.cardMuted)} />
                </div>
              ) : null}
            </div>
          </div>

          <div className={panelCls}>
            <div className="flex items-center gap-2">
              <h2 className={sectionTitle}>Source &amp; Fees</h2>
              <SectionInfo className={t.cardMuted} />
            </div>

            <div
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3",
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
                <p className={cn("text-xs", t.pageSubheading)}>Sending from attributed balance</p>
              </div>
              <ArrowRight className={cn("h-4 w-4 shrink-0", t.cardMuted)} />
            </div>

            <div
              className={cn(
                "space-y-2 rounded-lg border px-4 py-3 text-sm",
                t.dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
              )}
            >
              <div className="flex justify-between">
                <span className={t.pageSubheading}>Network fee</span>
                <span className={cn("text-xs font-medium", t.pageHeading)}>{STELLAR_NETWORK_FEE_LABEL}</span>
              </div>
              <div className="flex justify-between">
                <span className={t.pageSubheading}>Recipient receives</span>
                <span className={cn("font-semibold tabular-nums", t.pageHeading)}>
                  {amount || "0.00"} {currency}
                </span>
              </div>
              <div className={cn("border-t pt-2", t.cardDivider)}>
                <div className="flex justify-between">
                  <span className={cn("font-medium", t.pageHeading)}>Debited from vault</span>
                  <span className={cn("font-semibold tabular-nums", t.pageHeading)}>
                    {amount || "0.00"} {currency}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "space-y-3 rounded-lg border px-4 py-3",
                t.dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className={cn("text-sm font-medium", t.pageHeading)}>Private Send</p>
                    <SectionInfo className={t.cardMuted} />
                  </div>
                  <p className={cn("mt-1 text-xs leading-relaxed", t.pageSubheading)}>
                    Recorded on your account; on-chain privacy features are not enabled in this release.
                  </p>
                </div>
                <Switch
                  checked={privateSend}
                  onCheckedChange={setPrivateSend}
                  className="shrink-0 data-[state=checked]:bg-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn("text-xs", t.pageSubheading)}>Stellar · USDC · Est. arrival: ~3 sec</span>
            </div>
          </div>
        </div>

        <div className={cn("space-y-3 border-t pt-6", t.dark ? "border-white/10" : "border-slate-200")}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={sectionTitle}>Delivery Method</h2>
              <SectionInfo className={t.cardMuted} />
            </div>
            <p className={cn("mt-0.5 text-xs", t.pageSubheading)}>How the recipient receives funds.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DELIVERY_METHODS.map((method) => (
              <MethodCard
                key={method.id}
                {...method}
                checked={methods[method.id]}
                onToggle={selectDeliveryMethod}
                theme={theme}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className={cn("text-xs", t.pageSubheading)}>
            By sending, you confirm the recipient details are correct. Transfers cannot be reversed.
          </p>
          <Button
            type="submit"
            disabled={loading || !recipient.trim() || !amount.trim() || insufficient || balanceLoading}
            className="h-11 min-w-[180px] bg-blue-600 px-6 text-white hover:bg-blue-500"
          >
            {loading ? "Processing…" : timing === "schedule" ? "Schedule Payment" : "Send Payment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
