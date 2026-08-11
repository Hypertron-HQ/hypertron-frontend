"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { RequireWalletSession } from "@/components/dashboard/require-wallet-session";
import { WorkspaceShell } from "@/components/dashboard/workspace-shell";
import { businessToWorkspace, type BusinessProfile } from "@/lib/business";
import type { WalletSession } from "@/lib/auth";

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
  const mismatch = Boolean(
    workspaceId && workspaceId !== profile.businessId,
  );

  useEffect(() => {
    if (mismatch) {
      router.replace("/dashboard");
    }
  }, [mismatch, router]);

  if (mismatch) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-void text-sm text-mist">
        Loading workspace…
      </div>
    );
  }

  const workspace = businessToWorkspace(profile, session.walletAddress);

  return (
    <WorkspaceShell
      workspace={workspace}
      session={session}
      profile={profile}
    />
  );
}
