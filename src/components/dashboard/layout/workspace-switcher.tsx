"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, ChevronDown, LayoutGrid } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import {
  getWorkspaceTierState,
  WORKSPACE_TIER_UPDATED_EVENT,
} from "@/lib/workspace-tier-context";
import { cn } from "@/utils";

export function WorkspaceSwitcher() {
  const { open } = useSidebar();
  const [workspaceName, setWorkspaceName] = useState("Workspace");

  useEffect(() => {
    const sync = () => {
      const state = getWorkspaceTierState();
      setWorkspaceName(state?.businessName?.trim() || "Workspace");
    };
    sync();
    window.addEventListener(WORKSPACE_TIER_UPDATED_EVENT, sync);
    return () => window.removeEventListener(WORKSPACE_TIER_UPDATED_EVENT, sync);
  }, []);

  if (!open) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Link
            href="/dashboard"
            className="flex size-9 items-center justify-center rounded-lg border border-white/12 bg-white/[0.08]"
            title="Switch workspace"
          >
            <Building2 className="h-4 w-4" />
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.06] px-3 py-2.5 text-left transition-colors",
                "hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600/90 text-white">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-tight">{workspaceName}</p>
                <p className="text-[11px] text-white/45">Founder</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                All workspaces
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
