"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  WorkspaceHubShellBar,
  WorkspaceHubTopChrome,
} from "@/components/dashboard/workspace-hub/workspace-hub-chrome";
import {
  WorkspaceOverviewMobileNav,
  WorkspaceOverviewSidebar,
} from "@/components/dashboard/workspace-hub/workspace-overview-sidebar";
import {
  WorkspacePageMetaProvider,
  useWorkspacePageMetaContext,
} from "@/components/dashboard/workspace-hub/workspace-page-meta-context";
import {
  readCreateWorkspaceDraftLogo,
  templatesToWorkspaces,
  type WorkspaceCardModel,
} from "@/components/dashboard/workspace-hub/workspace-hub-model";
import { useLoginTransition } from "@/components/auth/login-transition-provider";
import { useFreighter } from "@/hooks/useFreighter";
import { useAppSession } from "@/hooks/useAppSession";
import { loadSavedTemplates, type SavedTemplate } from "@/lib/my-templates-storage";
import { getDefaultWorkspaceBreadcrumbs } from "@/lib/workspace-nav-routes";
import {
  getWorkspaceTierState,
  WORKSPACE_TIER_UPDATED_EVENT,
} from "@/lib/workspace-tier-context";
import { POST_SIGN_OUT_PATH } from "@/lib/launch-auth";
import { useDemoMode } from "@/components/demo/demo-mode-provider";

async function fetchWorkspaceTemplates(publicKey: string | null): Promise<SavedTemplate[]> {
  try {
    const res = await fetch("/api/templates", { cache: "no-store", credentials: "same-origin" });
    if (res.ok) {
      const json = (await res.json()) as { templates?: SavedTemplate[] };
      if (Array.isArray(json.templates)) return json.templates;
    }
  } catch {
    /* fall through */
  }
  return loadSavedTemplates(publicKey);
}

function WorkspaceLayoutInner({
  children,
  topSlot,
}: {
  children: ReactNode;
  topSlot?: ReactNode;
}) {
  const pathname = usePathname();
  const { publicKey, disconnect } = useFreighter();
  const { isPrivy, privyUser } = useAppSession();
  const { startLoginTransition } = useLoginTransition();
  const { meta: pageMeta } = useWorkspacePageMetaContext() ?? { meta: null };
  const { isDemo } = useDemoMode();

  const [workspaces, setWorkspaces] = useState<WorkspaceCardModel[]>([]);
  const [workspaceName, setWorkspaceName] = useState("Workspace");
  const [profileName, setProfileName] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [templates, profileRes] = await Promise.all([
        fetchWorkspaceTemplates(publicKey),
        fetch("/api/business/profile", { credentials: "same-origin" }).then((r) =>
          r.ok ? r.json() : null
        ),
      ]);

      const profile = profileRes as {
        name?: string;
        activeTemplate?: { businessName?: string; name?: string };
      } | null;
      if (profile?.name) setProfileName(String(profile.name));

      const tpl = profile?.activeTemplate;
      if (tpl && typeof tpl.businessName === "string" && tpl.businessName.trim()) {
        setWorkspaceName(tpl.businessName.trim());
      } else if (tpl && typeof tpl.name === "string" && tpl.name.trim()) {
        setWorkspaceName(tpl.name.trim());
      }

      setWorkspaces(
        templatesToWorkspaces(templates, { logoUrl: readCreateWorkspaceDraftLogo() })
      );
    } catch {
      setWorkspaces([]);
    }
  }, [publicKey]);

  useEffect(() => {
    const syncTier = () => {
      const state = getWorkspaceTierState();
      if (state?.businessName?.trim()) setWorkspaceName(state.businessName.trim());
    };
    syncTier();
    window.addEventListener(WORKSPACE_TIER_UPDATED_EVENT, syncTier);
    return () => window.removeEventListener(WORKSPACE_TIER_UPDATED_EVENT, syncTier);
  }, []);

  useEffect(() => {
    if (!publicKey && !isPrivy) return;
    void loadData();
  }, [publicKey, isPrivy, loadData]);

  const displayName =
    profileName.trim() ||
    privyUser?.name?.trim() ||
    (publicKey ? "Wallet User" : "User");

  const email =
    privyUser?.email?.trim() ||
    (publicKey ? `${publicKey.slice(0, 6)}…${publicKey.slice(-4)}` : "");

  const handleSignOut = () => {
    if (isDemo) {
      window.location.assign("/");
      return;
    }
    startLoginTransition("Signing out…");
    void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
      .catch(() => {})
      .finally(() => {
        window.dispatchEvent(new Event("hypertron-sign-out"));
        disconnect();
        window.location.assign(POST_SIGN_OUT_PATH);
      });
  };

  const chromeMeta = pageMeta ?? {
    breadcrumbs: getDefaultWorkspaceBreadcrumbs(pathname),
  };

  return (
    <div className="flex min-h-screen bg-transparent">
      <WorkspaceOverviewSidebar
        userName={displayName}
        userEmail={email}
        workspaceName={workspaceName}
        onSignOut={handleSignOut}
      />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
        {chromeMeta.title ? (
          <WorkspaceHubTopChrome
            breadcrumbs={chromeMeta.breadcrumbs}
            title={chromeMeta.title}
            subtitle={chromeMeta.subtitle}
            workspaces={workspaces}
          />
        ) : (
          <WorkspaceHubShellBar breadcrumbs={chromeMeta.breadcrumbs} workspaces={workspaces} />
        )}
        <div className="flex-1 overflow-y-auto">
          <div className="w-full px-5 pb-8 pt-4 lg:px-6">
            <WorkspaceOverviewMobileNav workspaceName={workspaceName} />
            {topSlot}
            <div className="workspace-hub-page-content w-full">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceLayout({
  children,
  topSlot,
}: {
  children: ReactNode;
  topSlot?: ReactNode;
}) {
  return (
    <WorkspacePageMetaProvider>
      <WorkspaceLayoutInner topSlot={topSlot}>{children}</WorkspaceLayoutInner>
    </WorkspacePageMetaProvider>
  );
}
