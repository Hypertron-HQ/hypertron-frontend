"use client";

import { DarkVeil } from "@/components/marketing/mono";

/** Matches the home hero atmosphere: animated veil + blue wash + subtle grid. */
export function DocBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0">
        <DarkVeil resolutionScale={0.55} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-blue-950/30 to-slate-950/90" />
      <div
        className="absolute left-1/2 top-[18%] h-[520px] w-[min(900px,90vw)] -translate-x-1/2 rounded-full opacity-60 blur-[100px]"
        style={{
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.28), transparent 68%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_25%,black,transparent)]"
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
