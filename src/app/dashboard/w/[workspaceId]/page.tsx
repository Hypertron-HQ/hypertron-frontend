"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { RequireMockSession } from "@/components/dashboard/require-mock-session";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { getWorkspace } from "@/mockdata";

export default function WorkspaceDashboardPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const workspaceId = params.workspaceId;
  const workspace = workspaceId ? getWorkspace(workspaceId) : undefined;

  useEffect(() => {
    if (workspaceId && !workspace) {
      router.replace("/dashboard");
    }
  }, [router, workspace, workspaceId]);

  if (!workspace) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-void text-sm text-mist">
        Loading workspace…
      </div>
    );
  }

  return (
    <RequireMockSession>
      {() => <WorkspaceShell workspace={workspace} />}
    </RequireMockSession>
  );
}
