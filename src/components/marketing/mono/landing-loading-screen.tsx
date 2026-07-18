"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const WORDS = ["Onboard", "Settle", "Scale"];

const DURATION_MS = 2700;

export type LandingLoadingScreenProps = {
  onComplete: () => void;
};

export function LandingLoadingScreen({ onComplete }: LandingLoadingScreenProps) {
  const [count, setCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const completeTimeoutRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    const wordInterval = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 900);

    const animate = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(Math.floor((elapsed / DURATION_MS) * 100), 100);
      setCount(progress);

      if (progress < 100) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        window.clearInterval(wordInterval);
        completeTimeoutRef.current = window.setTimeout(() => {
          completeTimeoutRef.current = null;
          onCompleteRef.current();
        }, 400);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.clearInterval(wordInterval);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (completeTimeoutRef.current !== null) {
        window.clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col justify-between bg-background p-8 md:p-12"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      data-testid="landing-loading-screen"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-xs uppercase tracking-[0.3em] text-muted-foreground"
        data-testid="landing-loading-brand"
      >
        Hypertron
      </motion.div>

      <div className="flex items-center justify-center" data-testid="landing-loading-word-wrapper">
        <AnimatePresence mode="wait">
          <motion.span
            key={wordIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="font-serif text-4xl font-normal italic text-foreground/80 md:text-6xl lg:text-7xl"
            data-testid="landing-loading-word"
          >
            {WORDS[wordIndex]}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-end gap-4" data-testid="landing-loading-progress-wrapper">
        <div
          className="font-heading text-6xl tabular-nums text-foreground md:text-8xl lg:text-9xl"
          data-testid="landing-loading-count"
        >
          {String(count).padStart(3, "0")}
        </div>
        <div
          className="h-[3px] w-full overflow-hidden rounded-full bg-border/50"
          data-testid="landing-loading-progress"
        >
          <div
            className="h-full origin-left rounded-full bg-gradient-to-r from-[#FFF971] via-amber-300 to-sky-400 transition-transform duration-100"
            style={{
              transform: `scaleX(${count / 100})`,
              boxShadow: "0 0 12px rgba(255, 249, 113, 0.35)",
            }}
            data-testid="landing-loading-progress-fill"
          />
        </div>
      </div>
    </motion.div>
  );
}
