"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DashboardThemeProvider, useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { DemoBanner } from "@/components/demo/demo-banner";
import { DemoModeProvider } from "@/components/demo/demo-mode-provider";
import { DemoAppSessionProvider } from "@/components/auth/app-session-provider";
import { cn } from "@/utils";
import { isDemoEmbedRoute, usesWorkspaceHubShell } from "@/lib/workspace-hub-shell-routes";

function DemoLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hubShell = usesWorkspaceHubShell(pathname);
  const isEmbed = isDemoEmbedRoute(pathname);
  const { theme } = useDashboardTheme();
  const activeTheme = isEmbed ? "light" : theme;

  return (
    <div
      data-theme={hubShell ? activeTheme : undefined}
      suppressHydrationWarning
      className={cn(
        hubShell ? "workspace-hub-root" : isEmbed ? "bg-white" : "marketing-mono dashboard-gradient-bg",
        "font-default relative min-h-screen antialiased",
        hubShell ? (activeTheme === "light" ? "text-slate-900" : "text-slate-100") : "text-slate-900"
      )}
    >
      {!hubShell && !isEmbed ? (
        <div className="border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <DemoBanner />
        </div>
      ) : null}
      {children}
    </div>
  );
}

export default function DemoRootLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardThemeProvider>
      <DemoModeProvider forcedDemo>
        <DemoAppSessionProvider>
          <DemoLayoutInner>{children}</DemoLayoutInner>
        </DemoAppSessionProvider>
      </DemoModeProvider>
    </DashboardThemeProvider>
  );
}
