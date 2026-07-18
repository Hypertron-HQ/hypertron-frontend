"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Rnd } from "react-rnd";
import { Upload, Wrench, Trash2, Plus, Loader2 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/layout/header";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFreighter } from "@/hooks/useFreighter";
import {
  getTemplateById,
  updateTemplate,
  defaultWidgetSettings,
  type DashboardWidget,
  type WidgetSettings,
  type WidgetType,
} from "@/lib/my-templates-storage";
import { toast } from "sonner";
import { cn } from "@/utils";

const DRAG_HANDLE_CLASS = "workspace-drag-handle";

const WIDGET_CATALOG: Array<{ id: string; title: string; type: WidgetType }> = [
  { id: "compliance-score", title: "Compliance Score Trend", type: "chart" },
  { id: "routing-analytics", title: "Routing Analytics", type: "chart" },
  { id: "transaction-volume", title: "Transaction Volume", type: "chart" },
  { id: "transaction-analytics", title: "Transaction Analytics", type: "chart" },
  { id: "risk-heatmap", title: "Risk Heatmap", type: "chart" },
  { id: "active-routes", title: "Active Routes", type: "metric" },
  { id: "compliance-blocks", title: "Active Compliance Blocks", type: "metric" },
  { id: "alerts-panel", title: "Recent Alerts", type: "alert" },
  { id: "asset-distribution", title: "Asset Distribution", type: "chart" },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function WorkspacePageContent() {
  const router = useRouter();
  const search = useSearchParams();
  const templateId = search.get("template");
  const { publicKey, disconnect, isConnecting } = useFreighter();

  const [dashboardName, setDashboardName] = useState("Untitled dashboard");
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [addWidgetId, setAddWidgetId] = useState(WIDGET_CATALOG[0].id);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState(1200);

  const selected = useMemo(
    () => widgets.find((w) => w.id === selectedId) ?? null,
    [widgets, selectedId]
  );

  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;
    getTemplateById(templateId, publicKey)
      .then((t) => {
        if (!t || cancelled) return;
        setDashboardName(t.name);
        const raw = t.widgets ?? [];
        const normalized: DashboardWidget[] = raw.map((w, i) => {
          if ("x" in w && "settings" in w && w.settings) return w as DashboardWidget;
          const col = (i % 4) * 3;
          const row = Math.floor(i / 4) * 5;
          return {
            id: (w as { id?: string }).id ?? `dw-${Date.now()}-${i}`,
            widgetId: String((w as { widgetId?: string }).widgetId ?? (w as { id?: string }).id ?? `widget-${i}`),
            title: String((w as { title?: string }).title ?? "Widget"),
            type: ((w as { type?: string }).type as WidgetType) ?? "chart",
            x: col,
            y: row,
            w: 3,
            h: 5,
            settings: defaultWidgetSettings(),
          };
        });
        setWidgets(normalized);
        setSelectedId(normalized[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setWidgets([]);
          setSelectedId(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [templateId, publicKey]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setStageWidth(el.clientWidth || 1200);
    });
    ro.observe(el);
    setStageWidth(el.clientWidth || 1200);
    return () => ro.disconnect();
  }, []);

  const rowHeight = 32;
  const colWidth = Math.max(48, Math.floor(stageWidth / 12));

  const addWidget = (widgetId: string) => {
    const def = WIDGET_CATALOG.find((w) => w.id === widgetId);
    if (!def) return;
    const maxBottom = widgets.reduce((acc, w) => Math.max(acc, w.y + w.h), 0);
    const next: DashboardWidget = {
      id: `dw-${Date.now()}`,
      widgetId: def.id,
      title: def.title,
      type: def.type,
      x: 0,
      y: maxBottom + 1,
      w: 3,
      h: 5,
      settings: defaultWidgetSettings(),
    };
    setWidgets((prev) => [...prev, next]);
    setSelectedId(next.id);
  };

  const updateWidget = (id: string, patch: Partial<DashboardWidget>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w))
    );
  };

  const updateSelectedSettings = (patch: Partial<WidgetSettings>) => {
    if (!selected) return;
    updateWidget(selected.id, {
      settings: { ...selected.settings, ...patch },
    });
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  };

  const saveDashboard = async () => {
    if (!templateId) {
      toast.error("No template selected");
      return;
    }
    const name = dashboardName.trim() || "Untitled dashboard";
    const updated = await updateTemplate(templateId, { name, widgets }, publicKey);
    if (updated) {
      setStatus("Saved to My Templates");
      toast.success("Saved to My Templates");
      setTimeout(() => setStatus(""), 2200);
    } else {
      toast.error("Failed to save");
    }
  };

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">
          Connect your wallet to use the workspace.
        </p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  if (!templateId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">
          Open a template from My Templates to edit it.
        </p>
        <Button onClick={() => router.push("/dashboard/documents")}>
          My Templates
        </Button>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader fixed>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Dashboard Workspace
          </span>
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
      <DashboardMain className="pl-0">
        <div className="mx-auto max-w-[1600px] space-y-4 pl-0 pr-4 pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Dashboard Workspace
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Customize widget size, location, parameters, data sources, and
                deployment. Save to &quot;My Templates&quot;.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{widgets.length} widgets</Badge>
              {status && (
                <Badge variant="default" className="bg-emerald-600/80">
                  {status}
                </Badge>
              )}
              <Button size="sm" onClick={saveDashboard}>
                <Upload className="mr-1.5 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
            {/* Canvas */}
            <Card className="min-h-[620px] overflow-hidden border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Canvas</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[920px] min-h-[720px] overflow-auto p-4">
                  <div
                    ref={stageRef}
                    className="relative min-h-[1600px] min-w-[1600px] rounded-xl border border-border bg-muted/20 p-6"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
                      `,
                      backgroundSize: `${100 / 12}% ${rowHeight}px`,
                    }}
                  >
                    {widgets.map((w) => {
                      const isSelected = selectedId === w.id;
                      const pxX = w.x * colWidth;
                      const pxY = w.y * rowHeight;
                      const pxW = Math.max(colWidth, w.w * colWidth);
                      const pxH = Math.max(rowHeight * 3, w.h * rowHeight);
                      return (
                        <Rnd
                          key={w.id}
                          bounds="parent"
                          dragGrid={[colWidth, rowHeight]}
                          resizeGrid={[colWidth, rowHeight]}
                          minWidth={colWidth}
                          minHeight={rowHeight * 3}
                          dragHandleClassName={DRAG_HANDLE_CLASS}
                          enableResizing={{
                            top: true,
                            right: true,
                            bottom: true,
                            left: true,
                            topRight: true,
                            bottomLeft: true,
                            bottomRight: true,
                            topLeft: true,
                          }}
                          size={{ width: pxW, height: pxH }}
                          position={{ x: pxX, y: pxY }}
                          onDragStart={() => setSelectedId(w.id)}
                          onDragStop={(_, d) => {
                            const nextX = clamp(
                              Math.round(d.x / colWidth),
                              0,
                              12 - w.w
                            );
                            const nextY = Math.max(
                              0,
                              Math.round(d.y / rowHeight)
                            );
                            updateWidget(w.id, { x: nextX, y: nextY });
                          }}
                          onResizeStart={() => setSelectedId(w.id)}
                          onResizeStop={(_, __, ref, ___, position) => {
                            const newW = clamp(
                              Math.round(ref.offsetWidth / colWidth),
                              1,
                              12
                            );
                            const newH = clamp(
                              Math.round(ref.offsetHeight / rowHeight),
                              2,
                              200
                            );
                            const newX = clamp(
                              Math.round(position.x / colWidth),
                              0,
                              12 - newW
                            );
                            const newY = Math.max(
                              0,
                              Math.round(position.y / rowHeight)
                            );
                            updateWidget(w.id, {
                              x: newX,
                              y: newY,
                              w: newW,
                              h: newH,
                            });
                          }}
                        >
                          <div
                            className={cn(
                              "flex h-full flex-col rounded-xl border bg-card shadow-sm overflow-hidden transition-colors",
                              isSelected
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border hover:border-muted-foreground/30"
                            )}
                            onMouseDown={() => setSelectedId(w.id)}
                          >
                            <div
                              className={cn(
                                "flex items-center justify-between gap-2 border-b border-border bg-muted/50 px-4 py-3 cursor-move",
                                DRAG_HANDLE_CLASS
                              )}
                            >
                              <p className="text-sm font-medium truncate">
                                {w.title}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {w.type}
                              </Badge>
                            </div>
                            <div className="flex-1 p-4 overflow-auto">
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                Drag the header to move. Drag any edge/corner to
                                resize.
                              </p>
                            </div>
                          </div>
                        </Rnd>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Panel */}
            <Card className="border-border bg-card flex flex-col min-h-0 lg:mr-4 lg:mb-4 lg:mt-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Dashboard Panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 overflow-auto">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dashboard name</label>
                  <Input
                    value={dashboardName}
                    onChange={(e) => setDashboardName(e.target.value)}
                    placeholder="Untitled dashboard"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Add widget</label>
                  <div className="flex gap-2">
                    <Select
                      value={addWidgetId}
                      onValueChange={(v) => setAddWidgetId(v)}
                    >
                      <SelectTrigger className="flex-1 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WIDGET_CATALOG.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => addWidget(addWidgetId)}>
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tip: Drag widgets on the canvas. Click a widget to show
                    settings here.
                  </p>
                </div>

                <div className="space-y-2">
                  {widgets.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No widgets yet. Add one above, or build combinations in
                        Compliance Maker.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => router.push("/dashboard/onboarding")}
                      >
                        <Wrench className="mr-2 h-4 w-4" />
                        Open Compliance Maker
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {widgets.map((w) => (
                        <div
                          key={w.id}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2",
                            selectedId === w.id
                              ? "border-primary/50"
                              : "border-border"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {w.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {w.type} · x:{w.x} y:{w.y} · {w.w}×{w.h}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedId(w.id)}
                            >
                              Select
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeWidget(w.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-sm font-semibold">Inspector</p>
                  {!selected ? (
                    <p className="text-xs text-muted-foreground">
                      Select a widget on the canvas to edit it.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">{selected.title}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline">{selected.type}</Badge>
                        <Badge variant="outline">
                          x:{selected.x} y:{selected.y} · {selected.w}×{selected.h}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          Data source
                        </label>
                        <Select
                          value={selected.settings.dataSource}
                          onValueChange={(v) =>
                            updateSelectedSettings({
                              dataSource: v as WidgetSettings["dataSource"],
                            })
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mock">Mock data</SelectItem>
                            <SelectItem value="coingecko">CoinGecko</SelectItem>
                            <SelectItem value="stellar">Stellar</SelectItem>
                            <SelectItem value="custom-api">Custom API</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">Refresh</label>
                        <Select
                          value={selected.settings.refresh}
                          onValueChange={(v) =>
                            updateSelectedSettings({
                              refresh: v as WidgetSettings["refresh"],
                            })
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="realtime">Real-time</SelectItem>
                            <SelectItem value="1m">Every 1 min</SelectItem>
                            <SelectItem value="5m">Every 5 min</SelectItem>
                            <SelectItem value="15m">Every 15 min</SelectItem>
                            <SelectItem value="1h">Every 1 hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          Deployment
                        </label>
                        <Select
                          value={selected.settings.deployment}
                          onValueChange={(v) =>
                            updateSelectedSettings({
                              deployment: v as WidgetSettings["deployment"],
                            })
                          }
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">Local</SelectItem>
                            <SelectItem value="staging">Staging</SelectItem>
                            <SelectItem value="prod">Production</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">
                          Parameters
                        </label>
                        <textarea
                          value={selected.settings.parameters}
                          onChange={(e) =>
                            updateSelectedSettings({
                              parameters: e.target.value,
                            })
                          }
                          placeholder='e.g. {"threshold": 0.9, "asset": "USDC"}'
                          rows={4}
                          className={cn(
                            "w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y"
                          )}
                        />
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardMain>
    </>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-foreground/40" aria-hidden />
          <p className="text-sm">Loading workspace…</p>
        </div>
      }
    >
      <WorkspacePageContent />
    </Suspense>
  );
}
