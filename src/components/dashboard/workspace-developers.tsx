"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCheck, Copy, KeyRound, RefreshCw, Trash2 } from "lucide-react";
import {
  createApiKey,
  getDeveloperApiBaseUrl,
  listApiKeys,
  revokeApiKey,
  rotateApiKey,
  type ApiKeyRecord,
} from "@/lib/developer-api";

export function WorkspaceDevelopers() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("Dashboard key");
  const [environment, setEnvironment] = useState<"test" | "live">("test");
  const [creating, setCreating] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const apiBase = getDeveloperApiBaseUrl();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listApiKeys();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setKeys(result.keys.filter((k) => k.active));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setCreating(true);
    setError(null);
    const result = await createApiKey({ name: trimmed, environment });
    setCreating(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (result.key.secret_key) {
      setRevealedSecret(result.key.secret_key);
    }
    setName("Dashboard key");
    await refresh();
  }

  async function handleRotate(id: string) {
    if (!window.confirm("Rotate this key? The old secret stops working immediately.")) {
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
    if (result.key.secret_key) {
      setRevealedSecret(result.key.secret_key);
    }
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
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          Integrations
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
          Developer Access
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          API keys for the Payments API. Authenticate with Bearer{" "}
          <span className="font-mono text-slate-700">sk_…</span> and an{" "}
          <span className="font-mono text-slate-700">Idempotency-Key</span>{" "}
          header on writes.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
        <p>
          Base URL:{" "}
          <span className="font-mono text-slate-800">{apiBase}</span>
        </p>
        <p className="mt-1">
          Docs:{" "}
          <a
            href={`${apiBase}/docs`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#2563EB] hover:underline"
          >
            {apiBase}/docs
          </a>
        </p>
      </div>

      {revealedSecret ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-900">
            Copy your secret key now
          </p>
          <p className="mt-1 text-xs text-amber-800">
            It is shown only once. Store it securely — you cannot retrieve it
            again.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-900 ring-1 ring-amber-200">
              {revealedSecret}
            </code>
            <button
              type="button"
              onClick={copySecret}
              className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 text-sm font-medium text-amber-900"
            >
              {copied ? (
                <CheckCheck className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setRevealedSecret(null)}
            className="mt-3 text-xs font-medium text-amber-800 underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-slate-200 bg-white px-5 py-5"
      >
        <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
          Create API key
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1 text-sm font-medium text-slate-700">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700 sm:w-36">
            Environment
            <select
              value={environment}
              onChange={(e) =>
                setEnvironment(e.target.value as "test" | "live")
              }
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="test">test</option>
              <option value="live">live</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            <KeyRound className="size-4" />
            {creating ? "Creating…" : "Create key"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-semibold text-slate-900">Active keys</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="px-5 py-8 text-sm text-slate-500">Loading keys…</p>
        ) : keys.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-500">
            No active API keys yet. Create one to call{" "}
            <span className="font-mono">POST /v1/payments</span>.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {keys.map((key) => (
              <li
                key={key.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {key.name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">
                    {key.key_prefix}…{key.last_four} · {key.environment}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Created {new Date(key.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busyId === key.id}
                    onClick={() => void handleRotate(key.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw className="size-3.5" />
                    Rotate
                  </button>
                  <button
                    type="button"
                    disabled={busyId === key.id}
                    onClick={() => void handleRevoke(key.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" />
                    Revoke
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
