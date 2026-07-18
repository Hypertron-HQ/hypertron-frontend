"use client";

type Props = {
  /** Value from API */
  value?: string | number;
  /** Subtitle, e.g. "routes in last 24h" */
  subvalue?: string;
  label?: string;
};

export function ActiveRoutesMetric({
  value = "12",
  subvalue = "routes in last 24h",
  label = "Active Routes",
}: Props) {
  return (
    <div className="flex flex-col gap-0.5 p-5">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-muted-foreground">{subvalue}</p>
    </div>
  );
}
