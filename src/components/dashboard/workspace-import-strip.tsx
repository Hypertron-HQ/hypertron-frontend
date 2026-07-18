"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getWorkspaceTierState,
  markWorkspaceSidebarImported,
  syncWorkspaceTierFromLatestTemplate,
  WORKSPACE_TIER_UPDATED_EVENT,
  type WorkspaceTierState,
} from "@/lib/workspace-tier-context";

function readState(): WorkspaceTierState | null {
  if (typeof window === "undefined") return null;
  return getWorkspaceTierState();
}

export function WorkspaceImportStrip() {
  const [state, setState] = useState<WorkspaceTierState | null>(null);

  const refresh = useCallback(() => {
    setState(readState());
  }, []);

  useEffect(() => {
    syncWorkspaceTierFromLatestTemplate();
    setState(readState());
  }, []);

  useEffect(() => {
    const onUpd = () => setState(readState());
    window.addEventListener(WORKSPACE_TIER_UPDATED_EVENT, onUpd);
    return () => window.removeEventListener(WORKSPACE_TIER_UPDATED_EVENT, onUpd);
  }, []);

  if (!state || state.sidebarImported) {
    return null;
  }

  return (
    <div className="relative z-[2] flex flex-wrap items-center justify-between gap-3 border-b border-amber-400/20 bg-amber-500/[0.06] px-4 py-2.5 backdrop-blur-md md:px-6">
      <p className="min-w-0 text-xs text-amber-100/90 md:text-sm">
        <span className="font-medium text-amber-50">Product tier saved</span>
        <span className="text-amber-100/70"> — Import to add {state.bundleName} routes under your business name in the sidebar.</span>
      </p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="shrink-0 rounded-full border-amber-400/40 bg-amber-500/15 text-amber-50 hover:bg-amber-500/25 hover:text-white"
        onClick={() => {
          markWorkspaceSidebarImported();
          refresh();
        }}
      >
        <Upload className="mr-1.5 h-3.5 w-3.5" />
        Import
      </Button>
    </div>
  );
}
