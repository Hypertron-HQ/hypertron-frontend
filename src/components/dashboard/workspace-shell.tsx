"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Code2,
  CreditCard,
  LayoutDashboard,
  Settings,
  Wallet,
} from "lucide-react";
import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { WorkspaceDevelopers } from "@/components/dashboard/workspace-developers";
import {
  WorkspaceOverview,
  WorkspacePayments,
  WorkspaceSettingsPanel,
  WorkspaceTreasury,
} from "@/components/dashboard/workspace-panels";
import {
  WORKSPACE_TABS,
  isWorkspaceTab,
  type WorkspaceTab,
} from "@/components/dashboard/workspace-types";
import type { BusinessProfile } from "@/lib/business";
import type { WalletSession } from "@/lib/auth";
import type { Workspace } from "@/mockdata";

const TAB_ICONS = {
  overview: LayoutDashboard,
  payments: CreditCard,
  treasury: Wallet,
  developers: Code2,
  settings: Settings,
} as const;

const TAB_META: Record<
  WorkspaceTab,
  { label: string; searchPlaceholder: string }
> = {
  overview: {
    label: "Overview",
    searchPlaceholder: "Search workspace...",
  },
  payments: {
    label: "Payments",
    searchPlaceholder: "Search payments",
  },
  treasury: {
    label: "Treasury",
    searchPlaceholder: "Search treasury",
  },
  developers: {
    label: "Developers",
    searchPlaceholder: "Search API keys",
  },
  settings: {
    label: "Settings",
    searchPlaceholder: "Search settings",
  },
};

function readTabFromUrl(): WorkspaceTab {
  if (typeof window === "undefined") return "overview";
  const value = new URLSearchParams(window.location.search).get("tab");
  return isWorkspaceTab(value) ? value : "overview";
}

export function WorkspaceShell({
  workspace,
  session,
  profile,
}: {
  workspace: Workspace;
  session: WalletSession;
  profile: BusinessProfile;
}) {
  const [tab, setTab] = useState<WorkspaceTab>("overview");
  const [ready, setReady] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);

  useEffect(() => {
    queueMicrotask(() => {
      setTab(readTabFromUrl());
      setReady(true);
    });
  }, []);

  // Keep local profile when parent remounts with a different business.
  if (profile.businessId !== currentProfile.businessId) {
    setCurrentProfile(profile);
  }

  const selectTab = useCallback((next: string) => {
    if (!isWorkspaceTab(next)) return;
    startTransition(() => {
      setTab(next);
      const url = new URL(window.location.href);
      if (next === "overview") url.searchParams.delete("tab");
      else url.searchParams.set("tab", next);
      window.history.replaceState(null, "", url.pathname + url.search);
    });
  }, []);

  const meta = TAB_META[tab];
  const navItems = WORKSPACE_TABS.map((item) => ({
    ...item,
    icon: TAB_ICONS[item.id],
  }));

  return (
    <DashboardChrome
      navItems={navItems}
      activeId={tab}
      onSelect={selectTab}
      breadcrumb={`${workspace.name} / ${meta.label}`}
      searchPlaceholder={meta.searchPlaceholder}
      identity={{
        title: currentProfile.name.trim() || workspace.name,
        subtitle: session.walletAddress,
      }}
    >
      {!ready ? null : (
        <>
          {tab === "overview" ? (
            <WorkspaceOverview
              workspace={workspace}
              session={session}
              profile={currentProfile}
              onCreatePaymentLink={() => selectTab("payments")}
              onViewAllPayments={() => selectTab("payments")}
            />
          ) : null}
          {tab === "payments" ? (
            <WorkspacePayments
              workspace={workspace}
              session={session}
              profile={currentProfile}
              onProfileUpdated={setCurrentProfile}
            />
          ) : null}
          {tab === "treasury" ? (
            <WorkspaceTreasury
              workspace={workspace}
              session={session}
              profile={currentProfile}
            />
          ) : null}
          {tab === "developers" ? (
            <WorkspaceDevelopers
              workspace={workspace}
              profile={currentProfile}
            />
          ) : null}
          {tab === "settings" ? (
            <WorkspaceSettingsPanel
              workspace={workspace}
              session={session}
              profile={currentProfile}
              onProfileUpdated={setCurrentProfile}
            />
          ) : null}
        </>
      )}
    </DashboardChrome>
  );
}
