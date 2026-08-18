"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  getBusinessProfile,
  isBusinessProfileComplete,
  type BusinessProfile,
} from "@/lib/business";
import { fetchAuthMe, type WalletSession } from "@/lib/auth";

export function RequireWalletSession({
  children,
  unauthenticated,
  /** Allow incomplete profiles (used by the create-workspace wizard). */
  allowIncompleteProfile = false,
}: {
  children: (
    session: WalletSession,
    profile: BusinessProfile,
  ) => ReactNode;
  unauthenticated?: ReactNode;
  allowIncompleteProfile?: boolean;
}) {
  const router = useRouter();
  const allowUnauthenticated = unauthenticated !== undefined;
  const [session, setSession] = useState<WalletSession | null | undefined>(
    undefined,
  );
  const [profile, setProfile] = useState<BusinessProfile | null | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const next = await fetchAuthMe();
      if (cancelled) return;
      if (!next) {
        if (allowUnauthenticated) {
          setSession(null);
        } else {
          router.replace("/");
        }
        return;
      }
      setSession(next);

      const business = await getBusinessProfile();
      if (cancelled) return;
      if (!business.ok) {
        setLoadError(business.error);
        setProfile(null);
        return;
      }
      setProfile(business.profile);
    })();

    return () => {
      cancelled = true;
    };
  }, [allowUnauthenticated, router]);

  const needsOnboarding =
    Boolean(session) &&
    Boolean(profile) &&
    !isBusinessProfileComplete(profile!) &&
    !allowIncompleteProfile;

  useEffect(() => {
    if (!needsOnboarding) return;
    router.replace("/dashboard/workspaces/new");
  }, [needsOnboarding, router]);

  if (session === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0F1939] text-sm text-white/60">
        Loading…
      </div>
    );
  }

  if (!session) return <>{unauthenticated ?? null}</>;

  if (profile === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0F1939] text-sm text-white/60">
        Loading…
      </div>
    );
  }

  if (loadError || profile === null) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-[#0F1939] px-6 text-center">
        <p className="text-sm text-white/70">
          {loadError ?? "Could not load your workspace."}
        </p>
        <button
          type="button"
          className="text-sm font-semibold text-[#E7B66D]"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#0F1939] text-sm text-white/60">
        Opening workspace setup…
      </div>
    );
  }

  return <>{children(session, profile)}</>;
}
