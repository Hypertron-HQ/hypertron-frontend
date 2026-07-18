"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export type RatingCategory = {
  name: string;
  value: number;
  fill?: string;
};

/* Blue / cyan / bluish palette for Project ratings bars */
const CATEGORIES: { key: string; name: string; color: string }[] = [
  { key: "dependency", name: "Dependency", color: "hsl(199, 65%, 45%)" },      /* teal-blue */
  { key: "financial", name: "Financial", color: "hsl(217, 91%, 60%)" },       /* bright blue */
  { key: "operational", name: "Operational", color: "hsl(187, 78%, 41%)" },    /* cyan */
  { key: "regulatory", name: "Regulatory", color: "hsl(210, 75%, 50%)" },      /* medium blue */
  { key: "reputational", name: "Reputational", color: "hsl(192, 70%, 48%)" }, /* cyanish */
  { key: "security", name: "Security", color: "hsl(213, 55%, 55%)" },        /* light blue */
];

type Props = {
  /** Data from API: { name: string, value: number }[] – use CATEGORIES names or custom */
  data?: RatingCategory[];
  height?: number;
  /** Time range for API (e.g. 1W, 1M, 6M, 1Y, All) */
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
};

const TIME_RANGES = ["1W", "1M", "6M", "1Y", "All"] as const;

function getMockData(): RatingCategory[] {
  const base = [78, 82, 71, 88, 75, 85];
  return CATEGORIES.map((cat, i) => ({
    name: cat.name,
    value: Math.min(100, Math.max(0, base[i] + (Math.random() - 0.5) * 8)),
    fill: cat.color,
  }));
}

export function ProjectRatingsBarChart({
  data,
  height = 270,
  timeRange = "All",
  onTimeRangeChange,
}: Props) {
  const chartData = data && data.length > 0 ? data : getMockData();
  const withFill = chartData.map((d, i) => ({
    ...d,
    fill: d.fill ?? CATEGORIES[i % CATEGORIES.length]?.color ?? "hsl(var(--primary))",
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">Project ratings</h3>
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
      <div className="min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={withFill} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <XAxis
              dataKey="name"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              interval={0}
            />
            <YAxis
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              width={28}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [String(value), "Score"]}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive>
              {withFill.map((entry, index) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {CATEGORIES.map((cat) => (
          <span key={cat.key} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
          </span>
        ))}
      </div>
    </div>
  );
}
