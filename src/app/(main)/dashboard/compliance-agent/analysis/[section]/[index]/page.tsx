"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  WandSparkles,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/layout/header";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDemoMode } from "@/components/demo/demo-mode-provider";
import { useFreighter } from "@/hooks/useFreighter";
import {
  getLatestComplianceContext,
  getLatestComplianceResult,
  normalizeComplianceDetailPlan,
  type ComplianceDetailPlan,
  type DetailLink,
} from "@/lib/compliance-agent-session";
import { getRegulatorySourcesForJurisdiction } from "@/lib/compliance/jurisdiction-knowledge-base";
import { demoComplianceHeaders } from "@/lib/demo-compliance-api";

type SectionKey = "licenses" | "documents" | "actions" | "timeline" | "risks";

const SEARCH_ENGINE_HOSTS = ["google.com", "bing.com", "search.yahoo.com", "duckduckgo.com", "yandex.com", "baidu.com"];

function toSection(value: string): SectionKey | null {
  if (value === "licenses" || value === "documents" || value === "actions" || value === "timeline" || value === "risks") {
    return value;
  }
  return null;
}

function sectionLabel(section: SectionKey): string {
  if (section === "licenses") return "Required Licenses";
  if (section === "documents") return "Required Documents";
  if (section === "actions") return "Action Items";
  if (section === "timeline") return "Timeline";
  return "Risks and Mitigation";
}

function isSearchEngineHost(host: string): boolean {
  for (const blocked of SEARCH_ENGINE_HOSTS) {
    if (host === blocked || host.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

function getDirectPortalUrl(rawUrl: string | null | undefined): string | null {
  const value = (rawUrl || "").trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const host = parsed.hostname.toLowerCase();
    if (isSearchEngineHost(host)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function mergeOfficialLinks(groups: DetailLink[][]): DetailLink[] {
  const merged: DetailLink[] = [];
  const seen = new Set<string>();
  for (const links of groups) {
    for (const link of links) {
      const safeUrl = getDirectPortalUrl(link.url);
      if (!safeUrl) continue;
      const key = safeUrl.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({
        title: link.title || "Official portal",
        url: safeUrl,
        purpose: link.purpose || "Official compliance portal",
        authority: link.authority || null,
      });
    }
  }
  return merged;
}

export default function ComplianceDetailPage() {
  const router = useRouter();
  const params = useParams<{ section: string; index: string }>();
  const { demoPath, isDemo } = useDemoMode();
  const { disconnect, isConnecting } = useFreighter();

  const section = toSection(String(params?.section || ""));
  const index = Number.parseInt(String(params?.index || ""), 10);

  const result = getLatestComplianceResult();
  const context = getLatestComplianceContext();

  const [detail, setDetail] = useState<ComplianceDetailPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!result || !section || Number.isNaN(index) || index < 0) return null;

    if (section === "licenses") {
      const item = result.requiredLicenses[index];
      if (!item) return null;
      return {
        title: item.name,
        summary: item.reason,
        priority: item.priority,
        owner: "legal",
      };
    }
    if (section === "documents") {
      const item = result.requiredDocuments[index];
      if (!item) return null;
      return {
        title: item.name,
        summary: item.reason,
        priority: item.priority,
        owner: item.owner,
      };
    }
    if (section === "actions") {
      const item = result.actionItems[index];
      if (!item) return null;
      return {
        title: item.title,
        summary: item.details,
        priority: item.priority,
        owner: item.owner,
      };
    }
    if (section === "timeline") {
      const item = result.timeline[index];
      if (!item) return null;
      return {
        title: `${item.phase} (${item.weeks})`,
        summary: item.goals.join("; "),
        priority: "P1",
        owner: "compliance",
      };
    }

    const item = result.risks[index];
    if (!item) return null;
    return {
      title: item.risk,
      summary: item.mitigation,
      priority: item.severity === "high" ? "P0" : item.severity === "medium" ? "P1" : "P2",
      owner: "compliance",
    };
  }, [index, result, section]);

  const inferredCountry = useMemo(() => {
    const fromContext = (context?.country || "").trim();
    if (fromContext) return fromContext;

    const fromLicenses = result?.requiredLicenses.find((item) => item.jurisdiction?.trim())?.jurisdiction?.trim();
    if (fromLicenses) return fromLicenses;

    const summary = (result?.summary || "").toLowerCase();
    if (summary.includes("india")) return "India";
    if (summary.includes("united states") || summary.includes("usa")) return "United States";
    if (summary.includes("united kingdom") || summary.includes("uk")) return "United Kingdom";
    return "India";
  }, [context?.country, result]);

  const defaultLinks = useMemo(() => {
    return getRegulatorySourcesForJurisdiction(inferredCountry).map((source) => ({
      title: source.name,
      url: source.url,
      purpose: source.description,
      authority: source.authorityType,
    }));
  }, [inferredCountry]);

  const resolvedSubmissionLinks = useMemo(() => {
    if (!detail) return defaultLinks;
    return mergeOfficialLinks([detail.submissionLinks, detail.sources, defaultLinks]).slice(0, 8);
  }, [defaultLinks, detail]);

  const resolvedSourceLinks = useMemo(() => {
    if (!detail) return [];
    return mergeOfficialLinks([detail.sources]).slice(0, 8);
  }, [detail]);

  useEffect(() => {
    if (!section || Number.isNaN(index) || index < 0) {
      setError("Invalid detail page URL.");
      setLoading(false);
      return;
    }
    if (!result || !selected) {
      setError("No analysis data found. Run a compliance analysis first.");
      setLoading(false);
      return;
    }

    const contextWebsites = context?.websites?.length ? context.websites : [];
    const statusWebsites = result.sourceStatuses
      .filter(
        (s) =>
          (s.sourceType === "website" || s.sourceType === "regulatory_source") &&
          !["Failed", "failed", "Unsupported", "skipped"].includes(s.status)
      )
      .map((s) => s.name);
    const websites = Array.from(new Set([...contextWebsites, ...statusWebsites]));

    const fallbackCountry = inferredCountry;
    const fallbackBusinessModel =
      (context?.businessModel || "").trim() ||
      "Digital asset business model; derive operational obligations from current analysis context.";
    const fallbackCompanyDetails =
      (context?.companyDetails || "").trim() ||
      result.summary ||
      "Business details were not found in session context; use current compliance analysis as source context.";

    const payload = {
      country: fallbackCountry,
      businessModel: fallbackBusinessModel,
      companyDetails: fallbackCompanyDetails,
      notes: context?.notes || "",
      websites,
      regulatorySources: context?.regulatorySources || getRegulatorySourcesForJurisdiction(fallbackCountry),
      section,
      itemTitle: selected.title,
      itemSummary: selected.summary,
      priority: selected.priority,
      owner: selected.owner,
    };

    let cancelled = false;

    fetch("/api/compliance-agent/detail-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...demoComplianceHeaders(isDemo),
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          let message = "Failed to generate detailed plan.";
          if (typeof data?.detail === "string") {
            message = data.detail;
          } else if (Array.isArray(data?.detail)) {
            message = data.detail
              .map((d: { loc?: Array<string | number>; msg?: string }) => {
                const loc = Array.isArray(d?.loc) ? d.loc.join(".") : "request";
                return `${loc}: ${d?.msg || "invalid value"}`;
              })
              .join("; ");
          } else if (typeof data?.error === "string") {
            message = data.error;
          }
          throw new Error(message);
        }
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setDetail(normalizeComplianceDetailPlan(data));
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to generate detailed plan.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [context, index, inferredCountry, result, section, selected]);

  return (
    <>
      <DashboardHeader fixed>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Compliance Detail Workflow</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitch />
          <Button variant="ghost" size="sm" onClick={() => router.push(demoPath("/dashboard/compliance-agent/analysis"))}>Back to Analysis</Button>
          <Button variant="ghost" size="sm" onClick={disconnect} disabled={isConnecting}>Disconnect</Button>
        </div>
      </DashboardHeader>

      <DashboardMain>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <div className="rounded-2xl border border-white/[0.12] bg-gradient-to-br from-violet-500/20 via-blue-500/10 to-cyan-500/10 p-6">
            <p className="text-xs uppercase tracking-wider text-white/55">{section ? sectionLabel(section) : "Detailed Workflow"}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{selected?.title || "Detailed Compliance Plan"}</h1>
            <p className="mt-2 text-sm text-white/70">{selected?.summary || "Step-by-step implementation guidance."}</p>
          </div>

          {loading && (
            <Card className="border-white/[0.08] bg-white/[0.02]">
              <CardContent className="flex items-center gap-3 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
                <p className="text-sm text-white/80">Generating detailed workflow and submission links...</p>
              </CardContent>
            </Card>
          )}

          {!loading && error && (
            <Card className="border-destructive/40 bg-destructive/10">
              <CardContent className="flex items-start gap-2 py-6 text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Could not build detail plan</p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && detail && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-white/[0.08] bg-white/[0.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <WandSparkles className="h-5 w-5 text-violet-300" />
                      Why it matters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-white/75">
                    {detail.whyItMatters}
                  </CardContent>
                </Card>

                <Card className="border-white/[0.08] bg-white/[0.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                      Eligibility checks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-white/75">
                      {detail.eligibilityChecks.map((check) => (
                        <li key={check}>{check}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-white/[0.08] bg-white/[0.02]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-blue-300" />
                    Required documents for this workflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2">
                    {detail.requiredDocuments.map((doc) => (
                      <div key={doc} className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-sm text-white/80">
                        {doc}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/[0.08] bg-white/[0.02]">
                <CardHeader>
                  <CardTitle className="text-lg">Step-by-step process</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detail.stepByStep.map((step) => {
                    const stepPortal = getDirectPortalUrl(step.submissionLink) || resolvedSubmissionLinks[0]?.url || null;
                    return (
                      <div key={`${step.step}-${step.title}`} className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-4">
                        <p className="text-sm font-semibold text-violet-200">Step {step.step}</p>
                        <p className="mt-1 text-base font-medium">{step.title}</p>
                        <p className="mt-1 text-sm text-white/75">{step.details}</p>
                        <p className="mt-2 text-xs text-white/50">
                          Owner: {step.owner || "compliance"} · Timeline: {step.estimatedTimeline}
                        </p>
                        {step.requiredDocuments.length > 0 && (
                          <p className="mt-2 text-xs text-white/65">
                            Docs: {step.requiredDocuments.join(", ")}
                          </p>
                        )}
                        {stepPortal && (
                          <a
                            href={stepPortal}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center text-xs text-violet-300 hover:text-violet-200"
                          >
                            Open official portal <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-white/[0.08] bg-white/[0.02]">
                  <CardHeader>
                    <CardTitle className="text-lg">Top official links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {resolvedSubmissionLinks.map((link) => (
                      <a
                        key={`${link.title}-${link.url}`}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 transition hover:border-violet-400/40"
                      >
                        <p className="text-sm font-medium">{link.title}</p>
                        <p className="mt-1 text-xs text-white/65">{link.purpose}</p>
                        <p className="mt-1 inline-flex items-center text-xs text-violet-300">
                          Open link <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </p>
                      </a>
                    ))}
                    {resolvedSubmissionLinks.length === 0 && (
                      <p className="text-sm text-white/60">Hypertron could not resolve a direct official link for this item yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-white/[0.08] bg-white/[0.02]">
                  <CardHeader>
                    <CardTitle className="text-lg">Automation suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-white/75">
                      {detail.automationSuggestions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {(detail.warnings.length > 0 || resolvedSourceLinks.length > 0) && (
                <Card className="border-white/[0.08] bg-white/[0.02]">
                  <CardHeader>
                    <CardTitle className="text-lg">Warnings and sources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {detail.warnings.length > 0 && (
                      <ul className="list-disc space-y-2 pl-5 text-sm text-amber-200/90">
                        {detail.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    )}
                    {resolvedSourceLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {resolvedSourceLinks.map((source) => (
                          <a
                            key={`${source.title}-${source.url}`}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1 text-xs text-white/80"
                          >
                            {source.title}
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-white/50">{detail.disclaimer}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DashboardMain>
    </>
  );
}
