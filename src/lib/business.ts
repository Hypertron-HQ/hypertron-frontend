import { apiFetch } from "@/lib/api";
import type { Workspace } from "@/mockdata";

export type BusinessProfile = {
  businessId: string;
  name: string;
  email: string;
  businessNature: string;
  selectedWidgets: string[];
  selectedTier: string | null;
  selectedTierName: string | null;
  selectedTierAt: string | null;
  receiveAddress: string | null;
  complianceForm: unknown;
};

type ErrorBody = { error?: string };

async function readJson<T>(res: Response): Promise<T & ErrorBody> {
  return (await res.json().catch(() => ({}))) as T & ErrorBody;
}

export function isBusinessProfileComplete(profile: BusinessProfile): boolean {
  return Boolean(profile.name?.trim());
}

export async function getBusinessProfile(): Promise<
  { ok: true; profile: BusinessProfile } | { ok: false; error: string }
> {
  try {
    const res = await apiFetch("/api/business/profile", { method: "GET" });
    const json = await readJson<BusinessProfile>(res);
    if (!res.ok || !json.businessId) {
      return {
        ok: false,
        error: json.error ?? "Could not load business profile.",
      };
    }
    return { ok: true, profile: json };
  } catch {
    return { ok: false, error: "Could not reach the API." };
  }
}

export async function updateBusinessProfile(input: {
  name?: string;
  email?: string;
  businessNature?: string;
}): Promise<
  { ok: true; profile: BusinessProfile } | { ok: false; error: string }
> {
  try {
    const res = await apiFetch("/api/business/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    const json = await readJson<BusinessProfile>(res);
    if (!res.ok || !json.businessId) {
      return { ok: false, error: json.error ?? "Could not update profile." };
    }
    return { ok: true, profile: json };
  } catch {
    return { ok: false, error: "Could not reach the API." };
  }
}

export async function linkReceiveAddress(
  receiveAddress: string,
): Promise<
  { ok: true; receiveAddress: string | null } | { ok: false; error: string }
> {
  try {
    const res = await apiFetch("/api/business/link", {
      method: "POST",
      body: JSON.stringify({ receiveAddress }),
    });
    const json = await readJson<{ receiveAddress?: string | null }>(res);
    if (!res.ok) {
      return {
        ok: false,
        error: json.error ?? "Could not save receive address.",
      };
    }
    return { ok: true, receiveAddress: json.receiveAddress ?? null };
  } catch {
    return { ok: false, error: "Could not reach the API." };
  }
}

/** Map core Business → dashboard Workspace shape (pulse placeholders for now). */
export function businessToWorkspace(
  profile: BusinessProfile,
  walletAddress: string,
): Workspace {
  const name = profile.name.trim() || "Workspace";
  const initial = name.slice(0, 1).toUpperCase();
  return {
    id: profile.businessId,
    name,
    initial,
    members: 1,
    tier: profile.selectedTierName?.trim() || "Starter",
    role: "Owner",
    lastAccessed: "Just now",
    pulse: [
      { value: "—", label: "Collected", warn: false },
      { value: "—", label: "Pending", warn: false },
      { value: "—", label: "Settled", warn: false },
      { value: shorten(walletAddress), label: "Wallet", warn: false },
    ],
    latest: {
      highlight: "Ready",
      steps: ["Connect wallet", "Create payment link", "Share checkout"],
    },
    directory: {
      openTasks: "0",
      pendingApprovals: "0",
      complianceAlerts: "None",
    },
  };
}

function shorten(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
