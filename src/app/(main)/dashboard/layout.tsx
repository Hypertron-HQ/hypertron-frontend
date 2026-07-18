"use client";

import { usePathname } from "next/navigation";
import { isHubNavRoute } from "@/lib/hub-nav-routes";
import { isWorkspaceRoute } from "@/lib/workspace-nav-routes";
import { WorkspaceHubLayout } from "@/components/dashboard/workspace-hub/workspace-hub-layout";
import { WorkspaceLayout } from "@/components/dashboard/workspace-hub/workspace-layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isHubNavRoute(pathname)) {
    return <WorkspaceHubLayout>{children}</WorkspaceHubLayout>;
  }

  if (isWorkspaceRoute(pathname)) {
    return <WorkspaceLayout>{children}</WorkspaceLayout>;
  }

  return children;
}
