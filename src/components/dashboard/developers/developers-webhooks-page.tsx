"use client";

import { type ComponentType, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CirclePlus,
  Copy,
  Eye,
  ExternalLink,
  Pencil,
  RefreshCw,
  Send,
  ShieldCheck,
  Siren,
  Trash2,
  Webhook,
  Zap,
} from "lucide-react";
import {
  CopyValue,
  DevelopersPageHeader,
  type DevelopersMode,
  SectionTitle,
  Surface,
} from "@/components/dashboard/developers/developers-shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

type EndpointRow = {
  url: string;
  label: string;
  events: number;
  status: "Active" | "Inactive";
  successRate: string;
  lastDelivery: string;
  lastEvent: string;
};

type DeliveryRow = {
  event: string;
  endpoint: string;
  status: "Delivered" | "Failed";
  response: string;
  time: string;
  attempts: number;
};

const stats = [
  {
    title: "Active Endpoints",
    value: "2",
    detail: "of 5 allowed",
    action: "Manage limits",
    icon: Webhook,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    title: "Successful Deliveries",
    value: "98.7%",
    detail: "Last 7 days",
    icon: ShieldCheck,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Failed Deliveries",
    value: "12",
    detail: "Last 7 days",
    action: "View logs",
    icon: Siren,
    iconClassName: "bg-orange-50 text-orange-500",
  },
  {
    title: "Avg. Response Time",
    value: "412 ms",
    detail: "Last 7 days",
    icon: Zap,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    title: "Last Delivery",
    value: "2 mins ago",
    detail: "payment.completed",
    icon: Send,
    iconClassName: "bg-blue-50 text-blue-600",
  },
] as const;

const endpoints: EndpointRow[] = [
  {
    url: "https://api.example.com/webhooks/hypertron",
    label: "Main Production Endpoint",
    events: 6,
    status: "Active",
    successRate: "99.3%",
    lastDelivery: "2 mins ago",
    lastEvent: "payment.completed",
  },
  {
    url: "https://backup.example.com/webhooks/hypertron",
    label: "Backup Endpoint",
    events: 4,
    status: "Active",
    successRate: "97.8%",
    lastDelivery: "18 mins ago",
    lastEvent: "payment.created",
  },
] as const;

const subscriptionEvents = [
  {
    id: "payment.created",
    title: "payment.created",
    description: "Triggered when a payment is created.",
    selected: true,
  },
  {
    id: "payment.pending",
    title: "payment.pending",
    description: "Triggered when a payment is pending.",
    selected: true,
  },
  {
    id: "refund.completed",
    title: "refund.completed",
    description: "Triggered when a refund is completed.",
    selected: false,
  },
  {
    id: "payment.confirmed",
    title: "payment.confirmed",
    description: "Triggered when a payment is confirmed.",
    selected: true,
  },
  {
    id: "payment.failed",
    title: "payment.failed",
    description: "Triggered when a payment fails.",
    selected: true,
  },
  {
    id: "chargeback.created",
    title: "chargeback.created",
    description: "Triggered when a chargeback is created.",
    selected: false,
  },
  {
    id: "payment.completed",
    title: "payment.completed",
    description: "Triggered when a payment is completed.",
    selected: true,
  },
  {
    id: "refund.created",
    title: "refund.created",
    description: "Triggered when a refund is created.",
    selected: false,
  },
  {
    id: "payout.sent",
    title: "payout.sent",
    description: "Triggered when a payout is sent.",
    selected: false,
  },
  {
    id: "invoice.paid",
    title: "invoice.paid",
    description: "Triggered when an invoice is paid.",
    selected: true,
  },
] as const;

const deliveries: DeliveryRow[] = [
  {
    event: "payment.completed",
    endpoint: "https://api.example.com/webhooks/hypertron",
    status: "Delivered",
    response: "200 OK",
    time: "2 mins ago",
    attempts: 1,
  },
  {
    event: "payment.created",
    endpoint: "https://backup.example.com/webhooks/hypertron",
    status: "Delivered",
    response: "200 OK",
    time: "18 mins ago",
    attempts: 1,
  },
  {
    event: "payment.failed",
    endpoint: "https://api.example.com/webhooks/hypertron",
    status: "Failed",
    response: "500 Internal Server Error",
    time: "49 mins ago",
    attempts: 3,
  },
  {
    event: "payment.pending",
    endpoint: "https://api.example.com/webhooks/hypertron",
    status: "Delivered",
    response: "200 OK",
    time: "1 hour ago",
    attempts: 1,
  },
] as const;

const guideLinks = [
  "How webhooks work",
  "Signature verification",
  "Event reference",
  "Best practices",
] as const;

function MetricCard({
  title,
  value,
  detail,
  action,
  icon,
  iconClassName,
}: {
  title: string;
  value: string;
  detail: string;
  action?: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number | string }>;
  iconClassName: string;
}) {
  const Icon = icon;

  return (
    <Surface className="p-5">
      <div className="space-y-4">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", iconClassName)}>
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-[32px] font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{detail}</p>
        </div>
        {action ? (
          <Link href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
            {action}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </Surface>
  );
}

function EndpointStatus({ status }: { status: EndpointRow["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "Active"
          ? "bg-emerald-50 text-emerald-600"
          : "bg-slate-100 text-slate-500"
      )}
    >
      {status}
    </span>
  );
}

function EndpointActions() {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <button type="button" className="rounded-md p-1 transition-colors hover:bg-slate-100 hover:text-slate-600">
        <Pencil className="h-4 w-4" />
      </button>
      <button type="button" className="rounded-md p-1 transition-colors hover:bg-slate-100 hover:text-slate-600">
        <Copy className="h-4 w-4" />
      </button>
      <button type="button" className="rounded-md p-1 transition-colors hover:bg-red-50 hover:text-red-500">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function RecentDeliveryStatus({ status }: { status: DeliveryRow["status"] }) {
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

function RecentDeliveryResponse({ response }: { response: string }) {
  const failed = response.startsWith("500");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        failed ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"
      )}
    >
      {response}
    </span>
  );
}

function RightSidebarGuide() {
  return (
    <Surface className="p-6">
      <SectionTitle title="Webhook Guide" />

      <div className="mt-5 space-y-2">
        {guideLinks.map((label) => (
          <Link
            key={label}
            href="#"
            className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50/40"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <BookOpen className="h-[18px] w-[18px]" strokeWidth={1.85} />
              </span>
              {label}
            </span>
            <ExternalLink className="h-[18px] w-[18px] text-slate-400" />
          </Link>
        ))}
      </div>
    </Surface>
  );
}

export function DevelopersWebhooksPage() {
  const [mode] = useState<DevelopersMode>("test");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    subscriptionEvents.filter((event) => event.selected).map((event) => event.id)
  );
  const selectedCount = selectedEvents.length;
  const availableCount = subscriptionEvents.length;

  const actionButtons = useMemo(
    () => (
      <>
        <Button
          variant="outline"
          className="h-10 rounded-xl border-blue-200 bg-white px-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-500"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          View Webhook Docs
        </Button>
        <Button className="h-10 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500">
          <CirclePlus className="mr-2 h-4 w-4" />
          Add Webhook Endpoint
        </Button>
      </>
    ),
    []
  );

  return (
    <div className="space-y-6 pb-2">
      <DevelopersPageHeader
        title="Webhooks"
        subtitle="Manage webhook endpoints and real-time event delivery."
        activeTab="webhooks"
        mode={mode}
        onModeChange={() => {}}
        actions={actionButtons}
      />

      <div className="grid gap-4 xl:grid-cols-5">
        {stats.map((stat) => (
          <MetricCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_340px]">
        <div className="space-y-5">
          <Surface className="p-6">
            <SectionTitle title="Webhook Endpoints" />

            <div className="hidden grid-cols-[3fr_1fr_1fr_1fr_1.35fr_0.9fr] gap-4 border-b border-slate-200 pb-4 pt-6 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
              <span>URL</span>
              <span>Events</span>
              <span>Status</span>
              <span>Success Rate</span>
              <span>Last Delivery</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-slate-200/90">
              {endpoints.map((row) => (
                <div key={row.url} className="grid gap-4 py-4 md:grid-cols-[3fr_1fr_1fr_1fr_1.35fr_0.9fr] md:items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{row.url}</p>
                    <p className="text-sm text-slate-500">{row.label}</p>
                  </div>
                  <div>
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      {row.events} events
                    </span>
                  </div>
                  <div>
                    <EndpointStatus status={row.status} />
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    {row.successRate}
                  </div>
                  <div className="space-y-1 text-sm text-slate-500">
                    <p>{row.lastDelivery}</p>
                    <p>{row.lastEvent}</p>
                  </div>
                  <div>
                    <EndpointActions />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 text-center">
              <Link href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                Show inactive endpoints (1)
                <ChevronDown className="h-4 w-4" />
              </Link>
            </div>
          </Surface>

          <Surface className="p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Event Subscriptions</h2>
                <p className="mt-1 text-sm text-slate-500">Select the events you want to receive.</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-slate-500">
                  {selectedCount} of {availableCount} events selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEvents([])}
                  className="font-semibold text-red-500 transition-colors hover:text-red-600"
                >
                  Clear all
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {subscriptionEvents.map((event) => {
                const checked = selectedEvents.includes(event.id);
                return (
                  <label
                    key={event.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                      checked
                        ? "border-blue-200 bg-blue-50/40"
                        : "border-slate-200/80 bg-white hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedEvents((prev) =>
                          e.target.checked
                            ? [...prev, event.id]
                            : prev.filter((value) => value !== event.id)
                        );
                      }}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{event.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </Surface>

          <Surface className="p-6">
            <SectionTitle
              title="Recent Deliveries"
              action={
                <Link href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  View all deliveries
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />

            <div className="mt-6 hidden grid-cols-[1.6fr_2.5fr_1fr_1.3fr_1fr_0.7fr] gap-4 border-b border-slate-200 pb-4 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
              <span>Event</span>
              <span>Endpoint</span>
              <span>Status</span>
              <span>Response</span>
              <span>Time</span>
              <span>Attempts</span>
            </div>

            <div className="divide-y divide-slate-200/90">
              {deliveries.map((delivery) => (
                <div key={`${delivery.event}-${delivery.time}`} className="grid gap-4 py-4 md:grid-cols-[1.6fr_2.5fr_1fr_1.3fr_1fr_0.7fr] md:items-center">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        delivery.status === "Delivered"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-500"
                      )}
                    >
                      <Webhook className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{delivery.event}</span>
                  </div>
                  <p className="truncate text-sm text-slate-500">{delivery.endpoint}</p>
                  <RecentDeliveryStatus status={delivery.status} />
                  <RecentDeliveryResponse response={delivery.response} />
                  <p className="text-sm text-slate-500">{delivery.time}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">{delivery.attempts}</span>
                    {delivery.status === "Failed" ? (
                      <Button
                        variant="outline"
                        className="h-8 rounded-lg border-blue-200 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-500"
                      >
                        View
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        </div>

        <div className="space-y-5">
          <Surface className="p-6">
            <SectionTitle title="Signing Secret" />
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Used to verify webhook signatures from Hypertron.
            </p>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3">
              <span className="min-w-0 truncate font-mono text-sm font-semibold text-blue-600">
                whsec_•••••••••••••••••••••••••••
              </span>
              <CopyValue value="whsec_example_secret" />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="h-10 rounded-xl border-blue-200 bg-white text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-500"
              >
                <Eye className="mr-2 h-4 w-4" />
                Reveal
              </Button>
              <Button
                variant="outline"
                className="h-10 rounded-xl border-blue-200 bg-white text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-500"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Rotate Secret
              </Button>
            </div>
          </Surface>

          <Surface className="p-6">
            <SectionTitle title="Test Webhook" />
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Send a test event to verify your endpoint configuration.
            </p>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Select Endpoint</label>
                <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option>https://api.example.com/webhooks/hypertron</option>
                  <option>https://backup.example.com/webhooks/hypertron</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Select Event</label>
                <select className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option>payment.completed</option>
                  <option>payment.created</option>
                  <option>payment.failed</option>
                </select>
              </div>

              <Button className="h-10 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500">
                <Send className="mr-2 h-4 w-4" />
                Send Test Event
              </Button>
            </div>
          </Surface>

          <RightSidebarGuide />
        </div>
      </div>
    </div>
  );
}
