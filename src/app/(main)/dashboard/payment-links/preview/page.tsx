"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PaymentLinkPreviewPage } from "@/components/dashboard/payments/payment-link-preview-page";
import {
  WorkspacePageShell,
  workspaceHubBreadcrumbs,
} from "@/components/dashboard/workspace-hub/workspace-page-shell";

function PreviewFallback() {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-neutral-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading preview…
    </div>
  );
}

export default function PaymentLinkPreviewRoute() {
  return (
    <WorkspacePageShell breadcrumbs={workspaceHubBreadcrumbs("Preview")}>
      <Suspense fallback={<PreviewFallback />}>
        <PaymentLinkPreviewPage />
      </Suspense>
    </WorkspacePageShell>
  );
}
