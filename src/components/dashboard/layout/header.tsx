"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
};

export function DashboardHeader({
  className,
  fixed,
  children,
  ...props
}: HeaderProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setOffset(
        document.body.scrollTop || document.documentElement.scrollTop
      );
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "z-50 h-14 border-b border-white/10 bg-black/35 backdrop-blur-xl supports-[backdrop-filter]:bg-black/25",
        fixed && "sticky top-0 w-full peer/header",
        offset > 10 && fixed && "border-white/[0.12] bg-black/55 shadow-[0_1px_0_rgba(255,255,255,0.06)]",
        className
      )}
      {...props}
    >
      <div className="relative flex h-full items-center gap-3 px-4 sm:gap-4 md:px-6">
        {children}
      </div>
    </header>
  );
}
