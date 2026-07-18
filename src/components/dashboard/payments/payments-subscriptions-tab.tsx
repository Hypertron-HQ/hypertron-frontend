"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Calendar,
  CheckCheck,
  ChevronDown,
  Copy,
  CreditCard,
  MoreHorizontal,
  RefreshCw,
  Repeat,
  Sparkles,
  Wallet,
  QrCode,
  Building2,
} from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import {
  MethodCard,
  SectionInfo,
  usePaymentsStyles,
} from "@/components/dashboard/payments/payments-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils";

const EXISTING_PLANS = [
  {
    id: "p1",
    name: "Pro Monthly",
    amount: "49.00",
    interval: "Monthly",
    subscribers: 23,
    status: "Active" as const,
  },
  {
    id: "p2",
    name: "Enterprise Annual",
    amount: "499.00",
    interval: "Yearly",
    subscribers: 8,
    status: "Active" as const,
  },
  {
    id: "p3",
    name: "Starter Weekly",
    amount: "12.00",
    interval: "Weekly",
    subscribers: 16,
    status: "Paused" as const,
  },
  {
    id: "p4",
    name: "Team Quarterly",
    amount: "149.00",
    interval: "Quarterly",
    subscribers: 5,
    status: "Active" as const,
  },
  {
    id: "p5",
    name: "API Access",
    amount: "29.00",
    interval: "Monthly",
    subscribers: 41,
    status: "Active" as const,
  },
  {
    id: "p6",
    name: "Legacy Plan",
    amount: "99.00",
    interval: "Monthly",
    subscribers: 2,
    status: "Paused" as const,
  },
];

const BILLING_INTERVALS = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const PAYMENT_METHODS = [
  { id: "wallet", label: "Wallet", sub: "USDC on Stellar", icon: Wallet, enabled: true },
  { id: "qr", label: "QR Code", sub: "Instant payment", icon: QrCode, enabled: true },
  { id: "onramp", label: "On-Ramp", sub: "Buy with MoneyGram", icon: Building2, enabled: true },
  { id: "card", label: "Card", sub: "Coming soon", icon: CreditCard, enabled: false },
] as const;

const YOUR_PLANS_SECTION_ID = "your-plans";

export function PaymentsSubscriptionsTab() {
  const { theme } = useDashboardTheme();
  const { t, inputCls, labelCls, hintCls, sectionTitle, cardCls, panelCls } = usePaymentsStyles(theme);

  const plansSectionRef = useRef<HTMLDivElement>(null);

  const [planName, setPlanName] = useState("Growth Plan");
  const [amount, setAmount] = useState("79.00");
  const [interval, setInterval] = useState("monthly");
  const [description, setDescription] = useState("Full access to all features, priority support, and analytics.");
  const [trialDays, setTrialDays] = useState("14");
  const [autoRenew, setAutoRenew] = useState(true);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [methods, setMethods] = useState<Record<string, boolean>>({
    wallet: true,
    qr: true,
    onramp: false,
    card: false,
  });
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  const intervalLabel = BILLING_INTERVALS.find((i) => i.value === interval)?.label ?? "Monthly";
  const annualValue = (parseFloat(amount.replace(/,/g, "")) || 0) * (interval === "yearly" ? 1 : interval === "monthly" ? 12 : interval === "quarterly" ? 4 : 52);

  function toggleMethod(id: string) {
    setMethods((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setCreated(true);
  }

  function copyPlanLink() {
    navigator.clipboard.writeText("https://pay.hypertron.io/sub/growth-plan-abc123");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const activePlanCount = EXISTING_PLANS.filter((p) => p.status === "Active").length;

  const scrollToPlans = useCallback(() => {
    plansSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!created) return;
    const timer = window.setTimeout(scrollToPlans, 400);
    return () => window.clearTimeout(timer);
  }, [created, scrollToPlans]);

  return (
    <div className={cardCls}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={cn("text-xl font-semibold tracking-tight sm:text-2xl", t.pageHeading)}>
            Subscription Plans
          </h1>
          <p className={cn("mt-1 text-sm", t.pageSubheading)}>
            Create recurring billing plans and collect USDC on autopilot.
          </p>
        </div>
        {EXISTING_PLANS.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={scrollToPlans}
            className={cn("shrink-0 gap-2 text-sm", t.outlineBtn)}
          >
            <Repeat className="h-4 w-4" />
            Your plans
            <span className="rounded-full bg-blue-600 px-1.5 py-0 text-[10px] font-semibold tabular-nums text-white">
              {EXISTING_PLANS.length}
            </span>
          </Button>
        ) : null}
      </div>

      {created ? (
        <div
          className={cn(
            "mb-6 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between",
            t.dark ? "border-emerald-500/30 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50/80"
          )}
        >
          <div className="min-w-0">
            <p className={cn("text-sm font-medium", t.dark ? "text-emerald-200" : "text-emerald-800")}>
              Plan created — share the signup link
            </p>
            <p className={cn("mt-0.5 truncate text-xs", t.pageSubheading)}>
              https://pay.hypertron.io/sub/growth-plan-abc123
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" className={cn("shrink-0 gap-2", t.outlineBtn)} onClick={copyPlanLink}>
            {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      ) : null}

      <form onSubmit={handleCreate} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label htmlFor="plan-name" className={labelCls}>
                Plan Name
              </Label>
              <Input
                id="plan-name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g. Pro, Growth, Enterprise"
                className={inputCls}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sub-amount" className={labelCls}>
                  Price
                </Label>
                <div
                  className={cn(
                    "flex overflow-hidden rounded-lg border",
                    t.dark ? "border-white/10" : "border-slate-200"
                  )}
                >
                  <Input
                    id="sub-amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={cn(inputCls, "rounded-none border-0 focus-visible:ring-0")}
                    required
                  />
                  <span
                    className={cn(
                      "flex items-center border-l px-2.5 text-xs font-medium",
                      t.dark ? "border-white/10 bg-white/5 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"
                    )}
                  >
                    USDC
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className={labelCls}>Billing Interval</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger className={cn("h-10", t.selectTrigger, inputCls)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={t.selectContent}>
                    {BILLING_INTERVALS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className={t.selectItem}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sub-description" className={labelCls}>
                  Description <span className={cn("font-normal", t.pageSubheading)}>(shown to customers)</span>
                </Label>
                <span className={hintCls}>{description.length}/280</span>
              </div>
              <Textarea
                id="sub-description"
                value={description}
                maxLength={280}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={cn(
                  "resize-none text-sm focus:ring-2 focus:ring-blue-500/20",
                  t.dark
                    ? "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500"
                    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trial" className={labelCls}>
                  Free Trial <span className={cn("font-normal", t.pageSubheading)}>(days)</span>
                </Label>
                <Select value={trialDays} onValueChange={setTrialDays}>
                  <SelectTrigger className={cn("h-10 gap-2", t.selectTrigger, inputCls)}>
                    <SelectValue />
                    <Calendar className={cn("ml-auto h-4 w-4 shrink-0", t.cardMuted)} />
                  </SelectTrigger>
                  <SelectContent className={t.selectContent}>
                    <SelectItem value="0" className={t.selectItem}>No trial</SelectItem>
                    <SelectItem value="7" className={t.selectItem}>7 days</SelectItem>
                    <SelectItem value="14" className={t.selectItem}>14 days</SelectItem>
                    <SelectItem value="30" className={t.selectItem}>30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelCls}>Renewal</Label>
                <div
                  className={cn(
                    "flex h-10 items-center justify-between rounded-lg border px-3",
                    t.dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                  )}
                >
                  <span className={cn("text-sm", t.pageHeading)}>Auto-renew</span>
                  <Switch checked={autoRenew} onCheckedChange={setAutoRenew} className="data-[state=checked]:bg-blue-600" />
                </div>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-3",
                t.dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
              )}
            >
              <div>
                <p className={cn("text-sm font-medium", t.pageHeading)}>Email reminders</p>
                <p className={cn("text-xs", t.pageSubheading)}>Notify before renewal and on failed payments</p>
              </div>
              <Switch checked={notifyCustomer} onCheckedChange={setNotifyCustomer} className="data-[state=checked]:bg-blue-600" />
            </div>
          </div>

          <div className={panelCls}>
            <div className="flex items-center gap-2">
              <h2 className={sectionTitle}>Plan Preview</h2>
              <SectionInfo className={t.cardMuted} />
            </div>
            <p className={cn("text-xs", t.pageSubheading)}>What your customer will see at checkout.</p>

            <div
              className={cn(
                "overflow-hidden rounded-xl border shadow-sm",
                t.dark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white"
              )}
            >
              <div className={cn("px-5 py-4", t.dark ? "bg-blue-950/50" : "bg-gradient-to-br from-blue-50 to-white")}>
                <div className="flex items-center gap-2">
                  <Repeat className={cn("h-4 w-4 text-blue-600", t.dark && "text-blue-400")} />
                  <span className={cn("text-xs font-medium uppercase tracking-wide", t.pageSubheading)}>
                    Subscription
                  </span>
                </div>
                <p className={cn("mt-2 text-xl font-bold", t.pageHeading)}>{planName || "Plan Name"}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className={cn("text-3xl font-bold tabular-nums", t.pageHeading)}>${amount || "0.00"}</span>
                  <span className={cn("text-sm", t.pageSubheading)}>USDC / {intervalLabel.toLowerCase()}</span>
                </div>
              </div>
              <div className="space-y-3 px-5 py-4">
                <p className={cn("text-sm leading-relaxed", t.pageSubheading)}>
                  {description || "Plan description will appear here."}
                </p>
                {parseInt(trialDays, 10) > 0 ? (
                  <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2", t.dark ? "bg-emerald-500/10" : "bg-emerald-50")}>
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span className={cn("text-xs font-medium", t.dark ? "text-emerald-300" : "text-emerald-700")}>
                      {trialDays}-day free trial included
                    </span>
                  </div>
                ) : null}
                <div className={cn("space-y-1.5 border-t pt-3 text-xs", t.cardDivider)}>
                  <div className="flex justify-between">
                    <span className={t.pageSubheading}>Est. annual value</span>
                    <span className={cn("font-medium tabular-nums", t.pageHeading)}>
                      ${annualValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={t.pageSubheading}>Renewal</span>
                    <span className={cn("font-medium", t.pageHeading)}>{autoRenew ? "Automatic" : "Manual"}</span>
                  </div>
                </div>
                <Button type="button" disabled className="h-10 w-full bg-blue-600/80 text-white">
                  Subscribe with USDC
                </Button>
              </div>
            </div>

            <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2", t.dark ? "bg-white/5" : "bg-slate-100/80")}>
              <RefreshCw className={cn("h-3.5 w-3.5", t.cardMuted)} />
              <p className={cn("text-[11px]", t.pageSubheading)}>
                Failed payments retry automatically up to 3 times over 7 days.
              </p>
            </div>
          </div>
        </div>

        <div className={cn("space-y-3 border-t pt-6", t.dark ? "border-white/10" : "border-slate-200")}>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={sectionTitle}>Accepted Payment Methods</h2>
              <SectionInfo className={t.cardMuted} />
            </div>
            <p className={cn("mt-0.5 text-xs", t.pageSubheading)}>Methods available on the subscription checkout page.</p>
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

        <div className="flex flex-col items-stretch gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700",
              t.dark && "text-blue-400 hover:text-blue-300"
            )}
          >
            Advanced billing rules
            <ChevronDown className="h-4 w-4" />
          </button>
          <Button type="submit" disabled={loading} className="h-11 min-w-[200px] bg-blue-600 px-6 text-white hover:bg-blue-500">
            {loading ? "Creating…" : "Create Subscription Plan"}
          </Button>
        </div>
      </form>

      {EXISTING_PLANS.length > 0 ? (
        <div
          id={YOUR_PLANS_SECTION_ID}
          ref={plansSectionRef}
          className={cn("scroll-mt-24 space-y-3 border-t pt-8", t.dark ? "border-white/10" : "border-slate-200")}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className={sectionTitle}>Your Plans</h2>
            <span className={hintCls}>
              {activePlanCount} active · {EXISTING_PLANS.length} total
            </span>
          </div>
          <div
            className={cn(
              "overflow-hidden rounded-xl border",
              t.dark ? "border-white/10" : "border-slate-200"
            )}
          >
            <div
              className={cn(
                "hidden grid-cols-[minmax(0,1fr)_100px_100px_90px_80px_36px] gap-3 border-b px-4 py-2.5 text-xs font-medium sm:grid",
                t.dark ? "border-white/10 bg-white/[0.02]" : "border-slate-100 bg-slate-50/80",
                t.pageSubheading
              )}
            >
              <span>Plan</span>
              <span>Price</span>
              <span>Interval</span>
              <span>Subscribers</span>
              <span>Status</span>
              <span className="sr-only">Actions</span>
            </div>
            <ul
              className={cn(
                "scrollbar-subtle divide-y overflow-y-auto",
                t.dark ? "divide-white/10" : "divide-slate-100",
                EXISTING_PLANS.length > 5 && "max-h-[280px]"
              )}
            >
              {EXISTING_PLANS.map((plan) => {
                const selected = selectedPlan === plan.id;
                return (
                  <li key={plan.id}>
                    <div
                      className={cn(
                        "group transition-colors",
                        selected
                          ? t.dark
                            ? "bg-blue-500/10"
                            : "bg-blue-50/60"
                          : t.dark
                            ? "hover:bg-white/[0.03]"
                            : "hover:bg-slate-50/80"
                      )}
                    >
                      <div className="flex items-start gap-3 px-4 py-3 sm:hidden">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            t.dark ? "bg-white/10" : "bg-slate-100"
                          )}
                        >
                          <Repeat className={cn("h-4 w-4", t.dark ? "text-slate-300" : "text-slate-600")} />
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedPlan(selected ? null : plan.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("truncate text-sm font-semibold", t.pageHeading)}>{plan.name}</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 text-[10px]",
                                plan.status === "Active"
                                  ? t.dark
                                    ? "border-emerald-500/30 text-emerald-300"
                                    : "border-emerald-200 text-emerald-700"
                                  : t.dark
                                    ? "border-amber-500/30 text-amber-300"
                                    : "border-amber-200 text-amber-700"
                              )}
                            >
                              {plan.status}
                            </Badge>
                          </div>
                          <p className={cn("mt-0.5 text-xs tabular-nums", t.pageSubheading)}>
                            ${plan.amount} · {plan.interval.toLowerCase()} · {plan.subscribers} subscribers
                          </p>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", t.menuBtn)}
                              aria-label={`Actions for ${plan.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={cn("min-w-[160px] rounded-xl border", t.menuContent)}>
                            <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px]", t.menuItem)}>
                              Edit plan
                            </DropdownMenuItem>
                            <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px]", t.menuItem)}>
                              Copy signup link
                            </DropdownMenuItem>
                            <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px]", t.menuItem)}>
                              View subscribers
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className={t.menuSeparator} />
                            <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px]", t.menuItem)}>
                              {plan.status === "Active" ? "Pause plan" : "Resume plan"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="hidden items-center gap-3 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_100px_100px_90px_80px_36px]">
                        <button
                          type="button"
                          onClick={() => setSelectedPlan(selected ? null : plan.id)}
                          className="flex min-w-0 items-center gap-3 text-left sm:contents"
                        >
                          <div className="flex min-w-0 items-center gap-3 sm:col-span-1">
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                t.dark ? "bg-white/10" : "bg-slate-100"
                              )}
                            >
                              <Repeat className={cn("h-4 w-4", t.dark ? "text-slate-300" : "text-slate-600")} />
                            </div>
                            <p className={cn("truncate text-sm font-semibold", t.pageHeading)}>{plan.name}</p>
                          </div>
                          <p className={cn("text-sm font-semibold tabular-nums sm:col-start-2", t.pageHeading)}>
                            ${plan.amount}
                          </p>
                          <p className={cn("text-sm sm:col-start-3", t.pageSubheading)}>{plan.interval}</p>
                          <p className={cn("text-sm tabular-nums sm:col-start-4", t.pageSubheading)}>
                            {plan.subscribers}
                          </p>
                          <div className="sm:col-start-5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                plan.status === "Active"
                                  ? t.dark
                                    ? "border-emerald-500/30 text-emerald-300"
                                    : "border-emerald-200 text-emerald-700"
                                  : t.dark
                                    ? "border-amber-500/30 text-amber-300"
                                    : "border-amber-200 text-amber-700"
                              )}
                            >
                              {plan.status}
                            </Badge>
                          </div>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 sm:col-start-6",
                                t.menuBtn
                              )}
                              aria-label={`Actions for ${plan.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={cn("min-w-[160px] rounded-xl border", t.menuContent)}>
                            <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px]", t.menuItem)}>
                              Edit plan
                            </DropdownMenuItem>
                            <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px]", t.menuItem)}>
                              Copy signup link
                            </DropdownMenuItem>
                            <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px]", t.menuItem)}>
                              View subscribers
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className={t.menuSeparator} />
                            <DropdownMenuItem className={cn("cursor-pointer rounded-lg text-[13px]", t.menuItem)}>
                              {plan.status === "Active" ? "Pause plan" : "Resume plan"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          {EXISTING_PLANS.length > 5 ? (
            <p className={cn("text-center text-[11px]", t.pageSubheading)}>
              Scroll to see all {EXISTING_PLANS.length} plans
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
