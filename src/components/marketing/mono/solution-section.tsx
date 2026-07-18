"use client";

import { motion } from "framer-motion";
import { FEATURES } from "@/utils/constants/misc";
import { Card, CardContent } from "@/components/ui/card";
import { fadeUp } from "./fade-up";
import { SectionHeader } from "./section-header";
import { glassCard } from "./glass-card";
import { cn } from "@/utils";

export function SolutionSection() {
  return (
    <section
      id="solution"
      className="relative border-t border-border/30 py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <SectionHeader
          eyebrow="The product"
          title={
            <>
              B2B operations on Stellar, with{" "}
              <span className="font-serif font-normal italic">privacy</span> you can program
            </>
          }
          description="Every workflow primitive you need to onboard clients, run compliance, and settle on-chain — composed into a single programmable surface."
        />

        <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:mt-20 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} {...fadeUp(0.04 * i)}>
                <Card className={cn("group h-full", glassCard)}>
                  <CardContent className="flex h-full flex-col gap-4 p-6">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/80 backdrop-blur-md transition-colors group-hover:border-blue-400/30 group-hover:text-blue-300"
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold leading-tight tracking-tight text-white">
                        {f.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/60">
                        {f.description}
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
