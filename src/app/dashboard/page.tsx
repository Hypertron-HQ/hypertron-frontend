"use client";

import { HubShell } from "@/components/dashboard/hub-shell";
import { RequireMockSession } from "@/components/dashboard/require-mock-session";

export default function DashboardPage() {
  return (
    <RequireMockSession>
      {(session) => <HubShell session={session} />}
    </RequireMockSession>
  );
}
