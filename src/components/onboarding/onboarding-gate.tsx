"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { isWorkspaceSetupComplete } from "@/lib/is-workspace-setup-complete";

type OnboardingGateProps = {
  children: React.ReactNode;
  /** When false, skip setup checks (e.g. logged out). */
  when?: boolean;
  /** Redirect to Create Workspace when setup is incomplete. */
  autoRedirect?: boolean;
  walletAddress?: string | null;
  scopeKey?: string | null;
};

export type OnboardingUiContextValue = {
  isOnboardingComplete: boolean;
  /** Navigate to the Create Workspace wizard. */
  openOnboardingQuiz: () => void;
};

const OnboardingUiContext = createContext<OnboardingUiContextValue | null>(null);

export function useOnboardingUi(): OnboardingUiContextValue {
  const ctx = useContext(OnboardingUiContext);
  if (!ctx) {
    throw new Error("useOnboardingUi must be used within OnboardingGate");
  }
  return ctx;
}

export function OnboardingGate({
  children,
  when = true,
  autoRedirect = true,
  walletAddress,
  scopeKey,
}: OnboardingGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const storageKey = (scopeKey?.trim() || walletAddress?.trim() || "").trim();
  const scopeOk = storageKey.length > 0;
  const onCreateWorkspaceRoute = pathname === "/CreateWorkspace";

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshProfileCompletion = useCallback(() => {
    if (!mounted || !when || !scopeOk) {
      setProfileLoading(false);
      setProfileComplete(true);
      return;
    }
    setProfileLoading(true);
    fetch("/api/business/profile", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setProfileComplete(isWorkspaceSetupComplete(data));
      })
      .catch(() => {
        setProfileComplete(false);
      })
      .finally(() => setProfileLoading(false));
  }, [mounted, scopeOk, when]);

  useEffect(() => {
    refreshProfileCompletion();
  }, [refreshProfileCompletion]);

  useEffect(() => {
    const onProfileUpdated = () => refreshProfileCompletion();
    window.addEventListener("profile-updated", onProfileUpdated);
    return () => window.removeEventListener("profile-updated", onProfileUpdated);
  }, [refreshProfileCompletion]);

  const openOnboardingQuiz = useCallback(() => {
    router.push("/CreateWorkspace");
  }, [router]);

  useEffect(() => {
    if (
      !mounted ||
      !when ||
      !scopeOk ||
      !autoRedirect ||
      onCreateWorkspaceRoute ||
      profileLoading ||
      profileComplete
    ) {
      return;
    }
    router.replace("/CreateWorkspace");
  }, [
    mounted,
    when,
    scopeOk,
    autoRedirect,
    onCreateWorkspaceRoute,
    profileLoading,
    profileComplete,
    router,
  ]);

  const isOnboardingComplete = useMemo(() => {
    if (!when || !scopeOk) return true;
    if (!mounted) return false;
    if (profileLoading) return false;
    return profileComplete;
  }, [when, scopeOk, mounted, profileComplete, profileLoading]);

  const uiValue = useMemo<OnboardingUiContextValue>(
    () => ({
      isOnboardingComplete,
      openOnboardingQuiz,
    }),
    [isOnboardingComplete, openOnboardingQuiz]
  );

  return (
    <OnboardingUiContext.Provider value={uiValue}>{children}</OnboardingUiContext.Provider>
  );
}
