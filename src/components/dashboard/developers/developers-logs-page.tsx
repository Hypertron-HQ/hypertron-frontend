"use client";

import { type ComponentType, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  Columns3,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Globe,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Tag,
  Webhook,
  Zap,
} from "lucide-react";
import {
  DevelopersPageHeader,
  type DevelopersMode,
  SectionTitle,
  Surface,
} from "@/components/dashboard/developers/developers-shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

type LogsView = "api-requests" | "webhook-deliveries" | "payment-timeline";
type DeliveryStatus = "Delivered" | "Failed";
type RequestStatus = "201 Created" | "200 OK" | "400 Bad Request";
type Environment = "Test" | "Live";

const topStats = [
  {
    title: "API Requests",
    value: "1,284",
    detail: "+ 24.6% vs last 7 days",
    detailClassName: "text-emerald-600",
    icon: Code2,
    iconClassName: "bg-blue-50 text-blue-600",
    lineColor: "#8b5cf6",
    points: "4,20 18,18 30,6 42,12 54,4 66,9 78,2 90,8 102,1",
  },
  {
    title: "Successful Requests",
    value: "1,231",
    detail: "96.0% success rate",
    detailClassName: "text-slate-500",
    icon: ShieldCheck,
    iconClassName: "bg-emerald-50 text-emerald-600",
    lineColor: "#4ade80",
    points: "4,22 18,18 30,8 42,12 54,3 66,13 78,0 90,7 102,2",
  },
  {
    title: "Failed Requests",
    value: "53",
    detail: "+ 18.5% vs last 7 days",
    detailClassName: "text-red-500",
    icon: ReceiptText,
    iconClassName: "bg-red-50 text-red-500",
    lineColor: "#fb7185",
    points: "4,18 18,19 30,6 42,15 54,18 66,5 78,18 90,20 102,10",
  },
  {
    title: "Webhook Deliveries",
    value: "312",
    detail: "+ 31.2% vs last 7 days",
    detailClassName: "text-emerald-600",
    icon: Webhook,
    iconClassName: "bg-blue-50 text-blue-600",
    lineColor: "#3b82f6",
    points: "4,20 18,19 30,11 42,14 54,2 66,8 78,1 90,5 102,0",
  },
  {
    title: "Avg. Response Time",
    value: "412 ms",
    detail: "+ 12.4% vs last 7 days",
    detailClassName: "text-red-500",
    icon: Clock3,
    iconClassName: "bg-blue-50 text-blue-600",
    lineColor: "#a78bfa",
    points: "4,5 18,16 30,8 42,20 54,18 66,6 78,21 90,22 102,14",
  },
] as const;

const apiRequests = [
  {
    method: "POST",
    endpoint: "/v1/payments",
    requestId: "req_01J2X6YV7A86C4T3J2K9ZP6VFY",
    status: "201 Created" as RequestStatus,
    responseTime: "241 ms",
    environment: "Test" as Environment,
    time: "2 mins ago",
  },
  {
    method: "GET",
    endpoint: "/v1/payments/pay_01J2X6YV7A86BC",
    requestId: "req_01J2X6YV7A872H1O3M4KQ2YT",
    status: "200 OK" as RequestStatus,
    responseTime: "92 ms",
    environment: "Test" as Environment,
    time: "7 mins ago",
  },
  {
    method: "POST",
    endpoint: "/v1/payments",
    requestId: "req_01J2X6YV7A8E6987Q6W3L2N8RM",
    status: "400 Bad Request" as RequestStatus,
    responseTime: "114 ms",
    environment: "Test" as Environment,
    time: "16 mins ago",
  },
  {
    method: "GET",
    endpoint: "/v1/customers",
    requestId: "req_01J2X6YV7AB5H5N2X9B6YQ4FJ2",
    status: "200 OK" as RequestStatus,
    responseTime: "63 ms",
    environment: "Live" as Environment,
    time: "21 mins ago",
  },
  {
    method: "POST",
    endpoint: "/v1/webhooks/test",
    requestId: "req_01J2X6YV7A94K7Q0Z3F5W8PLX",
    status: "200 OK" as RequestStatus,
    responseTime: "84 ms",
    environment: "Test" as Environment,
    time: "35 mins ago",
  },
] as const;

const webhookDeliveries = [
  { event: "payment.completed", status: "Delivered" as DeliveryStatus, attempts: 1, time: "2 mins ago" },
  { event: "payment.created", status: "Delivered" as DeliveryStatus, attempts: 1, time: "18 mins ago" },
  { event: "payment.failed", status: "Failed" as DeliveryStatus, attempts: 3, time: "49 mins ago" },
  { event: "payment.pending", status: "Delivered" as DeliveryStatus, attempts: 1, time: "1 hour ago" },
  { event: "chargeback.created", status: "Delivered" as DeliveryStatus, attempts: 1, time: "2 hours ago" },
] as const;

const timelineItems = [
  {
    title: "Payment Created",
    body: "Payment object created",
    timestamp: "Jul 12, 10:24:31",
    age: "2 mins ago",
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Payment Pending",
    body: "Awaiting payment confirmation",
    timestamp: "Jul 12, 10:24:33",
    age: "2 mins ago",
    tone: "bg-blue-50 text-blue-600",
  },
  {
    title: "Payment Confirmed",
    body: "Payment confirmed on blockchain",
    timestamp: "Jul 12, 10:24:41",
    age: "1 min ago",
    tone: "bg-blue-50 text-blue-600",
  },
  {
    title: "Payment Completed",
    body: "Funds captured successfully",
    timestamp: "Jul 12, 10:24:45",
    age: "1 min ago",
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Webhook Delivered",
    body: "payment.completed delivered",
    timestamp: "Jul 12, 10:24:47",
    age: "1 min ago",
    tone: "bg-emerald-50 text-emerald-600",
  },
] as const;

const requestResponse = `{
  "id": "pay_01J2X6YV7A86C4T3J2K9ZP6VFY",
  "object": "payment",
  "status": "created",
  "amount": "100.00",
  "currency": "USDC",
  "customer_id": "cus_01J2X6YV7A7H2NN9BP3LZ11T",
  "created": "2025-07-12T10:24:31Z",
  "checkout_url": "https://pay.hypertron.io/checkout/pay_01J2X6YV7A86C4T3J2K9ZP6VFY"
}`;

function LogsStatCard({
  title,
  value,
  detail,
  detailClassName,
  icon,
  iconClassName,
  lineColor,
  points,
}: {
  title: string;
  value: string;
  detail: string;
  detailClassName: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number | string }>;
  iconClassName: string;
  lineColor: string;
  points: string;
}) {
  const Icon = icon;

  return (
    <Surface className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconClassName)}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-[32px] font-semibold tracking-tight text-slate-900">{value}</p>
            <p className={cn("mt-2 text-sm font-medium", detailClassName)}>{detail}</p>
          </div>
        </div>

        <svg viewBox="0 0 106 24" className="mt-6 h-10 w-28 shrink-0">
          <polyline
            fill="none"
            stroke={lineColor}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
    </Surface>
  );
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
      {method}
    </span>
  );
}

function RequestStatusBadge({ status }: { status: RequestStatus }) {
  if (status === "400 Bad Request") {
    return (
      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500">
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
      {status}
    </span>
  );
}

function EnvironmentBadge({ environment }: { environment: Environment }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        environment === "Live"
          ? "bg-violet-50 text-violet-500"
          : "bg-blue-50 text-blue-600"
      )}
    >
      {environment}
    </span>
  );
}

function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "Delivered"
          ? "bg-emerald-50 text-emerald-600"
          : "bg-red-50 text-red-500"
      )}
    >
      {status}
    </span>
  );
}

function FilterChip({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
        active
          ? "border-blue-200 bg-blue-50 text-blue-600"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
      )}
    >
      {label}
    </button>
  );
}

export function DevelopersLogsPage() {
  const [mode] = useState<DevelopersMode>("test");
  const [activeView, setActiveView] = useState<LogsView>("api-requests");

  const headerActions = useMemo(
    () => (
      <>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            All Environments
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            Last 7 days
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </>
    ),
    []
  );

  return (
    <div className="space-y-6 pb-2">
      <DevelopersPageHeader
        title="Logs"
        subtitle="Monitor API requests, webhook deliveries and integration activity."
        activeTab="logs"
        mode={mode}
        onModeChange={() => {}}
        actions={headerActions}
      />

      <div className="grid gap-4 xl:grid-cols-5">
        {topStats.map((stat) => (
          <LogsStatCard key={stat.title} {...stat} />
        ))}
      </div>

      <Surface className="p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-6 border-b border-slate-200">
            {[
              { id: "api-requests", label: "API Requests", icon: Code2 },
              { id: "webhook-deliveries", label: "Webhook Deliveries", icon: Webhook },
              { id: "payment-timeline", label: "Payment Timeline", icon: Tag },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id as LogsView)}
                  className={cn(
                    "inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors",
                    active
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative flex-1 xl:max-w-[330px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  defaultValue=""
                  placeholder="Search by endpoint, status, request ID..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {["All Methods", "All Statuses", "All Environments"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="inline-flex h-10 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {label}
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              ))}
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Filter className="h-4 w-4 text-slate-400" />
                More Filters
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 text-slate-400" />
                Export
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Columns3 className="h-4 w-4 text-slate-400" />
                Columns
              </button>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
            <div className="rounded-2xl border border-slate-200/90">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-slate-900">API Requests</h3>
              </div>
              <div className="hidden grid-cols-[0.8fr_2.8fr_1.2fr_1fr_1fr_0.9fr] gap-4 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
                <span>Method</span>
                <span>Endpoint</span>
                <span>Status</span>
                <span>Response Time</span>
                <span>Environment</span>
                <span>Time</span>
              </div>
              <div className="divide-y divide-slate-200/90">
                {apiRequests.map((request) => (
                  <div key={request.requestId} className="grid gap-4 px-5 py-4 md:grid-cols-[0.8fr_2.8fr_1.2fr_1fr_1fr_0.9fr] md:items-center">
                    <MethodBadge method={request.method} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{request.endpoint}</p>
                      <p className="mt-1 font-mono text-xs text-slate-400">{request.requestId}</p>
                    </div>
                    <RequestStatusBadge status={request.status} />
                    <p className="text-sm text-slate-500">{request.responseTime}</p>
                    <EnvironmentBadge environment={request.environment} />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">{request.time}</p>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 text-center">
                <Link href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  View all API requests
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-slate-900">Webhook Deliveries</h3>
              </div>
              <div className="hidden grid-cols-[1.7fr_1fr_0.8fr_1fr] gap-4 px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
                <span>Event</span>
                <span>Status</span>
                <span>Attempts</span>
                <span>Time</span>
              </div>
              <div className="divide-y divide-slate-200/90">
                {webhookDeliveries.map((delivery) => (
                  <div key={`${delivery.event}-${delivery.time}`} className="grid gap-4 px-5 py-4 md:grid-cols-[1.7fr_1fr_0.8fr_1fr] md:items-center">
                    <p className="text-sm font-medium text-slate-900">{delivery.event}</p>
                    <DeliveryStatusBadge status={delivery.status} />
                    <p className="text-sm text-slate-500">{delivery.attempts}</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">{delivery.time}</p>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 text-center">
                <Link href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  View all webhook deliveries
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr_0.8fr]">
            <Surface className="p-6">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Request Details</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <MethodBadge method="POST" />
                    <span className="text-sm font-medium text-slate-900">/v1/payments</span>
                    <RequestStatusBadge status="201 Created" />
                    <span className="text-sm text-slate-500">req_01J2X6YV7A86C4T3J2K9ZP6VFY</span>
                    <span className="text-sm text-slate-400">•</span>
                    <span className="text-sm text-slate-500">2 mins ago</span>
                    <span className="text-sm text-slate-400">•</span>
                    <span className="text-sm text-slate-500">241 ms</span>
                    <EnvironmentBadge environment="Test" />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-blue-200 bg-white px-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-500"
                >
                  View in Playground
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-6 border-b border-slate-200 pt-4">
                {["Request", "Response", "Headers", "Timeline"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={cn(
                      "border-b-2 pb-3 text-sm font-semibold transition-colors",
                      tab === "Response"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a]">
                <div className="flex items-center justify-end border-b border-slate-700/70 px-4 py-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
                <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-6 text-slate-200">
                  <code>{requestResponse}</code>
                </pre>
              </div>
            </Surface>

            <Surface className="p-6">
              <SectionTitle title="Payment Timeline" />
              <div className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                pay_01J2X6YV7A86C4T3J2K9ZP6VFY
              </div>

              <div className="mt-5 space-y-5">
                {timelineItems.map((item, index) => (
                  <div key={item.title} className="relative pl-8">
                    {index < timelineItems.length - 1 ? (
                      <div className="absolute left-[11px] top-8 h-[calc(100%+8px)] w-px bg-slate-200" />
                    ) : null}
                    <span className={cn("absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-full", item.tone)}>
                      <div className="h-2.5 w-2.5 rounded-full bg-current" />
                    </span>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{item.body}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-400">{item.timestamp}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.age}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="p-6">
              <SectionTitle title="Quick Filters" />

              <div className="mt-5 space-y-5">
                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">Status</p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip label="All" active />
                    <FilterChip label="2xx" />
                    <FilterChip label="3xx" />
                    <FilterChip label="4xx" />
                    <FilterChip label="5xx" />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">Method</p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip label="All" active />
                    <FilterChip label="GET" />
                    <FilterChip label="POST" />
                    <FilterChip label="PUT" />
                    <FilterChip label="DELETE" />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">Environment</p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip label="All" active />
                    <FilterChip label="Test" />
                    <FilterChip label="Live" />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-semibold text-slate-700">Time</p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip label="Last 15 min" />
                    <FilterChip label="Last 1 hour" />
                    <FilterChip label="Last 24 hours" />
                    <FilterChip label="Custom" />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="h-10 w-full rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </Surface>
          </div>
        </div>
      </Surface>
    </div>
  );
}
