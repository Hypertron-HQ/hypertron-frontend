"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DashboardThemeTransitionOverlay,
  type ActiveThemeReveal,
  type ThemeRevealOrigin,
} from "@/components/dashboard/dashboard-theme-transition-overlay";
import {
  DASHBOARD_THEME_UPDATED_EVENT,
  getStoredDashboardTheme,
  setStoredDashboardTheme,
  type DashboardTheme,
} from "@/lib/dashboard-theme";

type DashboardThemeContextValue = {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
  toggleThemeAt: (origin: ThemeRevealOrigin) => void;
  isReady: boolean;
  isTransitioning: boolean;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(null);

export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DashboardTheme>(() => getStoredDashboardTheme());
  const [isReady, setIsReady] = useState(false);
  const [reveal, setReveal] = useState<ActiveThemeReveal | null>(null);

  useEffect(() => {
    setIsReady(true);

    const onThemeUpdated = (event: Event) => {
      const next = (event as CustomEvent<DashboardTheme>).detail;
      if (next === "light" || next === "dark") {
        setThemeState(next);
      }
    };

    window.addEventListener(DASHBOARD_THEME_UPDATED_EVENT, onThemeUpdated);
    return () => window.removeEventListener(DASHBOARD_THEME_UPDATED_EVENT, onThemeUpdated);
  }, []);

  const setTheme = useCallback((next: DashboardTheme) => {
    setStoredDashboardTheme(next);
    setThemeState(next);
  }, []);

  const toggleThemeAt = useCallback(
    (origin: ThemeRevealOrigin) => {
      const next: DashboardTheme = theme === "light" ? "dark" : "light";

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        setTheme(next);
        return;
      }

      setReveal({ ...origin, nextTheme: next });
    },
    [theme, setTheme]
  );

  const onRevealComplete = useCallback(() => {
    if (!reveal) return;
    setTheme(reveal.nextTheme);
    setReveal(null);
  }, [reveal, setTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleThemeAt,
      isReady,
      isTransitioning: reveal !== null,
    }),
    [theme, setTheme, toggleThemeAt, isReady, reveal]
  );

  return (
    <DashboardThemeContext.Provider value={value}>
      {children}
      <DashboardThemeTransitionOverlay reveal={reveal} onRevealComplete={onRevealComplete} />
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    throw new Error("useDashboardTheme must be used within DashboardThemeProvider");
  }
  return ctx;
}
