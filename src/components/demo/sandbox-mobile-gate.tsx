"use client";

import { type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { SandboxMobileUnsupported } from "@/components/demo/sandbox-mobile-unsupported";

export function SandboxMobileGate({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <SandboxMobileUnsupported variant="page" />;
  }

  return children;
}
