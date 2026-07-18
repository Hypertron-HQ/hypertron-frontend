"use client";

import { useEffect, useRef, useState } from "react";

/** Live demo overview scaled inside the landing hero (light mode). */
const EMBED_SRC = "/demo/embed/overview";
const IFRAME_WIDTH = 1280;
const IFRAME_HEIGHT = 780;

export function HeroDashboardPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width > 0) setScale(width / IFRAME_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scaledHeight = Math.round(IFRAME_HEIGHT * scale);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[#f8fbff]"
      style={{ height: scaledHeight }}
      aria-hidden
    >
      <iframe
        src={EMBED_SRC}
        title="Hypertron dashboard preview"
        tabIndex={-1}
        loading="lazy"
        className="pointer-events-none absolute left-0 top-0 border-0 bg-[#f8fbff]"
        style={{
          width: IFRAME_WIDTH,
          height: IFRAME_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}
