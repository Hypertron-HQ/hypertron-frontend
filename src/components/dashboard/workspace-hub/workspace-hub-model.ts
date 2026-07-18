import type { SavedTemplate } from "@/lib/my-templates-storage";

const WORKSPACE_DRAFT_KEY = "hypertron:create-workspace:draft";

/** Logo uploaded during workspace setup (session draft), until persisted on Business. */
export function readCreateWorkspaceDraftLogo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WORKSPACE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { logoDataUrl?: string };
    const url = parsed.logoDataUrl?.trim();
    return url || null;
  } catch {
    return null;
  }
}

export type WorkspaceCardModel = {
  id: string;
  name: string;
  type: string;
  members: number;
  role: "Owner" | "Admin" | "Member";
  openTasks: number;
  pendingApprovals: number;
  complianceAlerts: number;
  lastAccessed: string;
  accent: "violet" | "sky" | "amber";
  template: SavedTemplate;
  logoUrl?: string | null;
};

function hashStat(id: string, mod: number, min: number) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (n % mod) + min;
}

export function templatesToWorkspaces(
  templates: SavedTemplate[],
  options?: { logoUrl?: string | null }
): WorkspaceCardModel[] {
  const accents: WorkspaceCardModel["accent"][] = ["violet", "sky", "amber"];
  const roles: WorkspaceCardModel["role"][] = ["Owner", "Admin", "Member"];
  const sharedLogo = options?.logoUrl?.trim() || null;

  return templates.map((t, i) => ({
    id: t.id,
    name: (t.businessName || t.name || "Untitled workspace").trim(),
    type: t.bundleName || "Web3 Startup",
    members: hashStat(t.id, 8, 2),
    role: roles[i % roles.length] ?? "Owner",
    openTasks: hashStat(t.id, 12, 1),
    pendingApprovals: hashStat(t.id, 6, 0),
    complianceAlerts: hashStat(t.id, 4, 0),
    lastAccessed: t.savedAt,
    accent: accents[i % accents.length]!,
    template: t,
    logoUrl: sharedLogo,
  }));
}
