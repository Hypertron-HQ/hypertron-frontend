"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  CreditCard,
  ExternalLink,
  FlaskConical,
  KeyRound,
  LifeBuoy,
  Sparkles,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import {
  CopyValue,
  DevelopersPageHeader,
  type DevelopersMode,
  SectionTitle,
  Surface,
} from "@/components/dashboard/developers/developers-shared";

type ActivityFilter = "all" | "payments" | "api" | "webhooks";
type ActionCard = {
  title: string;
  body: string;
  icon: typeof KeyRound;
  iconClassName: string;
  external?: boolean;
};

const actionCards: ActionCard[] = [
  {
    title: "Create API Key",
    body: "Generate your test or live API key to get started.",
    icon: KeyRound,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    title: "Create Test Payment",
    body: "Create a test payment and experience the flow.",
    icon: CreditCard,
    iconClassName: "bg-[#dcfce7] text-[#16a34a]",
  },
  {
    title: "Configure Webhook",
    body: "Set up webhooks to receive real-time events.",
    icon: Webhook,
    iconClassName: "bg-[#ffedd5] text-[#f97316]",
  },
  {
    title: "View Documentation",
    body: "Explore guides, API reference and examples.",
    icon: BookOpen,
    iconClassName: "bg-blue-50 text-blue-600",
    external: true,
  },
] as const;

const quickStartSteps = [
  {
    step: "1",
    title: "Get API Key",
    body: "Create a test API key from the API Keys tab.",
    icon: KeyRound,
    tone: "bg-blue-50 text-blue-600",
  },
  {
    step: "2",
    title: "Create Payment",
    body: "Send a POST request to `/payments` to create a payment.",
    icon: Code2,
    tone: "bg-[#dcfce7] text-[#16a34a]",
  },
  {
    step: "3",
    title: "Redirect Customer",
    body: "Redirect your customer to the checkout URL.",
    icon: ArrowRight,
    tone: "bg-[#ffedd5] text-[#f97316]",
  },
  {
    step: "4",
    title: "Receive Webhook",
    body: "Get notified of payment status via webhook.",
    icon: Webhook,
    tone: "bg-blue-50 text-blue-600",
  },
  {
    step: "5",
    title: "Go Live",
    body: "Switch your integration to live mode.",
    icon: FlaskConical,
    tone: "bg-blue-50 text-blue-600",
  },
] as const;

const activityItems = [
  {
    category: "payments" as const,
    title: "Test payment created",
    badge: "100.00 USDC",
    badgeClassName: "bg-[#dcfce7] text-[#16a34a]",
    time: "2 minutes ago",
    icon: CheckCircle2,
    iconClassName: "bg-[#dcfce7] text-[#16a34a]",
  },
  {
    category: "api" as const,
    title: "API key `Test Backend Key` created",
    badge: null,
    badgeClassName: "",
    time: "15 minutes ago",
    icon: KeyRound,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    category: "webhooks" as const,
    title: "Webhook endpoint added",
    badge: "Active",
    badgeClassName: "bg-[#dcfce7] text-[#16a34a]",
    time: "22 minutes ago",
    icon: Webhook,
    iconClassName: "bg-blue-50 text-blue-600",
  },
  {
    category: "api" as const,
    title: "POST `/v1/payments`",
    badge: "200 OK",
    badgeClassName: "bg-blue-50 text-blue-600",
    time: "25 minutes ago",
    icon: Code2,
    iconClassName: "bg-[#ffedd5] text-[#f97316]",
  },
  {
    category: "payments" as const,
    title: "Payment completed",
    badge: "100.00 USDC",
    badgeClassName: "bg-[#dcfce7] text-[#16a34a]",
    time: "35 minutes ago",
    icon: CheckCircle2,
    iconClassName: "bg-[#dcfce7] text-[#16a34a]",
  },
] as const;

const helpLinks = [
  { label: "Integration Guide", icon: BookOpen },
  { label: "API Reference", icon: Code2 },
  { label: "Webhook Guide", icon: Webhook },
  { label: "Postman Collection", icon: KeyRound },
  { label: "Status Page", icon: Sparkles },
] as const;

const integrationSummary = {
  apiVersion: "v1 (2026-07-01)",
  merchantId: "mer_hypt_0192X6YV7A",
  workspaceId: "ws_0192MSY7A",
  currency: "USDC",
  successUrl: "https://merchant.com/success",
  cancelUrl: "https://merchant.com/cancel",
};

export function DevelopersOverviewPage() {
  const [mode, setMode] = useState<DevelopersMode>("test");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

  const filteredActivity =
    activityFilter === "all"
      ? activityItems
      : activityItems.filter((item) => item.category === activityFilter);

  return (
    <div className="space-y-6 pb-2">
      <DevelopersPageHeader
        title="Developers"
        subtitle="Build and manage your Hypertron Payments integration."
        activeTab="overview"
        mode={mode}
        onModeChange={setMode}
      />

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <Surface key={card.title} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", card.iconClassName)}>
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-base font-semibold text-slate-900">{card.title}</p>
                    <p className="max-w-[250px] text-sm leading-6 text-slate-500">{card.body}</p>
                  </div>
                </div>
                {card.external ? (
                  <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                )}
              </div>
            </Surface>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="space-y-5">
          <Surface className="p-6">
            <div className="space-y-7">
              <SectionTitle
                title="Quick Start Guide"
                action={
                  <Link
                    href="#"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600"
                  >
                    View full docs
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                }
              />
              <p className="-mt-4 text-sm text-slate-500">
                Integrate Hypertron Payments in 5 simple steps.
              </p>

              <div className="grid gap-8 xl:grid-cols-5 xl:gap-6">
                {quickStartSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="relative flex flex-col gap-4">
                      <div className="relative flex h-14 items-center justify-center">
                        {index < quickStartSteps.length - 1 ? (
                          <div className="absolute left-1/2 top-1/2 hidden h-px w-[calc(100%-2rem)] -translate-y-1/2 translate-x-8 border-t border-dashed border-blue-100 xl:block" />
                        ) : null}
                        <div className={cn("relative z-10 flex h-12 w-12 items-center justify-center rounded-full ring-8 ring-white", step.tone)}>
                          <Icon className="h-5 w-5" strokeWidth={1.9} />
                        </div>
                      </div>
                      <div className="space-y-2 xl:px-1">
                        <p className="text-sm font-semibold text-blue-600">{step.step}</p>
                        <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                        <p className="text-sm leading-6 text-slate-500">{step.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <Sparkles className="h-[18px] w-[18px]" />
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-slate-500">
                    Not sure where to start? Try our interactive integration guide.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-blue-200 bg-white px-5 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-500"
                >
                  Start Guide
                </Button>
              </div>
            </div>
          </Surface>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_0.8fr]">
            <Surface className="p-6">
              <SectionTitle
                title="Recent Activity"
                action={
                  <Link href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                    View all activity
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                }
              />

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { label: "All", value: "all" },
                  { label: "Payments", value: "payments" },
                  { label: "API", value: "api" },
                  { label: "Webhooks", value: "webhooks" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActivityFilter(filter.value as ActivityFilter)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      activityFilter === filter.value
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-slate-500 hover:bg-blue-100"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                {filteredActivity.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={`${item.category}-${item.title}`}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200/80 px-4 py-3 transition-colors hover:bg-blue-50/40 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", item.iconClassName)}>
                          <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-400">{item.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.badge ? (
                          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", item.badgeClassName)}>
                            {item.badge}
                          </span>
                        ) : null}
                        <ChevronRight className="h-4 w-4 text-[#c4c0cf]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Surface>

            <Surface className="p-6">
              <SectionTitle
                title="Latest Payment"
                action={
                  <Link href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                    View all payments
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                }
              />

              <div className="mt-5 space-y-5">
                <span className="inline-flex rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-semibold text-[#16a34a]">
                  payment.completed
                </span>
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-slate-900">100.00 USDC</p>
                </div>
                <div className="space-y-3 text-sm text-slate-500">
                  <div className="flex items-start justify-between gap-4">
                    <span>Payment ID</span>
                    <div className="flex items-center gap-2 text-right font-medium text-slate-900">
                      <span>pay_01J2X6YV7A889C</span>
                      <CopyValue value="pay_01J2X6YV7A889C" />
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span>Customer</span>
                    <span className="text-right font-medium text-slate-900">customer@example.com</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span>Created</span>
                    <span className="text-right font-medium text-slate-900">2 minutes ago</span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span>Method</span>
                    <span className="text-right font-medium text-slate-900">USDC (Stellar)</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="h-10 w-full rounded-xl border-blue-200 bg-white text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-500"
                >
                  View payment details
                </Button>
              </div>
            </Surface>
          </div>
        </div>

        <div className="space-y-5">
          <Surface className="p-6">
            <SectionTitle title="Integration Summary" />

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500">Environment</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                  {mode === "test" ? "Test Mode" : "Live Mode"}
                </span>
              </div>
              <SummaryRow label="API Version" value={integrationSummary.apiVersion} />
              <SummaryRow
                label="Merchant ID"
                value={integrationSummary.merchantId}
                action={<CopyValue value={integrationSummary.merchantId} />}
              />
              <SummaryRow
                label="Workspace ID"
                value={integrationSummary.workspaceId}
                action={<CopyValue value={integrationSummary.workspaceId} />}
              />
              <SummaryRow label="Default Currency" value={integrationSummary.currency} />
              <SummaryRow label="Success URL" value={integrationSummary.successUrl} />
              <SummaryRow label="Cancel URL" value={integrationSummary.cancelUrl} />
            </div>

            <Link
              href="#"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600"
            >
              Manage in API Keys
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Surface>

          <Surface className="p-6">
            <SectionTitle title="Need Help?" />

            <div className="mt-5 space-y-2">
              {helpLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.label}
                    href="#"
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50/40"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} />
                      </span>
                      {link.label}
                    </span>
                    <ExternalLink className="h-[18px] w-[18px] text-[#98a2b3]" />
                  </Link>
                );
              })}
            </div>

            <Button
              variant="ghost"
              className="mt-6 h-10 w-full rounded-xl bg-blue-50 text-sm font-semibold text-blue-600 hover:bg-blue-100 hover:text-blue-500"
            >
              <LifeBuoy className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <div className="flex items-start gap-2 text-right font-medium text-slate-900">
        <span className="break-all">{value}</span>
        {action}
      </div>
    </div>
  );
}
