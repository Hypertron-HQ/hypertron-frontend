import {
  LayoutDashboard,
  LayoutGrid,
  Settings,
  Zap,
  Users,
  Bot,
  FolderArchive,
  ShieldCheck,
  FileText,
  CreditCard,
  Newspaper,
  Briefcase,
  Wallet,
  Scale,
  AlertTriangle,
  ArrowLeftRight,
  Code2,
} from "lucide-react";
import type { NavGroup, NavLink, SidebarData } from "@/components/dashboard/layout/types";
import type { WorkspaceTierId } from "@/lib/workspace-tier-context";

/** Widget id (from settings) -> sidebar link. Used to show only selected widgets in FEATURES. */
export const FEATURES_BY_WIDGET: { widgetId: string; title: string; url: string; icon: typeof Zap }[] = [
  { widgetId: "ai-assistant", title: "Custom AI Assistant", url: "/dashboard/ai-assistant", icon: Bot },
  { widgetId: "employee-mgmt", title: "Employee Management", url: "/dashboard/employee-management", icon: Users },
  { widgetId: "compliance", title: "Compliance Agent", url: "/dashboard/compliance-agent", icon: ShieldCheck },
  { widgetId: "document-vault", title: "Document vault", url: "/dashboard/document-vault", icon: FolderArchive },
];

export const DASHBOARD_GROUP: NavGroup = {
  title: "Dashboard",
  items: [
    { title: "Workspaces", url: "/dashboard", icon: LayoutGrid },
    { title: "Overview", url: "/dashboard/overview", icon: LayoutDashboard },
    { title: "My Templates", url: "/dashboard/documents", icon: FileText },
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ],
};

/** Build FEATURES nav group showing only links for selected widget ids. If none selected, show all. */
export function getFeaturesNavGroup(selectedWidgets: string[]): NavGroup {
  const set = new Set(selectedWidgets);
  const items = FEATURES_BY_WIDGET
    .filter((f) => set.has(f.widgetId))
    .map(({ title, url, icon }) => ({ title, url, icon }));
  return { title: "FEATURES", items };
}

/** Sidebar links for a saved product tier (Compliance Maker onboarding). */
const TIER_NAV: Record<WorkspaceTierId, NavLink[]> = {
  "tier-1": [
    { title: "Payments", url: "/dashboard/payment-links", icon: CreditCard },
    { title: "Employee management", url: "/dashboard/employee-management", icon: Users },
    { title: "Compliance", url: "/dashboard/compliance-agent", icon: ShieldCheck },
  ],
  "tier-2": [
    { title: "Payments & privacy", url: "/dashboard/payment-links", icon: CreditCard },
    { title: "Employee management", url: "/dashboard/employee-management", icon: Users },
    { title: "Compliance Agent", url: "/dashboard/compliance-agent", icon: ShieldCheck },
    { title: "RNS", url: "/dashboard/rns", icon: Newspaper },
  ],
  "tier-3": [
    { title: "Payments & privacy", url: "/dashboard/payment-links", icon: CreditCard },
    { title: "Employee management", url: "/dashboard/employee-management", icon: Users },
    { title: "Compliance Agent", url: "/dashboard/compliance-agent", icon: ShieldCheck },
    { title: "RNS", url: "/dashboard/rns", icon: Newspaper },
    { title: "Escrow projects", url: "/dashboard/escrow", icon: Briefcase },
  ],
};

export function buildBusinessTierNavGroup(sectionTitle: string, bundleId: WorkspaceTierId): NavGroup {
  return {
    title: sectionTitle,
    items: TIER_NAV[bundleId] ?? TIER_NAV["tier-2"],
  };
}

/** Full workspace sidebar (shown after opening a workspace). */
export function buildWorkspaceNavGroup(options?: { enableAllLinks?: boolean }): NavGroup {
  const all = options?.enableAllLinks ?? false;
  return {
    title: "Workspace",
    items: [
      { title: "Overview", url: "/dashboard/overview", icon: LayoutDashboard },
      { title: "Developers", url: "/dashboard/developers", icon: Code2 },
      { title: "Payments", url: "/dashboard/payment-links", icon: CreditCard },
      { title: "Treasury", url: "/dashboard/withdraw", icon: Wallet },
      {
        title: "Bridge",
        url: "/dashboard/bridge",
        icon: ArrowLeftRight,
        badge: "New",
        disabled: all ? undefined : true,
      },
      {
        title: "Compliance",
        url: "/dashboard/compliance-agent",
        icon: ShieldCheck,
        badge: "5",
      },
      { title: "Regulations", url: "/dashboard/rns", icon: Scale, badge: "3", disabled: all ? undefined : true },
      {
        title: "Risk Reports",
        url: "/dashboard/compliance-analysis",
        icon: AlertTriangle,
        badge: "4",
        disabled: all ? undefined : true,
      },
      { title: "Document Vault", url: "/dashboard/document-vault", icon: FolderArchive, disabled: all ? undefined : true },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  };
}

export function buildWorkspaceQuickActionsGroup(options?: { enableAllLinks?: boolean }): NavGroup {
  const all = options?.enableAllLinks ?? false;
  return {
    title: "Quick Actions",
    items: [{ title: "Invite Team", url: "/dashboard/settings", icon: Users, disabled: all ? undefined : true }],
  };
}

export const sidebarData: SidebarData = {
  user: {
    name: "Wallet",
    email: "Connect to view",
    avatar: "",
  },
  teams: [
    {
      name: "Hypertron",
      logo: Zap,
      plan: "B2B Onboarding & Payments",
    },
  ],
  navGroups: [
    DASHBOARD_GROUP,
    getFeaturesNavGroup([]), // default: show all when no preference
  ],
};
