"use client";

import { DevelopersWebhooksPage } from "@/components/dashboard/developers/developers-webhooks-page";
import { WorkspacePageShell } from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { useDemoMode } from "@/components/demo/demo-mode-provider";

export default function DevelopersWebhooksRoute() {
  const { demoPath } = useDemoMode();

  return (
    <WorkspacePageShell
      breadcrumbs={[
        { label: "Workspaces", href: demoPath("/dashboard") },
        { label: "Developers", href: demoPath("/dashboard/developers") },
        { label: "Webhooks", current: true },
      ]}
    >
      <DevelopersWebhooksPage />
    </WorkspacePageShell>
  );
}
