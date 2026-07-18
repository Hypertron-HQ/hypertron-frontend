"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  sidebarData,
  DASHBOARD_GROUP,
  getFeaturesNavGroup,
  buildWorkspaceNavGroup,
  buildWorkspaceQuickActionsGroup,
} from "@/components/dashboard/layout/data/sidebar-data";
import {
  getWorkspaceTierState,
  syncWorkspaceTierFromLatestTemplate,
  hydrateWorkspaceTierFromProfile,
  WORKSPACE_TIER_UPDATED_EVENT,
} from "@/lib/workspace-tier-context";
import { NavGroup } from "@/components/dashboard/layout/nav-group";
import { NavUser } from "@/components/dashboard/layout/nav-user";
import { TeamSwitcher } from "@/components/dashboard/layout/team-switcher";
import { WorkspaceSwitcher } from "@/components/dashboard/layout/workspace-switcher";
import { WorkspaceSidebarHelp } from "@/components/dashboard/layout/workspace-sidebar-help";
import { useFreighter } from "@/hooks/useFreighter";

type AppSidebarProps = {
  onDisconnect?: () => void;
  user?: { name: string; email: string; avatar: string };
  /** True when Privy or wallet server session exists (sidebar account row). */
  isSessionConnected?: boolean;
};

export function AppSidebar({ onDisconnect, user, isSessionConnected }: AppSidebarProps) {
  const { publicKey, connect, isConnecting } = useFreighter();
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [tierNavTick, setTierNavTick] = useState(0);
  const [tierStorageReady, setTierStorageReady] = useState(false);
  const fetchRef = useRef<() => void>(() => {});

  const fetchSelectedWidgets = useCallback(() => {
    if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith("G")) {
      setSelectedWidgets([]);
      return;
    }
    fetch("/api/business/profile", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const widgets = Array.isArray(data?.selectedWidgets)
          ? data.selectedWidgets.filter((w: unknown) => typeof w === "string")
          : [];
        setSelectedWidgets(widgets);
        const activeTpl =
          data?.activeTemplate &&
          typeof data.activeTemplate === "object" &&
          typeof data.activeTemplate.id === "string"
            ? data.activeTemplate
            : null;
        hydrateWorkspaceTierFromProfile({
          selectedTier: typeof data?.selectedTier === "string" ? data.selectedTier : null,
          selectedTierName:
            typeof data?.selectedTierName === "string" ? data.selectedTierName : null,
          businessName: typeof data?.name === "string" ? data.name : null,
          activeTemplateId: typeof data?.activeTemplateId === "string" ? data.activeTemplateId : null,
          activeTemplate: activeTpl
            ? {
                id: activeTpl.id,
                name: typeof activeTpl.name === "string" ? activeTpl.name : "",
                bundleId: typeof activeTpl.bundleId === "string" ? activeTpl.bundleId : "",
                bundleName:
                  activeTpl.bundleName === null || typeof activeTpl.bundleName === "string"
                    ? activeTpl.bundleName
                    : null,
                businessName:
                  activeTpl.businessName === null || typeof activeTpl.businessName === "string"
                    ? activeTpl.businessName
                    : null,
              }
            : null,
        });
      })
      .catch(() => {
        setSelectedWidgets([]);
      });
  }, [publicKey]);

  useEffect(() => {
    fetchSelectedWidgets();
  }, [fetchSelectedWidgets]);

  fetchRef.current = () => {
    fetchSelectedWidgets();
  };

  useEffect(() => {
    const onProfileUpdated = () => fetchRef.current();
    window.addEventListener("profile-updated", onProfileUpdated);
    return () => window.removeEventListener("profile-updated", onProfileUpdated);
  }, []);

  useEffect(() => {
    syncWorkspaceTierFromLatestTemplate();
    setTierStorageReady(true);
    const onTier = () => setTierNavTick((k) => k + 1);
    window.addEventListener(WORKSPACE_TIER_UPDATED_EVENT, onTier);
    return () => window.removeEventListener(WORKSPACE_TIER_UPDATED_EVENT, onTier);
  }, []);

  const displayUser = user ?? sidebarData.user;
  const featuresGroup = getFeaturesNavGroup(selectedWidgets);
  const tierState = useMemo(
    () => {
      void tierNavTick;
      return tierStorageReady ? getWorkspaceTierState() : null;
    },
    [tierStorageReady, tierNavTick]
  );
  const workspaceActive = tierState?.sidebarImported === true;

  const navGroups = workspaceActive
    ? [buildWorkspaceNavGroup(), buildWorkspaceQuickActionsGroup()]
    : featuresGroup.items.length > 0
      ? [DASHBOARD_GROUP, featuresGroup]
      : [DASHBOARD_GROUP];

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        {workspaceActive ? <WorkspaceSwitcher /> : <TeamSwitcher />}
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {workspaceActive && <WorkspaceSidebarHelp />}
        <NavUser
          user={displayUser}
          onDisconnect={onDisconnect}
          onConnect={connect}
          isConnecting={isConnecting}
          isConnected={isSessionConnected ?? !!publicKey}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
