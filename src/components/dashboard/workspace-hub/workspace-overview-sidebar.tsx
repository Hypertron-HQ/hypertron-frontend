"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LifeBuoy,
  Loader2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  buildWorkspaceNavGroup,
  buildWorkspaceQuickActionsGroup,
} from "@/components/dashboard/layout/data/sidebar-data";
import type { NavCollapsible, NavItem, NavLink } from "@/components/dashboard/layout/types";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { WorkspaceHubUserMenu } from "@/components/dashboard/workspace-hub/workspace-hub-user-menu";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import {
  getWorkspaceTierState,
  syncWorkspaceTierFromLatestTemplate,
  WORKSPACE_TIER_UPDATED_EVENT,
} from "@/lib/workspace-tier-context";
import { cn } from "@/utils";
import { useDemoMode } from "@/components/demo/demo-mode-provider";
import { normalizeAppPathname } from "@/lib/workspace-hub-shell-routes";
import { PendingNavProvider, usePendingNav } from "@/hooks/usePendingNavigation";

type WorkspaceOverviewSidebarProps = {
  userName: string;
  userEmail: string;
  workspaceName?: string;
  onSignOut: () => void | Promise<void>;
};

function isPathActive(pathname: string, url: string) {
  const base = normalizeAppPathname(pathname);
  if (base === url) return true;
  if (url === "/dashboard/overview" && base.startsWith("/dashboard/overview")) return true;
  if (url === "/dashboard/documents" && base.startsWith("/dashboard/documents")) return true;
  if (url === "/dashboard/document-vault" && base.startsWith("/dashboard/document-vault")) return true;
  return base.startsWith(`${url}/`);
}

function NavItemBadge({ children }: { children: string }) {
  return (
    <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold leading-none text-white">
      {children}
    </span>
  );
}

function HubNavLink({ item, pathname }: { item: NavLink; pathname: string }) {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const { demoPath } = useDemoMode();
  const { markPending, isPending } = usePendingNav();
  const active = !item.disabled && isPathActive(pathname, item.url);
  const Icon = item.icon;
  const href = demoPath(item.url);
  const pending = !item.disabled && isPending(href);

  const content = (
    <>
      {pending ? (
        <Loader2
          className={cn("h-[18px] w-[18px] shrink-0 animate-spin", t.sidebarNavIcon(active))}
          strokeWidth={1.75}
        />
      ) : Icon ? (
        <Icon className={cn("h-[18px] w-[18px] shrink-0", t.sidebarNavIcon(active))} strokeWidth={1.75} />
      ) : null}
      <span className="flex-1 truncate">{item.title}</span>
      {item.badge ? <NavItemBadge>{item.badge}</NavItemBadge> : null}
    </>
  );

  if (item.disabled) {
    return (
      <span
        aria-disabled="true"
        title="Coming soon"
        className={cn(
          "group flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium opacity-45",
          t.dark ? "text-slate-500" : "text-neutral-400"
        )}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      prefetch
      aria-busy={pending}
      onClick={() => {
        if (!active) markPending(href);
      }}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
        active ? t.sidebarNavActive : t.sidebarNav,
        pending && "pointer-events-none opacity-80"
      )}
    >
      {content}
    </Link>
  );
}

function HubNavCollapsible({ item, pathname }: { item: NavCollapsible; pathname: string }) {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const { demoPath } = useDemoMode();
  const { markPending, isPending } = usePendingNav();
  const Icon = item.icon;
  const childActive = item.items.some((sub) => isPathActive(pathname, sub.url));
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        type="button"
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition-colors",
          childActive ? t.sidebarNavActive : t.sidebarNav
        )}
      >
        {Icon ? (
          <Icon
            className={cn("h-[18px] w-[18px] shrink-0", t.sidebarNavIcon(childActive))}
            strokeWidth={1.75}
          />
        ) : null}
        <span className="flex-1 truncate">{item.title}</span>
        {item.badge ? <NavItemBadge>{item.badge}</NavItemBadge> : null}
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            t.dark ? "text-slate-500" : "text-neutral-400",
            open && "rotate-90"
          )}
          strokeWidth={1.75}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pb-1 pl-3 pt-0.5">
        {item.items.map((sub) => {
          const SubIcon = sub.icon;
          const subHref = demoPath(sub.url);
          const active = isPathActive(pathname, sub.url);
          const pending = isPending(subHref);
          return (
            <Link
              key={`${sub.title}-${sub.url}`}
              href={subHref}
              prefetch
              aria-busy={pending}
              onClick={() => {
                if (!active) markPending(subHref);
              }}
              className={cn(
                "group flex items-center gap-3 rounded-lg py-2 pl-7 pr-3 text-[12px] font-medium transition-colors",
                active ? t.sidebarNavActive : t.sidebarNav,
                pending && "pointer-events-none opacity-80"
              )}
            >
              {pending ? (
                <Loader2
                  className={cn("h-4 w-4 shrink-0 animate-spin", t.sidebarNavIcon(active))}
                  strokeWidth={1.75}
                />
              ) : SubIcon ? (
                <SubIcon
                  className={cn("h-4 w-4 shrink-0", t.sidebarNavIcon(active))}
                  strokeWidth={1.75}
                />
              ) : null}
              <span className="flex-1 truncate">{sub.title}</span>
              {sub.badge ? <NavItemBadge>{sub.badge}</NavItemBadge> : null}
            </Link>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

function HubNavGroup({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  return (
    <div className="space-y-0.5">
      <p
        className={cn(
          "px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider",
          t.dark ? "text-slate-500" : "text-neutral-400"
        )}
      >
        {title}
      </p>
      {items.map((item) => {
        const key = `${item.title}-${"url" in item ? item.url : "group"}`;
        if ("items" in item && item.items) {
          return <HubNavCollapsible key={key} item={item} pathname={pathname} />;
        }
        return <HubNavLink key={key} item={item as NavLink} pathname={pathname} />;
      })}
    </div>
  );
}

export function WorkspaceOverviewSidebar({
  userName,
  userEmail,
  workspaceName: workspaceNameProp,
  onSignOut,
}: WorkspaceOverviewSidebarProps) {
  const pathname = usePathname() ?? "";
  const [workspaceName, setWorkspaceName] = useState(workspaceNameProp?.trim() || "Workspace");

  useEffect(() => {
    syncWorkspaceTierFromLatestTemplate();
    const sync = () => {
      const state = getWorkspaceTierState();
      const fromTier = state?.businessName?.trim();
      if (fromTier) setWorkspaceName(fromTier);
      else if (workspaceNameProp?.trim()) setWorkspaceName(workspaceNameProp.trim());
    };
    sync();
    window.addEventListener(WORKSPACE_TIER_UPDATED_EVENT, sync);
    return () => window.removeEventListener(WORKSPACE_TIER_UPDATED_EVENT, sync);
  }, [workspaceNameProp]);

  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const { isDemo, demoPath } = useDemoMode();
  const workspaceGroup = buildWorkspaceNavGroup({ enableAllLinks: isDemo });
  const quickActionsGroup = buildWorkspaceQuickActionsGroup({ enableAllLinks: isDemo });

  return (
    <aside className="workspace-hub-sidebar hidden h-screen w-[220px] shrink-0 flex-col rounded-tl-[28px] border-r border-ui-border/80 lg:flex">
      {/* Workspace switcher */}
      <div className="px-4 pb-2 pt-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
                t.dark
                  ? "border-white/10 bg-white/10 hover:bg-white/15"
                  : "border-ui-border/80 bg-white hover:bg-neutral-50"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Building2 className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-semibold tracking-tight", t.brandText)}>
                  {workspaceName}
                </p>
                <p className={cn("text-[11px]", t.cardMeta)}>Founder</p>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0", t.dark ? "text-slate-500" : "text-neutral-400")}
                strokeWidth={1.75}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="workspace-hub-user-menu-content w-56 rounded-xl border border-ui-border/80 bg-white p-1"
          >
            <DropdownMenuItem
              asChild
              className="hub-menu-item cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-neutral-700 focus:bg-neutral-100 data-[highlighted]:bg-neutral-100"
            >
              <Link href={demoPath("/dashboard")} className="flex items-center gap-2.5">
                <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
                All workspaces
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Workspace navigation */}
      <PendingNavProvider>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
          <HubNavGroup title={workspaceGroup.title} items={workspaceGroup.items} pathname={pathname} />
          <HubNavGroup
            title={quickActionsGroup.title}
            items={quickActionsGroup.items}
            pathname={pathname}
          />
        </nav>

        {/* Help + user */}
        <div className="space-y-3 px-4 pb-5 pt-2">
          <SidebarHelpLink demoPath={demoPath} themeClasses={t} />

        <WorkspaceHubUserMenu
          userName={userName}
          userEmail={userEmail}
          onSignOut={onSignOut}
        />
        </div>
      </PendingNavProvider>
    </aside>
  );
}

export function WorkspaceOverviewMobileNav({
  workspaceName: workspaceNameProp,
}: {
  workspaceName?: string;
}) {
  const pathname = usePathname() ?? "";
  const [workspaceName, setWorkspaceName] = useState(workspaceNameProp?.trim() || "Workspace");
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const { isDemo, demoPath } = useDemoMode();
  const workspaceGroup = buildWorkspaceNavGroup({ enableAllLinks: isDemo });
  const quickActionsGroup = buildWorkspaceQuickActionsGroup({ enableAllLinks: isDemo });
  const navItems = [...workspaceGroup.items, ...quickActionsGroup.items].filter(
    (item): item is NavLink => "url" in item
  );

  useEffect(() => {
    syncWorkspaceTierFromLatestTemplate();
    const sync = () => {
      const state = getWorkspaceTierState();
      const fromTier = state?.businessName?.trim();
      if (fromTier) setWorkspaceName(fromTier);
      else if (workspaceNameProp?.trim()) setWorkspaceName(workspaceNameProp.trim());
    };
    sync();
    window.addEventListener(WORKSPACE_TIER_UPDATED_EVENT, sync);
    return () => window.removeEventListener(WORKSPACE_TIER_UPDATED_EVENT, sync);
  }, [workspaceNameProp]);

  return (
    <div className="lg:hidden">
      <div
        className={cn(
          "mb-3 flex items-center gap-3 rounded-2xl border px-3 py-3",
          t.dark ? "border-white/10 bg-white/10" : "border-ui-border/80 bg-white"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Building2 className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-semibold tracking-tight", t.brandText)}>
            {workspaceName}
          </p>
          <p className={cn("text-[11px]", t.cardMeta)}>Founder</p>
        </div>
        <Link
          href={demoPath("/dashboard")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
            t.dark
              ? "border-white/10 text-slate-200"
              : "border-ui-border/80 text-neutral-700"
          )}
        >
          Workspaces
        </Link>
      </div>

      <PendingNavProvider>
        <nav className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <MobileNavPill
              key={`${item.title}-${item.url}`}
              item={item}
              pathname={pathname}
              demoPath={demoPath}
              themeClasses={t}
            />
          ))}
        </nav>
      </PendingNavProvider>
    </div>
  );
}

function MobileNavPill({
  item,
  pathname,
  demoPath,
  themeClasses: t,
}: {
  item: NavLink;
  pathname: string;
  demoPath: (path: string) => string;
  themeClasses: ReturnType<typeof hubThemeClasses>;
}) {
  const { markPending, isPending } = usePendingNav();
  const active = !item.disabled && isPathActive(pathname, item.url);
  const href = demoPath(item.url);
  const pending = !item.disabled && isPending(href);
  const Icon = item.icon;

  if (item.disabled) {
    return null;
  }

  return (
    <Link
      href={href}
      prefetch
      aria-busy={pending}
      onClick={() => {
        if (!active) markPending(href);
      }}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
        active
          ? t.sidebarNavActive
          : t.dark
            ? "border-white/10 bg-white/[0.04] text-slate-300"
            : "border-ui-border/80 bg-white text-neutral-600",
        pending && "pointer-events-none opacity-80"
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={1.75} />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      ) : null}
      <span>{item.title}</span>
      {item.badge ? <NavItemBadge>{item.badge}</NavItemBadge> : null}
    </Link>
  );
}

function SidebarHelpLink({
  demoPath,
  themeClasses: t,
}: {
  demoPath: (path: string) => string;
  themeClasses: ReturnType<typeof hubThemeClasses>;
}) {
  const { markPending, isPending } = usePendingNav();
  const href = demoPath("/dashboard/workspace/help");
  const pending = isPending(href);

  return (
    <Link
      href={href}
      aria-busy={pending}
      onClick={() => markPending(href)}
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors",
        t.dark
          ? "border-white/10 bg-blue-950/40 hover:bg-blue-950/60"
          : "border-ui-border/60 bg-blue-50/50 hover:bg-blue-50",
        pending && "pointer-events-none opacity-80"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          t.dark ? "bg-blue-600/30 text-blue-300" : "bg-blue-100 text-blue-600"
        )}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
        ) : (
          <LifeBuoy className="h-4 w-4" strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0">
        <p className={cn("text-xs font-semibold", t.promoTitle)}>Need Help?</p>
        <p className={cn("text-[11px]", t.cardMeta)}>Chat with support</p>
      </div>
    </Link>
  );
}
