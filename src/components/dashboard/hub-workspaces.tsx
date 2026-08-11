"use client";

import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ClipboardList,
  Clock3,
  Loader,
  MoreHorizontal,
  Plus,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";

const FEATURED_SURFACE =
  "overflow-hidden rounded-[22px] bg-[radial-gradient(ellipse_90%_80%_at_15%_0%,rgba(59,130,246,0.28),transparent_55%),linear-gradient(165deg,#121a28_0%,#0B0F14_42%,#0B0F14_100%)] text-white shadow-[0_20px_50px_rgba(0,0,0,0.22)]";

const FEATURED_WORKSPACE_ID = "design-test";

const pulse = [
  { value: "$8,240", label: "collected" },
  { value: "24", label: "payments" },
  { value: "2", label: "processing" },
  { value: "1", label: "needs attention", warn: true },
] as const;

const otherWorkspaces = [
  {
    id: "main-1",
    name: "Main Workspace",
    initial: "M",
    members: 8,
    openTasks: "1",
    pendingApprovals: "—",
    complianceAlerts: "All Clear",
  },
  {
    id: "main-2",
    name: "Main Workspace",
    initial: "M",
    members: 8,
    openTasks: "1",
    pendingApprovals: "—",
    complianceAlerts: "All Clear",
  },
] as const;

export function HubWorkspaces() {
  const router = useRouter();

  function openWorkspace(id: string) {
    router.push(`/dashboard/w/${id}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            Workspace directory
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
            Your Workspaces
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a workspace or continue where you left off.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] transition hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          New Workspace
        </button>
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          Last opened
        </p>

        <article className={`${FEATURED_SURFACE} flex min-h-[360px] flex-col`}>
          <div className="flex items-start justify-between gap-3 px-6 pt-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#1A222D] text-base font-semibold text-white">
                D
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold tracking-tight">
                  DesignTest Co.
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Tier 1 · 6 members
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Workspace menu"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>

          <div className="px-6 pt-6">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              Workspace pulse
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {pulse.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-black/35 px-3.5 py-4 ring-1 ring-white/5"
                >
                  <p className="text-xl font-semibold tracking-tight text-white">
                    {item.value}
                  </p>
                  <p
                    className={[
                      "mt-1 text-xs",
                      "warn" in item && item.warn
                        ? "text-amber-300"
                        : "text-slate-400",
                    ].join(" ")}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 px-6 text-xs text-slate-400">
            <span className="mr-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Latest
            </span>
            <span className="font-medium text-emerald-400">+$1,280 received</span>
            <span className="h-px w-8 bg-slate-700 sm:w-12" />
            <span>settling</span>
            <span className="h-px w-8 bg-slate-700 sm:w-12" />
            <span>available soon</span>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-black/20 px-6 py-5">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5" />
                Last accessed 1 day ago
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="size-3.5" />
                Role Owner
              </span>
            </div>
            <button
              type="button"
              onClick={() => openWorkspace(FEATURED_WORKSPACE_ID)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Open Workspace
              <ArrowRight className="size-4" />
            </button>
          </div>
        </article>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Other Workspaces
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">2 workspaces</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            Last accessed
            <ChevronDown className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {otherWorkspaces.map((ws) => (
            <article
              key={ws.id}
              className="flex min-h-[300px] flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
            >
              <div className="flex min-h-[140px] items-center bg-[radial-gradient(ellipse_90%_80%_at_20%_0%,rgba(59,130,246,0.35),transparent_55%),linear-gradient(165deg,#1a2740_0%,#0B0F14_55%,#0B0F14_100%)] px-5 py-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#152033] text-base font-semibold text-white ring-1 ring-white/10">
                    {ws.initial}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold tracking-tight text-white">
                      {ws.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-400">
                      {ws.members} members
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 px-4 py-5">
                <div className="pr-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <ClipboardList className="size-3.5 shrink-0" strokeWidth={1.75} />
                    <p className="text-[11px] leading-tight">Open Tasks</p>
                  </div>
                  <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-slate-950">
                    {ws.openTasks}
                  </p>
                </div>
                <div className="px-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Loader className="size-3.5 shrink-0" strokeWidth={1.75} />
                    <p className="text-[11px] leading-tight">Pending Approvals</p>
                  </div>
                  <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-slate-950">
                    {ws.pendingApprovals}
                  </p>
                </div>
                <div className="pl-3">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <AlertTriangle className="size-3.5 shrink-0" strokeWidth={1.75} />
                    <p className="text-[11px] leading-tight">Compliance Alerts</p>
                  </div>
                  <p className="mt-2 text-base font-semibold tracking-tight text-slate-950">
                    {ws.complianceAlerts}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex flex-wrap items-center gap-5 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <Clock3 className="size-3.5" />
                    Last accessed
                    <span className="font-semibold text-slate-900">1 day ago</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <Shield className="size-3.5" />
                    Role
                    <span className="font-semibold text-slate-900">Owner</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openWorkspace(ws.id)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] transition hover:text-[#1d4ed8]"
                >
                  Open
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
