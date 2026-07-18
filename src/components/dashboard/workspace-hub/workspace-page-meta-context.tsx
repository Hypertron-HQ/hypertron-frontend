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
import type { HubBreadcrumb } from "@/components/dashboard/workspace-hub/workspace-hub-chrome";

export type WorkspacePageMeta = {
  breadcrumbs: HubBreadcrumb[];
  title?: string;
  subtitle?: string;
};

function metaKey(meta: WorkspacePageMeta | null): string {
  if (!meta) return "";
  const crumbs = meta.breadcrumbs
    .map((b) => `${b.label}:${b.href ?? ""}:${b.current ?? false}`)
    .join("|");
  return `${crumbs}::${meta.title ?? ""}::${meta.subtitle ?? ""}`;
}

type WorkspacePageMetaContextValue = {
  meta: WorkspacePageMeta | null;
  setMeta: (meta: WorkspacePageMeta | null) => void;
};

const WorkspacePageMetaContext = createContext<WorkspacePageMetaContextValue | null>(null);

export function WorkspacePageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<WorkspacePageMeta | null>(null);

  const setMeta = useCallback((next: WorkspacePageMeta | null) => {
    setMetaState((prev) => (metaKey(prev) === metaKey(next) ? prev : next));
  }, []);

  const value = useMemo(() => ({ meta, setMeta }), [meta, setMeta]);

  return (
    <WorkspacePageMetaContext.Provider value={value}>{children}</WorkspacePageMetaContext.Provider>
  );
}

export function useWorkspacePageMetaContext() {
  return useContext(WorkspacePageMetaContext);
}

/** Register breadcrumbs and optional top chrome for the shared workspace layout. */
export function useWorkspacePageMeta(meta: WorkspacePageMeta) {
  const setMeta = useWorkspacePageMetaContext()?.setMeta;
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
