"use client";

import { useMemo } from "react";

export type HeatMapPoint = { date: string; intensity: number };

function getLevel(intensity: number, levels: number[]): number {
  if (intensity === 0) return 0;
  for (let i = 1; i < levels.length; i++) {
    if (intensity <= levels[i]) return i;
  }
  return Math.min(levels.length - 1, 4);
}

const INTENSITY_LEVELS = [0, 25, 50, 75, 100];
const LEVEL_CLASSES = [
  "bg-muted/30",           // 0
  "bg-muted/50",           // 1
  "bg-muted",              // 2
  "bg-muted-foreground/40", // 3
  "bg-muted-foreground/70", // 4
];

type Props = {
  /** Data from API: { date: "YYYY-MM-DD", intensity: number }[] */
  points?: HeatMapPoint[];
  days?: number;
  intensityLevels?: number[];
};

/** Mock heatmap data – replace with API in parent */
function getMockPoints(days: number): HeatMapPoint[] {
  const pts: HeatMapPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    pts.push({
      date: d.toISOString().split("T")[0],
      intensity: Math.floor(Math.random() * 5) * 25,
    });
  }
  return pts;
}

export function RiskHeatmapChart({
  points,
  days = 28,
  intensityLevels = INTENSITY_LEVELS,
}: Props) {
  const gridData = useMemo(() => {
    const data = points && points.length > 0 ? points : getMockPoints(days);
    const dateMap = new Map<string, number>();
    data.forEach((p) => dateMap.set(p.date, p.intensity));

    const today = new Date();
    const grid: Array<{ date: string; intensity: number }> = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      grid.push({ date: dateStr, intensity: dateMap.get(dateStr) ?? 0 });
    }
    const totalCells = Math.ceil(grid.length / 7) * 7;
    while (grid.length < totalCells) {
      grid.push({ date: "", intensity: 0 });
    }
    return grid;
  }, [points, days]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Risk Heatmap</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            {LEVEL_CLASSES.map((cls, i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-sm ${cls}`}
                title={`Level ${i}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
      <div
        className="grid w-full gap-1"
        style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
      >
        {gridData.map((cell, index) => {
          const level = getLevel(cell.intensity, intensityLevels);
          const title = cell.date
            ? `${formatDate(cell.date)}: ${cell.intensity}`
            : undefined;
          return (
            <div
              key={index}
              className={`min-h-[14px] min-w-0 rounded border border-border/50 ${LEVEL_CLASSES[level]} transition-transform hover:scale-110`}
              title={title}
              role="img"
              aria-label={title}
            />
          );
        })}
      </div>
    </div>
  );
}
