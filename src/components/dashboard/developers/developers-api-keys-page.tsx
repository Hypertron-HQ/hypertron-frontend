"use client";

import { type ComponentType, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CirclePlus,
  Copy,
  Eye,
  ExternalLink,
  FlaskConical,
  KeyRound,
  LockKeyhole,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
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

type ApiKeyRow = {
  name: string;
  key: string;
  label: string;
  created: string;
  lastUsed: string;
  status: "Active" | "Revoked";
};

const testKeys: ApiKeyRow[] = [
  {
    name: "Test Backend Key",
    key: "sk_test_••••••••••••••••3f4a",
    label: "Backend",
    created: "Jul 12, 2025\n10:24 AM",
    lastUsed: "2 mins ago",
    status: "Active",
  },
  {
    name: "Local Development",
    key: "sk_test_••••••••••••••••8b7c",
    label: "Development",
    created: "Jul 08, 2025\n04:31 PM",
    lastUsed: "1 hour ago",
    status: "Active",
  },
  {
    name: "Mobile App Test",
    key: "sk_test_••••••••••••••••6d9e",
    label: "Mobile",
    created: "Jun 30, 2025\n11:03 AM",
    lastUsed: "3 days ago",
    status: "Active",
  },
] as const;

const liveKeys: ApiKeyRow[] = [
  {
    name: "Production Backend Key",
    key: "sk_live_••••••••••••••••a1b2",
    label: "Production",
    created: "Jul 02, 2025\n09:15 AM",
    lastUsed: "12 mins ago",
    status: "Active",
  },
  {
    name: "Server to Server",
    key: "sk_live_••••••••••••••••c3d4",
    label: "Server",
    created: "Jun 28, 2025\n02:45 PM",
    lastUsed: "2 hours ago",
    status: "Active",
  },
  {
    name: "Legacy Integration",
    key: "sk_live_••••••••••••••••e5f6",
    label: "Legacy",
    created: "May 15, 2025\n05:10 PM",
    lastUsed: "Jun 15, 2025",
    status: "Revoked",
  },
] as const;

const createApiKeyTips = [
  "Keep your keys secure and never share them publicly.",
  "Use Test keys for development only.",
  "Switch to Live keys to accept real payments.",
  "You can rotate or revoke keys at any time.",
] as const;

const gettingStartedLinks = [
  "Integration Guide",
  "API Reference",
  "Postman Collection",
  "Community Support",
] as const;

const checkoutFields = [
  { label: "Business Name", value: "Hypertron Demo" },
  { label: "Logo", value: "Uploaded" },
  { label: "Default Currency", value: "USDC" },
  { label: "Success URL", value: "/success" },
  { label: "Cancel URL", value: "/cancel" },
] as const;

function StatusBadge({ status }: { status: ApiKeyRow["status"] }) {
  if (status === "Active") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
      Revoked
    </span>
  );
}

function KeyLabel({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
      {label}
    </span>
  );
}

function ActionButtons() {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <button type="button" className="rounded-md p-1 transition-colors hover:bg-slate-100 hover:text-slate-600">
        <Copy className="h-4 w-4" />
      </button>
      <button type="button" className="rounded-md p-1 transition-colors hover:bg-slate-100 hover:text-slate-600">
        <RefreshCw className="h-4 w-4" />
      </button>
      <button type="button" className="rounded-md p-1 transition-colors hover:bg-red-50 hover:text-red-500">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ApiKeysTable({
  title,
  description,
  icon,
  iconClassName,
  keys,
  createLabel,
  footerLabel,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number | string }>;
  iconClassName: string;
  keys: readonly ApiKeyRow[];
  createLabel: string;
  footerLabel: string;
}) {
  const Icon = icon;

  return (
    <Surface className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl", iconClassName)}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500">{description}</p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-10 rounded-xl border-blue-200 bg-white px-4 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-500"
        >
          <CirclePlus className="mr-2 h-4 w-4" />
          {createLabel}
        </Button>
      </div>

      <div className="hidden grid-cols-[2.1fr_3fr_1.35fr_1.2fr_1.15fr_0.9fr] gap-4 px-1 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
        <span>Name</span>
        <span>API Key</span>
        <span>Created</span>
        <span>Last Used</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      <div className="divide-y divide-slate-200/90">
        {keys.map((row) => (
          <div key={row.name} className="grid gap-4 py-4 md:grid-cols-[2.1fr_3fr_1.35fr_1.2fr_1.15fr_0.9fr] md:items-center">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">{row.name}</p>
              <KeyLabel label={row.label} />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 md:hidden">
                API Key
              </span>
              <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <span className="font-mono text-[13px]">{row.key}</span>
                <Eye className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1 text-sm text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 md:hidden">
                Created
              </span>
              {row.created.split("\n").map((part) => (
                <p key={part}>{part}</p>
              ))}
            </div>

            <div className="space-y-1 text-sm text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 md:hidden">
                Last Used
              </span>
              <p>{row.lastUsed}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 md:hidden">
                Status
              </span>
              <StatusBadge status={row.status} />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 md:hidden">
                Actions
              </span>
              <ActionButtons />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 text-center">
        <Link href="#" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
          {footerLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Surface>
  );
}

function SidebarHelpCard() {
  return (
    <Surface className="p-6">
      <SectionTitle title="Need help getting started?" />

      <div className="mt-5 space-y-2">
        {gettingStartedLinks.map((label) => (
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

export function DevelopersApiKeysPage() {
  const [mode, setMode] = useState<DevelopersMode>("test");

  return (
    <div className="space-y-6 pb-2">
      <DevelopersPageHeader
        title="API Keys"
        subtitle="Manage your API keys and integration settings."
        activeTab="api-keys"
        mode={mode}
        onModeChange={setMode}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_340px]">
        <div className="space-y-5">
          <ApiKeysTable
            title="Test API Keys"
            description="For testing and development only"
            icon={FlaskConical}
            iconClassName="bg-blue-50 text-blue-600"
            keys={testKeys}
            createLabel="Create Test Key"
            footerLabel="View all test keys"
          />

          <ApiKeysTable
            title="Live API Keys"
            description="For live payments and production use"
            icon={LockKeyhole}
            iconClassName="bg-orange-50 text-orange-500"
            keys={liveKeys}
            createLabel="Create Live Key"
            footerLabel="View all live keys"
          />

          <Surface className="p-6">
            <SectionTitle title="Checkout Configuration" />
            <p className="mt-1 text-sm text-slate-500">Customize your checkout experience</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {checkoutFields.map((field) => (
                <div key={field.label} className="rounded-xl border border-slate-200/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{field.label}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-900">{field.value}</span>
                    <Pencil className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/30 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-28 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-violet-400">
                      H
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Preview your checkout</p>
                    <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                      See how your checkout page will look to your customers.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-blue-200 bg-white px-5 text-sm font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-500"
                >
                  Preview Checkout
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Surface>
        </div>

        <div className="space-y-5">
          <Surface className="p-6">
            <SectionTitle title="Create API Key" />
            <p className="mt-2 text-sm leading-6 text-slate-500">
              API keys allow you to authenticate requests to the Hypertron Payments API.
            </p>

            <div className="mt-5 space-y-4">
              {createApiKeyTips.map((tip, index) => {
                const icons = [KeyRound, Sparkles, ShieldCheck, RefreshCw] as const;
                const Icon = icons[index]!;
                return (
                  <div key={tip} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                    </span>
                    <p className="text-sm leading-6 text-slate-500">{tip}</p>
                  </div>
                );
              })}
            </div>

            <Link href="#" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
              Learn more about API keys
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Surface>

          <Surface className="border-blue-100 bg-blue-50/40 p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-[18px] w-[18px] text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Only shown once</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              You&apos;ll only see the full API key once when it&apos;s created. Make sure to copy it and store it securely.
            </p>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3">
              <span className="min-w-0 truncate font-mono text-sm font-semibold text-blue-600">
                sk_test_••••••••••••••••••••••••••
              </span>
              <CopyValue value="sk_test_example_api_key_once_only" />
            </div>
          </Surface>

          <Surface className="p-6">
            <SectionTitle title="Configuration" />

            <div className="mt-5 space-y-4">
              <ConfigRow label="API Version" value="v1 (2026-07-01)" />
              <ConfigRow label="Default Currency" value="USDC" />
              <ConfigRow label="Success URL" value="https://merchant.com/success" />
              <ConfigRow label="Cancel URL" value="https://merchant.com/cancel" />
            </div>

            <Link href="#" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
              Manage in API Keys
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Surface>

          <SidebarHelpCard />
        </div>
      </div>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-start gap-2 text-right">
        <span className="break-all text-sm font-medium text-slate-900">{value}</span>
        <Pencil className="mt-0.5 h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}
