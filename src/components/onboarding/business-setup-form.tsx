"use client";

import { useState } from "react";
import {
  linkReceiveAddress,
  updateBusinessProfile,
  type BusinessProfile,
} from "@/lib/business";

const fieldCls =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function BusinessSetupForm({
  walletAddress,
  onComplete,
}: {
  walletAddress: string;
  onComplete: (profile: BusinessProfile) => void;
}) {
  const [name, setName] = useState("");
  const [businessNature, setBusinessNature] = useState("");
  const [email, setEmail] = useState("");
  const [receiveAddress, setReceiveAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Business name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const updated = await updateBusinessProfile({
      name: trimmedName,
      businessNature: businessNature.trim() || undefined,
      email: email.trim() || undefined,
    });

    if (!updated.ok) {
      setError(updated.error);
      setSaving(false);
      return;
    }

    let profile = updated.profile;
    const addr = receiveAddress.trim();
    if (addr) {
      const linked = await linkReceiveAddress(addr);
      if (!linked.ok) {
        setError(linked.error);
        setSaving(false);
        return;
      }
      const refreshed = await getRefreshedProfile(profile, linked.receiveAddress);
      profile = refreshed;
    }

    setSaving(false);
    onComplete(profile);
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center bg-[#F8FAFC] px-6 py-12">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
        Set up workspace
      </p>
      <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
        Tell us about your business
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Connected as{" "}
        <span className="font-mono text-slate-700">{walletAddress}</span>
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Business name
          <input
            className={fieldCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Payments"
            required
            autoFocus
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Business type
          <input
            className={fieldCls}
            value={businessNature}
            onChange={(e) => setBusinessNature(e.target.value)}
            placeholder="Agency, SaaS, marketplace…"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Email <span className="font-normal text-slate-400">(optional)</span>
          <input
            type="email"
            className={fieldCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Receive address{" "}
          <span className="font-normal text-slate-400">(optional G…)</span>
          <input
            className={fieldCls}
            value={receiveAddress}
            onChange={(e) => setReceiveAddress(e.target.value)}
            placeholder="G…"
            spellCheck={false}
          />
        </label>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#2563EB] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] transition hover:bg-[#1d4ed8] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Continue to dashboard"}
        </button>
      </form>
    </div>
  );
}

async function getRefreshedProfile(
  fallback: BusinessProfile,
  receiveAddress: string | null,
): Promise<BusinessProfile> {
  const { getBusinessProfile } = await import("@/lib/business");
  const refreshed = await getBusinessProfile();
  if (refreshed.ok) return refreshed.profile;
  return { ...fallback, receiveAddress };
}
