import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
export type HubNotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  defaultUnread: boolean;
  icon: LucideIcon;
  iconBg: string;
  iconBgDark: string;
  iconColor: string;
  iconColorDark: string;
};

export type WorkspaceStatsSource = {
  members: number;
  openTasks: number;
  pendingApprovals: number;
  complianceAlerts: number;
};

export function summarizeWorkspaces(workspaces: WorkspaceStatsSource[]) {
  return {
    workspaces: workspaces.length,
    members: workspaces.reduce((s, w) => s + w.members, 0),
    openTasks: workspaces.reduce((s, w) => s + w.openTasks, 0),
    pendingApprovals: workspaces.reduce((s, w) => s + w.pendingApprovals, 0),
    complianceAlerts: workspaces.reduce((s, w) => s + w.complianceAlerts, 0),
    deadlines: Math.min(workspaces.length + 2, 9),
  };
}

export function buildHubNotifications(summary: {
  workspaces: number;
  members: number;
  openTasks: number;
  pendingApprovals: number;
  complianceAlerts: number;
  deadlines: number;
}): HubNotificationItem[] {
  return [
    {
      id: "open-tasks",
      title:
        summary.openTasks > 0
          ? `${summary.openTasks} open task${summary.openTasks === 1 ? "" : "s"}`
          : "Open tasks cleared",
      message:
        summary.openTasks > 0
          ? "Tasks across your workspaces need your attention."
          : "No open tasks requiring action right now.",
      time: "Just now",
      defaultUnread: summary.openTasks > 0,
      icon: CheckCircle2,
      iconBg: "bg-red-50",
      iconBgDark: "bg-red-500/15",
      iconColor: "text-red-500",
      iconColorDark: "text-red-400",
    },
    {
      id: "pending-approvals",
      title:
        summary.pendingApprovals > 0
          ? `${summary.pendingApprovals} pending approval${summary.pendingApprovals === 1 ? "" : "s"}`
          : "Approvals up to date",
      message:
        summary.pendingApprovals > 0
          ? "Items are waiting for your sign-off."
          : "Nothing pending your approval.",
      time: "12m ago",
      defaultUnread: summary.pendingApprovals > 0,
      icon: Clock,
      iconBg: "bg-amber-50",
      iconBgDark: "bg-amber-500/15",
      iconColor: "text-amber-600",
      iconColorDark: "text-amber-400",
    },
    {
      id: "compliance-alerts",
      title:
        summary.complianceAlerts > 0
          ? `${summary.complianceAlerts} compliance alert${summary.complianceAlerts === 1 ? "" : "s"}`
          : "Compliance looks good",
      message:
        summary.complianceAlerts > 0
          ? "Review required on flagged compliance items."
          : "All compliance checks are clear.",
      time: "1h ago",
      defaultUnread: summary.complianceAlerts > 0,
      icon: AlertTriangle,
      iconBg: "bg-red-50",
      iconBgDark: "bg-red-500/15",
      iconColor: "text-red-500",
      iconColorDark: "text-red-400",
    },
    {
      id: "deadlines",
      title: `${summary.deadlines} upcoming deadline${summary.deadlines === 1 ? "" : "s"}`,
      message: "Due this week across your workspaces.",
      time: "3h ago",
      defaultUnread: summary.deadlines > 0,
      icon: Clock,
      iconBg: "bg-blue-50",
      iconBgDark: "bg-blue-500/15",
      iconColor: "text-blue-600",
      iconColorDark: "text-blue-400",
    },
    {
      id: "workspaces",
      title: `${summary.workspaces} active workspace${summary.workspaces === 1 ? "" : "s"}`,
      message: "Your workspace portfolio is active and synced.",
      time: "Yesterday",
      defaultUnread: false,
      icon: Building2,
      iconBg: "bg-emerald-50",
      iconBgDark: "bg-emerald-500/15",
      iconColor: "text-emerald-600",
      iconColorDark: "text-emerald-400",
    },
    {
      id: "members",
      title: `${summary.members} team members`,
      message: "Total members across all workspaces.",
      time: "Yesterday",
      defaultUnread: false,
      icon: Users,
      iconBg: "bg-blue-50",
      iconBgDark: "bg-blue-500/15",
      iconColor: "text-blue-600",
      iconColorDark: "text-blue-400",
    },
  ];
}
