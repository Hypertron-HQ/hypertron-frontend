"use client";

import type { ReactNode } from "react";

type DashboardPageHeaderProps = {
  /** Small caps line above the title (e.g. "Operations") */
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  /** Right-aligned actions (e.g. secondary buttons) */
  end?: ReactNode;
  /** Light workspace hub pages */
  variant?: "default" | "hub";
};

/**
 * Page title block aligned with marketing mono (Solution section) typography.
 */
export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  end,
  variant = "default",
}: DashboardPageHeaderProps) {
  const isHub = variant === "hub";
  const body = (
    <div className="min-w-0 space-y-3">
      {eyebrow ? (
        <p
          className={
            isHub
              ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600"
              : "text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
          }
        >
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={
          isHub
            ? "max-w-3xl text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl"
            : "max-w-3xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        }
      >
        {title}
      </h1>
      {description ? (
        <p
          className={
            isHub
              ? "max-w-2xl text-sm leading-relaxed text-neutral-500 md:text-base"
              : "max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base"
          }
        >
          {description}
        </p>
      ) : null}
    </div>
  );

  if (end) {
    return (
      <div className="flex flex-wrap items-start justify-between gap-4">
        {body}
        <div className="shrink-0">{end}</div>
      </div>
    );
  }

  return body;
}
