"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Layers3, CheckCheck } from "lucide-react";
import {
  WorkspacePageShell,
  workspaceHubBreadcrumbs,
} from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useFreighter } from "@/hooks/useFreighter";
import { cn } from "@/utils";
import {
  getOnboardingData,
  setOnboardingCompleted,
  BUSINESS_NATURES,
  WIDGETS,
  type OnboardingData,
} from "@/components/onboarding/onboarding-modal";
import { Checkbox } from "@/components/ui/checkbox";

type SettingsSection = "general" | "features";

const navItems: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: SettingsIcon },
  { id: "features", label: "Features", icon: Layers3 },
];

export default function WorkspaceSettingsPage() {
  const { publicKey } = useFreighter();
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const [section, setSection] = useState<SettingsSection>("general");
  const [businessNature, setBusinessNature] = useState("");
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(!!publicKey);

  useEffect(() => {
    if (publicKey?.trim().length === 56 && publicKey.startsWith("G")) {
      setLoading(true);
      fetch("/api/business/profile", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : null))
        .then((profile) => {
          if (profile) {
            setBusinessNature(profile.businessNature ?? "");
            setSelectedWidgets(Array.isArray(profile.selectedWidgets) ? profile.selectedWidgets : []);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    const stored = getOnboardingData();
    if (stored) {
      setBusinessNature(stored.businessNature ?? "");
      setSelectedWidgets(Array.isArray(stored.selectedWidgets) ? stored.selectedWidgets : []);
    }
  }, [publicKey]);

  function handleSave() {
    const stored = getOnboardingData();
    const data: OnboardingData = {
      name: stored?.name ?? "",
      email: stored?.email ?? "",
      businessNature: businessNature || "",
      selectedWidgets,
    };

    if (publicKey?.trim().length === 56 && publicKey.startsWith("G")) {
      fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          businessNature: data.businessNature || null,
          selectedWidgets: data.selectedWidgets,
        }),
      })
        .then((res) => {
          if (res.ok) {
            setOnboardingCompleted(data);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("profile-updated"));
          }
        })
        .catch(() => {});
      return;
    }

    setOnboardingCompleted(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const toggleWidget = (id: string) =>
    setSelectedWidgets((p) => (p.includes(id) ? p.filter((w) => w !== id) : [...p, id]));

  return (
    <WorkspacePageShell
      breadcrumbs={workspaceHubBreadcrumbs("Workspace Settings")}
      connectMessage="Connect your wallet to view workspace settings."
    >
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div>
          <h2 className={cn("text-xl font-semibold tracking-tight", t.pageHeading)}>
            Workspace settings
          </h2>
          <p className={cn("mt-1 text-sm", t.pageSubheading)}>
            Configure this workspace&apos;s business type and enabled modules.
          </p>
        </div>

        {!publicKey ? null : (
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-44 lg:flex-col">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSection(id)}
                  className={cn(
                    "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    section === id ? t.sidebarNavActive : t.sidebarNav
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {label}
                </button>
              ))}
            </nav>

            <div className="min-w-0 flex-1">
              {section === "general" ? (
                <Card className={cn("rounded-2xl border shadow-none", t.card)}>
                  <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
                    <div>
                      <p className={cn("text-sm font-semibold", t.cardTitle)}>General</p>
                      <p className={cn("mt-0.5 text-xs", t.cardMeta)}>
                        Business context for this workspace.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className={cn("text-xs", t.cardMeta)}>Nature of your business</Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {BUSINESS_NATURES.map(({ value, label }) => (
                          <label
                            key={value}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                              businessNature === value
                                ? t.dark
                                  ? "border-blue-500/40 bg-blue-500/10 text-slate-100"
                                  : "border-blue-300 bg-blue-50/60 text-neutral-900"
                                : cn(t.card, "hover:border-blue-300/60")
                            )}
                          >
                            <input
                              type="radio"
                              name="businessNature"
                              value={value}
                              checked={businessNature === value}
                              onChange={() => setBusinessNature(value)}
                              className="sr-only"
                            />
                            <span className="font-medium">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className={cn(
                        "h-10 w-fit rounded-xl px-5 text-sm font-semibold shadow-none",
                        saved
                          ? "bg-emerald-600 text-white hover:bg-emerald-600"
                          : "hub-cta bg-blue-600 text-white hover:bg-blue-500"
                      )}
                    >
                      {saved ? (
                        <>
                          <CheckCheck className="mr-1.5 h-4 w-4" /> Saved
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : null}

              {section === "features" ? (
                <Card className={cn("rounded-2xl border shadow-none", t.card)}>
                  <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
                    <div>
                      <p className={cn("text-sm font-semibold", t.cardTitle)}>Features</p>
                      <p className={cn("mt-0.5 text-xs", t.cardMeta)}>
                        Choose which modules appear in this workspace sidebar.
                      </p>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {WIDGETS.map((w) => {
                        const Icon = w.icon;
                        const checked = selectedWidgets.includes(w.id);
                        return (
                          <label
                            key={w.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                              checked
                                ? t.dark
                                  ? "border-blue-500/40 bg-blue-500/10"
                                  : "border-blue-300 bg-blue-50/50"
                                : cn(t.card, "hover:border-blue-300/60")
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleWidget(w.id)}
                              className="mt-0.5"
                            />
                            <div className="flex min-w-0 flex-1 items-start gap-2.5">
                              <div
                                className={cn(
                                  "shrink-0 rounded-md p-1.5",
                                  t.dark ? "bg-white/10" : "bg-neutral-100"
                                )}
                              >
                                <Icon className={cn("size-3.5", t.cardMeta)} />
                              </div>
                              <div className="min-w-0">
                                <p className={cn("truncate text-sm font-medium", t.cardTitle)}>
                                  {w.label}
                                </p>
                                <p className={cn("text-[11px] leading-relaxed", t.cardMeta)}>
                                  {w.description}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className={cn(
                        "h-10 w-fit rounded-xl px-5 text-sm font-semibold shadow-none",
                        saved
                          ? "bg-emerald-600 text-white hover:bg-emerald-600"
                          : "hub-cta bg-blue-600 text-white hover:bg-blue-500"
                      )}
                    >
                      {saved ? (
                        <>
                          <CheckCheck className="mr-1.5 h-4 w-4" /> Saved
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </WorkspacePageShell>
  );
}
