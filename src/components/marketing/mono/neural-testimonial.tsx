"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

const QUOTE_WORDS: { w: string; em?: boolean }[] = [
  { w: "Fragmented" },
  { w: "tools" },
  { w: "and" },
  { w: "exposed" },
  { w: "on-chain" },
  { w: "flows" },
  { w: "block" },
  { w: "real" },
  { w: "B2B", em: true },
  { w: "adoption." },
  { w: "Hypertron", em: true },
  { w: "unifies" },
  { w: "onboarding,", em: true },
  { w: "compliance,", em: true },
  { w: "and" },
  { w: "Stellar", em: true },
  { w: "payments," },
  { w: "with" },
  { w: "a" },
  { w: "privacy", em: true },
  { w: "pool" },
  { w: "so" },
  { w: "execution" },
  { w: "stays" },
  { w: "programmable", em: true },
  { w: "and" },
  { w: "defensible.", em: true },
];

function RevealWord({
  text,
  index,
  total,
  progress,
  emphasize,
}: {
  text: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  emphasize?: boolean;
}) {
  const start = (index / Math.max(total, 1)) * 0.72 + 0.06;
  const end = Math.min(start + 0.14, 0.98);
  const opacity = useTransform(progress, [start, end], [0.5, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      <span className={emphasize ? "text-white" : "text-white/75"}>{text}</span>{" "}
    </motion.span>
  );
}

export function NeuralTestimonial() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.88", "end 0.32"],
  });

  return (
    <section
      id="reviews"
      ref={containerRef}
      className="relative flex min-h-[70vh] items-center px-6 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-center text-3xl font-medium tracking-[-0.5px] md:text-4xl lg:text-5xl lg:leading-[1.12]">
          {QUOTE_WORDS.map((item, i) => (
            <RevealWord
              key={`${item.w}-${i}`}
              text={item.w}
              index={i}
              total={QUOTE_WORDS.length}
              progress={scrollYProgress}
              emphasize={item.em}
            />
          ))}
        </p>
      </div>
    </section>
  );
}
