"use client";

import { DevelopersOverviewPage } from "@/components/dashboard/developers/developers-overview-page";
import { WorkspacePageShell } from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { useDemoMode } from "@/components/demo/demo-mode-provider";

export default function DevelopersPage() {
  const { demoPath } = useDemoMode();

  return (
    <WorkspacePageShell
      breadcrumbs={[
        { label: "Workspaces", href: demoPath("/dashboard") },
        { label: "Developers", current: true },
      ]}
    >
      <DevelopersOverviewPage />
    </WorkspacePageShell>
  );
}
