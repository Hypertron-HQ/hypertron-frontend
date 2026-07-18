"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getCookie } from "@/lib/cookies";
import { cn } from "@/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar";
import { DashboardThemeProvider, useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { useFreighter } from "@/hooks/useFreighter";
import { useAppSession } from "@/hooks/useAppSession";
import { sidebarData } from "@/components/dashboard/layout/data/sidebar-data";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { ConnectWalletBanner } from "@/components/dashboard/connect-wallet-banner";
import { ProtectedRouteGuard } from "@/components/auth/protected-route-guard";
import { useLoginTransition } from "@/components/auth/login-transition-provider";
import { usesWorkspaceHubShell } from "@/lib/workspace-hub-shell-routes";
import { POST_SIGN_OUT_PATH, homeLaunchPath } from "@/lib/launch-auth";

function MainLayoutShell({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useDashboardTheme();
  const pathname = usePathname();
  const { publicKey, disconnect, isPrivyWallet } = useFreighter();
  const { data: session, loading: sessionLoading, isPrivy, privyUser } = useAppSession();
  const { startLoginTransition } = useLoginTransition();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (cancelled || res.status === 401) return;
      const data = (await res.json().catch(() => null)) as
        | { auth?: string; walletAddress?: string }
        | null;
      if (data?.auth !== "wallet" || isPrivyWallet) return;
      const sessionWallet = data.walletAddress?.trim();
      if (!sessionWallet) return;
      if (publicKey && sessionWallet !== publicKey) {
        disconnect();
        const ret = pathname && pathname.startsWith("/") ? pathname : "/dashboard";
        window.location.assign(homeLaunchPath(ret, { wallet: true }));
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [publicKey, disconnect, pathname, isPrivyWallet]);

  const handleSignOut = () => {
    startLoginTransition("Signing out…");
    void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
      .catch(() => {})
      .finally(() => {
        window.dispatchEvent(new Event("hypertron-sign-out"));
        disconnect();
        window.location.assign(POST_SIGN_OUT_PATH);
      });
  };

  const defaultOpen = getCookie("sidebar_state") !== "false";

  const user = publicKey
    ? {
        name: "Wallet",
        email: `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`,
        avatar: "",
      }
    : privyUser
      ? {
          name: privyUser.name?.trim() || "Account",
          email: privyUser.email?.trim() || privyUser.id.slice(0, 12) + "…",
          avatar: "",
        }
      : sidebarData.user;

  const showConnectWallet = !sessionLoading && isPrivy && !publicKey;
  const hubShell = usesWorkspaceHubShell(pathname);

  if (hubShell) {
    return (
      <div
        data-theme={theme}
        suppressHydrationWarning
        className={cn(
          "workspace-hub-root font-default relative min-h-screen antialiased",
          theme === "light" ? "text-slate-900" : "text-slate-100"
        )}
      >
        <ProtectedRouteGuard>
          <OnboardingGate
            when={!sessionLoading && !!session}
            autoRedirect={pathname !== "/CreateWorkspace"}
            walletAddress={publicKey}
            scopeKey={
              publicKey && publicKey.length === 56 && publicKey.startsWith("G")
                ? publicKey
                : privyUser?.id ?? null
            }
          >
            {children}
          </OnboardingGate>
        </ProtectedRouteGuard>
      </div>
    );
  }

  return (
    <ProtectedRouteGuard>
      <div
        className={cn(
          "marketing-mono font-default relative min-h-screen text-foreground antialiased dashboard-gradient-bg",
          theme === "light" ? "dashboard-light bg-[#f5f0ff]" : "bg-black"
        )}
      >
        <SidebarProvider defaultOpen={defaultOpen} className="!bg-transparent">
          <AppSidebar
            onDisconnect={handleSignOut}
            user={user}
            isSessionConnected={!!session || !!publicKey}
          />
          <SidebarInset className={cn("flex flex-1 flex-col bg-transparent min-h-screen")}>
            <div className="flex flex-1 flex-col px-4 pt-4 md:px-6 md:pt-6">
              <ConnectWalletBanner show={showConnectWallet} />
              <OnboardingGate
                when={!sessionLoading && !!session}
                walletAddress={publicKey}
                scopeKey={
                  publicKey && publicKey.length === 56 && publicKey.startsWith("G")
                    ? publicKey
                    : privyUser?.id ?? null
                }
              >
                {children}
              </OnboardingGate>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </ProtectedRouteGuard>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardThemeProvider>
      <MainLayoutShell>{children}</MainLayoutShell>
    </DashboardThemeProvider>
  );
}
