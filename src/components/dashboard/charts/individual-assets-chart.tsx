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
import { WALLET_ASSETS, type WalletAssetId, type WalletAsset } from "./wallet-assets";

export type AssetHistoryPoint = { x: string; value: number };

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

const TIME_RANGES = ["1D", "7D", "30D", "90D", "All"] as const;

type Props = {
  /** Available assets to filter (default: XLM, PayPal USD, EURC) */
  assets?: WalletAsset[];
  /** Historical data per asset id. From API: wallet balances or price history per token. */
  dataByAsset?: Partial<Record<WalletAssetId, AssetHistoryPoint[]>>;
  /** Currently selected asset (controlled) */
  selectedAssetId?: WalletAssetId;
  onAssetChange?: (id: WalletAssetId) => void;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  loading?: boolean;
  height?: number;
};

/** Mock historical series per asset – replace with API in parent */
function getMockHistoryForAsset(assetId: WalletAssetId): AssetHistoryPoint[] {
  const points: AssetHistoryPoint[] = [];
  const bases: Record<WalletAssetId, number> = {
    xlm: 0.35,
    pyusd: 1,
    eurc: 1.08,
  };
  const base = bases[assetId] ?? 1;
  const spread = assetId === "xlm" ? 0.08 : 0.02;
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    points.push({
      x: d.toISOString().split("T")[0],
      value: base + Math.random() * spread + (13 - i) * 0.002,
    });
  }
  return points;
}

export function IndividualAssetsChart({
  assets = WALLET_ASSETS,
  dataByAsset,
  selectedAssetId: controlledAssetId,
  onAssetChange,
  timeRange = "All",
  onTimeRangeChange,
  loading = false,
  height = 260,
}: Props) {
  const [localAssetId, setLocalAssetId] = useState<WalletAssetId>("xlm");
  const [localTimeRange, setLocalTimeRange] = useState(timeRange);
  const selectedId = controlledAssetId ?? localAssetId;
  const effectiveTimeRange = timeRange ?? localTimeRange;

  const selectedAsset = assets.find((a) => a.id === selectedId) ?? assets[0];
  const chartData =
    dataByAsset?.[selectedId] && dataByAsset[selectedId]!.length > 0
      ? dataByAsset[selectedId]!
      : getMockHistoryForAsset(selectedId);

  const setAsset = (id: WalletAssetId) => {
    setLocalAssetId(id);
    onAssetChange?.(id);
  };
  const setTimeRange = (r: string) => {
    setLocalTimeRange(r);
    onTimeRangeChange?.(r);
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
      <h3 className="text-base font-semibold">Individual assets</h3>
      <p className="text-sm text-muted-foreground">
        Historical data for each asset in your wallet. Select an asset to view its history.
      </p>

      {/* Asset filter: tokens with logos */}
      <div className="flex flex-wrap items-center gap-2">
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            onClick={() => setAsset(asset.id)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              selectedId === asset.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
            }`}
          >
            <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.logo}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
            <span>
              {asset.name} ({asset.ticker})
            </span>
          </button>
        ))}
      </div>

      {/* Time range */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          Showing: {selectedAsset.name} ({selectedAsset.ticker})
        </span>
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

      {/* Chart */}
      <div className="relative min-h-[200px] w-full rounded-xl border border-border bg-muted/20">
        {loading && (
          <>
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/60"
              aria-busy="true"
              aria-label="Loading asset history"
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
    </div>
  );
}
