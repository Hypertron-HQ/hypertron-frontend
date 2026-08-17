"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PanelShell({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          {eyebrow ? (
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function AppSurface({
  children,
  className,
  padded = true,
  tone = "paper",
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  tone?: "paper" | "muted" | "shielded";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border",
        tone === "paper" && "border-border bg-card text-card-foreground",
        tone === "muted" && "border-border bg-muted/60 text-foreground",
        tone === "shielded" &&
          "border-[color:var(--shielded-border)] bg-[color:var(--shielded)] text-[color:var(--shielded-foreground)]",
        padded && "px-5 py-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Money({
  value,
  unit,
  size = "md",
  className,
}: {
  value: string | number;
  unit?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "dash-amount inline-flex items-baseline gap-1.5 font-semibold tracking-tight text-foreground",
        size === "sm" && "text-base",
        size === "md" && "text-2xl",
        size === "lg" && "text-3xl",
        className,
      )}
    >
      <span>{value}</span>
      {unit ? (
        <span className="text-sm font-medium text-muted-foreground">{unit}</span>
      ) : null}
    </span>
  );
}

export type StatusTone =
  | "pending"
  | "paid"
  | "settled"
  | "expired"
  | "spent"
  | "shielded"
  | "error"
  | "neutral";

const STATUS_TONE: Record<StatusTone, string> = {
  pending:
    "border-amber-200/80 bg-amber-50 text-amber-900",
  paid: "border-blue-200/80 bg-blue-50 text-blue-800",
  settled: "border-blue-200/80 bg-blue-50 text-blue-800",
  expired: "border-border bg-muted text-muted-foreground",
  spent: "border-border bg-muted text-muted-foreground",
  shielded:
    "border-[color:var(--shielded-border)] bg-[color:var(--shielded)] text-[color:var(--shielded-foreground)]",
  error: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STATUS_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-5 py-8",
        className,
      )}
    >
      <div className="max-w-md">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function WarningStrip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border border-[color:var(--shielded-border)] bg-[color:var(--shielded)] px-4 py-3 text-sm text-[color:var(--shielded-foreground)]",
        className,
      )}
      role="status"
    >
      {children}
    </div>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function MonoId({
  children,
  title,
  className,
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn("dash-mono text-xs text-muted-foreground", className)}
    >
      {children}
    </span>
  );
}
