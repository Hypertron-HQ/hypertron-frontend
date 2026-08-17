"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RequireWalletSession } from "@/components/dashboard/require-wallet-session";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import {
  businessToWorkspace,
  getBusinessProfile,
  type BusinessProfile,
} from "@/lib/business";
import type { WalletSession } from "@/lib/auth";
import type { Workspace } from "@/mockdata";
import {
  activateWorkspace,
  getWorkspace,
  workspaceRecordToView,
} from "@/lib/workspaces";

export default function WorkspaceDashboardPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;

  return (
    <RequireWalletSession>
      {(session, profile) => (
        <WorkspaceGate
          workspaceId={workspaceId}
          session={session}
          profile={profile}
        />
      )}
    </RequireWalletSession>
  );
}

function WorkspaceGate({
  workspaceId,
  session,
  profile,
}: {
  workspaceId: string | undefined;
  session: WalletSession;
  profile: BusinessProfile;
}) {
  const router = useRouter();
  const [resolved, setResolved] = useState<{
    workspace: Workspace;
    profile: BusinessProfile;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!workspaceId) {
      router.replace("/dashboard");
      return;
    }

    void (async () => {
      const activated = await activateWorkspace(workspaceId);
      if (!activated.ok && workspaceId !== profile.businessId) {
        router.replace("/dashboard");
        return;
      }

      const [workspaceResult, profileResult] = await Promise.all([
        getWorkspace(workspaceId),
        getBusinessProfile(),
      ]);
      if (cancelled) return;

      if (workspaceResult.ok && profileResult.ok) {
        setResolved({
          workspace: workspaceRecordToView(
            workspaceResult.workspace,
            session.walletAddress,
          ),
          profile: profileResult.profile,
        });
        return;
      }

      // Backward-compatible path while the workspace API is being deployed.
      if (workspaceId === profile.businessId) {
        setResolved({
          workspace: businessToWorkspace(profile, session.walletAddress),
          profile,
        });
        return;
      }
      router.replace("/dashboard");
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, router, session.walletAddress, workspaceId]);

  if (!resolved) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-void text-sm text-mist">
        Loading workspace…
      </div>
    );
  }

  return (
    <WorkspaceShell
      workspace={resolved.workspace}
      session={session}
      profile={resolved.profile}
    />
  );
}
