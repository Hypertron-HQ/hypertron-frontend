"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";

export type PortfolioValuePoint = { x: string; value: number };

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

function formatTooltipValue(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

const CHART_TYPES = [
  { value: "totalValue", label: "Total Value" },
  { value: "marketCap", label: "Market Cap Chart" },
] as const;

const TIME_RANGES = ["1D", "7D", "30D", "90D", "All"] as const;

type Props = {
  /**
   * Portfolio total valuation over time.
   * From API: aggregate of all wallet holdings per timestamp.
   * Shape: { x: "YYYY-MM-DD" or "YYYY-MM-DD HH:00", value: number }[]
   */
  data?: PortfolioValuePoint[];
  loading?: boolean;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  chartType?: "totalValue" | "marketCap";
  onChartTypeChange?: (type: "totalValue" | "marketCap") => void;
  height?: number;
};

/** Mock portfolio valuation – replace with wallet/portfolio API in parent */
function getMockData(): PortfolioValuePoint[] {
  const points: PortfolioValuePoint[] = [];
  const base = 12000;
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({
      x: d.toISOString().split("T")[0],
      value: base + Math.random() * 2000 + (13 - i) * 80,
    });
  }
  return points;
}

export function PortfolioTotalValueChart({
  data,
  loading = false,
  timeRange = "All",
  onTimeRangeChange,
  chartType = "totalValue",
  onChartTypeChange,
  height = 280,
}: Props) {
  const [localTimeRange, setLocalTimeRange] = useState(timeRange);
  const [localChartType, setLocalChartType] = useState(chartType);
  const effectiveTimeRange = timeRange ?? localTimeRange;
  const effectiveChartType = chartType ?? localChartType;

  const chartData = data && data.length > 0 ? data : getMockData();
  const showLoading = loading;
  const showChart = !showLoading && chartData.length > 0;

  const setTimeRange = (r: string) => {
    setLocalTimeRange(r);
    onTimeRangeChange?.(r);
  };
  const setChartType = (t: "totalValue" | "marketCap") => {
    setLocalChartType(t);
    onChartTypeChange?.(t);
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    const value = payload[0]?.value;
    return (
      <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
        <p className="font-medium text-foreground">
          {typeof value === "number" ? formatTooltipValue(value) : value}
        </p>
        <p className="text-xs text-muted-foreground">
          {label ? formatDateLabel(String(label)) : ""}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-semibold">Total assets valuation</h3>
      {/* Header: chart type toggle (Total Value / Market Cap) + time range */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg bg-muted/50 p-0.5">
          {CHART_TYPES.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setChartType(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                effectiveChartType === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg bg-muted/50 p-0.5">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                effectiveTimeRange === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area: loading spinner + blurred placeholder, or line chart */}
      <div className="relative min-h-[220px] w-full rounded-xl border border-border bg-muted/20">
        {showLoading && (
          <>
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60"
              aria-busy="true"
              aria-label="Loading portfolio value"
            />
            <div
              className="absolute left-1/2 top-1/2 z-20 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin"
              aria-hidden
            />
          </>
        )}
        {showLoading && (
          <div className="absolute inset-0 flex items-end p-4 opacity-30">
            <svg className="h-32 w-full" viewBox="0 0 400 80" preserveAspectRatio="none">
              <path
                d="M0,60 Q50,20 100,50 T200,30 T300,55 T400,20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
        )}
        {!showLoading && (
          <div className="p-2" style={{ height }}>
            <ResponsiveContainer width="100%" height={height - 16}>
              <LineChart data={chartData} margin={{ top: 5, right: 8, left: 0, bottom: 20 }}>
                <XAxis
                  dataKey="x"
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
                  tickFormatter={(v) => formatTooltipValue(Number(v))}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  width={48}
                  domain={["auto", "auto"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--foreground))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Tracks all assets in your wallet and displays portfolio value over time. Wire your API for
        live data.
      </p>
    </div>
  );
}
