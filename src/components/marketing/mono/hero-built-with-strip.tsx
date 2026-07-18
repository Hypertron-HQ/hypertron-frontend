"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { HERO_BUILT_WITH_PARTNERS } from "@/lib/hero-built-with-partners";
import { cn } from "@/utils";

function PartnerLogo({ partner }: { partner: (typeof HERO_BUILT_WITH_PARTNERS)[number] }) {
  const isWide = "wide" in partner && partner.wide;
  return (
    <span className="flex h-5 shrink-0 items-center justify-center" title={partner.logoAlt}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={partner.logoSrc}
        alt=""
        width={isWide ? 56 : 20}
        height={20}
        className={cn(
          "object-contain",
          isWide ? "h-4 w-auto max-w-[56px]" : "h-5 w-5",
          "rounded" in partner && partner.rounded && !isWide && "rounded-full"
        )}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

export function HeroBuiltWithStrip({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.38 }}
      className={cn(
        "mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 sm:gap-x-4",
        className
      )}
    >
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.16em] text-white/50">
        Built with
      </span>
      {HERO_BUILT_WITH_PARTNERS.map((partner, index) => (
        <Fragment key={partner.name}>
          {index > 0 ? (
            <span className="text-sm text-white/30" aria-hidden>
              •
            </span>
          ) : null}
          <span className="flex items-center gap-2">
            <PartnerLogo partner={partner} />
            <span className="text-sm font-medium text-white/60">{partner.name}</span>
          </span>
        </Fragment>
      ))}
    </motion.div>
  );
}
