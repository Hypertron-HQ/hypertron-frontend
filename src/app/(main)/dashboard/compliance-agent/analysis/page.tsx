"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileCheck2,
  FileText,
  Globe2,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDemoMode } from "@/components/demo/demo-mode-provider";
import { useWorkspacePageMeta } from "@/components/dashboard/workspace-hub/workspace-page-meta-context";
import {
  getLatestComplianceResult,
  type ComplianceResult,
  type SourceStatus,
} from "@/lib/compliance-agent-session";
import { cn } from "@/utils";

const tabs = ["Overview", "Licenses", "Documents", "Action Plan", "Timeline", "Risks"] as const;
type AnalysisTab = (typeof tabs)[number];
type DetailSection = "licenses" | "documents" | "actions" | "timeline" | "risks";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function faviconFor(url: string): string {
  return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(url)}`;
}

function priorityClasses(priority: "P0" | "P1" | "P2") {
  if (priority === "P0") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (priority === "P1") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-violet-50 text-violet-700 ring-violet-100";
}

function severityClasses(severity: "high" | "medium" | "low") {
  if (severity === "high") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (severity === "medium") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

function alertSeverityTone(severity: "high" | "medium" | "low") {
  if (severity === "high") {
    return {
      icon: ShieldAlert,
      classes: "bg-rose-50 text-rose-600 ring-rose-100",
    };
  }
  if (severity === "medium") {
    return {
      icon: AlertTriangle,
      classes: "bg-amber-50 text-amber-600 ring-amber-100",
    };
  }
  return {
    icon: FileCheck2,
    classes: "bg-violet-50 text-violet-700 ring-violet-100",
  };
}

function healthTone(status: ComplianceResult["complianceHealth"]["status"]) {
  if (status === "On Track") {
    return {
      label: "Excellent",
      color: "#22c55e",
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      icon: ShieldCheck,
    };
  }
  if (status === "At Risk") {
    return {
      label: "Needs attention",
      color: "#f59e0b",
      text: "text-amber-600",
      bg: "bg-amber-50",
      icon: AlertTriangle,
    };
  }
  return {
    label: "Critical",
    color: "#e11d48",
    text: "text-rose-600",
    bg: "bg-rose-50",
    icon: ShieldAlert,
  };
}

function MetricCard({
  title,
  value,
  detail,
  children,
}: {
  title: string;
  value?: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-slate-200 text-[11px] text-slate-400">
          i
        </span>
      </div>
      {children ?? (
        <>
          <p className="mt-7 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </>
      )}
    </section>
  );
}

function ScoreCard({ result }: { result: ComplianceResult }) {
  const score = Math.max(0, Math.min(100, result.complianceHealth.score));
  const tone = healthTone(result.complianceHealth.status);
  const Icon = tone.icon;

  return (
    <MetricCard title="Overall Compliance Score">
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className="grid h-24 w-24 shrink-0 place-items-center rounded-full p-2"
          style={{
            background: `conic-gradient(${tone.color} 0 ${score}%, #e5e7eb ${score}% 100%)`,
          }}
        >
          <div className="grid h-full w-full place-items-center rounded-full bg-white text-center">
            <p className="text-2xl font-semibold leading-none text-slate-950">{score}</p>
            <p className="text-xs text-slate-500">/100</p>
          </div>
        </div>
        <div className="min-w-0">
          <p className={cn("flex items-center gap-2 font-semibold", tone.text)}>
            <Icon className="h-4 w-4" />
            {tone.label}
          </p>
          <p className="mt-3 text-sm leading-5 text-slate-500">{result.complianceHealth.rationale}</p>
        </div>
      </div>
    </MetricCard>
  );
}

function SourceCard({ source }: { source: SourceStatus }) {
  const isWebsite = source.sourceType === "website";
  const isRegulatorySource = source.sourceType === "regulatory_source";
  const title = isWebsite || isRegulatorySource ? hostOf(source.name) : source.name;
  const subtitle =
    source.extractedChars > 0
      ? `${source.status} · ${source.extractedChars.toLocaleString()} chars`
      : `${source.status} · ${source.providedBy === "hypertron" ? "Hypertron-provided" : "attached source"}`;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex items-center gap-3">
        {isWebsite || isRegulatorySource ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={faviconFor(source.name)}
            alt=""
            className="h-10 w-10 rounded-lg border border-slate-200 bg-white p-1"
          />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-violet-50 text-violet-700">
            <FileText className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          {isRegulatorySource && (
            <p className="truncate text-xs font-medium text-violet-700">
              {source.detail || "Hypertron regulatory source"}
            </p>
          )}
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function RiskDistribution({ risks }: { risks: ComplianceResult["risks"] }) {
  const counts = {
    high: risks.filter((risk) => risk.severity === "high").length,
    medium: risks.filter((risk) => risk.severity === "medium").length,
    low: risks.filter((risk) => risk.severity === "low").length,
  };
  const total = Math.max(risks.length, 1);
  const high = (counts.high / total) * 100;
  const medium = high + (counts.medium / total) * 100;
  const low = medium + (counts.low / total) * 100;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">Risk Level Distribution</h2>
        <span className="text-sm font-semibold text-violet-700">{risks.length} risks</span>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-[150px_1fr] lg:grid-cols-1 2xl:grid-cols-[150px_1fr]">
        <div
          className="mx-auto h-36 w-36 rounded-full p-6"
          style={{
            background: `conic-gradient(#e11d48 0 ${high}%, #f59e0b ${high}% ${medium}%, #22c55e ${medium}% ${low}%, #cbd5e1 ${low}% 100%)`,
          }}
        >
          <div className="h-full w-full rounded-full bg-white" />
        </div>
        <div className="space-y-4">
          {[
            { label: "High Risk", value: counts.high, color: "bg-rose-500" },
            { label: "Medium Risk", value: counts.medium, color: "bg-amber-500" },
            { label: "Low Risk", value: counts.low, color: "bg-emerald-500" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700">
                <span className={cn("h-3 w-3 shrink-0 rounded", row.color)} />
                {row.label}
              </span>
              <span className="shrink-0 tabular-nums text-slate-500">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnalysisAlerts({
  result,
  onOpenDetail,
}: {
  result: ComplianceResult;
  onOpenDetail: (section: DetailSection, index: number) => void;
}) {
  const rows = result.risks.length
    ? result.risks
    : [{ risk: "No major risks detected", severity: "low" as const, mitigation: "Continue routine monitoring." }];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Compliance Alerts</h2>
        <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
          All Risks <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((risk, index) => {
          const tone = alertSeverityTone(risk.severity);
          const Icon = tone.icon;
          return (
          <div key={`${risk.risk}-${index}`} className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <div className="flex min-w-0 items-start gap-4">
              <span className={cn("mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl ring-1", tone.classes)}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{risk.risk}</p>
                <p className="mt-1 truncate text-sm text-slate-500">{risk.mitigation}</p>
              </div>
            </div>
            <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1", tone.classes)}>
              {risk.severity}
            </span>
            <div className="flex justify-start lg:justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl"
                onClick={() => onOpenDetail("risks", index)}
              >
                View
              </Button>
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}

function ComplianceChecks({
  result,
  onOpenDetail,
}: {
  result: ComplianceResult;
  onOpenDetail: (section: DetailSection, index: number) => void;
}) {
  const rows = [
    ...result.requiredLicenses.map((item, index) => ({
      type: item.name,
      description: `${item.jurisdiction} · Confidence ${item.confidence}`,
      reason: item.reason,
      priority: item.priority,
      icon: ShieldCheck,
      section: "licenses" as const,
      index,
    })),
    ...result.requiredDocuments.map((item, index) => ({
      type: item.name,
      description: `Owner: ${item.owner}`,
      reason: item.reason,
      priority: item.priority,
      icon: FileCheck2,
      section: "documents" as const,
      index,
    })),
  ];

  const statusForPriority = (priority: "P0" | "P1" | "P2") => {
    if (priority === "P0") return "Action";
    if (priority === "P1") return "Attention";
    return "Review";
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-950">Compliance Checks</h2>
          <span className="grid h-5 w-5 place-items-center rounded-full border border-slate-200 text-[11px] text-slate-400">
            i
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
            All Status <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
            Current Analysis <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3">Check Type</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Passed</th>
              <th className="px-5 py-3">Failed</th>
              <th className="px-5 py-3">Action Required</th>
              <th className="px-5 py-3">Last Run</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const Icon = row.icon;
              const status = statusForPriority(row.priority);
              return (
                <tr key={`${row.section}-${row.index}-${row.type}`} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{row.type}</p>
                        <p className="text-xs text-slate-500">{row.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        row.priority === "P2"
                          ? "bg-emerald-50 text-emerald-700"
                          : row.priority === "P1"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                      )}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium tabular-nums text-slate-700">1</td>
                  <td className="px-5 py-4 tabular-nums text-emerald-600">{row.priority === "P2" ? "1 ready" : "0"}</td>
                  <td className="px-5 py-4 tabular-nums text-rose-600">{row.priority === "P0" ? "1 critical" : "0"}</td>
                  <td className="px-5 py-4 tabular-nums text-amber-600">{row.priority !== "P2" ? "1 item" : "0"}</td>
                  <td className="px-5 py-4 text-slate-500">Latest run</td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => onOpenDetail(row.section, row.index)} aria-label={`Open ${row.type}`}>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="border-t border-slate-100 px-5 py-6 text-sm text-slate-500">
            No licenses or documents were generated for this run.
          </p>
        )}
      </div>
    </section>
  );
}

function DetailList({
  tab,
  result,
  onOpenDetail,
}: {
  tab: AnalysisTab;
  result: ComplianceResult;
  onOpenDetail: (section: DetailSection, index: number) => void;
}) {
  if (tab === "Licenses") {
    return (
      <section className="grid gap-4 lg:grid-cols-2">
        {result.requiredLicenses.map((item, index) => (
          <button
            key={`${item.name}-${index}`}
            type="button"
            onClick={() => onOpenDetail("licenses", index)}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md"
          >
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", priorityClasses(item.priority))}>
              {item.priority}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.jurisdiction} · Confidence {item.confidence}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.reason}</p>
          </button>
        ))}
      </section>
    );
  }

  if (tab === "Documents") {
    return (
      <section className="grid gap-4 lg:grid-cols-2">
        {result.requiredDocuments.map((item, index) => (
          <button
            key={`${item.name}-${index}`}
            type="button"
            onClick={() => onOpenDetail("documents", index)}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md"
          >
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", priorityClasses(item.priority))}>
              {item.priority}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.name}</h3>
            <p className="mt-1 text-sm capitalize text-slate-500">Owner: {item.owner}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.reason}</p>
          </button>
        ))}
      </section>
    );
  }

  if (tab === "Action Plan") {
    return (
      <section className="grid gap-4 lg:grid-cols-2">
        {result.actionItems.map((item, index) => (
          <button
            key={`${item.title}-${index}`}
            type="button"
            onClick={() => onOpenDetail("actions", index)}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md"
          >
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold ring-1", priorityClasses(item.priority))}>
              {item.priority}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-1 text-sm capitalize text-slate-500">Owner: {item.owner}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.details}</p>
          </button>
        ))}
      </section>
    );
  }

  if (tab === "Timeline") {
    return (
      <section className="grid gap-4 lg:grid-cols-2">
        {result.timeline.map((item, index) => (
          <button
            key={`${item.phase}-${index}`}
            type="button"
            onClick={() => onOpenDetail("timeline", index)}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-slate-950">{item.phase}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.weeks}</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {item.goals.map((goal) => (
                <li key={goal} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {goal}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </section>
    );
  }

  if (tab === "Risks") {
    return (
      <section className="grid gap-4 lg:grid-cols-2">
        {result.risks.map((item, index) => (
          <button
            key={`${item.risk}-${index}`}
            type="button"
            onClick={() => onOpenDetail("risks", index)}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md"
          >
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1", severityClasses(item.severity))}>
              {item.severity}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.risk}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.mitigation}</p>
          </button>
        ))}
      </section>
    );
  }

  return null;
}

export default function ComplianceAgentAnalysisPage() {
  const router = useRouter();
  const { demoPath } = useDemoMode();
  const [activeTab, setActiveTab] = useState<AnalysisTab>("Overview");
  const result = getLatestComplianceResult();

  useWorkspacePageMeta({
    breadcrumbs: [
      { label: "Workspaces", href: demoPath("/dashboard") },
      { label: "Compliance", href: demoPath("/dashboard/compliance-agent") },
      { label: "Analysis", current: true },
    ],
  });

  const processedSources = useMemo(
    () =>
      result?.sourceStatuses.filter(
        (source) =>
          source.sourceType === "regulatory_source" ||
          !["Failed", "failed", "Unsupported", "skipped"].includes(source.status)
      ) ?? [],
    [result]
  );

  const openDetail = (section: DetailSection, index: number) => {
    router.push(demoPath(`/dashboard/compliance-agent/analysis/${section}/${index}`));
  };

  if (!result) {
    return (
      <main className="min-h-[60vh] bg-slate-50/60 text-slate-950">
        <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert className="h-10 w-10 text-violet-700" />
          <h1 className="text-2xl font-semibold tracking-tight">No completed analysis yet</h1>
          <p className="text-sm leading-6 text-slate-500">
            Run the Compliance Agent first, then the generated results will appear in this dashboard.
          </p>
          <Button
            className="rounded-xl bg-violet-700 text-white hover:bg-violet-800"
            onClick={() => router.push(demoPath("/dashboard/compliance-agent"))}
          >
            Go to Compliance Agent
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen min-w-0 overflow-x-hidden bg-slate-50/60 text-slate-950">
      <div className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-6">
        <div className="flex min-w-0 flex-col gap-4 min-[1700px]:flex-row min-[1700px]:items-start min-[1700px]:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Compliance Analysis</h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-500">{result.summary}</p>
          </div>
          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2 min-[1700px]:flex min-[1700px]:flex-wrap">
            <Button variant="outline" className="h-11 min-w-0 rounded-xl bg-white" onClick={() => setActiveTab("Risks")}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Review Risks
            </Button>
            <Button
              className="h-11 min-w-0 rounded-xl bg-violet-700 px-5 text-white shadow-lg shadow-violet-200 hover:bg-violet-800"
              onClick={() => router.push(demoPath("/dashboard/compliance-agent"))}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Run
            </Button>
          </div>
        </div>

        <div className="flex min-w-0 gap-5 overflow-x-auto border-b border-slate-200 sm:gap-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "relative shrink-0 px-1 pb-4 text-sm font-semibold transition",
                activeTab === tab ? "text-violet-700" : "text-slate-500 hover:text-slate-900"
              )}
            >
              {tab}
              {activeTab === tab ? (
                <span className="absolute inset-x-0 bottom-[-1px] h-0.5 rounded-full bg-violet-700" />
              ) : null}
            </button>
          ))}
        </div>

        {activeTab === "Overview" ? (
          <div className="grid min-w-0 gap-6 min-[1700px]:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <div className="flex min-w-0 flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-2 min-[1900px]:grid-cols-4">
                <ScoreCard result={result} />
                <MetricCard
                  title="Required Licenses"
                  value={String(result.requiredLicenses.length)}
                  detail="Licenses and registrations identified"
                />
                <MetricCard
                  title="Action Items"
                  value={String(result.actionItems.length)}
                  detail="Tasks generated for your team"
                />
                <MetricCard
                  title="High Priority Risks"
                  value={String(result.risks.filter((risk) => risk.severity === "high").length)}
                  detail="Risks requiring urgent review"
                />
              </div>

              <AnalysisAlerts result={result} onOpenDetail={openDetail} />
              <ComplianceChecks result={result} onOpenDetail={openDetail} />
            </div>

            <aside className="flex min-w-0 flex-col gap-6">
              <RiskDistribution risks={result.risks} />

              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-950">Source Intelligence</h2>
                  <span className="text-sm font-semibold text-violet-700">{processedSources.length} available</span>
                </div>
                <div className="mt-5 space-y-3">
                  {processedSources.length ? (
                    processedSources.map((source) => <SourceCard key={`${source.sourceType}-${source.name}`} source={source} />)
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No processed sources were attached to this analysis.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-violet-100 bg-violet-50 p-6">
                <div className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-violet-700">
                    <Globe2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Generated by {result.modelSource}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Open any row to continue into the detailed workflow for that recommendation.
                    </p>
                    <button
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-700"
                      onClick={() => setActiveTab("Action Plan")}
                    >
                      View Action Plan <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        ) : (
          <DetailList tab={activeTab} result={result} onOpenDetail={openDetail} />
        )}

        {result.disclaimers.length ? (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40">
            <h2 className="text-base font-semibold text-slate-950">Disclaimers</h2>
            <div className="mt-3 space-y-2">
              {result.disclaimers.map((text) => (
                <p key={text} className="text-sm leading-6 text-slate-500">
                  {text}
                </p>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
