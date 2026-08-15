"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Shield, CheckCircle, XCircle, Download, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  updateBusinessProfile,
  type BusinessProfile,
} from "@/lib/business";
import {
  auditWithViewingKey,
  exportAuditCsv,
  exportAuditJson,
  isPastedViewingPublicKey,
  isValidViewingSecret,
  normalizeViewingSecret,
  VIEWING_PUBLIC_KEY_MISTAKE,
  type AuditedNote,
} from "@/lib/hypertron-auditor";
import { ensureProverReady } from "@/lib/hypertron-prover";
import { getBillingPlan } from "@/mockdata";

export function HubAudit() {
  const [viewSecret, setViewSecret] = useState("");
  const [knownViewPub, setKnownViewPub] = useState("");
  const [scanning, setScanning] = useState(false);
  const [notes, setNotes] = useState<AuditedNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [stats, setStats] = useState<{
    totalScanned: number;
    totalMatched: number;
    lastLedger: number;
  } | null>(null);

  async function handleScan() {
    const trimmed = viewSecret.trim();
    if (!trimmed) {
      setError("Please enter a viewing secret.");
      return;
    }
    if (!isValidViewingSecret(trimmed)) {
      setError("Invalid viewing secret format. Expected 64 hex characters.");
      return;
    }

    const pubHint = knownViewPub.trim();
    if (pubHint && isPastedViewingPublicKey(trimmed, pubHint)) {
      setError(VIEWING_PUBLIC_KEY_MISTAKE);
      return;
    }
    if (pubHint && !isValidViewingSecret(pubHint)) {
      setError(
        "Invalid viewPub format. Expected 64 hex characters (optional check).",
      );
      return;
    }

    setScanning(true);
    setError(null);
    setNotes([]);
    setStats(null);

    try {
      const normalized = normalizeViewingSecret(trimmed);

      if (pubHint) {
        await ensureProverReady();
        const { keygen } = await import("@hypertron/prover");
        const pair = JSON.parse(keygen(normalized)) as {
          view_pub?: string;
        };
        if (
          !pair.view_pub ||
          pair.view_pub.replace(/^0x/i, "").toLowerCase() !==
            pubHint.replace(/^0x/i, "").toLowerCase()
        ) {
          setError(
            "This viewing secret does not match the viewPub you entered. Check that you pasted the secret, not the public key.",
          );
          return;
        }
      }

      const result = await auditWithViewingKey(normalized);

      if (result.error) {
        setError(result.error);
      } else {
        setNotes(result.notes);
        setStats({
          totalScanned: result.totalScanned,
          totalMatched: result.totalMatched,
          lastLedger: result.lastLedger,
        });
      }
      setHasScanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed.");
    } finally {
      setScanning(false);
    }
  }

  function handleExport(format: "csv" | "json") {
    const content = format === "csv" ? exportAuditCsv(notes) : exportAuditJson(notes);
    const blob = new Blob([content], {
      type: format === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-disclosure-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClear() {
    setViewSecret("");
    setKnownViewPub("");
    setNotes([]);
    setError(null);
    setHasScanned(false);
    setStats(null);
  }

  return (
    <PanelShell
      eyebrow="Compliance"
      title="Auditor Disclosure"
      subtitle="Paste a viewing secret to scan and verify private payment amounts off-chain. Do not paste the viewing public key."
    >
      <div className="max-w-2xl space-y-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          The viewing <span className="font-semibold">secret</span> decrypts
          note amounts for disclosure. It cannot spend — nullifiers and
          withdrawals require the separate spend key. Exports omit note fields
          (<span className="font-mono text-xs">ownerPk</span>,{" "}
          <span className="font-mono text-xs">k</span>).
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 size-5 shrink-0 text-slate-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Viewing secret
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Enter the viewing secret (64 hex characters) from the merchant
                Settings → Reveal secret. The viewing public key (
                <span className="font-mono">viewPub</span>) looks similar but
                cannot decrypt notes.
              </p>
              <input
                type="text"
                value={viewSecret}
                onChange={(e) => setViewSecret(e.target.value)}
                placeholder="0x… viewing secret (not viewPub)"
                className="mt-3 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <label className="mt-3 block text-xs font-medium text-slate-600">
                Matching viewPub (optional — catches public/secret mix-ups)
                <input
                  type="text"
                  value={knownViewPub}
                  onChange={(e) => setKnownViewPub(e.target.value)}
                  placeholder="0x… merchant viewPub"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              {error && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-4 flex items-center gap-3">
                <Button
                  type="button"
                  onClick={() => void handleScan()}
                  disabled={scanning || !viewSecret.trim()}
                >
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Scanning…
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 size-4" />
                      Scan blobs
                    </>
                  )}
                </Button>
                {hasScanned && (
                  <Button type="button" variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasScanned && stats && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="text-slate-600">
                <span className="font-semibold text-slate-900">
                  {stats.totalScanned}
                </span>{" "}
                blobs scanned
              </span>
              <span className="text-slate-600">
                <span className="font-semibold text-slate-900">
                  {stats.totalMatched}
                </span>{" "}
                notes decrypted
              </span>
              <span className="text-slate-600">
                Last ledger:{" "}
                <span className="font-mono">{stats.lastLedger}</span>
              </span>
            </div>
          </div>
        )}

        {hasScanned && notes.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Decrypted notes ({notes.length})
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Explorer links open the pool contract call (opaque args), not a
                  classic payment row.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("csv")}
                >
                  <Download className="mr-1 size-3.5" />
                  CSV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport("json")}
                >
                  <Download className="mr-1 size-3.5" />
                  JSON
                </Button>
              </div>
            </div>
            <ul className="divide-y divide-slate-100">
              {notes.map((note) => (
                <li key={note.commitment} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">
                          {note.amount} XLM
                        </p>
                        {note.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle className="size-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            <XCircle className="size-3" />
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-slate-500">
                        Commitment: {note.commitment.slice(0, 20)}…
                        {note.commitment.slice(-8)}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                        <p>
                          <span className="text-slate-400">Amount (stroops):</span>{" "}
                          <span className="font-mono">{note.amountBaseUnits}</span>
                        </p>
                        <p>
                          <span className="text-slate-400">Leaf index:</span>{" "}
                          <span className="font-mono">
                            {note.leafIndex ?? "—"}
                          </span>
                        </p>
                      </div>
                      {note.explorerUrl ? (
                        <a
                          href={note.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          View on StellarExpert
                          <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-slate-400">Ledger</p>
                      <p className="font-mono text-sm text-slate-700">
                        {note.ledger}
                      </p>
                      {note.txHash ? (
                        <p className="mt-1 max-w-[9rem] truncate font-mono text-[10px] text-slate-400">
                          {note.txHash.slice(0, 10)}…
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasScanned && notes.length === 0 && !error && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm text-slate-600">
              No notes found for this viewing secret.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Common mistake: pasting the viewing <span className="font-medium">public</span>{" "}
              key (<span className="font-mono">viewPub</span>) instead of the
              viewing secret. Paste the secret from Settings → Reveal secret, or
              fill in the matching viewPub above to catch that mix-up before
              scanning.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Otherwise no notes were sent to this key yet, or the indexer has no
              blobs.
            </p>
          </div>
        )}
      </div>
    </PanelShell>
  );
}

export function HubBilling() {
  const billing = getBillingPlan();

  return (
    <PanelShell
      eyebrow="Account"
      title="Billing & Plans"
      subtitle="Manage your plan, invoices, and usage."
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
        <p className="text-sm font-semibold text-slate-900">{billing.planName}</p>
        <p className="mt-1 text-sm text-slate-500">{billing.planDescription}</p>
      </div>
    </PanelShell>
  );
}

const fieldCls =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

export function HubSettingsPanel({
  profile,
  walletShort,
  onSignOut,
  onProfileUpdated,
}: {
  profile: BusinessProfile;
  walletShort: string;
  onSignOut: () => void;
  onProfileUpdated: (profile: BusinessProfile) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email ?? "");
  const [businessNature, setBusinessNature] = useState(
    profile.businessNature ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email ?? "");
    setBusinessNature(profile.businessNature ?? "");
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Business name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    const result = await updateBusinessProfile({
      name: trimmed,
      email: email.trim() || undefined,
      businessNature: businessNature.trim() || undefined,
    });

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    onProfileUpdated(result.profile);
    setName(result.profile.name);
    setEmail(result.profile.email ?? "");
    setBusinessNature(result.profile.businessNature ?? "");
    setSaved(true);
  }

  return (
    <PanelShell
      eyebrow="Account"
      title="Settings"
      subtitle="Profile and session preferences for this workspace hub."
    >
      <div className="max-w-lg space-y-4">
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm"
        >
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Business profile
          </p>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Business name
            <input
              className={fieldCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Business type
            <input
              className={fieldCls}
              value={businessNature}
              onChange={(e) => setBusinessNature(e.target.value)}
              placeholder="Agency, SaaS, marketplace…"
            />
          </label>

          <label className="mt-3 block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              className={fieldCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </label>

          {error ? (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="mt-3 text-sm text-emerald-600">Profile saved.</p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Connected wallet
          </p>
          <p className="mt-2 font-mono text-sm text-slate-800">{walletShort}</p>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-5 inline-flex h-10 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </PanelShell>
  );
}

function PanelShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
