"use client";

import { useEffect, type ReactNode } from "react";
import { WorkspaceLayout } from "@/components/dashboard/workspace-hub/workspace-layout";
import { setStoredDashboardTheme } from "@/lib/dashboard-theme";

/** Minimal chrome for landing-page hero iframe (light demo overview only). */
export default function DemoEmbedLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    setStoredDashboardTheme("light");
    document.documentElement.classList.add("hero-embed-root");
    return () => {
      document.documentElement.classList.remove("hero-embed-root");
    };
  }, []);

  return (
    <div className="hero-embed-shell min-h-0 bg-transparent text-slate-900" data-dashboard-theme="light">
      <WorkspaceLayout>{children}</WorkspaceLayout>
    </div>
  );
}
