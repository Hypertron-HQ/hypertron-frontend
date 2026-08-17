"use client";

import { RequireWalletSession } from "@/components/dashboard/require-wallet-session";
import { WorkspaceCreateWizard } from "@/components/workspaces/workspace-create-wizard";

export default function NewWorkspacePage() {
  return (
    <RequireWalletSession allowIncompleteProfile>
      {() => <WorkspaceCreateWizard />}
    </RequireWalletSession>
  );
}
