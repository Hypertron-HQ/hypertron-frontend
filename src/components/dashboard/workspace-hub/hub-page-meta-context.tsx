"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { HubPageMeta } from "@/lib/hub-nav-routes";

function metaKey(meta: HubPageMeta | null): string {
  if (!meta) return "";
  const crumbs = meta.breadcrumbs
    .map((b) => `${b.label}:${b.href ?? ""}:${b.current ?? false}`)
    .join("|");
  return `${crumbs}::${meta.title}::${meta.subtitle ?? ""}`;
}

type HubPageMetaContextValue = {
  meta: HubPageMeta | null;
  setMeta: (meta: HubPageMeta | null) => void;
};

const HubPageMetaContext = createContext<HubPageMetaContextValue | null>(null);

export function HubPageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<HubPageMeta | null>(null);

  const setMeta = useCallback((next: HubPageMeta | null) => {
    setMetaState((prev) => (metaKey(prev) === metaKey(next) ? prev : next));
  }, []);

  const value = useMemo(() => ({ meta, setMeta }), [meta, setMeta]);

  return <HubPageMetaContext.Provider value={value}>{children}</HubPageMetaContext.Provider>;
}

export function useHubPageMetaContext() {
  return useContext(HubPageMetaContext);
}

/** Register page title, breadcrumbs, and subtitle for the shared hub layout chrome. */
export function useHubPageMeta(meta: HubPageMeta) {
  const setMeta = useHubPageMetaContext()?.setMeta;
  const setMetaRef = useRef(setMeta);
  setMetaRef.current = setMeta;

  const metaRef = useRef(meta);
  metaRef.current = meta;

  const key = metaKey(meta);

  useLayoutEffect(() => {
    setMetaRef.current?.(metaRef.current);
    return () => setMetaRef.current?.(null);
  }, [key]);
}
