"use client";

import { type ReactNode } from "react";
import { useWorkspacePageMeta } from "@/components/dashboard/workspace-hub/workspace-page-meta-context";
import { workspaceHubBreadcrumbs } from "@/lib/workspace-nav-routes";

export { workspaceHubBreadcrumbs };

type WorkspacePageShellProps = {
  breadcrumbs: ReturnType<typeof workspaceHubBreadcrumbs>;
  children: ReactNode;
  workspaceName?: string;
  connectMessage?: string;
};

/** @deprecated Workspace pages use WorkspaceLayout; this wrapper only registers page meta. */
export function WorkspacePageShell({ breadcrumbs, children }: WorkspacePageShellProps) {
  useWorkspacePageMeta({ breadcrumbs });
  return <>{children}</>;
}
