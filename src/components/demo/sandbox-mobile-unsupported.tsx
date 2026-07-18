"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_THEME_DEFAULT,
  DASHBOARD_THEME_UPDATED_EVENT,
  getStoredDashboardTheme,
  type DashboardTheme,
} from "@/lib/dashboard-theme";
import { cn } from "@/utils";

type SandboxMobileUnsupportedProps = {
  variant?: "page" | "dialog";
  theme?: DashboardTheme;
  className?: string;
};

export function SandboxMobileUnsupported({
  variant = "page",
  theme: themeProp,
  className,
}: SandboxMobileUnsupportedProps) {
  const [theme, setTheme] = useState<DashboardTheme>(themeProp ?? DASHBOARD_THEME_DEFAULT);
  const isPage = variant === "page";
  const isLight = theme === "light";

  useEffect(() => {
    if (themeProp) {
      setTheme(themeProp);
      return;
    }

    setTheme(getStoredDashboardTheme());

    const onThemeUpdated = (event: Event) => {
      const next = (event as CustomEvent<DashboardTheme>).detail;
      if (next === "light" || next === "dark") {
        setTheme(next);
      }
    };

    window.addEventListener(DASHBOARD_THEME_UPDATED_EVENT, onThemeUpdated);
    return () => window.removeEventListener(DASHBOARD_THEME_UPDATED_EVENT, onThemeUpdated);
  }, [themeProp]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        isPage && "min-h-screen bg-transparent py-16",
        !isPage && "py-2",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center gap-5",
          isPage ? "max-w-md" : "max-w-sm"
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-2xl border",
            isLight
              ? "border-violet-200/90 bg-violet-50 text-violet-600"
              : "border-white/10 bg-white/[0.04] text-violet-300",
            isPage ? "h-16 w-16" : "h-14 w-14"
          )}
          aria-hidden
        >
          <MonitorSmartphone className={isPage ? "h-8 w-8" : "h-7 w-7"} strokeWidth={1.5} />
        </span>

        <div className="space-y-2">
          <p
            className={cn(
              "text-[11px] font-medium uppercase tracking-[0.16em]",
              isLight ? "text-violet-600" : "text-violet-300/80"
            )}
          >
            Mobile coming soon
          </p>
          <h1
            className={cn(
              "font-semibold tracking-tight",
              isLight ? "text-slate-900" : "text-white",
              isPage ? "text-2xl sm:text-3xl" : "text-xl"
            )}
          >
            Switch to desktop view
          </h1>
          <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-500" : "text-slate-400")}>
            The interactive sandbox is optimized for larger screens. Open Hypertron on a desktop or
            tablet in landscape to explore the full workspace demo.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
          className={cn(
            "rounded-full",
            isLight
              ? "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:text-slate-900"
              : "border-white/20 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white",
            isPage ? "mt-2 h-11 px-6" : "mt-1 h-10 px-5"
          )}
        >
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
