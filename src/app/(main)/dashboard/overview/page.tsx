"use client";

import { Suspense, useEffect } from "react";
import { WorkspaceOverviewDashboard } from "@/components/dashboard/workspace-overview/workspace-overview-dashboard";
import { WorkspaceOverviewContentSkeleton } from "@/components/dashboard/workspace-hub/hub-content-skeletons";
import { useWorkspacePageMeta } from "@/components/dashboard/workspace-hub/workspace-page-meta-context";
import { useFreighter } from "@/hooks/useFreighter";
import { useAppSession } from "@/hooks/useAppSession";
import {
  getWorkspaceTierState,
  WORKSPACE_TIER_UPDATED_EVENT,
} from "@/lib/workspace-tier-context";
import { useState, useCallback } from "react";
import { useDemoMode, useMockDashboardData } from "@/components/demo/demo-mode-provider";
import { fallbackBusiness } from "@/data/fallback";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (name.trim()[0] ?? "U").toUpperCase();
}

function OverviewContent() {
  const { demoPath } = useDemoMode();
  const useMock = useMockDashboardData();
  const { publicKey } = useFreighter();
  const { isPrivy, loading: sessionLoading, privyUser } = useAppSession();
  const [workspaceName, setWorkspaceName] = useState("Workspace");
  const [profileName, setProfileName] = useState("");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const syncNames = useCallback(() => {
    const state = getWorkspaceTierState();
    if (state?.businessName?.trim()) setWorkspaceName(state.businessName.trim());
  }, []);

  useEffect(() => {
    syncNames();
    window.addEventListener(WORKSPACE_TIER_UPDATED_EVENT, syncNames);
    return () => window.removeEventListener(WORKSPACE_TIER_UPDATED_EVENT, syncNames);
  }, [syncNames]);

  useEffect(() => {
    if (useMock) {
      setProfileName(fallbackBusiness.name);
      setBusinessId(fallbackBusiness.businessId);
      setWorkspaceName("Hypertron Demo");
      setProfileLoading(false);
      return;
    }
    if (sessionLoading || (!publicKey && !isPrivy)) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    fetch("/api/business/profile", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((profile) => {
        if (profile?.name) setProfileName(String(profile.name));
        if (typeof profile?.businessId === "string" && profile.businessId.trim()) {
          setBusinessId(profile.businessId.trim());
        } else {
          setBusinessId(null);
        }
        const tpl = profile?.activeTemplate;
        if (tpl?.businessName?.trim()) setWorkspaceName(String(tpl.businessName).trim());
        else if (tpl?.name?.trim()) setWorkspaceName(String(tpl.name).trim());
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [sessionLoading, publicKey, isPrivy, useMock]);

  const displayName =
    profileName.trim() ||
    privyUser?.name?.trim() ||
    (publicKey ? "Wallet User" : "User");

  const firstName = displayName.split(" ")[0] || displayName;
  const chromeReady = !sessionLoading && !profileLoading;

  useWorkspacePageMeta({
    breadcrumbs: [
      { label: "Workspaces", href: demoPath("/dashboard") },
      { label: "Overview", current: true },
    ],
    ...(chromeReady
      ? {
          title: `Hello, ${firstName}`,
          subtitle: workspaceName,
        }
      : {}),
  });

  if (sessionLoading || profileLoading) {
    return <WorkspaceOverviewContentSkeleton />;
  }

  return (
    <WorkspaceOverviewDashboard
      businessId={businessId}
      workspaceName={workspaceName}
      userName={displayName}
      userInitials={initialsFromName(displayName)}
    />
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<WorkspaceOverviewContentSkeleton />}>
      <OverviewContent />
    </Suspense>
  );
}
