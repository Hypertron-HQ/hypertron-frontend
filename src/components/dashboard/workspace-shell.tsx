"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Code2,
  CreditCard,
  LayoutDashboard,
  Settings,
  Wallet,
} from "lucide-react";
import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import {
  WorkspaceDevelopers,
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
  developers: Code2,
  treasury: Wallet,
  settings: Settings,
} as const;

const TAB_META: Record<
  WorkspaceTab,
  { label: string; searchPlaceholder: string }
> = {
  overview: {
    label: "Overview",
    searchPlaceholder: "Search overview",
  },
  payments: {
    label: "Payments",
    searchPlaceholder: "Search payments",
  },
  developers: {
    label: "Developer Access",
    searchPlaceholder: "Search developers",
  },
  treasury: {
    label: "Treasury",
    searchPlaceholder: "Search treasury",
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

  useEffect(() => {
    setTab(readTabFromUrl());
    setReady(true);
  }, []);

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
        title: profile.name.trim() || workspace.name,
        subtitle: session.walletAddress,
      }}
    >
      {!ready ? null : (
        <>
          <TabPanel active={tab === "overview"}>
            <WorkspaceOverview workspace={workspace} />
          </TabPanel>
          <TabPanel active={tab === "payments"}>
            <WorkspacePayments workspace={workspace} />
          </TabPanel>
          <TabPanel active={tab === "developers"}>
            <WorkspaceDevelopers />
          </TabPanel>
          <TabPanel active={tab === "treasury"}>
            <WorkspaceTreasury workspace={workspace} />
          </TabPanel>
          <TabPanel active={tab === "settings"}>
            <WorkspaceSettingsPanel workspace={workspace} />
          </TabPanel>
        </>
      )}
    </DashboardChrome>
  );
}

function TabPanel({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      hidden={!active}
      className={active ? "block" : "hidden"}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}
