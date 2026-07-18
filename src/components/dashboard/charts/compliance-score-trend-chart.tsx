"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";

export type ComplianceScoreTrendPoint = { x: string; value: number };

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

type Props = {
  /** Data from API: { x: "YYYY-MM-DD", value: number }[] */
  data?: ComplianceScoreTrendPoint[];
  height?: number;
  /** Time range tabs (e.g. 1W, 1M, 6M, 1Y, All) – for future API params */
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
};

const TIME_RANGES = ["1W", "1M", "6M", "1Y", "All"] as const;

/** Mock data when no data provided – replace with API call in parent */
function getMockData(): ComplianceScoreTrendPoint[] {
  const points: ComplianceScoreTrendPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({
      x: d.toISOString().split("T")[0],
      value: 5.2 + Math.random() * 1.8 + (13 - i) * 0.04,
    });
  }
  return points;
}

export function ComplianceScoreTrendChart({
  data,
  height = 220,
  timeRange = "All",
  onTimeRangeChange,
}: Props) {
  const chartData = data && data.length > 0 ? data : getMockData();

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm">
        <p className="font-medium text-foreground">{payload[0]?.value?.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">
          {label ? formatDateLabel(String(label)) : ""}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">Compliance Score Trend</h3>
        {onTimeRangeChange && (
          <div className="flex rounded-lg bg-muted/50 p-0.5">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onTimeRangeChange(r)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  timeRange === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="min-h-[180px] w-full">
        <ResponsiveContainer width="100%" height={height}>
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
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={32}
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
    </div>
  );
}
