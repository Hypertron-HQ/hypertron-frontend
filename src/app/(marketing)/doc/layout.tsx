import type { ReactNode } from "react";
import { DocBackground } from "@/components/doc/doc-background";
import { DocRouteNav } from "@/components/doc/doc-route-nav";

export default function DocLayout({ children }: { children: ReactNode }) {
  return (
    <div className="doc-shell relative" data-doc-shell>
      <DocBackground />
      <div className="doc-shell-content">
        <DocRouteNav />
        <div className="doc-shell-page">{children}</div>
      </div>
    </div>
  );
}
