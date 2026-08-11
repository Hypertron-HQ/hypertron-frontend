"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BusinessSetupForm } from "@/components/onboarding/business-setup-form";
import {
  getBusinessProfile,
  isBusinessProfileComplete,
  type BusinessProfile,
} from "@/lib/business";
import { fetchAuthMe, type WalletSession } from "@/lib/auth";

export function RequireWalletSession({
  children,
}: {
  children: (
    session: WalletSession,
    profile: BusinessProfile,
  ) => ReactNode;
}) {
  const router = useRouter();
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
        router.replace("/");
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
  }, [router]);

  if (session === undefined || profile === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-void text-sm text-mist">
        Loading dashboard…
      </div>
    );
  }

  if (!session) return null;

  if (loadError || profile === null) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-[#F8FAFC] px-6 text-center">
        <p className="text-sm text-slate-600">
          {loadError ?? "Could not load your workspace."}
        </p>
        <button
          type="button"
          className="text-sm font-semibold text-[#2563EB]"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isBusinessProfileComplete(profile)) {
    return (
      <BusinessSetupForm
        walletAddress={session.walletAddress}
        onComplete={(next) => setProfile(next)}
      />
    );
  }

  return <>{children(session, profile)}</>;
}
