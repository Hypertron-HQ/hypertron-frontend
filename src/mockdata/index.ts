/**
 * Mock data accessors.
 *
 * Swap these function bodies for real API calls when the backend is ready.
 * JSON fixtures in this folder are the temporary source of truth.
 */

import auditEventsJson from "./audit-events.json";
import billingJson from "./billing.json";
import profileJson from "./profile.json";
import workspacesJson from "./workspaces.json";
import workspaceDevelopersJson from "./workspace-developers.json";
import workspaceTreasuryJson from "./workspace-treasury.json";

export type WorkspaceRole = "Owner" | "Admin" | "Member";

export type WorkspacePulseStat = {
  value: string;
  label: string;
  warn: boolean;
};

export type WorkspaceLatest = {
  highlight: string;
  steps: string[];
};

export type WorkspaceDirectoryStats = {
  openTasks: string;
  pendingApprovals: string;
  complianceAlerts: string;
};

export type Workspace = {
  id: string;
  name: string;
  initial: string;
  logoUrl?: string | null;
  members: number;
  tier: string;
  role: WorkspaceRole;
  lastAccessed: string;
  pulse: WorkspacePulseStat[];
  latest: WorkspaceLatest;
  directory: WorkspaceDirectoryStats;
};

export type AuditEvent = {
  id: string;
  action: string;
  actor: string;
  detail: string;
  at: string;
};

export type Profile = {
  displayName: string;
};

export type BillingPlan = {
  planName: string;
  planDescription: string;
};

export type TreasuryBalance = {
  asset: string;
  amount: string;
  status: string;
};

export type WorkspaceTreasury = {
  balances: TreasuryBalance[];
};

export type WorkspaceDevelopers = {
  publishableKeyMasked: string;
  webhooksEmptyMessage: string;
};

type WorkspaceLookup<T> = {
  byWorkspaceId: Record<string, T>;
  default: T;
};

function resolveByWorkspaceId<T>(
  lookup: WorkspaceLookup<T>,
  workspaceId: string,
): T {
  return lookup.byWorkspaceId[workspaceId] ?? lookup.default;
}

/** Replace with: GET /api/workspaces */
export function getWorkspaces(): Workspace[] {
  return workspacesJson.items as Workspace[];
}

/** Replace with: GET /api/workspaces/:id */
export function getWorkspace(id: string): Workspace | undefined {
  return getWorkspaces().find((workspace) => workspace.id === id);
}

/** Replace with: featured id from list/me response */
export function getFeaturedWorkspace(): Workspace | undefined {
  return getWorkspace(workspacesJson.featuredId);
}

/** Replace with: list endpoint filtering / pagination */
export function getOtherWorkspaces(): Workspace[] {
  const featuredId = workspacesJson.featuredId;
  return getWorkspaces().filter((workspace) => workspace.id !== featuredId);
}

/** Replace with: GET /api/audit-events */
export function getAuditEvents(): AuditEvent[] {
  return auditEventsJson as AuditEvent[];
}

/** Replace with: GET /api/me or /api/profile */
export function getProfile(): Profile {
  return profileJson;
}

/** Replace with: GET /api/billing */
export function getBillingPlan(): BillingPlan {
  return billingJson;
}

/** Replace with: GET /api/workspaces/:id/treasury */
export function getWorkspaceTreasury(workspaceId: string): WorkspaceTreasury {
  return resolveByWorkspaceId(
    workspaceTreasuryJson as WorkspaceLookup<WorkspaceTreasury>,
    workspaceId,
  );
}

/** Replace with: GET /api/workspaces/:id/developers */
export function getWorkspaceDevelopers(
  workspaceId: string,
): WorkspaceDevelopers {
  return resolveByWorkspaceId(
    workspaceDevelopersJson as WorkspaceLookup<WorkspaceDevelopers>,
    workspaceId,
  );
}
