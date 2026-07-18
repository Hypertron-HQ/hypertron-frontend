import type { DashboardTheme } from "@/lib/dashboard-theme";
import { cn } from "@/utils";

/** Shared light/dark class sets for workspace hub surfaces */
export function hubThemeClasses(theme: DashboardTheme) {
  const dark = theme === "dark";

  return {
    dark,
    pageHeading: dark ? "text-slate-50" : "text-slate-900",
    pageSubheading: dark ? "text-slate-400" : "text-slate-500",
    actionTitle: dark ? "text-slate-50" : "text-[#1e1b4b]",
    actionBody: dark ? "text-slate-300" : "text-[#475569]",
    actionTag: dark
      ? "border-white/15 bg-white/10 text-slate-200"
      : "border-orange-200/60 bg-[#fff4eb] text-[#1e1b4b]",
    actionBadge: dark
      ? "bg-violet-500/25 text-violet-100 hover:bg-violet-500/25"
      : "bg-violet-100 text-[#1e1b4b] hover:bg-violet-100",
    templateCta: dark
      ? "border-white/15 bg-white/10 text-slate-100 hover:bg-white/15 hover:text-white"
      : "border-orange-200/40 bg-gradient-to-r from-[#fff7ed] via-[#ffedd5] to-[#ffe8d6] text-[#1e1b4b] hover:border-orange-300/50 hover:from-[#ffedd5] hover:via-[#ffe4cc] hover:to-[#ffd9b8]",
    card: dark
      ? "border-white/10 bg-slate-900/90 shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
      : "border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
    cardHeader: dark
      ? "bg-gradient-to-br from-blue-950/70 via-slate-900/90 to-slate-900"
      : "bg-gradient-to-br from-blue-100/80 via-sky-50/70 to-white",
    cardTitle: dark ? "text-slate-50" : "text-slate-900",
    cardMeta: dark ? "text-slate-400" : "text-slate-500",
    cardStat: dark ? "text-slate-50" : "text-slate-900",
    cardLabel: dark ? "text-slate-400" : "text-slate-500",
    cardMuted: dark ? "text-slate-500" : "text-slate-400",
    cardDivider: dark ? "border-white/10 divide-white/10" : "border-slate-100 divide-slate-100",
    cardRowLabel: dark ? "text-slate-400" : "text-slate-500",
    cardRowValue: dark ? "text-slate-200" : "text-slate-700",
    cardRowValueStrong: dark ? "text-slate-50" : "text-slate-900",
    menuBtn: dark
      ? "text-slate-400 hover:bg-white/10 hover:text-slate-200 data-[state=open]:bg-white/10 data-[state=open]:text-slate-200"
      : "text-slate-400 hover:bg-white/60 hover:text-slate-600 data-[state=open]:bg-white/60 data-[state=open]:text-slate-600",
    menuContent: dark
      ? "border-white/10 bg-slate-900 p-1 text-slate-100 shadow-lg"
      : "border-slate-200 bg-white p-1 text-slate-900 shadow-md",
    menuItem: dark
      ? "text-slate-200 focus:bg-white/10 focus:text-slate-100 data-[highlighted]:bg-white/10 data-[highlighted]:text-slate-100"
      : "text-neutral-700 focus:bg-neutral-100 focus:text-neutral-700 data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-700",
    menuIcon: dark ? "text-slate-300" : "text-neutral-700",
    menuSeparator: dark ? "bg-white/10" : "bg-slate-200",
    openCta: dark
      ? "bg-blue-600 text-white hover:bg-blue-500 hover:text-white"
      : "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700",
    selectTrigger: dark
      ? "border-white/10 bg-white/10 text-slate-100"
      : "border-slate-200 bg-white text-slate-900",
    selectContent: dark
      ? "border-white/10 bg-slate-900 text-slate-100"
      : "border-slate-200 bg-white text-slate-900",
    selectItem: dark
      ? "text-slate-200 focus:bg-white/10 focus:text-slate-50 data-[highlighted]:bg-white/10 data-[highlighted]:text-slate-50"
      : "text-slate-700 focus:bg-slate-100 focus:text-slate-900 data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-900",
    viewToggle: dark ? "border-white/10 bg-white/10" : "border-slate-200 bg-white",
    viewToggleActive: dark ? "bg-white/15" : "bg-slate-100",
    viewToggleIcon: dark ? "text-slate-200" : "text-slate-700",
    emptyCard: dark ? "border-dashed border-white/15 bg-white/5" : "border-dashed border-slate-200 bg-white",
    emptyIcon: dark ? "text-slate-600" : "text-slate-300",
    emptyTitle: dark ? "text-slate-200" : "text-slate-700",
    emptyBody: dark ? "text-slate-400" : "text-slate-500",
    outlineBtn: dark
      ? "border-white/15 bg-white/10 text-slate-100 hover:bg-white/15"
      : "border-slate-200 bg-white text-slate-900",
    sidebarSearch: dark
      ? "border-white/10 bg-white/10 text-slate-100 placeholder:text-slate-500"
      : "border-ui-border/60 bg-neutral-100/90 text-neutral-900 placeholder:text-neutral-400",
    sidebarKbd: dark
      ? "border-white/10 bg-white/10 text-slate-500"
      : "border-ui-border/80 bg-white text-neutral-400",
    sidebarNavActive: dark
      ? "bg-white/10 text-slate-50 shadow-sm"
      : "bg-neutral-100 text-neutral-900 shadow-sm",
    sidebarNav: dark
      ? "text-slate-400 hover:bg-white/10 hover:text-slate-100"
      : "text-neutral-500 hover:bg-neutral-100/60 hover:text-neutral-900",
    sidebarNavIcon: (active: boolean) =>
      dark
        ? active
          ? "text-slate-100"
          : "text-slate-400 group-hover:text-slate-100"
        : active
          ? "text-neutral-900"
          : "text-neutral-500 group-hover:text-neutral-900",
    promoTitle: dark ? "text-slate-100" : "text-neutral-900",
    promoItem: dark ? "text-slate-300" : "text-neutral-700",
    brandText: dark ? "text-slate-50" : "text-neutral-900",
  };
}

export function hubCn(theme: DashboardTheme, light: string, dark: string) {
  return cn(theme === "dark" ? dark : light);
}
