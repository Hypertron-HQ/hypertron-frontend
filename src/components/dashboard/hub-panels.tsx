"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  updateBusinessProfile,
  type BusinessProfile,
} from "@/lib/business";
import { getAuditEvents, getBillingPlan } from "@/mockdata";

export function HubAudit() {
  const events = getAuditEvents();

  return (
    <PanelShell
      eyebrow="Security"
      title="Audit"
      subtitle="Immutable event history for workspace activity and account changes."
    >
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {events.map((event) => (
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
  const billing = getBillingPlan();

  return (
    <PanelShell
      eyebrow="Account"
      title="Billing & Plans"
      subtitle="Manage your plan, invoices, and usage."
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
        <p className="text-sm font-semibold text-slate-900">{billing.planName}</p>
        <p className="mt-1 text-sm text-slate-500">{billing.planDescription}</p>
      </div>
    </PanelShell>
  );
}

const fieldCls =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function HubSettingsPanel({
  profile,
  walletShort,
  onSignOut,
  onProfileUpdated,
}: {
  profile: BusinessProfile;
  walletShort: string;
  onSignOut: () => void;
  onProfileUpdated: (profile: BusinessProfile) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email ?? "");
  const [businessNature, setBusinessNature] = useState(
    profile.businessNature ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email ?? "");
    setBusinessNature(profile.businessNature ?? "");
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Business name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await updateBusinessProfile({
      name: trimmed,
      email: email.trim() || undefined,
      businessNature: businessNature.trim() || undefined,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    onProfileUpdated(result.profile);
    setName(result.profile.name);
    setEmail(result.profile.email ?? "");
    setBusinessNature(result.profile.businessNature ?? "");
    setSaved(true);
  }

  return (
    <PanelShell
      eyebrow="Account"
      title="Settings"
      subtitle="Profile and session preferences for this workspace hub."
    >
      <div className="max-w-lg space-y-4">
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm"
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Business profile
          </p>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Business name
            <input
              className={fieldCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Business type
            <input
              className={fieldCls}
              value={businessNature}
              onChange={(e) => setBusinessNature(e.target.value)}
              placeholder="Agency, SaaS, marketplace…"
            />
          </label>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              className={fieldCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </label>

          {error ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="mt-3 text-sm text-emerald-600">Profile saved.</p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Connected wallet
          </p>
          <p className="mt-2 font-mono text-sm text-slate-800">{walletShort}</p>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-5 inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sign out
          </button>
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
