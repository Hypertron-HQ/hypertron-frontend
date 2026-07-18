"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

export function DemoBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50 via-white to-sky-50 px-4 py-2.5 shadow-sm",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Interactive demo</p>
          <p className="text-xs text-slate-500">
            Explore the workspace with sample data. Try{" "}
            <Link href="/demo/dashboard/secure-vault" className="font-medium text-violet-700 underline-offset-2 hover:underline">
              Secure Vault
            </Link>{" "}
            (Freighter + testnet) for live commitments.
          </p>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
        <Button asChild size="sm" variant="outline" className="h-8 flex-1 rounded-lg border-slate-200 bg-white sm:flex-none">
          <Link href="/">Exit demo</Link>
        </Button>
        <Button asChild size="sm" className="h-8 flex-1 rounded-lg bg-violet-600 hover:bg-violet-700 sm:flex-none">
          <Link href="https://calendly.com" target="_blank" rel="noopener noreferrer">
            Book a demo
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function DemoBannerDismiss({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      className="absolute right-3 top-3 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      aria-label="Dismiss demo banner"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
