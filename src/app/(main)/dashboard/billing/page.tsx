"use client";

import { useEffect, useState } from "react";
import {
  CheckCheck,
  CreditCard,
  Download,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useHubPageMeta } from "@/components/dashboard/workspace-hub/hub-page-meta-context";
import { HubBillingContentSkeleton } from "@/components/dashboard/workspace-hub/hub-content-skeletons";
import { hubNavBreadcrumbs } from "@/lib/hub-nav-routes";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFreighter } from "@/hooks/useFreighter";
import {
  getWorkspaceTierState,
  hydrateWorkspaceTierFromProfile,
} from "@/lib/workspace-tier-context";
import { cn } from "@/utils";

type PlanOption = {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
};

const PLAN_OPTIONS: PlanOption[] = [
  {
    id: "tier-1",
    name: "Tier 1",
    price: "$0",
    cadence: "/mo",
    description: "Payments foundation, employee management, and compliance analysis.",
    features: ["Payments & payment links", "Employee management", "Compliance analysis"],
  },
  {
    id: "tier-2",
    name: "Tier 2",
    price: "$49",
    cadence: "/mo",
    description: "Tier 1 plus opt-in privacy, compliance execution, and RNS.",
    features: ["Everything in Tier 1", "Opt-in privacy", "Compliance execution", "RNS"],
  },
  {
    id: "tier-3",
    name: "Tier 3",
    price: "$149",
    cadence: "/mo",
    description: "Tier 2 plus escrow-based project management.",
    features: ["Everything in Tier 2", "Escrow project management", "Priority support"],
  },
];

const INVOICES = [
  { id: "INV-2026-005", date: "May 1, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-004", date: "Apr 1, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-003", date: "Mar 1, 2026", amount: "$49.00", status: "Paid" },
];

export default function BillingPage() {
  const { publicKey } = useFreighter();
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const [selectedTier, setSelectedTier] = useState("tier-2");
  const [selectedTierName, setSelectedTierName] = useState("Tier 2");
  const [activeTier, setActiveTier] = useState("tier-2");
  const [loading, setLoading] = useState(!!publicKey);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useHubPageMeta({
    breadcrumbs: hubNavBreadcrumbs("Billing & Plans"),
    title: "Billing & Plans",
    subtitle: "Manage your subscription, payment method, and invoices.",
  });

  useEffect(() => {
    if (publicKey?.trim().length === 56 && publicKey.startsWith("G")) {
      setLoading(true);
      fetch("/api/business/profile", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : null))
        .then((profile) => {
          if (profile) {
            const tier =
              typeof profile.selectedTier === "string" && profile.selectedTier.trim()
                ? profile.selectedTier.trim()
                : "tier-2";
            const tierName =
              typeof profile.selectedTierName === "string" && profile.selectedTierName.trim()
                ? profile.selectedTierName.trim()
                : PLAN_OPTIONS.find((p) => p.id === tier)?.name ?? "Tier 2";
            setSelectedTier(tier);
            setSelectedTierName(tierName);
            setActiveTier(tier);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [publicKey]);

  const handleSelectTier = (tierId: string) => {
    const next = PLAN_OPTIONS.find((p) => p.id === tierId);
    if (!next) return;
    setSelectedTier(next.id);
    setSelectedTierName(next.name);
  };

  const handleUpdatePlan = async () => {
    if (!(publicKey?.trim().length === 56 && publicKey.startsWith("G"))) return;
    setSaving(true);
    try {
      const res = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ selectedTier, selectedTierName }),
      });
      if (!res.ok) return;
      hydrateWorkspaceTierFromProfile({
        selectedTier,
        selectedTierName,
        businessName: getWorkspaceTierState()?.businessName ?? "",
        activeTemplateId: null,
        activeTemplate: null,
      });
      setActiveTier(selectedTier);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("profile-updated"));
    } finally {
      setSaving(false);
    }
  };

  const currentPlan = PLAN_OPTIONS.find((p) => p.id === activeTier) ?? PLAN_OPTIONS[1]!;
  const planChanged = selectedTier !== activeTier;

  if (loading) {
    return <HubBillingContentSkeleton />;
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <Card className={cn("overflow-hidden rounded-2xl border shadow-none", t.card)}>
        <div className={cn("flex flex-wrap items-center justify-between gap-4 px-6 py-5", t.cardHeader)}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className={cn("text-xs font-medium", t.cardMeta)}>Active subscription</p>
              <p className={cn("text-lg font-semibold leading-tight", t.cardTitle)}>{currentPlan.name}</p>
              <p className={cn("mt-0.5 max-w-md text-sm", t.cardMeta)}>{currentPlan.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn("text-3xl font-bold tabular-nums tracking-tight", t.cardStat)}>
              {currentPlan.price}
              <span className={cn("text-sm font-medium", t.cardMuted)}>{currentPlan.cadence}</span>
            </p>
            <p className={cn("mt-1 text-xs", t.cardMuted)}>Renews Jun 1, 2026</p>
          </div>
        </div>
      </Card>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={cn("text-base font-semibold", t.pageHeading)}>Choose a plan</h2>
            <p className={cn("mt-0.5 text-sm", t.pageSubheading)}>
              Select the tier that fits your workspace needs.
            </p>
          </div>
          <Button
            onClick={handleUpdatePlan}
            disabled={loading || saving || !planChanged}
            className={cn(
              "h-10 rounded-xl px-5 text-sm font-semibold shadow-none transition-all",
              saved
                ? "bg-emerald-600 text-white hover:bg-emerald-600"
                : "hub-cta bg-blue-600 text-white hover:bg-blue-500"
            )}
          >
            {saved ? (
              <>
                <CheckCheck className="mr-1.5 h-4 w-4" /> Saved
              </>
            ) : saving ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : planChanged ? (
              `Switch to ${selectedTierName}`
            ) : (
              "Current plan"
            )}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_OPTIONS.map((plan) => {
            const selected = selectedTier === plan.id;
            const isActive = activeTier === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => handleSelectTier(plan.id)}
                className={cn(
                  "group flex flex-col rounded-2xl border p-5 text-left transition-all",
                  selected
                    ? t.dark
                      ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/30"
                      : "border-blue-400/70 bg-gradient-to-b from-blue-50/90 to-white ring-1 ring-blue-200/80"
                    : cn(t.card, "hover:border-blue-300/60")
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm font-semibold", t.cardTitle)}>{plan.name}</p>
                  {isActive ? (
                    <Badge
                      className={cn(
                        "shrink-0 border-0 px-2 py-0 text-[10px] font-semibold",
                        t.dark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      Active
                    </Badge>
                  ) : null}
                </div>
                <p className={cn("mt-2 text-2xl font-bold tabular-nums", t.cardStat)}>
                  {plan.price}
                  <span className={cn("text-xs font-medium", t.cardMuted)}>{plan.cadence}</span>
                </p>
                <p className={cn("mt-2 text-xs leading-relaxed", t.cardMeta)}>{plan.description}</p>
                <ul className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: "inherit" }}>
                  {plan.features.map((feature) => (
                    <li key={feature} className={cn("flex items-start gap-2 text-xs", t.cardRowValue)}>
                      <Check
                        className={cn(
                          "mt-0.5 h-3.5 w-3.5 shrink-0",
                          selected ? "text-blue-500" : t.dark ? "text-slate-500" : "text-slate-400"
                        )}
                        strokeWidth={2.5}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={cn("rounded-2xl border shadow-none", t.card)}>
          <CardContent className="p-5">
            <p className={cn("text-sm font-semibold", t.cardTitle)}>Payment method</p>
            <p className={cn("mt-0.5 text-xs", t.cardMeta)}>Default card on file</p>
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-inherit bg-black/[0.02] p-4 dark:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border",
                    t.dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
                  )}
                >
                  <CreditCard className={cn("h-5 w-5", t.cardMeta)} strokeWidth={1.75} />
                </div>
                <div>
                  <p className={cn("text-sm font-medium", t.cardTitle)}>Visa ···· 4242</p>
                  <p className={cn("text-xs", t.cardMeta)}>Expires 08 / 2028</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className={cn(
                  "h-9 rounded-lg px-3 text-xs font-semibold shadow-none",
                  t.outlineBtn
                )}
              >
                Update
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("overflow-hidden rounded-2xl border shadow-none", t.card)}>
          <div className={cn("border-b px-5 py-4", t.cardDivider)}>
            <p className={cn("text-sm font-semibold", t.cardTitle)}>Billing history</p>
            <p className={cn("mt-0.5 text-xs", t.cardMeta)}>Recent invoices</p>
          </div>
          <div className={cn("divide-y", t.cardDivider)}>
            {INVOICES.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className={cn("truncate text-sm font-medium", t.cardTitle)}>{invoice.id}</p>
                  <p className={cn("text-xs", t.cardMeta)}>{invoice.date}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full border-0 px-2 py-0 text-[10px] font-semibold",
                      t.dark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {invoice.status}
                  </Badge>
                  <span className={cn("text-sm font-semibold tabular-nums", t.cardStat)}>
                    {invoice.amount}
                  </span>
                  <button
                    type="button"
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                      t.menuBtn
                    )}
                    aria-label={`Download ${invoice.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
