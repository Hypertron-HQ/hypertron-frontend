"use client";

import { useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { originFromElement } from "@/components/dashboard/dashboard-theme-transition-overlay";
import { cn } from "@/utils";

export function HubThemeToggleButton() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { theme, toggleThemeAt, isTransitioning } = useDashboardTheme();

  const handleClick = () => {
    const el = buttonRef.current;
    if (el) {
      toggleThemeAt(originFromElement(el));
      return;
    }
    toggleThemeAt({
      x: typeof window !== "undefined" ? window.innerWidth - 48 : 0,
      y: 32,
    });
  };

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={isTransitioning}
      className={cn(
        "h-10 w-10 rounded-full shadow-none transition-colors",
        theme === "light"
          ? "border-ui-border/80 bg-white hover:bg-neutral-50"
          : "border-0 bg-white/[0.08] text-slate-100 hover:bg-white/[0.12]"
      )}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? (
        <Moon className="h-[18px] w-[18px] text-neutral-700" strokeWidth={1.75} />
      ) : (
        <Sun className="h-[18px] w-[18px] text-amber-200" strokeWidth={1.75} />
      )}
    </Button>
  );
}
