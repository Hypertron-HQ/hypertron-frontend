"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Menu, ShieldUser } from "lucide-react";
import { HypertronLogoMark } from "@/components/dashboard/hypertron-logo-mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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

function shortenWallet(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function NavList({
  navItems,
  activeId,
  onSelect,
}: {
  navItems: DashboardNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex h-10 items-center gap-2.5 rounded-xl px-3 text-left text-sm font-medium transition",
              active
                ? "bg-blue/15 text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.45)]"
                : "text-white/65 hover:bg-white/[0.05] hover:text-white",
            )}
          >
            <Icon className="size-4 shrink-0" strokeWidth={1.85} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function IdentityCard({ identity }: { identity?: DashboardIdentity }) {
  const identityTitle = identity?.title ?? "Not signed in";
  return (
    <Link
      href="/dashboard?tab=settings"
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-left transition hover:bg-white/[0.1]"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-white ring-1 ring-white/10">
        <ShieldUser className="size-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {identityTitle}
        </p>
        {identity?.subtitle ? (
          <p
            className="dash-mono truncate text-[11px] text-white/45"
            title={identity.subtitle}
          >
            {shortenWallet(identity.subtitle)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function SidebarBody({
  navItems,
  activeId,
  onSelect,
  identity,
}: {
  navItems: DashboardNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  identity?: DashboardIdentity;
}) {
  return (
    <>
      <Link href="/dashboard" className="flex items-center gap-2.5 px-1">
        <HypertronLogoMark size={28} />
        <span className="font-display text-[15px] font-semibold tracking-tight text-white">
          Hypertron
        </span>
      </Link>

      <div className="mt-6 flex min-h-0 flex-1 flex-col gap-6">
        <NavList
          navItems={navItems}
          activeId={activeId}
          onSelect={onSelect}
        />
        <IdentityCard identity={identity} />
      </div>
    </>
  );
}

export function DashboardChrome({
  navItems,
  activeId,
  onSelect,
  breadcrumb,
  identity,
  children,
}: {
  navItems: DashboardNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  breadcrumb: string;
  /** @deprecated kept for call-site compatibility; unused */
  searchPlaceholder?: string;
  identity?: DashboardIdentity;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSelect(id: string) {
    onSelect(id);
    setMobileOpen(false);
  }

  return (
    <div className="relative min-h-svh bg-navy text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_-10%,rgba(59,130,246,0.16),transparent_55%),linear-gradient(180deg,#070b14_0%,#030712_100%)]"
      />

      <div className="relative z-10 flex min-h-svh gap-0 md:gap-3 md:p-3">
        <aside className="hidden w-[220px] shrink-0 flex-col py-4 pl-3 md:flex">
          <SidebarBody
            navItems={navItems}
            activeId={activeId}
            onSelect={handleSelect}
            identity={identity}
          />
        </aside>

        <section className="surface-light flex min-h-svh min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground md:min-h-0 md:rounded-2xl md:border md:border-white/10">
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="md:hidden"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-4" />
              </Button>
              <p className="truncate text-sm text-muted-foreground">
                {breadcrumb}
              </p>
            </div>
            <Link
              href="/dashboard"
              className="hidden text-xs font-medium text-muted-foreground transition hover:text-foreground sm:inline"
            >
              Account hub
            </Link>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-7">
            {children}
          </div>
        </section>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[280px] border-white/10 bg-navy p-4 text-white sm:max-w-[280px]"
          showCloseButton
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Dashboard sections</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col pt-2">
            <SidebarBody
              navItems={navItems}
              activeId={activeId}
              onSelect={handleSelect}
              identity={identity}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
