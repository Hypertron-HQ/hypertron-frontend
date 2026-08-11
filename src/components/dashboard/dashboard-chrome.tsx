"use client";

import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChevronsUpDown,
  CircleHelp,
  Search,
  ShieldUser,
} from "lucide-react";
import type { ReactNode } from "react";
import { HypertronLogoMark } from "@/components/dashboard/hypertron-logo-mark";

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export type DashboardIdentity = {
  /** Primary label (display name when available) */
  title: string;
  /** Wallet address under the name — not a role label */
  subtitle?: string;
};

export function DashboardChrome({
  navItems,
  activeId,
  onSelect,
  breadcrumb,
  searchPlaceholder,
  identity,
  children,
}: {
  navItems: DashboardNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  breadcrumb: string;
  searchPlaceholder: string;
  identity?: DashboardIdentity;
  children: ReactNode;
}) {
  const identityTitle = identity?.title ?? "Not signed in";
  return (
    <div className="relative min-h-svh overflow-hidden text-white">
      <Image
        src="/dashboard-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.18),transparent_55%),linear-gradient(180deg,rgba(5,7,13,0.55),rgba(5,7,13,0.82))]"
      />

      <div className="relative z-10 flex min-h-svh gap-3 p-3 md:gap-4 md:p-4">
        <aside className="flex w-[220px] shrink-0 flex-col py-2 pb-10 pl-1">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-3 pt-2">
            <HypertronLogoMark size={32} />
            <span className="font-display text-[15px] font-semibold tracking-tight">
              Hypertron
            </span>
          </Link>

          <div className="mt-5 px-3">
            <label className="relative flex h-10 items-center rounded-full border border-white/10 bg-white/[0.06]">
              <Search
                className="pointer-events-none absolute left-3.5 size-4 text-slate-400"
                strokeWidth={1.75}
              />
              <input
                type="search"
                placeholder="Search"
                className="h-full w-full rounded-full bg-transparent pr-10 pl-10 text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
              <kbd className="pointer-events-none absolute right-2 flex h-6 min-w-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 text-[11px] font-medium text-slate-400">
                /
              </kbd>
            </label>
          </div>

          <nav className="mt-5 flex flex-1 flex-col gap-0.5 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={[
                    "flex h-10 items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium transition",
                    active
                      ? "bg-blue-500/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.55)]"
                      : "text-slate-300 hover:bg-white/[0.05] hover:text-white",
                  ].join(" ")}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.85} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="space-y-3 px-2">
            <button
              type="button"
              className="flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium text-white transition hover:bg-white/[0.05]"
            >
              <CircleHelp className="size-4" strokeWidth={1.85} />
              Help &amp; Support
            </button>

            <Link
              href="/dashboard"
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-3.5 text-left transition hover:bg-white/[0.1]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-white ring-1 ring-white/10">
                <ShieldUser className="size-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {identityTitle}
                </p>
                {identity?.subtitle ? (
                  <p
                    className="truncate font-mono text-xs text-slate-400"
                    title={identity.subtitle}
                  >
                    {identity.subtitle}
                  </p>
                ) : null}
              </div>
              <ChevronsUpDown
                className="size-4 shrink-0 text-[#60A5FA]"
                strokeWidth={2}
              />
            </Link>
          </div>
        </aside>

        <section className="surface-light flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] bg-background text-foreground shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 md:px-6">
            <p className="text-sm text-slate-400">{breadcrumb}</p>
            <div className="flex items-center gap-2">
              <label className="relative hidden h-9 w-56 items-center rounded-full border border-slate-200 bg-slate-50 sm:flex">
                <Search
                  className="pointer-events-none absolute left-3 size-3.5 text-slate-400"
                  strokeWidth={1.75}
                />
                <input
                  type="search"
                  placeholder={searchPlaceholder}
                  className="h-full w-full rounded-full bg-transparent pr-9 pl-9 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
                <kbd className="pointer-events-none absolute right-2 flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-white px-1 text-[10px] font-medium text-slate-400">
                  /
                </kbd>
              </label>
              <button
                type="button"
                aria-label="Notifications"
                className="relative inline-flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-7 md:py-7">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
