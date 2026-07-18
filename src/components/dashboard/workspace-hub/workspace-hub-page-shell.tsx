"use client";

import { type ReactNode } from "react";
import { useHubPageMeta } from "@/components/dashboard/workspace-hub/hub-page-meta-context";
import { hubNavBreadcrumbs } from "@/lib/hub-nav-routes";

export { hubNavBreadcrumbs };

type WorkspaceHubPageShellProps = {
  breadcrumbs: ReturnType<typeof hubNavBreadcrumbs>;
  title: string;
  subtitle?: string;
  children: ReactNode;
  connectMessage?: string;
};

/** @deprecated Hub pages use WorkspaceHubLayout; this wrapper only registers page meta. */
export function WorkspaceHubPageShell({
  breadcrumbs,
  title,
  subtitle,
  children,
}: WorkspaceHubPageShellProps) {
  useHubPageMeta({ breadcrumbs, title, subtitle });
  return <>{children}</>;
}
