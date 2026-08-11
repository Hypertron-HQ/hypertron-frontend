import type { ReactNode } from "react";

const MOCK_AUDIT_EVENTS = [
  {
    id: "evt_01",
    action: "Workspace created",
    actor: "Soumik Baksi",
    detail: "Acme Settlements",
    at: "2 hours ago",
  },
  {
    id: "evt_02",
    action: "Wallet connected",
    actor: "Soumik Baksi",
    detail: "Freighter · mock session",
    at: "Yesterday",
  },
  {
    id: "evt_03",
    action: "Plan viewed",
    actor: "Soumik Baksi",
    detail: "Public beta",
    at: "3 days ago",
  },
] as const;

export function HubAudit() {
  return (
    <PanelShell
      eyebrow="Security"
      title="Audit"
      subtitle="Immutable event history for workspace activity and account changes."
    >
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {MOCK_AUDIT_EVENTS.map((event) => (
          <li
            key={event.id}
            className="flex items-start justify-between gap-4 px-5 py-4"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {event.action}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                {event.actor} · {event.detail}
              </p>
            </div>
            <time className="shrink-0 text-xs text-slate-400">{event.at}</time>
          </li>
        ))}
      </ul>
    </PanelShell>
  );
}

export function HubBilling() {
  return (
    <PanelShell
      eyebrow="Account"
      title="Billing & Plans"
      subtitle="Manage your plan, invoices, and usage."
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
        <p className="text-sm font-semibold text-slate-900">Public beta</p>
        <p className="mt-1 text-sm text-slate-500">
          You&apos;re on the demo plan. Billing integration comes later.
        </p>
      </div>
    </PanelShell>
  );
}

export function HubSettingsPanel({
  walletShort,
  onSignOut,
}: {
  walletShort: string;
  onSignOut: () => void;
}) {
  return (
    <PanelShell
      eyebrow="Account"
      title="Settings"
      subtitle="Profile and session preferences for this mock workspace hub."
    >
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
          Connected wallet
        </p>
        <p className="mt-2 font-mono text-sm text-slate-800">{walletShort}</p>
        <p className="mt-1 text-xs text-slate-500">Freighter · mock session</p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-5 inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Sign out
        </button>
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
