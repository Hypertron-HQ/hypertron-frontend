"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Onboarding runs as a modal from the main layout; keep this route from 404s and old bookmarks. */
export default function OnboardingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
