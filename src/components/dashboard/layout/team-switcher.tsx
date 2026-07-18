"use client";

import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { SidebarMenu, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/utils";

export function TeamSwitcher() {
  const { open, toggleSidebar } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div
          className={cn(
            "flex items-center py-3",
            open ? "gap-3 px-2" : "justify-center px-2"
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/12 bg-white/[0.08] ring-1 ring-white/10",
              open ? "size-8" : "size-9 cursor-pointer transition-opacity hover:opacity-80"
            )}
            onClick={!open ? toggleSidebar : undefined}
          >
            <Image src="/logo.png" alt="Hypertron" width={open ? 28 : 26} height={open ? 28 : 26} className="object-contain" />
          </div>

          {open && (
            <>
              <div className="flex flex-1 flex-col text-left leading-tight min-w-0">
                <span className="text-sm font-semibold tracking-tight truncate">Hypertron</span>
                <span className="text-[11px] text-white/40 truncate">B2B Onboarding & Payments</span>
              </div>
              <button
                onClick={toggleSidebar}
                className="ml-auto shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
        {open && <div className="mx-2 mb-1 h-px bg-white/[0.06]" />}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
