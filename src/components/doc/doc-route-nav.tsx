"use client";

import { usePathname } from "next/navigation";
import { DocMobileNav } from "./doc-page-view";
import { DocTechnicalMobileNav } from "./doc-technical-view";

/** Picks the correct mobile doc nav for user guide vs technical architecture routes. */
export function DocRouteNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/doc/technical")) {
    return <DocTechnicalMobileNav />;
  }
  return <DocMobileNav />;
}
