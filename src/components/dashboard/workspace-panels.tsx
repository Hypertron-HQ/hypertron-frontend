import type { ReactNode } from "react";
import { getWorkspaceTreasury, type Workspace } from "@/mockdata";

export { WorkspaceDevelopers } from "@/components/dashboard/workspace-developers";

function titleCase(label: string) {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function WorkspaceOverview({ workspace }: { workspace: Workspace }) {
  return (
    <PanelShell
      eyebrow="Workspace"
      title="Overview"
      subtitle={`Pulse for ${workspace.name} — collections, settlements, and alerts.`}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {workspace.pulse.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-2xl font-semibold tracking-tight text-slate-950">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {titleCase(stat.label)}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          Latest activity
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className="font-medium text-emerald-600">
            {workspace.latest.highlight}
          </span>
          {workspace.latest.steps.map((step) => (
            <span key={step} className="contents">
              <span className="h-px w-8 bg-slate-200 sm:w-12" />
              <span>{step}</span>
            </span>
          ))}
        </div>
      </div>
    </PanelShell>
  );
}

export { WorkspacePayments } from "@/components/dashboard/workspace-payments";

export function WorkspaceTreasury({ workspace }: { workspace: Workspace }) {
  const treasury = getWorkspaceTreasury(workspace.id);

  return (
    <PanelShell
      eyebrow="Balances"
      title="Treasury"
      subtitle="Vault balances and withdrawal readiness for this workspace."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {treasury.balances.map((balance) => (
          <div
            key={balance.asset}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm"
          >
            <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
              {balance.asset}
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {balance.amount}
            </p>
            <p className="mt-1 text-xs text-slate-500">{balance.status}</p>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

export function WorkspaceSettingsPanel({
  workspace,
}: {
  workspace: Workspace;
}) {
  return (
    <PanelShell
      eyebrow="Workspace"
      title="Settings"
      subtitle="Name, members, and preferences for this workspace."
    >
      <div className="max-w-lg space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Workspace name
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {workspace.name}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {workspace.tier} · {workspace.members} members · Role{" "}
            {workspace.role}
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

function PanelShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
