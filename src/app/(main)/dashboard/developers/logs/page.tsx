"use client";

import { DevelopersLogsPage } from "@/components/dashboard/developers/developers-logs-page";
import { WorkspacePageShell } from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { useDemoMode } from "@/components/demo/demo-mode-provider";

export default function DevelopersLogsRoute() {
  const { demoPath } = useDemoMode();

  return (
    <WorkspacePageShell
      breadcrumbs={[
        { label: "Workspaces", href: demoPath("/dashboard") },
        { label: "Developers", href: demoPath("/dashboard/developers") },
        { label: "Logs", current: true },
      ]}
    >
      <DevelopersLogsPage />
    </WorkspacePageShell>
  );
}
