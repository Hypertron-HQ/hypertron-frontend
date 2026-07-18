"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnalyticsChart } from "./analytics-chart";

function SimpleBarList({
  items,
  valueFormatter,
  barClass,
}: {
  items: { name: string; value: number }[];
  valueFormatter: (n: number) => string;
  barClass: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((i) => {
        const width = `${Math.round((i.value / max) * 100)}%`;
        return (
          <li key={i.name} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 truncate text-xs text-muted-foreground">
                {i.name}
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted">
                <div
                  className={`h-2.5 rounded-full ${barClass}`}
                  style={{ width }}
                />
              </div>
            </div>
            <div className="pl-2 text-xs font-medium tabular-nums">
              {valueFormatter(i.value)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function AnalyticsTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Link traffic</CardTitle>
          <CardDescription>
            Clicks and unique visitors to your payment links
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <AnalyticsChart />
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,248</div>
            <p className="text-xs text-muted-foreground">+12.4% vs last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique visitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">832</div>
            <p className="text-xs text-muted-foreground">+5.8% vs last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <p className="text-xs text-muted-foreground">+2% vs last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42 XLM</div>
            <p className="text-xs text-muted-foreground">+18% vs last week</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Top links</CardTitle>
            <CardDescription>Most clicked payment links</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: "Invoice #1024", value: 512 },
                { name: "Donation", value: 238 },
                { name: "Product A", value: 174 },
                { name: "Event ticket", value: 104 },
              ]}
              barClass="bg-primary"
              valueFormatter={(n) => `${n}`}
            />
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Devices</CardTitle>
            <CardDescription>How payers open your links</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: "Mobile", value: 62 },
                { name: "Desktop", value: 32 },
                { name: "Tablet", value: 6 },
              ]}
              barClass="bg-muted-foreground"
              valueFormatter={(n) => `${n}%`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
