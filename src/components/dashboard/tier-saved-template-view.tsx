"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCheck, Loader2, Upload, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardPageHeader } from "@/components/dashboard/layout/dashboard-page-header";
import { TIER_FEATURE_HIGHLIGHTS, tierTagline } from "@/lib/tier-preview-content";
import type { WorkspaceTierId } from "@/lib/workspace-tier-context";
import type { SavedTemplate, DashboardWidget } from "@/lib/my-templates-storage";
import { ComplianceScoreTrendChart, TransactionAnalyticsChart } from "@/components/dashboard/charts";
import { cn } from "@/utils";

const glassCard =
  "rounded-2xl border border-white/[0.1] bg-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] backdrop-blur-xl";

type TierSavedTemplateViewProps = {
  tierId: WorkspaceTierId;
  template: SavedTemplate;
  widgets: DashboardWidget[];
  publicKey: string;
  workspaceNavPending: boolean;
  sidebarImported: boolean;
  onImportTier: () => void;
  onEditWorkspace: () => void;
  onPrefetchWorkspace: () => void;
  formatDate: (iso: string) => string;
  renderWidget: (widget: DashboardWidget) => ReactNode;
};

export function TierSavedTemplateView({
  tierId,
  template,
  widgets,
  publicKey,
  workspaceNavPending,
  sidebarImported,
  onImportTier,
  onEditWorkspace,
  onPrefetchWorkspace,
  formatDate,
  renderWidget,
}: TierSavedTemplateViewProps) {
  const features = TIER_FEATURE_HIGHLIGHTS[tierId];
  const moduleCount = features.length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-10 px-4 pb-10">
      <DashboardPageHeader
        eyebrow={`${template.bundleName} · read-only preview`}
        title={template.name}
        description={tierTagline(tierId)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className={cn(glassCard, "border-amber-400/15")}>
          <CardContent className="flex flex-col gap-1 p-5">
            <p className="text-sm font-medium text-amber-200/70">Product tier</p>
            <p className="text-2xl font-bold tracking-tight text-white">{template.bundleName}</p>
            <p className="text-sm text-white/45">{moduleCount} modules in this bundle</p>
          </CardContent>
        </Card>
        <Card className={glassCard}>
          <CardContent className="flex flex-col gap-1 p-5">
            <p className="text-sm font-medium text-white/50">Last updated</p>
            <p className="text-2xl font-bold tracking-tight text-white">{formatDate(template.savedAt)}</p>
            <p className="text-sm text-white/45">Saved from Compliance Maker</p>
          </CardContent>
        </Card>
        <Card className={cn(glassCard, "flex flex-col justify-between")}>
          <CardContent className="flex flex-col gap-1 p-5">
            <p className="text-lg font-semibold tracking-tight text-white">{template.businessName ?? "Your business"}</p>
            <p className="text-sm text-white/45">Open the full workspace to rearrange widgets.</p>
          </CardContent>
          <div className="px-5 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={sidebarImported ? "subtle" : "outline"}
                size="sm"
                className={cn(
                  "rounded-full sm:w-auto",
                  sidebarImported
                    ? "border border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20"
                    : "border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.12]"
                )}
                onClick={onImportTier}
              >
                {sidebarImported ? (
                  <CheckCheck className="mr-2 h-4 w-4" aria-hidden />
                ) : (
                  <Upload className="mr-2 h-4 w-4" aria-hidden />
                )}
                {sidebarImported ? "Imported to sidebar" : "Import to sidebar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-white/20 bg-white/[0.06] text-white hover:bg-white/[0.12] sm:w-auto"
                disabled={workspaceNavPending}
                onClick={onEditWorkspace}
                onMouseEnter={onPrefetchWorkspace}
              >
                {workspaceNavPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Wrench className="mr-2 h-4 w-4" aria-hidden />
                )}
                {workspaceNavPending ? "Opening workspace…" : "Edit in workspace"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Your product modules</h2>
          <p className="mt-1 text-sm text-white/45">
            Jump into each area — same routes as in your sidebar after you import this tier.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={cn(
                glassCard,
                "group flex flex-col gap-3 p-5 transition-colors hover:border-amber-400/25 hover:bg-white/[0.07]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                  <f.icon className="h-5 w-5 text-amber-200/90" />
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-amber-200/80" />
              </div>
              <div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/50">{f.description}</p>
              </div>
              <span className="text-xs font-medium text-amber-200/70">Open module</span>
            </Link>
          ))}
        </div>
      </section>

      {widgets.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">Saved workspace tiles</h2>
            <p className="mt-1 text-sm text-white/45">
              Layout from your tier bundle — edit positions in the workspace builder.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {widgets.map((w) => (
              <div key={w.id}>{renderWidget(w)}</div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Operational signals</h2>
          <p className="mt-1 text-sm text-white/45">
            Preview charts aligned with payments and compliance — wire APIs when ready.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className={cn(glassCard, "overflow-hidden")}>
            <CardContent className="p-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/40">Payments activity</p>
              <TransactionAnalyticsChart walletAddress={publicKey} />
            </CardContent>
          </Card>
          <Card className={cn(glassCard, "overflow-hidden")}>
            <CardContent className="p-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/40">Compliance pulse</p>
              <ComplianceScoreTrendChart />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
