"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  FileText,
  KeyRound,
  Plus,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDemoMode } from "@/components/demo/demo-mode-provider";
import { useWorkspacePageMeta } from "@/components/dashboard/workspace-hub/workspace-page-meta-context";
import { cn } from "@/utils";

const tabs = [
  "Overview",
  "KYC & Verification",
  "Risk Monitoring",
  "Sanctions Screening",
  "Audit Logs",
  "Documents",
] as const;

type ComplianceTab = (typeof tabs)[number];
type AlertSeverity = "Low" | "Medium" | "High";
type ActivityStatus = "Verified" | "Review" | "Passed" | "Uploaded" | "Alert";

const alerts: {
  title: string;
  detail: string;
  severity: AlertSeverity;
  time: string;
  icon: typeof AlertTriangle;
}[] = [
  {
    title: "High risk customer flagged",
    detail: "Customer ID: cus_9f3k2l8n - Reason: Transaction pattern",
    severity: "Medium",
    time: "May 16, 2024 - 10:32 AM",
    icon: AlertTriangle,
  },
  {
    title: "Sanctions match found",
    detail: "Customer ID: cus_7d2d9k1m - Matched: OFAC SDN List",
    severity: "High",
    time: "May 16, 2024 - 09:15 AM",
    icon: ShieldAlert,
  },
  {
    title: "KYC expiring soon",
    detail: "Customer ID: cus_2b8f7d1a - Expires in 7 days",
    severity: "Low",
    time: "May 16, 2024 - 08:45 AM",
    icon: FileText,
  },
];

const checks = [
  {
    type: "KYC Verification",
    description: "Identity verification checks",
    status: "Passed",
    total: "1,248",
    passed: "1,198 (96%)",
    failed: "20 (1.6%)",
    action: "30 (2.4%)",
    lastRun: "May 16, 2024 - 10:30 AM",
    icon: UserCheck,
  },
  {
    type: "Sanctions Screening",
    description: "Against global watchlists",
    status: "Passed",
    total: "1,248",
    passed: "1,244 (99.7%)",
    failed: "2 (0.2%)",
    action: "2 (0.1%)",
    lastRun: "May 16, 2024 - 10:30 AM",
    icon: Shield,
  },
  {
    type: "PEP Screening",
    description: "Politically exposed persons",
    status: "Passed",
    total: "1,248",
    passed: "1,241 (99.4%)",
    failed: "1 (0.1%)",
    action: "6 (0.5%)",
    lastRun: "May 16, 2024 - 10:30 AM",
    icon: UserCheck,
  },
  {
    type: "Transaction Monitoring",
    description: "AML transaction monitoring",
    status: "Attention",
    total: "12,620",
    passed: "12,320 (97.6%)",
    failed: "45 (0.4%)",
    action: "255 (2.0%)",
    lastRun: "May 16, 2024 - 10:30 AM",
    icon: FileText,
  },
];

const activities: {
  title: string;
  detail: string;
  time: string;
  status: ActivityStatus;
  icon: typeof CheckCircle2;
}[] = [
  {
    title: "KYC verified for Riya Sharma",
    detail: "May 16, 2024 - 10:32 AM",
    time: "10:32 AM",
    status: "Verified",
    icon: CheckCircle2,
  },
  {
    title: "Manual review requested",
    detail: "Customer ID: cus_9f3k2l8n",
    time: "09:58 AM",
    status: "Review",
    icon: AlertTriangle,
  },
  {
    title: "Sanctions screening passed",
    detail: "Customer ID: cus_2b8f7d1a",
    time: "09:41 AM",
    status: "Passed",
    icon: CheckCircle2,
  },
  {
    title: "Document uploaded",
    detail: "Customer ID: cus_7d2f1a9c",
    time: "09:15 AM",
    status: "Uploaded",
    icon: FileText,
  },
  {
    title: "High risk transaction detected",
    detail: "Transaction ID: txn_8f2d9k1m",
    time: "08:50 AM",
    status: "Alert",
    icon: ShieldAlert,
  },
];

const tabSummaries: Record<ComplianceTab, string> = {
  Overview: "Live compliance health, risk exposure, and workflow status.",
  "KYC & Verification": "Identity checks, customer reviews, and verification queues.",
  "Risk Monitoring": "Risk score movement, flagged behavior, and policy thresholds.",
  "Sanctions Screening": "Watchlist results, sanctions hits, and match resolution.",
  "Audit Logs": "Immutable event history for reviews, uploads, and approvals.",
  Documents: "Policy documents, evidence packs, and expiring files.",
};

function severityClasses(severity: AlertSeverity) {
  if (severity === "High") return "bg-rose-50 text-rose-700 ring-rose-100";
  if (severity === "Medium") return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-violet-50 text-violet-700 ring-violet-100";
}

function activityClasses(status: ActivityStatus) {
  if (status === "Verified" || status === "Passed") return "bg-emerald-50 text-emerald-700";
  if (status === "Review") return "bg-amber-50 text-amber-700";
  if (status === "Alert") return "bg-rose-50 text-rose-700";
  return "bg-violet-50 text-violet-700";
}

function MetricCard({
  title,
  value,
  detail,
  trend,
  tone = "emerald",
  children,
}: {
  title: string;
  value: string;
  detail: string;
  trend?: string;
  tone?: "emerald" | "amber" | "rose";
  children?: React.ReactNode;
}) {
  const trendColor =
    tone === "rose" ? "text-rose-600" : tone === "amber" ? "text-amber-600" : "text-emerald-600";

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-[11px] text-slate-400">
          i
        </span>
      </div>
      {children ? (
        children
      ) : (
        <>
          <p className="mt-7 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{detail}</p>
        </>
      )}
      {trend ? <p className={cn("mt-4 text-sm font-medium", trendColor)}>{trend}</p> : null}
    </section>
  );
}

function ScoreRing() {
  return (
    <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-[conic-gradient(#22c55e_0_92%,#e5e7eb_92%_100%)] p-2">
        <div className="grid h-full w-full place-items-center rounded-full bg-white text-center">
          <p className="text-2xl font-semibold leading-none text-slate-950">92</p>
          <p className="text-xs text-slate-500">/100</p>
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-emerald-600">Excellent</p>
        <p className="mt-3 text-sm font-medium text-emerald-600">+ 6 pts vs last month</p>
        <button className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-violet-700">
          Score breakdown <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function RiskDistribution() {
  const rows = [
    { label: "Low Risk", value: "1,104 (81.3%)", color: "bg-emerald-500" },
    { label: "Medium Risk", value: "196 (14.4%)", color: "bg-amber-500" },
    { label: "High Risk", value: "12 (0.9%)", color: "bg-rose-500" },
    { label: "Unknown", value: "44 (3.2%)", color: "bg-slate-300" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">Risk Level Distribution</h2>
        <button className="text-sm font-semibold text-violet-700">View all</button>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-[150px_1fr] lg:grid-cols-1 2xl:grid-cols-[150px_1fr]">
        <div className="mx-auto h-36 w-36 rounded-full bg-[conic-gradient(#22c55e_0_81%,#f59e0b_81%_95%,#e11d48_95%_96%,#cbd5e1_96%_100%)] p-6">
          <div className="h-full w-full rounded-full bg-white" />
        </div>
        <div className="space-y-4">
          {rows.map((row) => (
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
      <div className="mt-6 flex items-center gap-3 rounded-xl bg-emerald-50/80 px-4 py-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-slate-800">Your risk exposure is low</p>
          <p className="text-xs text-slate-500">Continue monitoring to maintain a healthy risk score.</p>
        </div>
      </div>
    </section>
  );
}

function ComplianceAlerts({
  filter,
  onFilterChange,
}: {
  filter: "All Alerts" | AlertSeverity;
  onFilterChange: (filter: "All Alerts" | AlertSeverity) => void;
}) {
  const visibleAlerts = filter === "All Alerts" ? alerts : alerts.filter((alert) => alert.severity === filter);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Compliance Alerts</h2>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <select
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as "All Alerts" | AlertSeverity)}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            aria-label="Filter alerts"
          >
            <option>All Alerts</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {visibleAlerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.title}
              className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_120px_230px_96px] lg:items-center lg:gap-6"
            >
              <div className="flex min-w-0 items-start gap-4">
                <span className={cn("mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl", severityClasses(alert.severity))}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{alert.title}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{alert.detail}</p>
                </div>
              </div>
              <div className="flex items-center lg:justify-start">
                <span className={cn("w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1", severityClasses(alert.severity))}>
                  {alert.severity}
                </span>
              </div>
              <span className="whitespace-nowrap text-sm text-slate-500 lg:text-left">{alert.time}</span>
              <div className="flex justify-start lg:justify-end">
                <Button variant="outline" size="sm" className="h-9 min-w-[72px] rounded-xl">
                  View
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-100 px-5 py-4">
        <button className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700">
          View all alerts <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function ComplianceChecks() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Compliance Checks</h2>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
            All Status <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <button className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <span className="truncate">May 9 - May 16, 2024</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
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
            {checks.map((check) => {
              const Icon = check.icon;
              return (
                <tr key={check.type} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{check.type}</p>
                        <p className="text-xs text-slate-500">{check.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        check.status === "Passed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {check.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium tabular-nums text-slate-700">{check.total}</td>
                  <td className="px-5 py-4 tabular-nums text-emerald-600">{check.passed}</td>
                  <td className="px-5 py-4 tabular-nums text-rose-600">{check.failed}</td>
                  <td className="px-5 py-4 tabular-nums text-amber-600">{check.action}</td>
                  <td className="px-5 py-4 text-slate-500">{check.lastRun}</td>
                  <td className="px-5 py-4">
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-100 px-5 py-4">
        <button className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700">
          View all compliance checks <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function ActivityFeed() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">Recent Compliance Activity</h2>
        <button className="text-sm font-semibold text-violet-700">View all</button>
      </div>
      <div className="mt-5 space-y-5">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={`${activity.title}-${activity.time}`} className="flex gap-3">
              <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", activityClasses(activity.status))}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", activityClasses(activity.status))}>
                    {activity.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{activity.detail}</p>
                <p className="mt-1 text-xs text-slate-400">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SecondaryTabView({ activeTab }: { activeTab: ComplianceTab }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm shadow-slate-200/40">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-violet-50 text-violet-700">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{activeTab}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{tabSummaries[activeTab]}</p>
        <div className="mt-6 grid w-full gap-3 sm:grid-cols-3">
          {["Queue", "Policies", "Reports"].map((item) => (
            <button
              key={item}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComplianceAgent2Inner() {
  const { demoPath } = useDemoMode();
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ComplianceTab>("Overview");
  const [alertFilter, setAlertFilter] = useState<"All Alerts" | AlertSeverity>("All Alerts");
  const isDemoRoute = pathname?.startsWith("/demo/") ?? false;

  useEffect(() => {
    if (!isDemoRoute) {
      router.replace("/dashboard/compliance-agent");
    }
  }, [isDemoRoute, router]);

  useWorkspacePageMeta({
    breadcrumbs: [
      { label: "Workspaces", href: demoPath("/dashboard") },
      { label: "Overview", href: demoPath("/dashboard/overview") },
      { label: "Compliance", current: true },
    ],
  });

  if (!isDemoRoute) return null;

  return (
    <main className="min-h-screen min-w-0 overflow-x-hidden bg-slate-50/60 text-slate-950">
      <div className="mx-auto flex w-full min-w-0 max-w-[1680px] flex-col gap-6">
        <div className="flex min-w-0 flex-col gap-4 min-[1700px]:flex-row min-[1700px]:items-start min-[1700px]:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Compliance</h1>
            <p className="mt-3 text-sm text-slate-500">
              Monitor compliance, manage risk, and stay audit-ready.
            </p>
          </div>
          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:w-auto sm:grid-cols-3 min-[1700px]:flex min-[1700px]:flex-wrap">
            <Button variant="outline" className="h-11 min-w-0 rounded-xl bg-white">
              <Code2 className="mr-2 h-4 w-4" />
              API Keys
            </Button>
            <Button variant="outline" className="h-11 min-w-0 rounded-xl bg-white">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button
              className="h-11 min-w-0 rounded-xl bg-violet-700 px-5 text-white shadow-lg shadow-violet-200 hover:bg-violet-800"
              onClick={() => router.push(demoPath("/dashboard/compliance-agent"))}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Verification
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
                <MetricCard title="Overall Compliance Score" value="92" detail="Excellent">
                  <ScoreRing />
                </MetricCard>
                <MetricCard title="Verification Completion" value="1,248" detail="92% completed" trend="+ 8% vs last month">
                  <div className="mt-7">
                    <p className="text-3xl font-semibold tracking-tight text-slate-950">
                      1,248 <span className="text-lg font-medium text-slate-400">/ 1,356</span>
                    </p>
                    <p className="mt-2 text-sm text-slate-500">92% completed</p>
                    <Progress value={92} className="mt-5 h-2 bg-violet-100 [&>div]:bg-violet-700" />
                    <p className="mt-4 text-sm font-medium text-emerald-600">+ 8% vs last month</p>
                  </div>
                </MetricCard>
                <MetricCard title="High Risk Customers" value="12" detail="0.9% of total customers" trend="- 2 vs last month" />
                <MetricCard title="Pending Reviews" value="28" detail="Requires attention" trend="+ 5 vs last month" tone="amber" />
              </div>

              <ComplianceAlerts filter={alertFilter} onFilterChange={setAlertFilter} />
              <ComplianceChecks />
            </div>

            <aside className="flex min-w-0 flex-col gap-6">
              <RiskDistribution />
              <ActivityFeed />
              <section className="rounded-2xl border border-violet-100 bg-violet-50 p-6">
                <div className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-violet-700">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950">Need help with compliance?</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Learn about compliance best practices and Hypertron security standards.
                    </p>
                    <Link
                      href={demoPath("/dashboard/document-vault")}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-700"
                    >
                      View Compliance Docs <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        ) : (
          <SecondaryTabView activeTab={activeTab} />
        )}

        <div className="fixed bottom-5 right-5 z-10 hidden rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-lg shadow-slate-200/60 backdrop-blur md:flex">
          <button className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
            <Search className="h-5 w-5" />
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
            <KeyRound className="h-5 w-5" />
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ComplianceAgent2Page() {
  return (
    <Suspense fallback={null}>
      <ComplianceAgent2Inner />
    </Suspense>
  );
}
