"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  CreditCard,
  LayoutDashboard,
  Settings,
  Wallet,
} from "lucide-react";
import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";
import { WorkspaceOverview } from "@/components/dashboard/workspace-overview";
import {
  SandboxPayments,
  SandboxSettings,
  SandboxTreasury,
} from "@/components/sandbox/sandbox-panels";
import {
  WORKSPACE_TABS,
  isWorkspaceTab,
  type WorkspaceTab,
} from "@/components/dashboard/workspace-types";
import { SANDBOX_WALLET, SANDBOX_WORKSPACE } from "@/lib/sandbox-demo";

const TAB_ICONS = {
  overview: LayoutDashboard,
  payments: CreditCard,
  treasury: Wallet,
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

export function SandboxShell() {
  const [tab, setTab] = useState<WorkspaceTab>("overview");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setTab(readTabFromUrl());
      setReady(true);
    });
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
      breadcrumb={`${SANDBOX_WORKSPACE.name} / ${meta.label}`}
      searchPlaceholder={meta.searchPlaceholder}
      identity={{
        title: SANDBOX_WORKSPACE.name,
        subtitle: SANDBOX_WALLET,
      }}
    >
      <div className="mb-5 rounded-xl border border-[#E7B66D]/35 bg-[#FBF7F0] px-4 py-3 text-sm text-[#0F1939]">
        <span className="font-semibold text-[#C9A46A]">Sandbox</span>
        {" — "}
        Demo workspace with sample data only. No wallet, API, or on-chain
        actions.
      </div>

      {!ready ? null : (
        <>
          {tab === "overview" ? (
            <WorkspaceOverview
              workspace={SANDBOX_WORKSPACE}
              demo
              onCreatePaymentLink={() => selectTab("payments")}
              onViewAllPayments={() => selectTab("payments")}
            />
          ) : null}
          {tab === "payments" ? <SandboxPayments /> : null}
          {tab === "treasury" ? <SandboxTreasury /> : null}
          {tab === "settings" ? <SandboxSettings /> : null}
        </>
      )}
    </DashboardChrome>
  );
}
