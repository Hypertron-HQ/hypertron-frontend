"use client";

import { Workflow, Shield, FileText, BarChart2, Coins, Link2, Layers, Network } from "lucide-react";

const ITEMS = [
  { label: "Privacy pool", Icon: Layers },
  { label: "Receivables", Icon: Link2 },
  { label: "Workflow builder", Icon: Workflow },
  { label: "AI-assisted ops", Icon: BarChart2 },
  { label: "KYB & compliance", Icon: Shield },
  { label: "Pool & payout", Icon: Coins },
  { label: "Document vault", Icon: FileText },
  { label: "Stellar network", Icon: Network },
];

// Duplicate for seamless loop
const REPEATED = [...ITEMS, ...ITEMS];

export function HeroMarquee() {
  return (
    <div className="w-full border-t border-b border-white/[0.06] py-4 overflow-hidden">
      <p className="text-center text-[10px] font-medium tracking-[0.2em] uppercase text-white/25 mb-4">
        Built for B2B teams on Stellar
      </p>

      <div className="relative flex">
        {/* Left fade */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
        {/* Right fade */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />

        <div
          className="flex shrink-0 gap-8 animate-marquee"
          style={{ "--duration": "28s", "--gap": "2rem" } as React.CSSProperties}
        >
          {REPEATED.map(({ label, Icon }, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              <span className="text-sm font-medium whitespace-nowrap">{label}</span>
              <span className="ml-4 text-white/15">·</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
