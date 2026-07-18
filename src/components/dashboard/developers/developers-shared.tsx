"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { FlaskConical, CheckCircle2, Copy } from "lucide-react";
import { cn } from "@/utils";
import { useDemoMode } from "@/components/demo/demo-mode-provider";

export type DevelopersMode = "test" | "live";
export type DevelopersTabId = "overview" | "api-keys" | "webhooks" | "logs";

const developerTabs: Array<{
  id: DevelopersTabId;
  label: string;
  href?: string;
}> = [
  { id: "overview", label: "Overview", href: "/dashboard/developers" },
  { id: "api-keys", label: "API Keys", href: "/dashboard/developers/api-keys" },
  { id: "webhooks", label: "Webhooks", href: "/dashboard/developers/webhooks" },
  { id: "logs", label: "Logs", href: "/dashboard/developers/logs" },
];

export function Surface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/90 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
      aria-label={`Copy ${value}`}
    >
      {copied ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function DevelopersPageHeader({
  title,
  subtitle,
  activeTab,
  mode,
  onModeChange,
  actions,
}: {
  title: string;
  subtitle: string;
  activeTab: DevelopersTabId;
  mode: DevelopersMode;
  onModeChange: (mode: DevelopersMode) => void;
  actions?: ReactNode;
}) {
  const { demoPath } = useDemoMode();

  return (
    <>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[32px]">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>
        </div>

        {actions ? (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {actions}
          </div>
        ) : (
          <div className="inline-flex w-full max-w-[280px] rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => onModeChange("test")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                mode === "test"
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-500"
                  : "text-slate-500 hover:bg-blue-50"
              )}
            >
              <FlaskConical className="h-4 w-4" />
              Test Mode
            </button>
            <button
              type="button"
              onClick={() => onModeChange("live")}
              className={cn(
                "flex flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                mode === "live"
                  ? "bg-blue-600 text-white shadow-sm hover:bg-blue-500"
                  : "text-slate-500 hover:bg-blue-50"
              )}
            >
              Live Mode
            </button>
          </div>
        )}
      </div>

      <div className="border-b border-slate-200/90">
        <div className="flex flex-wrap gap-6">
          {developerTabs.map((tab) => {
            const className = cn(
              "border-b-2 pb-3 text-sm font-semibold transition-colors",
              tab.id === activeTab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500"
            );

            if (!tab.href) {
              return (
                <span key={tab.id} className={className}>
                  {tab.label}
                </span>
              );
            }

            return (
              <Link key={tab.id} href={demoPath(tab.href)} className={className}>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
