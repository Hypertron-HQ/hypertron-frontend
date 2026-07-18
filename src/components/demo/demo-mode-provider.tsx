"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { mockDemoApiFetch } from "@/lib/demo-api-mocks";
import { isDemoRoute, withDemoPrefix } from "@/lib/demo-routes";
import {
  markWorkspaceSidebarImported,
  persistTierFromOnboarding,
} from "@/lib/workspace-tier-context";

type DemoModeContextValue = {
  isDemo: boolean;
  demoPath: (path: string) => string;
};

const DemoModeContext = createContext<DemoModeContextValue>({
  isDemo: false,
  demoPath: (path) => path,
});

export function useDemoMode() {
  return useContext(DemoModeContext);
}

export function useMockDashboardData(): boolean {
  return useDemoMode().isDemo;
}

export function useDemoPath(path: string): string {
  const { isDemo, demoPath } = useDemoMode();
  return isDemo ? demoPath(path) : path;
}

export function DemoModeProvider({
  children,
  forcedDemo = false,
}: {
  children: ReactNode;
  forcedDemo?: boolean;
}) {
  const pathname = usePathname();
  const isDemo = forcedDemo || isDemoRoute(pathname);

  const demoPath = useCallback((path: string) => withDemoPrefix(path, isDemo), [isDemo]);

  useLayoutEffect(() => {
    if (!isDemo || typeof window === "undefined") return;

    persistTierFromOnboarding({
      bundleId: "tier-2",
      businessName: "Hypertron Demo",
      bundleName: "Tier 2",
    });
    markWorkspaceSidebarImported();

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const mocked = mockDemoApiFetch(input, init);
      if (mocked) return mocked;
      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isDemo]);

  const value = useMemo(() => ({ isDemo, demoPath }), [isDemo, demoPath]);

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}
