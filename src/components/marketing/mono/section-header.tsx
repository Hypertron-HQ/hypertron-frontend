"use client";

import { motion } from "framer-motion";
import { fadeUp } from "./fade-up";
import { cn } from "@/utils";

interface Props {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center"
          ? "items-center text-center"
          : "items-start",
        className,
      )}
    >
      <motion.p
        {...fadeUp(0)}
        className="text-xs font-medium uppercase tracking-[3px] text-white/50"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        {...fadeUp(0.06)}
        className={cn(
          "text-4xl font-medium leading-[1.08] tracking-[-1px] text-foreground md:text-5xl lg:text-[56px]",
          align === "center" ? "max-w-3xl" : "max-w-2xl",
        )}
      >
        {title}
      </motion.h2>
      {description ? (
        <motion.p
          {...fadeUp(0.12)}
          className={cn(
            "text-base leading-relaxed text-white/60 md:text-[15px]",
            align === "center" ? "max-w-xl" : "max-w-lg",
          )}
        >
          {description}
        </motion.p>
      ) : null}
    </div>
  );
}
