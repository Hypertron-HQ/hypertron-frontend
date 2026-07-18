"use client";

import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/utils";

export function WorkspaceSidebarHelp() {
  const { open } = useSidebar();

  if (!open) return null;

  return (
    <Link
      href="/dashboard/settings"
      className={cn(
        "mx-2 mb-2 flex items-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-3 transition-colors",
        "hover:bg-white/[0.08]"
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 text-violet-300">
        <LifeBuoy className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">Need Help?</p>
        <p className="text-[11px] text-muted-foreground">Chat with support</p>
      </div>
    </Link>
  );
}
