"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { clamp01, easeInOutCubic, lerp, subscribeScroll } from "./scroll-sync";
import { BOOK_DEMO } from "./constants";

const HERO_VIDEO = "/media/The_Data_Flow_Pulse_Engin.mp4";

export function LandingHero() {
  const pinRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    radius: 0,
    pinned: true,
  });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      document.documentElement.dataset.landing = "void";
      return () => {
        delete document.documentElement.dataset.landing;
      };
    }

    return subscribeScroll(() => {
      const pin = pinRef.current;
      if (!pin) return;

      const rect = pin.getBoundingClientRect();
      const travel = Math.max(1, pin.offsetHeight - window.innerHeight);
      const raw = clamp01(-rect.top / travel);
      const shrink = easeInOutCubic(clamp01(raw / 0.88));
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const compact = vw < 768;
      const targetW = compact ? Math.min(300, vw * 0.78) : Math.min(424, vw * 0.3);
      const targetH = compact ? Math.min(360, vh * 0.5) : Math.min(480, vh * 0.56);
      const width = lerp(vw, targetW, shrink);
      const height = lerp(vh, targetH, shrink);

      setFrame({
        width,
        height,
        left: (vw - width) / 2,
        top: (vh - height) / 2,
        radius: lerp(0, 6, shrink),
        pinned: raw < 1,
      });

      document.documentElement.dataset.landing = shrink > 0.02 ? "paper" : "void";
    });
  }, [reduceMotion]);

  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.landing;
    };
  }, []);

  return (
    <section id="home" className="relative">
      <div
        ref={pinRef}
        className={reduceMotion ? "relative" : "relative h-[260vh]"}
      >
        <div
          className="landing-hero-stage flex h-[100svh] w-full items-stretch justify-center"
          style={
            reduceMotion
              ? undefined
              : frame.pinned
                ? { position: "fixed", inset: 0, zIndex: 20 }
                : { position: "absolute", bottom: 0, left: 0, right: 0 }
          }
        >
          <div
            aria-hidden
            className="landing-paper-grid pointer-events-none absolute inset-0"
          />

          <div
            className={
              reduceMotion
                ? "landing-hero-frame relative h-[100svh] overflow-hidden"
                : "landing-hero-frame absolute overflow-hidden"
            }
            style={
              reduceMotion
                ? undefined
                : {
                    width: frame.width || "100%",
                    height: frame.height || "100%",
                    left: frame.width ? frame.left : 0,
                    top: frame.height ? frame.top : 0,
                    right: "auto",
                    bottom: "auto",
                    borderRadius: frame.radius,
                    willChange: frame.pinned ? "left, top, width, height" : undefined,
                  }
            }
          >
            <div
              className="landing-hero-scene"
              style={
                reduceMotion
                  ? undefined
                  : {
                      width: "100vw",
                      height: "100svh",
                      left: frame.width ? -frame.left : 0,
                      top: frame.height ? -frame.top : 0,
                      right: "auto",
                      bottom: "auto",
                    }
              }
            >
            <video
              className="absolute inset-0 size-full object-cover"
              src={HERO_VIDEO}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
            />

            <div className="landing-hero-veil pointer-events-none absolute inset-0" />

            <div className="relative z-10 flex h-full flex-col justify-between px-5 py-24 sm:px-10 sm:py-28 lg:px-16">
              <div className="max-w-xl pt-4 sm:pt-8">
                <p className="hero-enter hero-enter-delay-1 mb-5 text-[11px] font-medium tracking-[0.22em] text-[#8eb6ff] uppercase">
                  Private payments on Stellar
                </p>
                <h1 className="hero-enter hero-enter-delay-1 font-display text-[clamp(2.6rem,6.4vw,5.4rem)] leading-[0.92] font-medium tracking-[-0.045em] text-white">
                  Private payments,
                  <br />
                  built for <span className="text-[#8b9bb4]">business.</span>
                </h1>
                <p className="hero-enter hero-enter-delay-2 mt-6 max-w-md text-sm leading-relaxed text-white/78 sm:text-base">
                  Hypertron gives businesses and developers the infrastructure
                  to accept, build, and operate private payments on Stellar.
                </p>
                <div className="hero-enter hero-enter-delay-3 mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="/developers"
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-[11px] font-semibold tracking-[0.16em] text-black uppercase transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                  >
                    Start building
                    <ArrowRight className="size-3.5" />
                  </a>
                  <a
                    href="#product"
                    className="inline-flex h-11 items-center gap-2 rounded-md border border-white/35 bg-transparent px-5 text-[11px] font-semibold tracking-[0.16em] text-white uppercase transition hover:border-white/70 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                  >
                    Explore platform
                    <ArrowRight className="size-3.5" />
                  </a>
                </div>
              </div>

              <div className="hero-enter hero-enter-delay-4 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-[auto_1fr_minmax(0,18rem)] sm:items-end">
                <p className="text-[10px] tracking-[0.2em] text-white/55 uppercase">
                  Built on Stellar
                </p>
                <p className="max-w-md text-xs leading-relaxed text-white/60 sm:justify-self-center sm:text-center">
                  One programmable rail for onboarding, compliance, and private
                  settlement — without splitting operations across tools.
                </p>
                <a
                  href={BOOK_DEMO}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-end justify-between gap-4 rounded-md border border-white/12 bg-black/25 px-4 py-3 backdrop-blur-md transition hover:border-white/25 hover:bg-black/35"
                >
                  <div>
                    <div className="flex items-center justify-between gap-6">
                      <p className="text-[10px] tracking-[0.18em] text-white/50 uppercase">
                        Public beta
                      </p>
                      <p className="text-[10px] tracking-[0.16em] text-white/40 uppercase">
                        Invite only
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-snug text-white/88">
                      Walk through onboarding to settlement on a live workspace.
                    </p>
                  </div>
                  <ArrowRight className="mb-0.5 size-4 shrink-0 text-white/70 transition group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
