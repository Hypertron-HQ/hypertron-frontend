"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronsUpDown,
  LogOut,
  Settings,
  User,
  HelpCircle,
} from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { HubAvatar } from "@/components/global/hub-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/utils";

type WorkspaceHubUserMenuProps = {
  userName: string;
  userEmail: string;
  onSignOut: () => void | Promise<void>;
};

export function WorkspaceHubUserMenu({
  userName,
  userEmail,
  onSignOut,
}: WorkspaceHubUserMenuProps) {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const handleSignOut = async () => {
    await onSignOut();
    setSignOutOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
              t.dark
                ? "border-white/10 bg-white/10 hover:bg-white/15"
                : "border-ui-border/80 bg-white hover:bg-neutral-50"
            )}
          >
            <HubAvatar value={userEmail || userName} size={40} />
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm font-semibold", t.brandText)}>{userName}</p>
              <p className={cn("truncate text-xs", t.cardMeta)}>{userEmail}</p>
            </div>
            <ChevronsUpDown
              className={cn("h-4 w-4 shrink-0", t.dark ? "text-slate-500" : "text-neutral-400")}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="top"
          sideOffset={2}
          className={cn(
            "workspace-hub-user-menu-content z-50 w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px] rounded-xl border p-1",
            t.dark
              ? "border-white/10 bg-slate-900 text-slate-100"
              : "border-ui-border/80 bg-white text-neutral-900",
            "!shadow-none data-[state=open]:animate-none data-[state=closed]:animate-none"
          )}
          style={{ boxShadow: "none", filter: "none" }}
        >
          <DropdownMenuItem
            asChild
            className={cn("hub-menu-item cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", t.menuItem)}
          >
            <Link href="/dashboard/settings" className="flex items-center gap-2.5">
              <User className={cn("h-4 w-4", t.menuIcon)} strokeWidth={1.75} />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className={cn("hub-menu-item cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", t.menuItem)}
          >
            <Link href="/dashboard/settings" className="flex items-center gap-2.5">
              <Settings className={cn("h-4 w-4", t.menuIcon)} strokeWidth={1.75} />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className={cn("hub-menu-item cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", t.menuItem)}
          >
            <Link href="/dashboard/settings" className="flex items-center gap-2.5">
              <HelpCircle className={cn("h-4 w-4", t.menuIcon)} strokeWidth={1.75} />
              Help & support
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className={cn("my-1", t.menuSeparator)} />
          <DropdownMenuItem
            className="hub-menu-item hub-menu-item--destructive cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-red-700 focus:bg-neutral-100 focus:text-red-700 data-[highlighted]:bg-neutral-100 data-[highlighted]:text-red-700"
            onSelect={(e) => {
              e.preventDefault();
              setSignOutOpen(true);
            }}
          >
            <LogOut className="h-4 w-4 text-red-700" strokeWidth={1.75} />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent className="rounded-2xl border border-ui-border/90 bg-white text-neutral-900 shadow-none sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-900">Sign out?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-600">
              You will be signed out of Hypertron and disconnected from your wallet. You can sign
              in again anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-lg border-ui-border bg-white text-neutral-900 hover:bg-neutral-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleSignOut()}
              className="rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
