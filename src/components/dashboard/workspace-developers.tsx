"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Copy,
  ExternalLink,
  FlaskConical,
  KeyRound,
  LifeBuoy,
  RefreshCw,
  Trash2,
  TrendingUp,
  Webhook,
} from "lucide-react";
import { DevelopersAnalyticsPanel } from "@/components/dashboard/developers-analytics-panel";
import { DevelopersWebhooksPanel } from "@/components/dashboard/developers-webhooks-panel";
import { Button } from "@/components/ui/button";
import type { BusinessProfile } from "@/lib/business";
import {
  createApiKey,
  getDeveloperApiBaseUrl,
  listApiKeys,
  listWebhookEndpoints,
  revokeApiKey,
  rotateApiKey,
  type ApiKeyRecord,
  type WebhookEndpointRecord,
} from "@/lib/developer-api";
import {
  getPaymentLinkStatus,
  listPaymentLinks,
  type PaymentLinkListItem,
} from "@/lib/payment-links";
import type { Workspace } from "@/mockdata";
import { cn } from "@/lib/utils";

type DevelopersMode = "test" | "live";
type DevelopersTab = "overview" | "api-keys" | "webhooks" | "analytics";

const TABS: { id: DevelopersTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "api-keys", label: "API Keys" },
  { id: "webhooks", label: "Webhooks" },
  { id: "analytics", label: "Analytics" },
];

function Surface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#E7B66D]/35 bg-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-semibold text-[#0F1939]">{title}</h2>
      {action}
    </div>
  );
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex size-7 items-center justify-center rounded-lg border border-[#E7B66D]/40 bg-white text-slate-500 transition hover:bg-[#FBF7F0] hover:text-[#0F1939]"
      aria-label={`Copy ${value}`}
    >
      {copied ? (
        <CheckCircle2 className="size-3.5 text-emerald-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
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
      <div className="flex items-start gap-2 text-right font-medium text-[#0F1939]">
        <span className="break-all">{value}</span>
        {action}
      </div>
    </div>
  );
}

function relativeTime(iso: string) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const mins = Math.floor((Date.now() - t) / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function WorkspaceDevelopers({
  workspace,
  profile,
}: {
  workspace?: Workspace;
  profile?: BusinessProfile;
} = {}) {
  const businessId = profile?.businessId || workspace?.id || "";
  const [tab, setTab] = useState<DevelopersTab>("overview");
  const [mode, setMode] = useState<DevelopersMode>("test");
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [endpoints, setEndpoints] = useState<WebhookEndpointRecord[]>([]);
  const [links, setLinks] = useState<PaymentLinkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("Dashboard key");
  const [creating, setCreating] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const apiBase = getDeveloperApiBaseUrl();
  const docsUrl = `${apiBase}/docs`;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [keysRes, hooksRes, linksRes] = await Promise.all([
      listApiKeys(),
      listWebhookEndpoints(),
      businessId
        ? listPaymentLinks(businessId)
        : Promise.resolve({ ok: true as const, links: [] as PaymentLinkListItem[] }),
    ]);
    setLoading(false);

    if (!keysRes.ok) {
      setError(keysRes.error);
      setKeys([]);
    } else {
      setKeys(keysRes.keys.filter((k) => k.active));
    }

    if (!hooksRes.ok) {
      if (keysRes.ok) setError(hooksRes.error);
      setEndpoints([]);
    } else {
      setEndpoints(hooksRes.endpoints);
    }

    if (linksRes.ok) setLinks(linksRes.links);
    else setLinks([]);
  }, [businessId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const modeKeys = useMemo(
    () => keys.filter((k) => k.environment === mode),
    [keys, mode],
  );
  const modeHooks = useMemo(
    () => endpoints.filter((e) => e.environment === mode),
    [endpoints, mode],
  );

  const overview = useMemo(() => {
    const paid = links.filter((l) => getPaymentLinkStatus(l) === "paid");
    const pending = links.filter((l) => getPaymentLinkStatus(l) === "pending");
    let volume = 0;
    let currency = "XLM";
    const byCur = new Map<string, number>();
    for (const link of paid) {
      const cur = (link.currency || "XLM").toUpperCase();
      const amt = Number(link.amount || 0);
      if (!Number.isFinite(amt)) continue;
      byCur.set(cur, (byCur.get(cur) ?? 0) + amt);
    }
    const top = [...byCur.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) {
      currency = top[0];
      volume = top[1];
    }

    const latest = [...paid].sort((a, b) => {
      const ta = new Date(a.paidAt || a.claimedAt || a.createdAt).getTime();
      const tb = new Date(b.paidAt || b.claimedAt || b.createdAt).getTime();
      return tb - ta;
    })[0];

    const activity: {
      title: string;
      time: string;
      badge: string | null;
      badgeClass: string;
      icon: typeof CheckCircle2;
      iconClass: string;
    }[] = [];

    for (const link of [...links]
      .sort(
        (a, b) =>
          new Date(b.paidAt || b.claimedAt || b.createdAt).getTime() -
          new Date(a.paidAt || a.claimedAt || a.createdAt).getTime(),
      )
      .slice(0, 4)) {
      const status = getPaymentLinkStatus(link);
      activity.push({
        title:
          status === "paid"
            ? `Payment settled · ${link.amount ?? "—"} ${link.currency}`
            : status === "expired"
              ? `Link expired · ${link.purpose?.trim() || "Payment"}`
              : `Link pending · ${link.purpose?.trim() || "Payment"}`,
        time: relativeTime(link.paidAt || link.claimedAt || link.createdAt),
        badge:
          status === "paid"
            ? `${link.amount ?? "—"} ${link.currency}`
            : status === "expired"
              ? "Expired"
              : "Pending",
        badgeClass:
          status === "paid"
            ? "bg-emerald-50 text-emerald-700"
            : status === "expired"
              ? "bg-slate-100 text-slate-600"
              : "bg-amber-50 text-amber-800",
        icon: status === "paid" ? CheckCircle2 : status === "expired" ? Trash2 : Clock3,
        iconClass:
          status === "paid"
            ? "bg-emerald-50 text-emerald-600"
            : status === "expired"
              ? "bg-slate-100 text-slate-500"
              : "bg-[#FBF7F0] text-[#C9A46A]",
      });
    }

    for (const key of [...keys]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 2)) {
      activity.push({
        title: `API key “${key.name}” created`,
        time: relativeTime(key.created_at),
        badge: key.environment,
        badgeClass: "bg-[#EEF2FF] text-[#4A63BE]",
        icon: KeyRound,
        iconClass: "bg-[#EEF2FF] text-[#4A63BE]",
      });
    }

    return {
      paidCount: paid.length,
      pendingCount: pending.length,
      volume,
      currency,
      latest,
      activity: activity.slice(0, 6),
      keyCount: modeKeys.length,
      hookCount: modeHooks.length,
      activeHooks: modeHooks.filter((e) => e.active).length,
    };
  }, [links, keys, modeKeys, modeHooks]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    setError(null);
    const result = await createApiKey({ name: trimmed, environment: mode });
    setCreating(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.key.secret_key) setRevealedSecret(result.key.secret_key);
    setName("Dashboard key");
    setTab("api-keys");
    await refresh();
  }

  async function handleRotate(id: string) {
    if (
      !window.confirm(
        "Rotate this key? The old secret stops working immediately.",
      )
    ) {
      return;
    }
    setBusyId(id);
    setError(null);
    const result = await rotateApiKey(id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.key.secret_key) setRevealedSecret(result.key.secret_key);
    await refresh();
  }

  async function handleRevoke(id: string) {
    if (!window.confirm("Revoke this key permanently?")) return;
    setBusyId(id);
    setError(null);
    const result = await revokeApiKey(id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  async function copySecret() {
    if (!revealedSecret) return;
    try {
      await navigator.clipboard.writeText(revealedSecret);
      setCopiedSecret(true);
      window.setTimeout(() => setCopiedSecret(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6 pb-2">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C9A46A] uppercase">
            Workbench
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[#0F1939] sm:text-[32px]">
            Developers
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            Build and manage your Hypertron Payments integration.
          </p>
        </div>

        <div className="inline-flex w-full max-w-[280px] rounded-xl border border-[#E7B66D]/45 bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("test")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
              mode === "test"
                ? "bg-gradient-to-r from-[#121F46] to-[#4A63BE] text-white"
                : "text-slate-500 hover:bg-[#FBF7F0]",
            )}
          >
            <FlaskConical className="size-4" />
            Test Mode
          </button>
          <button
            type="button"
            onClick={() => setMode("live")}
            className={cn(
              "flex flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition",
              mode === "live"
                ? "bg-gradient-to-r from-[#121F46] to-[#4A63BE] text-white"
                : "text-slate-500 hover:bg-[#FBF7F0]",
            )}
          >
            Live Mode
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div className="flex flex-wrap gap-6">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "border-b-2 pb-3 text-sm font-semibold transition",
                tab === item.id
                  ? "border-[#4A63BE] text-[#4A63BE]"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {revealedSecret ? (
        <div className="rounded-2xl border border-[#E7B66D]/55 bg-[#FBF7F0] px-5 py-4">
          <p className="text-sm font-semibold text-[#0F1939]">
            Copy your secret key now
          </p>
          <p className="mt-1 text-xs text-slate-600">
            It is shown only once. Store it securely — you cannot retrieve it
            again.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded-xl border border-[#E7B66D]/35 bg-white px-3 py-2 font-mono text-xs text-slate-900">
              {revealedSecret}
            </code>
            <button
              type="button"
              onClick={() => void copySecret()}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#E7B66D]/45 bg-white px-3 text-sm font-medium text-[#0F1939]"
            >
              {copiedSecret ? (
                <CheckCheck className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copiedSecret ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setRevealedSecret(null)}
            className="mt-3 text-xs font-medium text-[#C9A46A] underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {tab === "overview" ? (
        <OverviewPanel
          mode={mode}
          loading={loading}
          overview={overview}
          apiBase={apiBase}
          docsUrl={docsUrl}
          businessId={businessId}
          workspaceName={
            profile?.name?.trim() || workspace?.name || "Hypertron"
          }
          onSelectTab={setTab}
        />
      ) : null}

      {tab === "api-keys" ? (
        <ApiKeysPanel
          mode={mode}
          modeKeys={modeKeys}
          loading={loading}
          name={name}
          creating={creating}
          busyId={busyId}
          apiBase={apiBase}
          onNameChange={setName}
          onCreate={handleCreate}
          onRefresh={() => void refresh()}
          onRotate={handleRotate}
          onRevoke={handleRevoke}
        />
      ) : null}

      {tab === "webhooks" ? <DevelopersWebhooksPanel mode={mode} /> : null}

      {tab === "analytics" ? (
        businessId ? (
          <DevelopersAnalyticsPanel businessId={businessId} />
        ) : (
          <Surface className="px-6 py-10 text-center text-sm text-slate-500">
            Open Developers from a workspace to see payment analytics.
          </Surface>
        )
      ) : null}
    </div>
  );
}

function OverviewPanel({
  mode,
  loading,
  overview,
  apiBase,
  docsUrl,
  businessId,
  workspaceName,
  onSelectTab,
}: {
  mode: DevelopersMode;
  loading: boolean;
  overview: {
    paidCount: number;
    pendingCount: number;
    volume: number;
    currency: string;
    latest?: PaymentLinkListItem;
    activity: {
      title: string;
      time: string;
      badge: string | null;
      badgeClass: string;
      icon: typeof CheckCircle2;
      iconClass: string;
    }[];
    keyCount: number;
    hookCount: number;
    activeHooks: number;
  };
  apiBase: string;
  docsUrl: string;
  businessId: string;
  workspaceName: string;
  onSelectTab: (tab: DevelopersTab) => void;
}) {
  const actionCards = [
    {
      title: "Create API Key",
      body: `${overview.keyCount} active ${mode} key${overview.keyCount === 1 ? "" : "s"}.`,
      icon: KeyRound,
      iconClass: "bg-[#EEF2FF] text-[#4A63BE]",
      tab: "api-keys" as const,
    },
    {
      title: "Payment analytics",
      body: `${overview.paidCount} settled · ${overview.pendingCount} pending.`,
      icon: TrendingUp,
      iconClass: "bg-emerald-50 text-emerald-600",
      tab: "analytics" as const,
    },
    {
      title: "Configure Webhook",
      body: `${overview.activeHooks} active of ${overview.hookCount} ${mode} endpoint${overview.hookCount === 1 ? "" : "s"}.`,
      icon: Webhook,
      iconClass: "bg-[#FBF7F0] text-[#C9A46A]",
      tab: "webhooks" as const,
    },
    {
      title: "View Documentation",
      body: "Guides, API reference and examples.",
      icon: BookOpen,
      iconClass: "bg-[#EEF2FF] text-[#4A63BE]",
      tab: null,
      external: true,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              type="button"
              onClick={() => {
                if (card.external) {
                  window.open(docsUrl, "_blank", "noopener,noreferrer");
                  return;
                }
                if (card.tab) onSelectTab(card.tab);
              }}
              className="rounded-2xl border border-[#E7B66D]/35 bg-white p-5 text-left transition hover:border-[#E7B66D]/70 hover:bg-[#FBF7F0]/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl",
                      card.iconClass,
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.9} />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-base font-semibold text-[#0F1939]">
                      {card.title}
                    </p>
                    <p className="max-w-[250px] text-sm leading-relaxed text-slate-500">
                      {loading ? "Loading…" : card.body}
                    </p>
                  </div>
                </div>
                {card.external ? (
                  <ExternalLink className="mt-1 size-4 shrink-0 text-slate-400" />
                ) : (
                  <ChevronRight className="mt-1 size-4 shrink-0 text-slate-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="space-y-5">
          <Surface className="p-6">
            <SectionTitle
              title="Quick Start Guide"
              action={
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A63BE]"
                >
                  View full docs
                  <ExternalLink className="size-4" />
                </a>
              }
            />
            <p className="mt-1 text-sm text-slate-500">
              Integrate Hypertron Payments against{" "}
              <span className="font-mono text-slate-700">{apiBase}</span>.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { n: "1", t: "Get API Key", d: "Create a key in API Keys." },
                {
                  n: "2",
                  t: "Create Payment",
                  d: "POST /v1/payments with Bearer sk_…",
                },
                {
                  n: "3",
                  t: "Webhook",
                  d: "Subscribe to payment.completed.",
                },
                {
                  n: "4",
                  t: "Analytics",
                  d: "Track Collect settlements here.",
                },
              ].map((step) => (
                <div
                  key={step.n}
                  className="rounded-xl border border-[#E7B66D]/30 bg-[#FBF7F0]/40 px-3.5 py-3"
                >
                  <p className="text-sm font-semibold text-[#4A63BE]">
                    {step.n}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#0F1939]">
                    {step.t}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{step.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#E7B66D]/40 bg-[#FBF7F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Ready to ship? Create a {mode} API key and wire a webhook.
              </p>
              <Button
                type="button"
                onClick={() => onSelectTab("api-keys")}
                className="h-10 rounded-xl bg-gradient-to-r from-[#121F46] to-[#4A63BE] px-5 text-sm font-semibold text-white hover:brightness-110"
              >
                Create API key
              </Button>
            </div>
          </Surface>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_0.8fr]">
            <Surface className="p-6">
              <SectionTitle
                title="Recent Activity"
                action={
                  <button
                    type="button"
                    onClick={() => onSelectTab("analytics")}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A63BE]"
                  >
                    View analytics
                    <ArrowRight className="size-4" />
                  </button>
                }
              />
              {overview.activity.length === 0 ? (
                <p className="mt-5 text-sm text-slate-500">
                  No activity yet. Create a payment link or API key to get
                  started.
                </p>
              ) : (
                <div className="mt-5 space-y-2">
                  {overview.activity.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={`${item.title}-${i}`}
                        className="flex flex-col gap-3 rounded-xl border border-[#E7B66D]/25 px-4 py-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-xl",
                              item.iconClass,
                            )}
                          >
                            <Icon className="size-[18px]" strokeWidth={1.9} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#0F1939]">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400">{item.time}</p>
                          </div>
                        </div>
                        {item.badge ? (
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-semibold",
                              item.badgeClass,
                            )}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </Surface>

            <Surface className="p-6">
              <SectionTitle title="Latest Payment" />
              {overview.latest ? (
                <div className="mt-5 space-y-4">
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    paid
                  </span>
                  <p className="text-3xl font-semibold tracking-tight text-[#0F1939]">
                    {overview.latest.amount ?? "—"}{" "}
                    <span className="text-lg font-medium text-slate-500">
                      {overview.latest.currency}
                    </span>
                  </p>
                  <div className="space-y-3 text-sm text-slate-500">
                    <div className="flex justify-between gap-4">
                      <span>Link ID</span>
                      <span className="font-mono text-xs font-medium text-[#0F1939]">
                        {overview.latest.id.slice(0, 12)}…
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Customer</span>
                      <span className="font-medium text-[#0F1939]">
                        {overview.latest.clientName?.trim() || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>Settled</span>
                      <span className="font-medium text-[#0F1939]">
                        {relativeTime(
                          overview.latest.paidAt ||
                            overview.latest.claimedAt ||
                            overview.latest.createdAt,
                        )}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onSelectTab("analytics")}
                    className="h-10 w-full rounded-xl border-[#E7B66D]/45 text-sm font-semibold text-[#0F1939] hover:bg-[#FBF7F0]"
                  >
                    Open analytics
                  </Button>
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-500">
                  No settled Collect payments yet.
                </p>
              )}
            </Surface>
          </div>
        </div>

        <div className="space-y-5">
          <Surface className="p-6">
            <SectionTitle title="Integration Summary" />
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-500">Environment</span>
                <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-semibold text-[#4A63BE]">
                  {mode === "test" ? "Test Mode" : "Live Mode"}
                </span>
              </div>
              <SummaryRow label="Workspace" value={workspaceName} />
              <SummaryRow
                label="Business ID"
                value={businessId || "—"}
                action={
                  businessId ? <CopyValue value={businessId} /> : undefined
                }
              />
              <SummaryRow
                label="Base URL"
                value={apiBase}
                action={<CopyValue value={apiBase} />}
              />
              <SummaryRow
                label="Collected"
                value={`${overview.volume.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })} ${overview.currency}`}
              />
              <SummaryRow
                label="API keys"
                value={`${overview.keyCount} active`}
              />
              <SummaryRow
                label="Webhooks"
                value={`${overview.activeHooks} active`}
              />
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("api-keys")}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A63BE]"
            >
              Manage in API Keys
              <ArrowRight className="size-4" />
            </button>
          </Surface>

          <Surface className="p-6">
            <SectionTitle title="Need Help?" />
            <div className="mt-5 space-y-2">
              {[
                { label: "API Reference", icon: Code2 },
                { label: "Webhook Guide", icon: Webhook },
                { label: "Integration Guide", icon: BookOpen },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-[#E7B66D]/30 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#FBF7F0]/60"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4A63BE]">
                        <Icon className="size-[18px]" strokeWidth={1.85} />
                      </span>
                      {link.label}
                    </span>
                    <ExternalLink className="size-[18px] text-slate-400" />
                  </a>
                );
              })}
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-6 h-10 w-full rounded-xl bg-[#FBF7F0] text-sm font-semibold text-[#0F1939] hover:bg-[#F3E8D4]"
            >
              <LifeBuoy className="mr-2 size-4 text-[#C9A46A]" />
              Contact Support
            </Button>
          </Surface>
        </div>
      </div>
    </div>
  );
}

function ApiKeysPanel({
  mode,
  modeKeys,
  loading,
  name,
  creating,
  busyId,
  apiBase,
  onNameChange,
  onCreate,
  onRefresh,
  onRotate,
  onRevoke,
}: {
  mode: DevelopersMode;
  modeKeys: ApiKeyRecord[];
  loading: boolean;
  name: string;
  creating: boolean;
  busyId: string | null;
  apiBase: string;
  onNameChange: (v: string) => void;
  onCreate: (e: React.FormEvent) => void;
  onRefresh: () => void;
  onRotate: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <Surface className="p-5">
          <SectionTitle
            title={`${mode === "test" ? "Test" : "Live"} API Keys`}
            action={
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0F1939]"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </button>
            }
          />
          <p className="mt-1 text-sm text-slate-500">
            Authenticate with Bearer{" "}
            <span className="font-mono text-slate-700">sk_…</span> against{" "}
            <span className="font-mono text-slate-700">{apiBase}</span>.
          </p>

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading keys…</p>
          ) : modeKeys.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-[#E7B66D]/40 bg-[#FBF7F0]/50 px-4 py-8 text-center text-sm text-slate-500">
              No active {mode} keys yet. Create one to call{" "}
              <span className="font-mono">POST /v1/payments</span>.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100 rounded-xl border border-[#E7B66D]/25">
              {modeKeys.map((key) => (
                <li
                  key={key.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#0F1939]">
                        {key.name}
                      </p>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Active
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      {key.key_prefix}…{key.last_four} · {key.environment}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Created {new Date(key.created_at).toLocaleString()}
                      {key.last_used_at
                        ? ` · Last used ${relativeTime(key.last_used_at)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busyId === key.id}
                      onClick={() => onRotate(key.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#E7B66D]/40 px-3 text-xs font-medium text-[#0F1939] hover:bg-[#FBF7F0] disabled:opacity-50"
                    >
                      <RefreshCw className="size-3.5" />
                      Rotate
                    </button>
                    <button
                      type="button"
                      disabled={busyId === key.id}
                      onClick={() => onRevoke(key.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" />
                      Revoke
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface className="p-5">
          <SectionTitle title="Create API Key" />
          <form
            onSubmit={onCreate}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="block min-w-0 flex-1 text-sm font-medium text-slate-700">
              Name
              <input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-[#E7B66D]/40 bg-white px-3 text-sm outline-none focus:border-[#4A63BE] focus:ring-2 focus:ring-[#4A63BE]/20"
                required
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#121F46] to-[#4A63BE] px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              <KeyRound className="size-4" />
              {creating ? "Creating…" : `Create ${mode} key`}
            </button>
          </form>
        </Surface>
      </div>

      <Surface className="h-fit p-5">
        <SectionTitle title="Security tips" />
        <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
          <li>Keep secrets out of client apps and public repos.</li>
          <li>Use test keys for development only.</li>
          <li>Switch to live keys when you accept real payments.</li>
          <li>Rotate or revoke keys anytime from this page.</li>
        </ul>
        <a
          href={`${apiBase}/docs`}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A63BE]"
        >
          Open API reference
          <ExternalLink className="size-4" />
        </a>
      </Surface>
    </div>
  );
}
