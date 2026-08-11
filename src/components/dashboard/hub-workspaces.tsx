"use client";

import { ArrowRight, Clock3, Plus, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import type { BusinessProfile } from "@/lib/business";
import { businessToWorkspace } from "@/lib/business";
import type { Workspace } from "@/mockdata";

const FEATURED_SURFACE =
  "overflow-hidden rounded-[22px] bg-[radial-gradient(ellipse_90%_80%_at_15%_0%,rgba(59,130,246,0.28),transparent_55%),linear-gradient(165deg,#121a28_0%,#0B0F14_42%,#0B0F14_100%)] text-white shadow-[0_20px_50px_rgba(0,0,0,0.22)]";

export function HubWorkspaces({
  profile,
  walletAddress,
}: {
  profile: BusinessProfile;
  walletAddress: string;
}) {
  const router = useRouter();
  const workspace = businessToWorkspace(profile, walletAddress);

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
            Continue into your Freighter-linked business workspace.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Multi-workspace coming later"
          className="inline-flex h-10 cursor-not-allowed items-center gap-1.5 rounded-xl bg-slate-200 px-4 text-sm font-semibold text-slate-500"
        >
          <Plus className="size-4" strokeWidth={2.25} />
          New Workspace
        </button>
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          Your workspace
        </p>
        <FeaturedWorkspaceCard
          workspace={workspace}
          onOpen={() => openWorkspace(workspace.id)}
        />
      </div>
    </div>
  );
}

function FeaturedWorkspaceCard({
  workspace,
  onOpen,
}: {
  workspace: Workspace;
  onOpen: () => void;
}) {
  return (
    <article className={`${FEATURED_SURFACE} flex min-h-[360px] flex-col`}>
      <div className="flex items-start justify-between gap-3 px-6 pt-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#1A222D] text-base font-semibold text-white">
            {workspace.initial}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-tight">
              {workspace.name}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {workspace.tier} · {workspace.members} members
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pt-6">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
          Workspace pulse
        </p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {workspace.pulse.map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-black/35 px-3.5 py-4 ring-1 ring-white/5"
            >
              <p className="text-xl font-semibold tracking-tight text-white">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-slate-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 px-6 text-xs text-slate-400">
        <span className="mr-1 text-[11px] font-semibold tracking-[0.12em] text-slate-500 uppercase">
          Latest
        </span>
        <span className="font-medium text-emerald-400">
          {workspace.latest.highlight}
        </span>
        {workspace.latest.steps.map((step) => (
          <span key={step} className="contents">
            <span className="h-px w-8 bg-slate-700 sm:w-12" />
            <span>{step}</span>
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/5 bg-black/20 px-6 py-5">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            Last accessed {workspace.lastAccessed}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Shield className="size-3.5" />
            Role {workspace.role}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Open Workspace
          <ArrowRight className="size-4" />
        </button>
      </div>
    </article>
  );
}
