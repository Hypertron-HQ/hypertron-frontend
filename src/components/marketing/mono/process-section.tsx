"use client";

import { motion } from "framer-motion";
import { PROCESS } from "@/utils/constants/misc";
import { Card, CardContent } from "@/components/ui/card";
import { fadeUp } from "./fade-up";
import { SectionHeader } from "./section-header";
import { glassCard } from "./glass-card";
import { cn } from "@/utils";

const STEP_LABELS = ["01", "02", "03"];

export function ProcessSection() {
  return (
    <section
      id="how-it-works"
      className="relative border-t border-border/30 py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <SectionHeader
          eyebrow="How it works"
          title={
            <>
              From signup to{" "}
              <span className="font-serif font-normal italic">settlement</span> in three moves
            </>
          }
          description="One pipeline replaces a stack of tools. Onboarding, compliance, and capital flow share the same rail."
        />

        <div className="relative mt-16 grid gap-4 md:grid-cols-3 lg:mt-20">
          {/* Connector line (desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[8%] right-[8%] top-[74px] z-0 hidden h-px md:block"
            style={{
              backgroundImage:
                "linear-gradient(to right, transparent 0, rgba(255,255,255,0.14) 50%, transparent 100%)",
            }}
          />
          {PROCESS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.title} {...fadeUp(0.06 * i)} className="relative z-10">
                <Card className={cn("group h-full", glassCard)}>
                  <CardContent className="flex h-full flex-col gap-5 p-6 md:p-7">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-md transition-colors group-hover:border-blue-400/30">
                        <Icon className="h-5 w-5 text-white/80 transition-colors group-hover:text-blue-300" strokeWidth={1.5} />
                      </div>
                      <span className="font-mono text-xs tracking-[0.18em] text-white/50">
                        {STEP_LABELS[i]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold leading-tight tracking-tight text-white">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">
                        {step.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
