"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MeResponse } from "@/hooks/useAppSession";

type PrivyUser = Extract<MeResponse, { auth: "privy" }>["user"];

type AppSessionContextValue = {
  data: MeResponse | null;
  loading: boolean;
  refresh: () => Promise<MeResponse | null>;
  isAuthenticated: boolean;
  isPrivy: boolean;
  isWalletSession: boolean;
  privyUser: PrivyUser | null;
  walletAddress: string | null;
};

const AppSessionContext = createContext<AppSessionContextValue | null>(null);

export type { AppSessionContextValue };

export function DemoAppSessionProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AppSessionContextValue>(
    () => ({
      data: {
        auth: "privy",
        user: {
          id: "demo-user",
          privyId: "did:privy:demo",
          email: "demo@hypertron.space",
          name: "Hypertron Demo",
        },
        stellarAddress: "GDEMO6M6QY7E5R4Q4QY7E5R4Q4QY7E5R4Q4QY7E5R4Q4QY7E5R4QA",
      },
      loading: false,
      refresh: async () => null,
      isAuthenticated: true,
      isPrivy: true,
      isWalletSession: false,
      privyUser: {
        id: "demo-user",
        privyId: "did:privy:demo",
        email: "demo@hypertron.space",
        name: "Hypertron Demo",
      },
      walletAddress: null,
    }),
    []
  );

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function AppSessionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlightRef = useRef<Promise<MeResponse | null> | null>(null);

  const refresh = useCallback(() => {
    if (inFlightRef.current) return inFlightRef.current;

    const request = fetch("/api/auth/me", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) {
          setData(null);
          return null;
        }
        const json = (await res.json()) as MeResponse;
        setData(json);
        return json;
      })
      .catch(() => {
        setData(null);
        return null;
      })
      .finally(() => {
        setLoading(false);
        inFlightRef.current = null;
      });

    inFlightRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onSignOut = () => {
      inFlightRef.current = null;
      setData(null);
      setLoading(false);
    };
    const onSessionSynced = () => {
      void refresh();
    };
    window.addEventListener("hypertron-sign-out", onSignOut);
    window.addEventListener("hypertron-session-synced", onSessionSynced);
    return () => {
      window.removeEventListener("hypertron-sign-out", onSignOut);
      window.removeEventListener("hypertron-session-synced", onSessionSynced);
    };
  }, [refresh]);

  const value = useMemo<AppSessionContextValue>(
    () => ({
      data,
      loading,
      refresh,
      isAuthenticated: !!data,
      isPrivy: data?.auth === "privy",
      isWalletSession: data?.auth === "wallet",
      privyUser: data?.auth === "privy" ? data.user : null,
      walletAddress: data?.auth === "wallet" ? data.walletAddress : null,
    }),
    [data, loading, refresh]
  );

  return <AppSessionContext.Provider value={value}>{children}</AppSessionContext.Provider>;
}

export function useAppSessionContext(): AppSessionContextValue {
  const ctx = useContext(AppSessionContext);
  if (!ctx) {
    throw new Error("useAppSession must be used within AppSessionProvider");
  }
  return ctx;
}
