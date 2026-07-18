"use client";

import Link from "next/link";
import { HypertronLogoMark } from "@/components/global/hypertron-logo-mark";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  CreditCard,
  Settings,
  LifeBuoy,
  Search,
  Check,
  Loader2,
} from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { WorkspaceHubUserMenu } from "@/components/dashboard/workspace-hub/workspace-hub-user-menu";
import { CreateWorkspaceButton } from "@/components/dashboard/workspace-hub/use-create-workspace-nav";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { cn } from "@/utils";
import { useDemoMode } from "@/components/demo/demo-mode-provider";
import { normalizeAppPathname } from "@/lib/workspace-hub-shell-routes";
import { PendingNavProvider, usePendingNav } from "@/hooks/usePendingNavigation";

const NAV: {
  label: string;
  href: string;
  icon: typeof LayoutGrid;
  badge?: number;
  disabled?: boolean;
}[] = [
  { label: "Workspaces", href: "/dashboard", icon: LayoutGrid },
  { label: "Templates", href: "/dashboard/templates", icon: FileText, disabled: true },
  { label: "Billing & Plans", href: "/dashboard/billing", icon: CreditCard },
  { label: "Settings", href: "/dashboard/account", icon: Settings },
  { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
];

type WorkspaceHubSidebarProps = {
  userName: string;
  userEmail: string;
  onSignOut: () => void | Promise<void>;
};

export function WorkspaceHubSidebar({
  userName,
  userEmail,
  onSignOut,
}: WorkspaceHubSidebarProps) {
  const pathname = usePathname() ?? "";
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const { isDemo, demoPath } = useDemoMode();
  const pathBase = normalizeAppPathname(pathname);

  return (
    <aside className="workspace-hub-sidebar flex h-screen w-[220px] shrink-0 flex-col rounded-tl-[28px] border-r border-ui-border/80">
      {/* Brand */}
      <div className="px-4 pb-3 pt-5">
        <Link href={demoPath("/dashboard")} className="flex min-w-0 items-center gap-2.5">
          <HypertronLogoMark size={32} />
          <span className={cn("truncate text-[15px] font-semibold tracking-tight", t.brandText)}>
            Hypertron
          </span>
        </Link>
      </div>

      {/* Search */}
      <div className="px-4 pb-5">
        <div
          className={cn(
            "relative flex h-10 items-center rounded-full border",
            t.sidebarSearch
          )}
        >
          <Search
            className={cn(
              "pointer-events-none absolute left-3.5 h-4 w-4",
              t.dark ? "text-slate-500" : "text-neutral-400"
            )}
            strokeWidth={1.75}
          />
          <input
            type="search"
            placeholder="Search"
            className="h-full w-full rounded-full bg-transparent pl-10 pr-12 text-sm focus:outline-none"
            aria-label="Search"
          />
          <kbd
            className={cn(
              "pointer-events-none absolute right-2 flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 text-[11px] font-medium",
              t.sidebarKbd
            )}
          >
            /
          </kbd>
        </div>
      </div>

      {/* Navigation */}
      <PendingNavProvider>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
          <HubSidebarNavItems pathBase={pathBase} isDemo={isDemo} demoPath={demoPath} themeClasses={t} />
        </nav>
      </PendingNavProvider>

      {/* Promo + signed-in user */}
      <div className="space-y-3 px-4 pb-5 pt-2">
        <div className="workspace-hub-promo-card rounded-2xl p-4 shadow-none">
          <p className={cn("text-[13px] font-semibold leading-snug", t.promoTitle)}>
            Run your entire Web3 company, from one place.
          </p>
          <ul className="mt-3 space-y-2">
            {["Treasury", "Operations", "Compliance", "And more…"].map((item) => (
              <li key={item} className={cn("flex items-center gap-2 text-[12px]", t.promoItem)}>
                <Check className="h-3.5 w-3.5 shrink-0 text-blue-600" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>
          <CreateWorkspaceButton
            className="hub-cta mt-4 h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-500"
          />
        </div>

        <WorkspaceHubUserMenu
          userName={userName}
          userEmail={userEmail}
          onSignOut={onSignOut}
        />
      </div>
    </aside>
  );
}

function HubSidebarNavItems({
  pathBase,
  isDemo,
  demoPath,
  themeClasses: t,
}: {
  pathBase: string;
  isDemo: boolean;
  demoPath: (path: string) => string;
  themeClasses: ReturnType<typeof hubThemeClasses>;
}) {
  const { markPending, isPending } = usePendingNav();

  return (
    <>
      {NAV.map(({ label, href, icon: Icon, badge, disabled: disabledProp }) => {
        const disabled = disabledProp && !isDemo;
        const linkHref = demoPath(href);
        const active =
          !disabled &&
          (href === "/dashboard" ? pathBase === "/dashboard" : pathBase.startsWith(href));
        const pending = !disabled && isPending(linkHref);

        const itemContent = (
          <>
            {pending ? (
              <Loader2
                className={cn("h-[18px] w-[18px] shrink-0 animate-spin", t.sidebarNavIcon(active))}
                strokeWidth={1.75}
              />
            ) : (
              <Icon
                className={cn("h-[18px] w-[18px] shrink-0", t.sidebarNavIcon(active))}
                strokeWidth={1.75}
              />
            )}
            <span className="flex-1">{label}</span>
            {badge ? (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {badge}
              </span>
            ) : null}
          </>
        );

        if (disabled) {
          return (
            <span
              key={label}
              aria-disabled="true"
              title="Coming soon"
              className={cn(
                "group flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium opacity-45",
                t.dark ? "text-slate-500" : "text-neutral-400"
              )}
            >
              {itemContent}
            </span>
          );
        }

        return (
          <Link
            key={label}
            href={linkHref}
            prefetch
            aria-busy={pending}
            onClick={() => {
              if (!active) markPending(linkHref);
            }}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
              active ? t.sidebarNavActive : t.sidebarNav,
              pending && "pointer-events-none opacity-80"
            )}
          >
            {itemContent}
          </Link>
        );
      })}
    </>
  );
}
