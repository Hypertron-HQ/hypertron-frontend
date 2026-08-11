"use client";

import { HubShell } from "@/components/dashboard/hub-shell";
import { RequireWalletSession } from "@/components/dashboard/require-wallet-session";

export default function DashboardPage() {
  return (
    <RequireWalletSession>
      {(session, profile) => (
        <HubShell session={session} profile={profile} />
      )}
    </RequireWalletSession>
  );
}
