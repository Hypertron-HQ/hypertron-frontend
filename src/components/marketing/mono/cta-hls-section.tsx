"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { fadeUp } from "./fade-up";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const DEMO_HREF = "https://calendly.com/kararsweta/30min";
const DOCS_HREF = "/doc";

export function CtaHlsSection() {
  return (
    <section className="relative overflow-hidden border-t border-border/30 py-24 md:py-32">
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center md:px-8">
        <motion.div {...fadeUp(0)} className="mb-8">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md">
            <Image
              src="/logo.png"
              alt="Hypertron"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <div className="pointer-events-none absolute -inset-px rounded-2xl ring-1 ring-blue-400/20" />
          </div>
        </motion.div>
        <motion.div
          {...fadeUp(0.06)}
          className="mb-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55 backdrop-blur-md"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Early access — invite only
        </motion.div>
        <motion.h2
          {...fadeUp(0.1)}
          className="text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]"
        >
          <span className="font-serif font-normal italic">Start</span> your rollout
        </motion.h2>
        <motion.p {...fadeUp(0.16)} className="mt-5 max-w-lg text-base text-white/60">
          Book a walkthrough with the Hypertron team — onboarding, settlements, and the dashboard on Stellar.
        </motion.p>
        <motion.div {...fadeUp(0.22)} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href={DEMO_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-semibold text-background transition-shadow hover:shadow-[0_8px_30px_rgba(255,255,255,0.18)]"
            >
              Book a demo
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href={DOCS_HREF}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-transparent px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/5"
            >
              Read the docs
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
