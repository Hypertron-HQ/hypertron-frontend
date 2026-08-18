"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  CheckCheck,
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  WEBHOOK_EVENT_TYPES,
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  listWebhookDeliveries,
  listWebhookEndpoints,
  rotateWebhookSecret,
  testWebhookEndpoint,
  updateWebhookEndpoint,
  type WebhookDeliveryRecord,
  type WebhookEndpointRecord,
} from "@/lib/developer-api";
import { cn } from "@/lib/utils";

type Mode = "test" | "live";

export function DevelopersWebhooksPanel({ mode }: { mode: Mode }) {
  const [endpoints, setEndpoints] = useState<WebhookEndpointRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("https://");
  const [description, setDescription] = useState("");
  const [events, setEvents] = useState<string[]>([
    "payment.completed",
    "payment.failed",
  ]);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryRecord[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listWebhookEndpoints();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      setEndpoints([]);
      return;
    }
    const filtered = result.endpoints.filter((e) => e.environment === mode);
    setEndpoints(filtered);
    if (selectedId && !filtered.some((e) => e.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    } else if (!selectedId && filtered[0]) {
      setSelectedId(filtered[0].id);
    }
  }, [mode, selectedId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedId) {
      setDeliveries([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      setDeliveriesLoading(true);
      const result = await listWebhookDeliveries(selectedId);
      if (cancelled) return;
      setDeliveriesLoading(false);
      if (result.ok) setDeliveries(result.deliveries);
      else setDeliveries([]);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  function toggleEvent(event: string) {
    setEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event],
    );
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || events.length === 0) return;
    setCreating(true);
    setError(null);
    setTestResult(null);
    const result = await createWebhookEndpoint({
      url: trimmed,
      environment: mode,
      events,
      description: description.trim() || undefined,
    });
    setCreating(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.endpoint.signing_secret) {
      setRevealedSecret(result.endpoint.signing_secret);
    }
    setUrl("https://");
    setDescription("");
    setSelectedId(result.endpoint.id);
    await refresh();
  }

  async function handleToggleActive(endpoint: WebhookEndpointRecord) {
    setBusyId(endpoint.id);
    setError(null);
    const result = await updateWebhookEndpoint(endpoint.id, {
      active: !endpoint.active,
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await refresh();
  }

  async function handleRotate(id: string) {
    if (
      !window.confirm(
        "Rotate signing secret? Deliveries will use the new secret immediately.",
      )
    ) {
      return;
    }
    setBusyId(id);
    setError(null);
    const result = await rotateWebhookSecret(id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.endpoint.signing_secret) {
      setRevealedSecret(result.endpoint.signing_secret);
    }
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this webhook endpoint and its delivery history?")) {
      return;
    }
    setBusyId(id);
    setError(null);
    const result = await deleteWebhookEndpoint(id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (selectedId === id) setSelectedId(null);
    await refresh();
  }

  async function handleTest(id: string) {
    setBusyId(id);
    setError(null);
    setTestResult(null);
    const result = await testWebhookEndpoint(id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTestResult(
      result.delivered
        ? `Test delivered · HTTP ${result.responseStatus ?? "—"}`
        : `Test failed · ${result.error || `HTTP ${result.responseStatus ?? "—"}`}`,
    );
    const deliveriesResult = await listWebhookDeliveries(id);
    if (deliveriesResult.ok) setDeliveries(deliveriesResult.deliveries);
  }

  async function copySecret() {
    if (!revealedSecret) return;
    try {
      await navigator.clipboard.writeText(revealedSecret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  const activeCount = endpoints.filter((e) => e.active).length;
  const selected = endpoints.find((e) => e.id === selectedId) ?? null;
  const delivered = deliveries.filter((d) => d.status === "delivered").length;
  const failed = deliveries.filter((d) => d.status === "failed").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Endpoints"
          value={String(endpoints.length)}
          detail={`${activeCount} active · ${mode}`}
        />
        <StatCard
          label="Delivered"
          value={String(delivered)}
          detail="Selected endpoint log"
        />
        <StatCard
          label="Failed"
          value={String(failed)}
          detail="Selected endpoint log"
        />
      </div>

      {revealedSecret ? (
        <div className="rounded-2xl border border-[#E7B66D]/55 bg-[#FBF7F0] px-5 py-4">
          <p className="text-sm font-semibold text-[#0F1939]">
            Copy signing secret now
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Shown only once on create / rotate. Verify signatures with HMAC.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded-xl border border-[#E7B66D]/35 bg-white px-3 py-2 font-mono text-xs">
              {revealedSecret}
            </code>
            <button
              type="button"
              onClick={() => void copySecret()}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#E7B66D]/45 bg-white px-3 text-sm font-medium"
            >
              {copied ? <CheckCheck className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
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
      {testResult ? (
        <p className="text-sm font-medium text-[#4A63BE]">{testResult}</p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#E7B66D]/35 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#0F1939]">
                  {mode === "test" ? "Test" : "Live"} endpoints
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Signed events from Hypertron Payments API.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0F1939]"
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" /> Loading endpoints…
              </p>
            ) : endpoints.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-[#E7B66D]/40 bg-[#FBF7F0]/50 px-4 py-8 text-center text-sm text-slate-500">
                No {mode} webhook endpoints yet. Create one on the right.
              </p>
            ) : (
              <ul className="mt-5 space-y-2">
                {endpoints.map((endpoint) => {
                  const active = selectedId === endpoint.id;
                  return (
                    <li key={endpoint.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(endpoint.id)}
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-left transition",
                          active
                            ? "border-[#4A63BE] bg-[#EEF2FF]/60"
                            : "border-[#E7B66D]/25 hover:bg-[#FBF7F0]/40",
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#0F1939]">
                              {endpoint.description?.trim() || endpoint.url}
                            </p>
                            <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">
                              {endpoint.url}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {endpoint.events.length} events · secret …
                              {endpoint.secret_last_four}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              endpoint.active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500",
                            )}
                          >
                            {endpoint.active ? "Active" : "Paused"}
                          </span>
                        </div>
                      </button>
                      <div className="mt-2 flex flex-wrap gap-2 px-1">
                        <ActionChip
                          disabled={busyId === endpoint.id}
                          onClick={() => void handleTest(endpoint.id)}
                          icon={<Send className="size-3" />}
                          label="Test"
                        />
                        <ActionChip
                          disabled={busyId === endpoint.id}
                          onClick={() => void handleToggleActive(endpoint)}
                          label={endpoint.active ? "Pause" : "Enable"}
                        />
                        <ActionChip
                          disabled={busyId === endpoint.id}
                          onClick={() => void handleRotate(endpoint.id)}
                          icon={<RefreshCw className="size-3" />}
                          label="Rotate"
                        />
                        <ActionChip
                          disabled={busyId === endpoint.id}
                          onClick={() => void handleDelete(endpoint.id)}
                          icon={<Trash2 className="size-3" />}
                          label="Delete"
                          danger
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-[#E7B66D]/35 bg-white p-5">
            <h2 className="text-lg font-semibold text-[#0F1939]">
              Recent deliveries
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {selected
                ? selected.description?.trim() || selected.url
                : "Select an endpoint"}
            </p>
            {!selected ? (
              <p className="mt-6 text-sm text-slate-500">
                Choose an endpoint to inspect deliveries.
              </p>
            ) : deliveriesLoading ? (
              <p className="mt-6 inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </p>
            ) : deliveries.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                No deliveries yet. Send a test or wait for a payment event.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-[#E7B66D]/25">
                {deliveries.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold text-[#0F1939]">
                        {d.event_id}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(d.created_at).toLocaleString()} ·{" "}
                        {d.attempt_count} attempt
                        {d.attempt_count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                          d.status === "delivered"
                            ? "bg-emerald-50 text-emerald-700"
                            : d.status === "failed"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-800",
                        )}
                      >
                        {d.status}
                        {d.response_status != null
                          ? ` · ${d.response_status}`
                          : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <form
          onSubmit={handleCreate}
          className="h-fit rounded-2xl border border-[#E7B66D]/35 bg-white p-5"
        >
          <div className="flex items-center gap-2">
            <span className="inline-flex size-9 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4A63BE]">
              <Webhook className="size-4" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[#0F1939]">
                Add endpoint
              </h2>
              <p className="text-xs text-slate-500">{mode} environment</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">HTTPS URL</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://merchant.example.com/hooks"
                className="h-10 border-[#E7B66D]/40"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-600">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Orders service"
                className="h-10 border-[#E7B66D]/40"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Events</p>
              <div className="mt-2 grid gap-1.5">
                {WEBHOOK_EVENT_TYPES.map((event) => {
                  const on = events.includes(event);
                  return (
                    <label
                      key={event}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                        on
                          ? "border-[#4A63BE]/40 bg-[#EEF2FF]/50 text-[#0F1939]"
                          : "border-slate-200 text-slate-600",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleEvent(event)}
                        className="accent-[#4A63BE]"
                      />
                      <span className="font-mono">{event}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={creating || events.length === 0}
            className="mt-4 h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-[#121F46] to-[#4A63BE] font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {creating ? "Creating…" : "Create endpoint"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E7B66D]/35 bg-white px-4 py-4">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-[#C9A46A] uppercase">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[#0F1939]">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function ActionChip({
  label,
  onClick,
  disabled,
  icon,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-lg border px-2 text-[11px] font-medium disabled:opacity-50",
        danger
          ? "border-red-200 text-red-700 hover:bg-red-50"
          : "border-[#E7B66D]/40 text-[#0F1939] hover:bg-[#FBF7F0]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
