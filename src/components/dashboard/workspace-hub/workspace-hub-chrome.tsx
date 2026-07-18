"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, LayoutGrid } from "lucide-react";
import { HubThemeToggleButton } from "@/components/dashboard/hub-theme-toggle-button";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  buildHubNotifications,
  summarizeWorkspaces,
} from "@/components/dashboard/workspace-hub/workspace-hub-notifications";
import type { WorkspaceStatsSource } from "./workspace-hub-notifications";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { cn } from "@/utils";

export type HubBreadcrumb = {
  label: string;
  href?: string;
  current?: boolean;
};

function useWorkspaceHubNotifications(workspaces: WorkspaceStatsSource[]) {
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(
    () => new Set()
  );

  const summary = useMemo(() => summarizeWorkspaces(workspaces), [workspaces]);
  const hubNotifications = useMemo(() => buildHubNotifications(summary), [summary]);

  const isNotificationUnread = useCallback(
    (id: string, defaultUnread: boolean) =>
      defaultUnread && !readNotificationIds.has(id),
    [readNotificationIds]
  );

  const notificationBadgeCount = useMemo(
    () =>
      hubNotifications.filter(
        (item) => item.defaultUnread && !readNotificationIds.has(item.id)
      ).length,
    [hubNotifications, readNotificationIds]
  );

  const markNotificationRead = useCallback((id: string) => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setReadNotificationIds(new Set(hubNotifications.map((item) => item.id)));
  }, [hubNotifications]);

  return {
    hubNotifications,
    notificationBadgeCount,
    markNotificationRead,
    markAllNotificationsRead,
    isNotificationUnread,
  };
}

function WorkspaceHubHeaderActions({
  workspaces,
}: {
  workspaces: WorkspaceStatsSource[];
}) {
  const { theme } = useDashboardTheme();
  const dark = theme === "dark";
  const {
    hubNotifications,
    notificationBadgeCount,
    markNotificationRead,
    markAllNotificationsRead,
    isNotificationUnread,
  } = useWorkspaceHubNotifications(workspaces);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <HubThemeToggleButton />
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-full border shadow-none transition-colors",
              theme === "light"
                ? "border-ui-border/80 bg-white hover:bg-neutral-50"
                : "border-0 bg-white/[0.08] hover:bg-white/[0.12]"
            )}
            aria-label="Notifications"
          >
            <Bell
              className={cn(
                "h-[18px] w-[18px]",
                theme === "light" ? "text-neutral-700" : "text-slate-200"
              )}
              strokeWidth={1.75}
            />
            {notificationBadgeCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {notificationBadgeCount > 99 ? "99+" : notificationBadgeCount}
              </span>
            ) : null}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className={cn(
            "w-[min(100vw-2rem,380px)] overflow-hidden rounded-xl border p-0 shadow-lg",
            theme === "light"
              ? "border-slate-200 bg-white text-slate-900"
              : "border-white/10 bg-slate-900 text-slate-100"
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between gap-3 border-b px-4 py-3",
              dark ? "border-white/10" : "border-slate-100"
            )}
          >
            <div>
              <p className={cn("text-sm font-semibold", dark ? "text-slate-100" : "text-slate-900")}>
                Notifications
              </p>
              <p className={cn("mt-0.5 text-xs", dark ? "text-slate-400" : "text-slate-500")}>
                {notificationBadgeCount > 0
                  ? `${notificationBadgeCount} unread`
                  : "You're all caught up"}
              </p>
            </div>
            {notificationBadgeCount > 0 ? (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className={cn(
                  "shrink-0 text-xs font-medium",
                  dark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                )}
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div
            className={cn(
              "max-h-[min(70vh,400px)] overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent",
              dark
                ? "[scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15"
                : "[scrollbar-color:rgb(226_232_240)_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200"
            )}
          >
            {hubNotifications.map((item) => {
              const unread = isNotificationUnread(item.id, item.defaultUnread);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markNotificationRead(item.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0",
                    dark
                      ? cn(
                          "border-white/[0.06] hover:bg-white/[0.06]",
                          unread && "bg-blue-500/10"
                        )
                      : cn(
                          "border-slate-50 hover:bg-slate-50/80",
                          unread && "bg-blue-50/50"
                        )
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      dark ? item.iconBgDark : item.iconBg,
                      unread
                        ? dark
                          ? "ring-1 ring-blue-500/30"
                          : "ring-1 ring-blue-100"
                        : "opacity-80"
                    )}
                  >
                    <Icon
                      className={cn("h-4 w-4", dark ? item.iconColorDark : item.iconColor)}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-[13px] leading-snug",
                          unread
                            ? dark
                              ? "font-semibold text-slate-100"
                              : "font-semibold text-slate-900"
                            : dark
                              ? "font-medium text-slate-400"
                              : "font-medium text-slate-600"
                        )}
                      >
                        {item.title}
                      </p>
                      <span className={cn("shrink-0 text-[11px]", dark ? "text-slate-500" : "text-slate-400")}>
                        {item.time}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 text-xs leading-relaxed",
                        unread
                          ? dark
                            ? "text-slate-300"
                            : "text-slate-600"
                          : dark
                            ? "text-slate-500"
                            : "text-slate-400"
                      )}
                    >
                      {item.message}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "mt-2 h-2 w-2 shrink-0 rounded-full",
                      unread ? "bg-blue-500" : "bg-transparent"
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function HubBreadcrumbTrail({ breadcrumbs }: { breadcrumbs: HubBreadcrumb[] }) {
  const { theme } = useDashboardTheme();
  const muted = theme === "dark" ? "text-slate-400" : "text-neutral-500";
  const current = theme === "dark" ? "text-slate-100" : "text-neutral-900";
  const link = theme === "dark" ? "text-slate-400 hover:text-slate-200" : "text-neutral-500 hover:text-neutral-700";
  const sep = theme === "dark" ? "text-slate-500" : "text-neutral-400";
  const icon = theme === "dark" ? "text-slate-500" : "text-neutral-400";

  return (
    <Breadcrumb>
      <BreadcrumbList className={cn("flex-wrap gap-2 text-sm", muted)}>
        {breadcrumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="contents">
            {index > 0 ? (
              <BreadcrumbSeparator className={cn(sep, "[&>svg]:hidden")}>
                <span className={sep}>/</span>
              </BreadcrumbSeparator>
            ) : null}
            <BreadcrumbItem className={cn(index === 0 && "gap-2")}>
              {index === 0 ? (
                <LayoutGrid className={cn("h-4 w-4", icon)} strokeWidth={1.75} aria-hidden />
              ) : null}
              {crumb.current ? (
                <BreadcrumbPage className={cn("font-semibold", current)}>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild className={cn("font-normal", link)}>
                  <Link href={crumb.href ?? "#"}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

/** Breadcrumb row + theme / notifications (workspace feature pages). */
export function WorkspaceHubShellBar({
  breadcrumbs,
  workspaces,
}: {
  breadcrumbs: HubBreadcrumb[];
  workspaces: WorkspaceStatsSource[];
}) {
  const { theme } = useDashboardTheme();
  return (
    <header
      className="flex shrink-0 items-center justify-between gap-4 px-5 py-3 lg:px-6"
    >
      <HubBreadcrumbTrail breadcrumbs={breadcrumbs} />
      <WorkspaceHubHeaderActions workspaces={workspaces} />
    </header>
  );
}

export function WorkspaceHubTopChrome({
  breadcrumbs,
  title,
  subtitle,
  workspaces,
}: {
  breadcrumbs: HubBreadcrumb[];
  title?: string;
  subtitle?: string;
  workspaces: WorkspaceStatsSource[];
}) {
  const { theme } = useDashboardTheme();
  return (
    <div className="shrink-0">
      <header className="flex items-center justify-between gap-4 px-5 py-3 lg:px-6">
        <HubBreadcrumbTrail breadcrumbs={breadcrumbs} />
        <WorkspaceHubHeaderActions workspaces={workspaces} />
      </header>

      {title ? (
        <div className="px-5 pb-3 pt-0 lg:px-6">
          <h1
            className={cn(
              "text-[17px] font-semibold tracking-tight",
              theme === "light" ? "text-neutral-900" : "text-slate-100"
            )}
          >
            {title}
          </h1>
          {subtitle ? (
            <p
              className={cn(
                "mt-0.5 text-[12px]",
                theme === "light" ? "text-neutral-500" : "text-slate-400"
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
