"use client";

import { usePathname } from "next/navigation";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { DashboardRouteLoading } from "@/components/dashboard/workspace-hub/dashboard-route-loading";
import {
  HubChromeHeaderSkeleton,
  HubSidebarSkeleton,
} from "@/components/dashboard/workspace-hub/hub-content-skeletons";
import { isHubNavRoute } from "@/lib/hub-nav-routes";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";

/**
 * Full chrome skeleton shown while session is resolving or redirecting.
 * Matches the hub / workspace layout so sign-in and sign-out never flash a blank screen.
 */
export function AppSessionLoadingShell() {
  const pathname = usePathname();
  const { theme } = useDashboardTheme();
  const isHub = isHubNavRoute(pathname);

  return (
    <div
      className={cn(
        "flex min-h-screen bg-transparent",
        theme === "light" ? "text-slate-900" : "text-slate-100"
      )}
      aria-busy="true"
      aria-label="Loading"
    >
      <HubSidebarSkeleton />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
        {isHub ? (
          <HubChromeHeaderSkeleton />
        ) : (
          <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-3 lg:px-6">
            <Skeleton className="h-4 w-56" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </header>
        )}
        <div
          className={
            isHub
              ? "flex-1 overflow-y-auto px-8 pb-8 pt-2"
              : "flex-1 overflow-y-auto px-5 pb-8 pt-4 lg:px-6"
          }
        >
          <DashboardRouteLoading />
        </div>
      </div>
    </div>
  );
}
