import { LandingFooter, LandingNavbar, MarketingSplash } from "@/components/marketing/mono";
import React from "react";

interface Props {
  children: React.ReactNode;
}

const MarketingLayout = ({ children }: Props) => {
  return (
    <MarketingSplash>
      <div className="marketing-mono flex min-h-screen flex-col bg-background font-default text-foreground antialiased has-[#home]:bg-transparent has-[.doc-shell]:h-dvh has-[.doc-shell]:max-h-dvh has-[.doc-shell]:min-h-0 has-[.doc-shell]:overflow-hidden">
        <LandingNavbar />
        <main className="relative w-full shrink-0 pt-0 has-[.doc-shell]:min-h-0 has-[.doc-shell]:flex-1 has-[.doc-shell]:shrink has-[.doc-shell]:flex has-[.doc-shell]:flex-col has-[.doc-shell]:overflow-hidden [&:not(:has(#home))]:pt-24">
          {children}
        </main>
        <LandingFooter className="relative z-20 shrink-0" />
      </div>
    </MarketingSplash>
  );
};

export default MarketingLayout;
