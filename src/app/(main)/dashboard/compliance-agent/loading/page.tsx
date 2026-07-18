"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BrainCircuit, Loader2, ScanSearch, ShieldCheck, Webhook } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/layout/header";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  clearPendingComplianceRequest,
  getPendingComplianceRequest,
  normalizeComplianceResult,
  setLatestComplianceContext,
  setLatestComplianceResult,
  type ComplianceResult,
  type SourceStatus,
} from "@/lib/compliance-agent-session";
import type { RegulatorySource } from "@/lib/compliance/jurisdiction-knowledge-base";
import { demoComplianceHeaders } from "@/lib/demo-compliance-api";
import { useDemoMode } from "@/components/demo/demo-mode-provider";
import { useFreighter } from "@/hooks/useFreighter";

type LiveWebsiteState = {
  url: string;
  state: "queued" | "fetching" | "processed" | "failed";
};

type LiveRegulatorySourceState = {
  key: string;
  name: string;
  url: string;
  state: "available" | "used" | "skipped" | "failed";
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function mergeHypertronSourceStatuses(
  existingStatuses: SourceStatus[],
  regulatorySources: RegulatorySource[]
): SourceStatus[] {
  const merged = [...existingStatuses];
  const existingKeys = new Set(
    existingStatuses.map((status) => `${status.sourceType}:${status.name.toLowerCase()}`)
  );

  for (const source of regulatorySources) {
    const urlKey = `regulatory_source:${source.url.toLowerCase()}`;
    if (existingKeys.has(urlKey)) continue;
    merged.push({
      sourceType: "regulatory_source",
      name: source.url,
      status: "used",
      detail: source.name,
      extractedChars: 0,
      providedBy: "hypertron",
      authorityType: source.authorityType,
      description: source.description,
    });
    existingKeys.add(urlKey);
  }

  return merged;
}

export default function ComplianceAgentLoadingPage() {
  const router = useRouter();
  const { demoPath, isDemo } = useDemoMode();
  const { disconnect, isConnecting } = useFreighter();
  const pending = getPendingComplianceRequest();

  const [progress, setProgress] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState("Booting compliance engine");
  const [liveWebsites, setLiveWebsites] = useState<LiveWebsiteState[]>(
    () => (pending?.companyWebsiteUrl ? [pending.companyWebsiteUrl] : pending?.websites || []).map((url) => ({ url, state: "queued" }))
  );
  const [liveRegulatorySources, setLiveRegulatorySources] = useState<LiveRegulatorySourceState[]>(
    () =>
      (pending?.regulatorySources || []).map((source) => ({
        key: `${source.name}-${source.url}`,
        name: source.name,
        url: source.url,
        state: "available",
      }))
  );

  const stepItems = useMemo(
    () => [
      { icon: ShieldCheck, label: "Validating profile and guard rails" },
      { icon: Webhook, label: "Resolving Hypertron jurisdiction sources" },
      { icon: ScanSearch, label: "Fetching company website context" },
      { icon: ScanSearch, label: "Reading documents and extracting obligations" },
      { icon: BrainCircuit, label: "Generating structured compliance roadmap" },
    ],
    []
  );

  useEffect(() => {
    if (!pending) {
      router.replace(demoPath("/dashboard/compliance-agent"));
      return;
    }

    const progressTimer = window.setInterval(() => {
      setProgress((prev) => (prev >= 92 ? prev : prev + Math.random() * 8));
    }, 800);

    const phaseTimer = window.setInterval(() => {
      setPhase((prev) => {
        if (prev.includes("Booting")) return "Resolving Hypertron jurisdiction sources";
        if (prev.includes("jurisdiction")) return "Fetching company website context";
        if (prev.includes("website")) return "Processing uploaded documents";
        if (prev.includes("documents")) return "Building compliance strategy";
        return "Finalizing analysis";
      });
    }, 1800);

    const websiteTimer = window.setInterval(() => {
      setLiveWebsites((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const active = next.findIndex((w) => w.state === "fetching");
        if (active >= 0) {
          next[active] = { ...next[active], state: "processed" };
        }
        const queued = next.findIndex((w) => w.state === "queued");
        if (queued >= 0) {
          next[queued] = { ...next[queued], state: "fetching" };
        }
        return next;
      });
    }, 1400);

    const regulatoryTimer = window.setInterval(() => {
      setLiveRegulatorySources((prev) => {
        const nextAvailable = prev.findIndex((source) => source.state === "available");
        if (nextAvailable < 0) return prev;
        return prev.map((source, index) => (index === nextAvailable ? { ...source, state: "used" } : source));
      });
    }, 900);

    const run = async () => {
      const formData = new FormData();
      formData.append("country", pending.country);
      formData.append("companyName", pending.companyName);
      formData.append("companyDescription", pending.companyDescription);
      formData.append("companyDetails", pending.companyDetails);
      formData.append("businessModel", pending.businessModel);
      if (pending.notes) formData.append("notes", pending.notes);
      if (pending.companyWebsiteUrl) formData.append("companyWebsiteUrl", pending.companyWebsiteUrl);
      formData.append("regulatorySources", JSON.stringify(pending.regulatorySources));
      formData.append("websites", JSON.stringify(pending.websites));
      for (const file of pending.files) {
        formData.append("files", file, file.name);
      }

      try {
        const response = await fetch("/api/compliance-agent/analyze", {
          method: "POST",
          credentials: "same-origin",
          headers: demoComplianceHeaders(isDemo),
          body: formData,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.detail || payload?.error || "Compliance analysis failed.");
        }

        const normalized = normalizeComplianceResult(payload);
        const resultWithSources: ComplianceResult = {
          ...normalized,
          sourceStatuses: mergeHypertronSourceStatuses(normalized.sourceStatuses, pending.regulatorySources),
        };
        setLatestComplianceResult(resultWithSources);
        setLatestComplianceContext({
          country: pending.country,
          companyName: pending.companyName,
          companyDescription: pending.companyDescription,
          companyDetails: pending.companyDetails,
          businessModel: pending.businessModel,
          notes: pending.notes,
          companyWebsiteUrl: pending.companyWebsiteUrl,
          websites: pending.websites,
          regulatorySources: pending.regulatorySources,
          sourceStatuses: resultWithSources.sourceStatuses,
        });

        const websiteStatuses = resultWithSources.sourceStatuses.filter((s) => s.sourceType === "website");
        if (websiteStatuses.length > 0) {
          setLiveWebsites((prev) =>
            prev.map((w) => {
              const match = websiteStatuses.find((s) => s.name === w.url);
              if (!match) return w;
              return { ...w, state: match.status === "Processed" ? "processed" : "failed" };
            })
          );
        }
        setLiveRegulatorySources((prev) =>
          prev.map((source) => {
            const match = resultWithSources.sourceStatuses.find(
              (status) => status.sourceType === "regulatory_source" && (status.name === source.url || status.description === source.name)
            );
            if (!match) return { ...source, state: "used" };
            if (match.status === "failed" || match.status === "Failed") return { ...source, state: "failed" };
            if (match.status === "skipped" || match.status === "Unsupported") return { ...source, state: "skipped" };
            return { ...source, state: "used" };
          })
        );

        clearPendingComplianceRequest();
        setProgress(100);
        window.setTimeout(() => {
          router.replace(demoPath("/dashboard/compliance-agent/analysis"));
        }, 700);
      } catch (runError) {
        const message = runError instanceof Error ? runError.message : "Compliance analysis failed.";
        setError(message);
        setPhase("Analysis paused due to an error");
      }
    };

    run();

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(phaseTimer);
      window.clearInterval(websiteTimer);
      window.clearInterval(regulatoryTimer);
    };
  }, [demoPath, isDemo, pending, router]);

  if (!pending) return null;

  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <>
      <DashboardHeader fixed>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Compliance Agent</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitch />
          <Button variant="ghost" size="sm" onClick={() => router.push(demoPath("/dashboard/compliance-agent"))}>Back</Button>
          <Button variant="ghost" size="sm" onClick={disconnect} disabled={isConnecting}>Disconnect</Button>
        </div>
      </DashboardHeader>

      <DashboardMain>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <Card className="overflow-hidden border-white/[0.12] bg-gradient-to-br from-violet-500/15 via-blue-500/8 to-emerald-500/10">
            <CardHeader>
              <CardTitle className="text-2xl">Compliance analysis in progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
                <p className="text-sm text-white/85">{phase}</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-white/70">
                  <span>Agent progress</span>
                  <span>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => window.location.reload()}>Retry</Button>
                    <Button size="sm" variant="outline" onClick={() => router.replace(demoPath("/dashboard/compliance-agent"))}>Back to form</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-white/[0.08] bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-base">Execution steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stepItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
                      <div className="rounded-md bg-white/[0.08] p-2">
                        <Icon className="h-4 w-4 text-violet-200" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/90">{item.label}</p>
                        <p className="text-xs text-white/45">Step {i + 1}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-white/[0.08] bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-base">Source collection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {liveWebsites.length === 0 ? (
                  <p className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 text-sm text-white/50">
                    No company website added. Agent is using docs, notes, and Hypertron jurisdiction sources.
                  </p>
                ) : (
                  liveWebsites.map((website) => (
                    <div key={website.url} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                      <div>
                        <p className="text-sm text-white/90">{hostOf(website.url)}</p>
                        <p className="text-xs text-white/45 truncate max-w-[240px]">{website.url}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] ${
                          website.state === "processed"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : website.state === "fetching"
                              ? "bg-blue-500/15 text-blue-300"
                              : website.state === "failed"
                                ? "bg-red-500/15 text-red-300"
                                : "bg-white/10 text-white/50"
                        }`}
                      >
                        {website.state}
                      </span>
                    </div>
                  ))
                )}

                {liveRegulatorySources.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/40">
                      Hypertron-provided regulatory sources
                    </p>
                    {liveRegulatorySources.map((source) => (
                      <div
                        key={source.key}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white/90">{source.name}</p>
                          <p className="truncate text-xs text-white/45">{hostOf(source.url)}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${
                            source.state === "used"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : source.state === "failed"
                                ? "bg-red-500/15 text-red-300"
                                : source.state === "skipped"
                                  ? "bg-amber-500/15 text-amber-300"
                                  : "bg-white/10 text-white/50"
                          }`}
                        >
                          {source.state}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 text-xs text-white/50">
                  Files queued: {pending.files.length} · Notes included: {pending.notes ? "yes" : "no"}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardMain>
    </>
  );
}
