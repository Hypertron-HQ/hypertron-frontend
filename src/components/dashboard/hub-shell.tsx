"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  CreditCard,
  LayoutGrid,
  ScrollText,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import {
  HubAudit,
  HubBilling,
  HubSettingsPanel,
} from "@/components/dashboard/hub-panels";
import { HUB_TABS, isHubTab, type HubTab } from "@/components/dashboard/hub-types";
import { HubWorkspaces } from "@/components/dashboard/hub-workspaces";
import type { BusinessProfile } from "@/lib/business";
import {
  logoutAuth,
  shortenAddress,
  type WalletSession,
} from "@/lib/auth";

const TAB_ICONS = {
  workspaces: LayoutGrid,
  audit: ScrollText,
  billing: CreditCard,
  settings: Settings,
} as const;

const TAB_META: Record<
  HubTab,
  { breadcrumb: string; searchPlaceholder: string }
> = {
  workspaces: {
    breadcrumb: "Account / Workspaces",
    searchPlaceholder: "Search workspaces",
  },
  audit: {
    breadcrumb: "Account / Audit",
    searchPlaceholder: "Search audit log",
  },
  billing: {
    breadcrumb: "Account / Billing",
    searchPlaceholder: "Search billing",
  },
  settings: {
    breadcrumb: "Account / Settings",
    searchPlaceholder: "Search settings",
  },
};

function readTabFromUrl(): HubTab {
  if (typeof window === "undefined") return "workspaces";
  const value = new URLSearchParams(window.location.search).get("tab");
  return isHubTab(value) ? value : "workspaces";
}

export function HubShell({
  session,
  profile,
}: {
  session: WalletSession;
  profile: BusinessProfile;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<HubTab>("workspaces");
  const [ready, setReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);

  useEffect(() => {
    setTab(readTabFromUrl());
    setReady(true);
  }, []);

  useEffect(() => {
    setCurrentProfile(profile);
  }, [profile]);

  const selectTab = useCallback((next: string) => {
    if (!isHubTab(next)) return;
    startTransition(() => {
      setTab(next);
      const url = new URL(window.location.href);
      if (next === "workspaces") url.searchParams.delete("tab");
      else url.searchParams.set("tab", next);
      window.history.replaceState(null, "", url.pathname + url.search);
    });
  }, []);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    await logoutAuth();
    router.replace("/");
  }

  const meta = TAB_META[tab];
  const walletShort = shortenAddress(session.walletAddress);
  const navItems = HUB_TABS.map((item) => ({
    ...item,
    icon: TAB_ICONS[item.id],
  }));

  return (
    <DashboardChrome
      navItems={navItems}
      activeId={tab}
      onSelect={selectTab}
      breadcrumb={meta.breadcrumb}
      searchPlaceholder={meta.searchPlaceholder}
      identity={{
        title: currentProfile.name.trim() || "Workspace",
        subtitle: session.walletAddress,
      }}
    >
      {!ready ? null : (
        <>
          <TabPanel active={tab === "workspaces"}>
            <HubWorkspaces
              profile={currentProfile}
              walletAddress={session.walletAddress}
            />
          </TabPanel>
          <TabPanel active={tab === "audit"}>
            <HubAudit />
          </TabPanel>
          <TabPanel active={tab === "billing"}>
            <HubBilling />
          </TabPanel>
          <TabPanel active={tab === "settings"}>
            <HubSettingsPanel
              profile={currentProfile}
              walletShort={walletShort}
              onSignOut={signOut}
              onProfileUpdated={setCurrentProfile}
            />
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
