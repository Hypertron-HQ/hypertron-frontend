import { apiFetch } from "@/lib/api";
import type { Workspace } from "@/mockdata";

export type WorkspaceRecord = {
  id: string;
  name: string;
  workspaceType: string;
  website: string | null;
  teamSize: string | null;
  logoUrl: string | null;
  logoName: string | null;
  tier: string;
  selectedTier: string | null;
  role: "Owner" | "Admin" | "Member";
  members: number;
  receiveAddress: string | null;
  lastAccessedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceCreateInput = {
  name: string;
  workspaceType: string;
  website?: string;
  teamSize?: string;
  logoDataUrl?: string;
  logoName?: string;
  invitedMembers?: Array<{
    email: string;
    nickname: string;
    role: string;
    permission: string;
  }>;
};

type WorkspaceListResponse = {
  activeWorkspaceId: string | null;
  workspaces: WorkspaceRecord[];
};

type WorkspaceResponse = {
  activeWorkspaceId?: string | null;
  workspace: WorkspaceRecord;
};

type ErrorBody = { error?: string };

async function readJson<T>(res: Response): Promise<T & ErrorBody> {
  return (await res.json().catch(() => ({}))) as T & ErrorBody;
}

export async function listWorkspaces(): Promise<
  | { ok: true; activeWorkspaceId: string | null; workspaces: WorkspaceRecord[] }
  | { ok: false; error: string }
> {
  try {
    const res = await apiFetch("/api/workspaces", { method: "GET" });
    const json = await readJson<WorkspaceListResponse>(res);
    if (!res.ok || !Array.isArray(json.workspaces)) {
      return {
        ok: false,
        error: json.error ?? "Could not load workspaces.",
      };
    }
    return {
      ok: true,
      activeWorkspaceId: json.activeWorkspaceId ?? null,
      workspaces: json.workspaces,
    };
  } catch {
    return { ok: false, error: "Could not reach the workspace API." };
  }
}

export async function getWorkspace(
  workspaceId: string,
): Promise<
  { ok: true; workspace: WorkspaceRecord } | { ok: false; error: string }
> {
  try {
    const res = await apiFetch(
      `/api/workspaces/${encodeURIComponent(workspaceId)}`,
      { method: "GET" },
    );
    const json = await readJson<WorkspaceResponse>(res);
    if (!res.ok || !json.workspace?.id) {
      return { ok: false, error: json.error ?? "Workspace not found." };
    }
    return { ok: true, workspace: json.workspace };
  } catch {
    return { ok: false, error: "Could not reach the workspace API." };
  }
}

export async function createWorkspace(
  input: WorkspaceCreateInput,
): Promise<
  { ok: true; workspace: WorkspaceRecord } | { ok: false; error: string }
> {
  try {
    const res = await apiFetch("/api/workspaces", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const json = await readJson<WorkspaceResponse>(res);
    if (!res.ok || !json.workspace?.id) {
      return {
        ok: false,
        error: json.error ?? "Could not create workspace.",
      };
    }
    return { ok: true, workspace: json.workspace };
  } catch {
    return { ok: false, error: "Could not reach the workspace API." };
  }
}

export async function activateWorkspace(
  workspaceId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await apiFetch(
      `/api/workspaces/${encodeURIComponent(workspaceId)}/activate`,
      { method: "POST" },
    );
    const json = await readJson<{ ok?: boolean }>(res);
    if (!res.ok || json.ok !== true) {
      return {
        ok: false,
        error: json.error ?? "Could not activate workspace.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the workspace API." };
  }
}

export function workspaceRecordToView(
  record: WorkspaceRecord,
  walletAddress: string,
): Workspace {
  return {
    id: record.id,
    name: record.name,
    initial: record.name.trim().slice(0, 1).toUpperCase() || "W",
    logoUrl: record.logoUrl,
    members: record.members,
    tier: record.tier,
    role: record.role,
    lastAccessed: formatLastAccessed(record.lastAccessedAt),
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

function formatLastAccessed(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function shorten(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

