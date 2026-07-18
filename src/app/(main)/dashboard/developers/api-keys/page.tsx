"use client";

import { DevelopersApiKeysPage } from "@/components/dashboard/developers/developers-api-keys-page";
import { WorkspacePageShell } from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { useDemoMode } from "@/components/demo/demo-mode-provider";

export default function DevelopersApiKeysRoute() {
  const { demoPath } = useDemoMode();

  return (
    <WorkspacePageShell
      breadcrumbs={[
        { label: "Workspaces", href: demoPath("/dashboard") },
        { label: "Developers", href: demoPath("/dashboard/developers") },
        { label: "API Keys", current: true },
      ]}
    >
      <DevelopersApiKeysPage />
    </WorkspacePageShell>
  );
}
