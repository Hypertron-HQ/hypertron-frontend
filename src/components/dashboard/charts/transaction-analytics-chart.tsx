"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";

export type DailyPaymentPoint = { date: string; count: number; totalAmount: number };

function formatDateLabel(dateString: string): string {
  try {
    const date = new Date(dateString);
    const month = date.toLocaleString("default", { month: "short" });
    const day = date.getDate();
    return `${month} ${day}`;
  } catch {
    return dateString;
  }
}

const TIME_RANGES = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
] as const;

type Props = {
  /** Stellar wallet address (G...) – from integrated wallet / useFreighter */
  walletAddress: string | null;
  height?: number;
};

/** Mock data when no wallet or API returns empty */
function getMockDailyData(days: number): DailyPaymentPoint[] {
  const out: DailyPaymentPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      date: d.toISOString().split("T")[0],
      count: Math.floor(Math.random() * 5) + (i === 0 ? 2 : 0),
      totalAmount: Math.random() * 50 + 10,
    });
  }
  return out;
}

export function TransactionAnalyticsChart({ walletAddress, height = 280 }: Props) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<DailyPaymentPoint[]>([]);
  const [loading, setLoading] = useState(!!walletAddress);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress?.trim()) {
      setData(getMockDailyData(days));
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/transaction-analytics?days=${days}`, { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load transaction data");
        return res.json();
      })
      .then((json: { daily: DailyPaymentPoint[] }) => {
        const daily = json.daily ?? [];
        if (daily.length > 0) {
          setData(daily);
        } else {
          setData(getMockDailyData(days));
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Error");
        setData(getMockDailyData(days));
      })
      .finally(() => setLoading(false));
  }, [walletAddress, days]);

  const chartData = data.length > 0 ? data : getMockDailyData(days);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload as DailyPaymentPoint;
    return (
      <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
        <p className="font-medium text-foreground">
          {point.count} payment{point.count !== 1 ? "s" : ""} received
        </p>
        {point.totalAmount > 0 && (
          <p className="text-xs text-muted-foreground">
            Total: {point.totalAmount.toFixed(2)} XLM
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {label ? formatDateLabel(String(label)) : ""}
        </p>
      </div>
    );
  };

  const noWallet = !walletAddress?.trim();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold">Transaction Analytics</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {noWallet
            ? "Connect your wallet to track daily payments received from Stellar."
            : "Daily payments received. Tracked from Stellar scanner based on the wallet integrated with this dashboard."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Payments per day</span>
        <div className="flex rounded-lg bg-muted/50 p-0.5">
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setDays(r.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                days === r.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive">
          Could not load Stellar data. Showing sample data.
        </p>
      )}

      <div className="relative min-h-[200px] w-full rounded-xl border border-border bg-muted/20">
        {loading && (
          <>
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60"
              aria-busy="true"
              aria-label="Loading transaction analytics"
            />
            <div
              className="absolute left-1/2 top-1/2 z-20 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin"
              aria-hidden
            />
          </>
        )}
        {!loading && (
          <div className="p-2" style={{ height }}>
            <ResponsiveContainer width="100%" height={height - 16}>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
              >
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={formatDateLabel}
                  interval="preserveStartEnd"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  orientation="right"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  width={28}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                  isAnimationActive
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
