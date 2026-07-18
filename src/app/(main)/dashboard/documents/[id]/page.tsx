"use client";

import { useRouter, useParams, usePathname } from "next/navigation";
import { useEffect, useState, useMemo, useTransition } from "react";
import {
  BarChart3,
  Activity,
  LayoutGrid,
  AlertTriangle,
  Wrench,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/layout/header";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFreighter } from "@/hooks/useFreighter";
import { getTemplateById, type SavedTemplate, type DashboardWidget } from "@/lib/my-templates-storage";
import {
  bundleIdToTierId,
  getWorkspaceTierState,
  hydrateWorkspaceTierFromProfile,
  markWorkspaceSidebarImported,
  persistTierFromOnboarding,
  WORKSPACE_TIER_UPDATED_EVENT,
} from "@/lib/workspace-tier-context";
import { TierSavedTemplateView } from "@/components/dashboard/tier-saved-template-view";
import { cn } from "@/utils";
import { toast } from "sonner";
import {
  ComplianceScoreTrendChart,
  RiskHeatmapChart,
  ProjectRatingsBarChart,
  ActiveRoutesMetric,
  PortfolioTotalValueChart,
  IndividualAssetsChart,
  TransactionAnalyticsChart,
} from "@/components/dashboard/charts";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const TIME_FRAMES = ["1D", "7D", "30D", "90D", "All"] as const;
const TIME_FRAMES_ALT = ["1W", "1M", "6M", "1Y", "All"] as const;

function ChartWidgetCard({ widget }: { widget: DashboardWidget }) {
  const [activeTab, setActiveTab] = useState(0);
  const [timeFrame, setTimeFrame] = useState(4); // All
  const tabs = widget.type === "chart" ? ["Chart", "Data"] : ["Summary"];
  const frames = widget.widgetId?.includes("compliance") ? TIME_FRAMES_ALT : TIME_FRAMES;

  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
      <CardHeader className="space-y-3 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold">{widget.title}</CardTitle>
          <Badge variant="secondary" className="rounded-full text-xs font-medium">
            {widget.type}
          </Badge>
        </div>
        {widget.type === "chart" && tabs.length > 1 && (
          <div className="flex rounded-lg bg-muted/50 p-0.5">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(i)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === i
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {frames.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setTimeFrame(i)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                timeFrame === i
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="min-h-[220px] rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center p-6">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Chart analysis</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Data source: {widget.settings?.dataSource ?? "mock"} · {widget.settings?.refresh ?? "5m"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricWidgetCard({ widget }: { widget: DashboardWidget }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">{widget.title}</CardTitle>
          <Badge variant="secondary" className="rounded-full text-xs">
            {widget.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[140px] rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center p-6">
          <Activity className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Metric summary</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {widget.settings?.dataSource ?? "mock"} · {widget.settings?.refresh ?? "5m"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertWidgetCard({ widget }: { widget: DashboardWidget }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">{widget.title}</CardTitle>
          <Badge variant="secondary" className="rounded-full text-xs">
            {widget.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[140px] rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center p-6">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Alerts</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TableWidgetCard({ widget }: { widget: DashboardWidget }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">{widget.title}</CardTitle>
          <Badge variant="secondary" className="rounded-full text-xs">
            {widget.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="min-h-[140px] rounded-xl border border-border bg-muted/20 flex flex-col items-center justify-center p-6">
          <LayoutGrid className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Table data</p>
        </div>
      </CardContent>
    </Card>
  );
}

function WidgetCard({ widget }: { widget: DashboardWidget }) {
  if (widget.type === "chart") return <ChartWidgetCard widget={widget} />;
  if (widget.type === "metric") return <MetricWidgetCard widget={widget} />;
  if (widget.type === "alert") return <AlertWidgetCard widget={widget} />;
  return <TableWidgetCard widget={widget} />;
}

export default function DashboardViewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  const { publicKey, disconnect, isConnecting } = useFreighter();
  const [, startTransition] = useTransition();
  const [workspaceNavPending, setWorkspaceNavPending] = useState(false);
  const [sidebarImported, setSidebarImported] = useState(false);
  /** Matches `Business.activeTemplateId` when loaded from `/api/business/profile`. */
  const [serverActiveTemplateId, setServerActiveTemplateId] = useState<string | null>(null);

  const [template, setTemplate] = useState<SavedTemplate | null>(null);

  useEffect(() => {
    if (pathname?.startsWith("/dashboard/workspace")) {
      setWorkspaceNavPending(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!(publicKey?.trim().length === 56 && publicKey.startsWith("G"))) {
      setServerActiveTemplateId(null);
      return;
    }
    const load = () => {
      fetch("/api/business/profile", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          setServerActiveTemplateId(
            typeof data?.activeTemplateId === "string" ? data.activeTemplateId : null
          );
        })
        .catch(() => setServerActiveTemplateId(null));
    };
    load();
    const onProfileUpdated = () => load();
    window.addEventListener("profile-updated", onProfileUpdated);
    return () => window.removeEventListener("profile-updated", onProfileUpdated);
  }, [publicKey]);

  useEffect(() => {
    const refreshImported = () => {
      const state = getWorkspaceTierState();
      const localMatch =
        Boolean(
          state?.sidebarImported &&
            template?.bundleId &&
            state.bundleId === template.bundleId
        );
      const serverMatch = Boolean(
        template?.id && serverActiveTemplateId && serverActiveTemplateId === template.id
      );
      setSidebarImported(localMatch || serverMatch);
    };
    refreshImported();
    window.addEventListener(WORKSPACE_TIER_UPDATED_EVENT, refreshImported);
    return () => window.removeEventListener(WORKSPACE_TIER_UPDATED_EVENT, refreshImported);
  }, [template?.bundleId, template?.id, serverActiveTemplateId]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getTemplateById(id, publicKey)
      .then((result) => {
        if (!cancelled) setTemplate(result);
      })
      .catch(() => {
        if (!cancelled) setTemplate(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id, publicKey]);

  const widgets = useMemo(() => {
    const list = template?.widgets ?? [];
    return [...list].sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));
  }, [template?.widgets]);

  const tierId = template ? bundleIdToTierId(template.bundleId) : null;

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">Connect your wallet to view this page.</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  if (!id || (!template && id)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">Template not found.</p>
        <Button onClick={() => router.push("/dashboard/documents")}>My Templates</Button>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader fixed>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitch />
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            Home
          </Button>
          <Button variant="ghost" size="sm" onClick={disconnect} disabled={isConnecting}>
            Disconnect
          </Button>
        </div>
      </DashboardHeader>
      <DashboardMain>
        <div className="mx-auto max-w-[1400px] space-y-8 px-4 pb-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/documents")}
            className="text-muted-foreground -ml-1"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            My Templates
          </Button>

          {tierId ? (
            <TierSavedTemplateView
              tierId={tierId}
              template={template}
              widgets={widgets}
              publicKey={publicKey}
              workspaceNavPending={workspaceNavPending}
              sidebarImported={sidebarImported}
              onImportTier={async () => {
                persistTierFromOnboarding({
                  bundleId: template.bundleId,
                  bundleName: template.bundleName,
                  businessName: template.businessName ?? "",
                });
                try {
                  const res = await fetch("/api/business/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify({ activeTemplateId: template.id }),
                  });
                  const data = res.ok ? ((await res.json().catch(() => null)) as Record<string, unknown> | null) : null;
                  if (res.ok && data) {
                    const activeTpl =
                      data.activeTemplate &&
                      typeof data.activeTemplate === "object" &&
                      typeof (data.activeTemplate as { id?: string }).id === "string"
                        ? (data.activeTemplate as {
                            id: string;
                            name?: string;
                            bundleId?: string;
                            bundleName?: string | null;
                            businessName?: string | null;
                          })
                        : null;
                    hydrateWorkspaceTierFromProfile({
                      selectedTier: typeof data.selectedTier === "string" ? data.selectedTier : null,
                      selectedTierName:
                        typeof data.selectedTierName === "string" ? data.selectedTierName : null,
                      businessName: typeof data.name === "string" ? data.name : null,
                      activeTemplateId:
                        typeof data.activeTemplateId === "string" ? data.activeTemplateId : null,
                      activeTemplate: activeTpl
                        ? {
                            id: activeTpl.id,
                            name: typeof activeTpl.name === "string" ? activeTpl.name : "",
                            bundleId: typeof activeTpl.bundleId === "string" ? activeTpl.bundleId : "",
                            bundleName:
                              activeTpl.bundleName === null || typeof activeTpl.bundleName === "string"
                                ? activeTpl.bundleName
                                : null,
                            businessName:
                              activeTpl.businessName === null || typeof activeTpl.businessName === "string"
                                ? activeTpl.businessName
                                : null,
                          }
                        : null,
                    });
                    setServerActiveTemplateId(
                      typeof data.activeTemplateId === "string" ? data.activeTemplateId : template.id
                    );
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("profile-updated"));
                    }
                    toast.success(`${template.bundleName} imported to sidebar`);
                    return;
                  }
                } catch {
                  /* fall through to local-only */
                }
                markWorkspaceSidebarImported();
                toast.success(`${template.bundleName} imported to sidebar (device only)`);
                toast.message(
                  "Cloud sync unavailable",
                  { description: "Save your template to the account or try again to persist across logins." }
                );
              }}
              onEditWorkspace={() => {
                setWorkspaceNavPending(true);
                startTransition(() => {
                  router.push(`/dashboard/workspace?template=${encodeURIComponent(template.id)}`);
                });
              }}
              onPrefetchWorkspace={() =>
                router.prefetch(`/dashboard/workspace?template=${encodeURIComponent(template.id)}`)
              }
              formatDate={formatDate}
              renderWidget={(w) => <WidgetCard widget={w} />}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card className="rounded-2xl border-border bg-card shadow-sm">
                  <CardContent className="flex flex-col gap-0.5 p-5">
                    <p className="text-sm font-medium text-muted-foreground">Widgets</p>
                    <p className="text-2xl font-bold tracking-tight">{widgets.length}</p>
                    <p className="text-sm text-muted-foreground">widgets in this dashboard</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-border bg-card shadow-sm">
                  <CardContent className="flex flex-col gap-0.5 p-5">
                    <p className="text-sm font-medium text-muted-foreground">Last updated</p>
                    <p className="text-2xl font-bold tracking-tight">{formatDate(template.savedAt)}</p>
                    <p className="text-sm text-muted-foreground">Saved from workspace</p>
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border-border bg-card shadow-sm flex flex-col justify-between">
                  <CardContent className="flex flex-col gap-0.5 p-5">
                    <p className="text-xl font-bold tracking-tight">{template.name}</p>
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/documents")}
                      className="text-sm text-muted-foreground hover:text-foreground text-left underline-offset-2 hover:underline"
                    >
                      My Templates
                    </button>
                  </CardContent>
                  <div className="px-5 pb-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto rounded-full border-white/15"
                      disabled={workspaceNavPending}
                      onClick={() => {
                        setWorkspaceNavPending(true);
                        startTransition(() => {
                          router.push(
                            `/dashboard/workspace?template=${encodeURIComponent(template.id)}`
                          );
                        });
                      }}
                      onMouseEnter={() =>
                        router.prefetch(
                          `/dashboard/workspace?template=${encodeURIComponent(template.id)}`
                        )
                      }
                    >
                      {workspaceNavPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Wrench className="mr-2 h-4 w-4" aria-hidden />
                      )}
                      {workspaceNavPending ? "Opening workspace…" : "Edit in workspace"}
                    </Button>
                  </div>
                </Card>
              </div>

              <section>
                <h2 className="text-lg font-semibold tracking-tight mb-4">Portfolio</h2>
                <div className="space-y-6">
                  <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
                    <CardContent className="p-5">
                      <PortfolioTotalValueChart />
                    </CardContent>
                  </Card>
                  <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
                    <CardContent className="p-5">
                      <IndividualAssetsChart />
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold tracking-tight mb-4">Compliance Parameters</h2>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm lg:col-span-2">
                    <CardContent className="p-5">
                      <ProjectRatingsBarChart />
                    </CardContent>
                  </Card>
                  <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
                    <CardContent className="p-5">
                      <ComplianceScoreTrendChart />
                    </CardContent>
                  </Card>
                  <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
                    <CardContent className="p-5">
                      <RiskHeatmapChart />
                    </CardContent>
                  </Card>
                  <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
                    <CardContent className="p-0">
                      <ActiveRoutesMetric />
                    </CardContent>
                  </Card>
                  <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm lg:col-span-2">
                    <CardContent className="p-5">
                      <TransactionAnalyticsChart walletAddress={publicKey ?? null} />
                    </CardContent>
                  </Card>
                </div>
              </section>
            </>
          )}
        </div>
      </DashboardMain>
    </>
  );
}
