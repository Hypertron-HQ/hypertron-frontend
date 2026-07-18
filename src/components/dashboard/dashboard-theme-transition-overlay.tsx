"use client";

import { useEffect, useState } from "react";
import type { DashboardTheme } from "@/lib/dashboard-theme";

const HUB_DARK_BG = "#070b14";
const HUB_LIGHT_BG = "#fafbff";

const REVEAL_MS = 720;
const REVEAL_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";

export type ThemeRevealOrigin = {
  x: number;
  y: number;
};

export type ActiveThemeReveal = ThemeRevealOrigin & {
  nextTheme: DashboardTheme;
};

function getRevealRadius(x: number, y: number) {
  if (typeof window === "undefined") return 2000;
  const { innerWidth: w, innerHeight: h } = window;
  const distances = [
    Math.hypot(x, y),
    Math.hypot(w - x, y),
    Math.hypot(x, h - y),
    Math.hypot(w - x, h - y),
  ];
  return Math.ceil(Math.max(...distances)) + 24;
}

type DashboardThemeTransitionOverlayProps = {
  reveal: ActiveThemeReveal | null;
  onRevealComplete: () => void;
};

export function DashboardThemeTransitionOverlay({
  reveal,
  onRevealComplete,
}: DashboardThemeTransitionOverlayProps) {
  const [radius, setRadius] = useState(0);

  useEffect(() => {
    if (!reveal) {
      setRadius(0);
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      onRevealComplete();
      return;
    }

    const target = getRevealRadius(reveal.x, reveal.y);
    setRadius(0);

    const startId = requestAnimationFrame(() => {
      requestAnimationFrame(() => setRadius(target));
    });

    const timer = window.setTimeout(() => {
      onRevealComplete();
    }, REVEAL_MS + 40);

    return () => {
      cancelAnimationFrame(startId);
      window.clearTimeout(timer);
    };
  }, [reveal, onRevealComplete]);

  if (!reveal) return null;

  const bg = reveal.nextTheme === "dark" ? HUB_DARK_BG : HUB_LIGHT_BG;

  return (
    <div
      aria-hidden
      className="theme-reveal-overlay pointer-events-none fixed inset-0 z-[100000]"
      style={{
        background: bg,
        clipPath: `circle(${radius}px at ${reveal.x}px ${reveal.y}px)`,
        transition: `clip-path ${REVEAL_MS}ms ${REVEAL_EASING}`,
        WebkitClipPath: `circle(${radius}px at ${reveal.x}px ${reveal.y}px)`,
      }}
    />
  );
}

export function originFromElement(el: HTMLElement): ThemeRevealOrigin {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}
