"use client";

import { DarkVeil } from "./dark-veil";

/** Fixed animated veil + wash for the full marketing home page. */
export function LandingPageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <DarkVeil resolutionScale={0.6} />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-blue-950/20 to-slate-950/85" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_40%,black,transparent)]" />
    </div>
  );
}
