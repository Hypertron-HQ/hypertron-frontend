"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DemoBanner } from "@/components/demo/demo-banner";
import { SandboxMobileGate } from "@/components/demo/sandbox-mobile-gate";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { isHubNavRoute } from "@/lib/hub-nav-routes";
import { isWorkspaceRoute } from "@/lib/workspace-nav-routes";
import { WorkspaceHubLayout } from "@/components/dashboard/workspace-hub/workspace-hub-layout";
import { WorkspaceLayout } from "@/components/dashboard/workspace-hub/workspace-layout";

export default function DemoDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const banner = <DemoBanner className="mb-4 w-full" />;

  let content: ReactNode;

  if (isHubNavRoute(pathname)) {
    content = <WorkspaceHubLayout topSlot={banner}>{children}</WorkspaceHubLayout>;
  } else if (isWorkspaceRoute(pathname)) {
    content = <WorkspaceLayout topSlot={banner}>{children}</WorkspaceLayout>;
  } else {
    content = (
      <>
        <div className="px-5 pt-4 lg:px-6">{banner}</div>
        {children}
      </>
    );
  }

  return (
    <SandboxMobileGate>
      <OnboardingGate when={false} autoRedirect={false}>
        {content}
      </OnboardingGate>
    </SandboxMobileGate>
  );
}
