import type { ReactNode } from "react";
import type { MockWorkspace } from "@/lib/mock-workspaces";

const overviewStats = [
  { value: "$8,240", label: "Collected" },
  { value: "24", label: "Payments" },
  { value: "2", label: "Processing" },
  { value: "1", label: "Needs attention" },
] as const;

export function WorkspaceOverview({ workspace }: { workspace: MockWorkspace }) {
  return (
    <PanelShell
      eyebrow="Workspace"
      title="Overview"
      subtitle={`Pulse for ${workspace.name} — collections, settlements, and alerts.`}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {overviewStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-2xl font-semibold tracking-tight text-slate-950">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          Latest activity
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className="font-medium text-emerald-600">+$1,280 received</span>
          <span className="h-px w-8 bg-slate-200 sm:w-12" />
          <span>settling</span>
          <span className="h-px w-8 bg-slate-200 sm:w-12" />
          <span>available soon</span>
        </div>
      </div>
    </PanelShell>
  );
}

export { WorkspacePayments } from "@/components/dashboard/workspace-payments";

export function WorkspaceDevelopers() {
  return (
    <PanelShell
      eyebrow="Integrations"
      title="Developer Access"
      subtitle="API keys, webhooks, and integration credentials for this workspace."
    >
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Publishable key
          </p>
          <p className="mt-2 font-mono text-sm text-slate-800">
            pk_test_••••••••••••4f2a
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
          <p className="text-sm font-semibold text-slate-900">Webhooks</p>
          <p className="mt-1 text-sm text-slate-500">
            No endpoints configured yet. Mock data only.
          </p>
        </div>
      </div>
    </PanelShell>
  );
}

export function WorkspaceTreasury() {
  return (
    <PanelShell
      eyebrow="Balances"
      title="Treasury"
      subtitle="Vault balances and withdrawal readiness for this workspace."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            USDC
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            $6,420.00
          </p>
          <p className="mt-1 text-xs text-slate-500">Available</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            XLM
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            1,820.40
          </p>
          <p className="mt-1 text-xs text-slate-500">Available</p>
        </div>
      </div>
    </PanelShell>
  );
}

export function WorkspaceSettingsPanel({
  workspace,
}: {
  workspace: MockWorkspace;
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
