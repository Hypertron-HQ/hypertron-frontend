"use client";

import { useScroll, useTransform, type MotionValue, motion } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

const MISSION_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_132944_a0d124bb-eaa1-4082-aa30-2310efb42b4b.mp4";

const P1: { w: string; em?: boolean }[] = [
  { w: "We're" },
  { w: "building" },
  { w: "where" },
  { w: "onboarding,", em: true },
  { w: "capital,", em: true },
  { w: "and", em: true },
  { w: "compliance", em: true },
  { w: "share" },
  { w: "one" },
  { w: "Stellar-native", em: true },
  { w: "rail," },
  { w: "so" },
  { w: "teams" },
  { w: "ship" },
  { w: "end-to-end", em: true },
  { w: "flows" },
  { w: "with" },
  { w: "privacy", em: true },
  { w: "you" },
  { w: "can" },
  { w: "prove", em: true },
  { w: "when" },
  { w: "it" },
  { w: "matters." },
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

export function MissionSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.88", "end 0.32"],
  });

  return (
    <section
      id="mission"
      ref={ref}
      className="relative border-t border-border/30 py-24 md:py-32"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-[minmax(0,420px)_1fr] md:px-8 lg:gap-20">
        <div className="relative">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-6 text-xs font-medium uppercase tracking-[3px] text-white/50"
          >
            Our mission
          </motion.p>
          <div className="relative aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] shadow-lg shadow-black/20 backdrop-blur-sm">
            <video
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
            >
              <source src={MISSION_VIDEO} type="video/mp4" />
            </video>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur-md">
              <Image src="/logo.png" alt="" width={16} height={16} className="h-4 w-4" />
              <span className="text-[11px] font-medium tracking-wide text-white/80">Hypertron · 2026</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-2xl font-medium tracking-[-0.5px] md:text-4xl lg:text-[44px] lg:leading-[1.15]">
            {P1.map((item, i) => (
              <RevealWord
                key={`${item.w}-${i}`}
                text={item.w}
                index={i}
                total={P1.length}
                progress={scrollYProgress}
                emphasize={item.em}
              />
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
