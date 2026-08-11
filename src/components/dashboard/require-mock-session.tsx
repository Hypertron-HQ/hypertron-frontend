"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getMockSession, type MockSession } from "@/lib/mock-session";

export function RequireMockSession({
  children,
}: {
  children: (session: MockSession) => ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<MockSession | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const next = getMockSession();
    if (!next) {
      router.replace("/");
      return;
    }
    setSession(next);
  }, [router]);

  if (session === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-void text-sm text-mist">
        Loading dashboard…
      </div>
    );
  }

  if (!session) return null;

  return <>{children(session)}</>;
}
