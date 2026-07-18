"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";

const STATUS_LINES = [
  "Analyzing your business profile…",
  "Mapping compliance & payments modules…",
  "Estimating time and cost savings…",
  "Assembling tier recommendations…",
];

function ShimmerBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white/[0.06]",
        className
      )}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/12 to-transparent"
        aria-hidden
      />
    </div>
  );
}

function TierCardSkeleton({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden"
    >
      <div className="border-b border-white/[0.08] px-4 py-4 space-y-3">
        <ShimmerBar className="h-3 w-16" />
        <ShimmerBar className="h-5 w-28" />
        <ShimmerBar className="h-3 w-full max-w-[200px]" />
        <div className="flex gap-4 pt-1">
          <ShimmerBar className="h-3 w-20" />
          <ShimmerBar className="h-3 w-24" />
        </div>
      </div>
      <div className="flex flex-col gap-3 px-4 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-2.5">
            <Skeleton className="h-5 w-5 shrink-0 rounded-full bg-white/10" />
            <div className="flex-1 space-y-1.5">
              <ShimmerBar className="h-3 w-full" />
              <ShimmerBar className="h-2.5 w-[80%]" />
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <ShimmerBar className="h-10 w-full rounded-lg" />
      </div>
    </motion.div>
  );
}

/** Wireframe “app being assembled” — inspired by builder loading UIs */
function AssemblyPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md aspect-[4/3] rounded-xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-amber-950/20 p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.15),transparent_55%)]" />
      <div className="relative flex h-full gap-3">
        <div className="flex w-10 shrink-0 flex-col gap-2 pt-1">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="h-8 w-8 rounded-lg bg-white/[0.08] border border-white/10"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex gap-2">
            <motion.div
              className="h-8 flex-1 rounded-md bg-white/[0.1]"
              animate={{ scaleX: [0.7, 1, 0.85] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "left" }}
            />
            <motion.div
              className="h-8 w-16 rounded-md bg-amber-400/20 border border-amber-400/30"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </div>
          <motion.div
            className="h-24 rounded-lg bg-white/[0.06] border border-white/[0.08]"
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
          <div className="grid grid-cols-2 gap-2 flex-1">
            <motion.div
              className="rounded-lg bg-white/[0.05] border border-white/[0.06] p-2 space-y-1.5"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 0.65, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.2 }}
            >
              <ShimmerBar className="h-2 w-full" />
              <ShimmerBar className="h-2 w-3/4" />
              <ShimmerBar className="h-2 w-1/2" />
            </motion.div>
            <motion.div
              className="rounded-lg bg-white/[0.05] border border-white/[0.06] p-2 space-y-1.5"
              animate={{ opacity: [0.3, 0.65, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
            >
              <ShimmerBar className="h-2 w-full" />
              <ShimmerBar className="h-2 w-2/3" />
              <ShimmerBar className="h-2 w-[80%]" />
            </motion.div>
          </div>
        </div>
      </div>
      <motion.div
        className="absolute bottom-6 right-8 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/25 border border-blue-400/40 shadow-lg shadow-blue-500/20"
        animate={{ y: [0, -6, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-5 w-5 text-blue-300" />
      </motion.div>
    </div>
  );
}

export function OnboardingWidgetBuildLoader() {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-5 min-h-[420px]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] text-xs font-semibold text-amber-300 ring-1 ring-amber-400/25">
          2
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">Building your workspace</p>
          <p className="text-xs text-white/40 mt-0.5">Composing tiers from your business inputs</p>
        </div>
        <Loader2 className="h-4 w-4 animate-spin text-amber-300/80 shrink-0" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[200px_1fr] lg:gap-6">
        {/* Progress sidebar */}
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-medium text-white/70">Business profile</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            </span>
            <span className="text-xs font-medium text-amber-100/90">Workspace tiers</span>
          </div>
          <div className="mt-2 space-y-2 border-t border-white/[0.06] pt-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.25 }}
                className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-2.5 space-y-2"
              >
                <ShimmerBar className="h-2.5 w-3/4" />
                <ShimmerBar className="h-2 w-full" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main build canvas */}
        <div className="flex flex-col gap-5">
          <AssemblyPreview />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TierCardSkeleton delay={0.35} />
            <TierCardSkeleton delay={0.65} />
            <TierCardSkeleton delay={0.95} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pt-1">
        <AnimatePresence mode="wait">
          <motion.p
            key={statusIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-sm text-white/45 text-center"
          >
            {STATUS_LINES[statusIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
