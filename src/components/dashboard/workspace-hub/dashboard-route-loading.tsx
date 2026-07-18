"use client";

import { usePathname } from "next/navigation";
import { getHubLoadingVariant, isHubNavRoute } from "@/lib/hub-nav-routes";
import { getWorkspaceLoadingVariant, isWorkspaceRoute } from "@/lib/workspace-nav-routes";
import {
  HubBillingContentSkeleton,
  HubSettingsContentSkeleton,
  HubSupportContentSkeleton,
  HubTemplatesContentSkeleton,
  HubWorkspacesContentSkeleton,
  WorkspaceGenericContentSkeleton,
  WorkspaceOverviewContentSkeleton,
  WorkspacePageShellSkeleton,
  WorkspacePaymentsContentSkeleton,
  WorkspaceTreasuryContentSkeleton,
} from "@/components/dashboard/workspace-hub/hub-content-skeletons";

function HubContentLoading({ pathname }: { pathname: string | null }) {
  const variant = getHubLoadingVariant(pathname);
  switch (variant) {
    case "templates":
      return <HubTemplatesContentSkeleton />;
    case "billing":
      return <HubBillingContentSkeleton />;
    case "settings":
      return <HubSettingsContentSkeleton />;
    case "support":
      return <HubSupportContentSkeleton />;
    default:
      return <HubWorkspacesContentSkeleton />;
  }
}

function WorkspaceContentLoading({ pathname }: { pathname: string | null }) {
  const variant = getWorkspaceLoadingVariant(pathname);
  switch (variant) {
    case "overview":
      return <WorkspaceOverviewContentSkeleton />;
    case "treasury":
      return <WorkspaceTreasuryContentSkeleton />;
    case "payments":
      return <WorkspacePaymentsContentSkeleton />;
    default:
      return <WorkspaceGenericContentSkeleton />;
  }
}

export function DashboardRouteLoading() {
  const pathname = usePathname();

  if (isHubNavRoute(pathname)) {
    return <HubContentLoading pathname={pathname} />;
  }

  if (isWorkspaceRoute(pathname)) {
    return <WorkspaceContentLoading pathname={pathname} />;
  }

  return <WorkspacePageShellSkeleton />;
}
