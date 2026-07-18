"use client";

import { useState, useEffect } from "react";
import { DollarSign, Link2, CheckCircle, Clock } from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";

interface Stats {
  totalReceivedXlm: string;
  linkCount: number;
  completed: number;
  pending: number;
}

interface OverviewStatsProps {
  businessId: string | null;
  /** When true, show NA placeholders instead of metrics (onboarding not completed). */
  onboardingIncomplete?: boolean;
}

/** Dark mode: landing accent. Light mode: BDO mesh gradient strip. */
function statAccentBar(theme: "dark" | "light") {
  return theme === "light"
    ? "linear-gradient(90deg, #74a0ff 0%, #b197fc 55%, #ffb347 100%)"
    : "#FFF971";
}

function StatCard({
  label,
  sub,
  icon: Icon,
  value,
  theme,
}: {
  label: string;
  sub: string;
  icon: React.ElementType;
  value: string;
  theme: "dark" | "light";
}) {
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-white/[0.12] bg-transparent p-6 backdrop-blur-xl transition-colors duration-300 hover:border-white/[0.2]">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`mt-1 shrink-0 rounded-full transition-[width] group-hover:w-14 ${theme === "light" ? "h-1 w-12" : "h-0.5 w-10"}`}
          style={{ background: statAccentBar(theme) }}
          aria-hidden
        />
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <span className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{value}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

export function OverviewStats({ businessId, onboardingIncomplete }: OverviewStatsProps) {
  const { theme } = useDashboardTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!businessId) {
      setStats(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/dashboard-stats?businessId=${encodeURIComponent(businessId)}`, {
      credentials: "same-origin",
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof json?.error === "string" ? json.error : `Failed to load stats (${res.status})`
          );
        }
        return json as Stats;
      })
      .then((data) => {
        if (cancelled) return;
        setStats(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setStats(null);
        setError(e instanceof Error ? e.message : "Could not load stats");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const d = stats ?? {
    totalReceivedXlm: "0.0000",
    linkCount: 0,
    completed: 0,
    pending: 0,
  };

  if (onboardingIncomplete) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Received" sub="Complete onboarding to see metrics" icon={DollarSign} value="NA" theme={theme} />
        <StatCard label="Payment Links" sub="Complete onboarding to see metrics" icon={Link2} value="NA" theme={theme} />
        <StatCard label="Completed" sub="Complete onboarding to see metrics" icon={CheckCircle} value="NA" theme={theme} />
        <StatCard label="Pending" sub="Complete onboarding to see metrics" icon={Clock} value="NA" theme={theme} />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Received"
          sub="All-time from payment links"
          icon={DollarSign}
          value={loading ? "…" : `${d.totalReceivedXlm} XLM`}
          theme={theme}
        />
        <StatCard
          label="Payment Links"
          sub="Active links"
          icon={Link2}
          value={loading ? "…" : String(d.linkCount)}
          theme={theme}
        />
        <StatCard
          label="Completed"
          sub="Successful payments"
          icon={CheckCircle}
          value={loading ? "…" : String(d.completed)}
          theme={theme}
        />
        <StatCard
          label="Pending"
          sub="Awaiting payment"
          icon={Clock}
          value={loading ? "…" : String(d.pending)}
          theme={theme}
        />
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </>
  );
}
