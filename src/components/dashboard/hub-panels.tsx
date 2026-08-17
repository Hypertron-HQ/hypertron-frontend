"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Download,
  ExternalLink,
  Loader2,
  Search,
  Shield,
  XCircle,
} from "lucide-react";
import {
  AppSurface,
  EmptyState,
  Money,
  MonoId,
  PanelShell,
  SectionLabel,
  StatusBadge,
  WarningStrip,
} from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    const content =
      format === "csv" ? exportAuditCsv(notes) : exportAuditJson(notes);
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
      title="Auditor disclosure"
      subtitle="Paste a viewing secret to scan private payment amounts off-chain. Do not paste the viewing public key."
    >
      <div className="max-w-2xl space-y-4">
        <WarningStrip>
          <Shield className="mt-0.5 size-4 shrink-0" />
          <span>
            The viewing secret decrypts note amounts for disclosure. It cannot
            spend. Exports omit spendable note fields.
          </span>
        </WarningStrip>

        <AppSurface>
          <SectionLabel>Viewing secret</SectionLabel>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Enter the 64-hex viewing secret from workspace Settings → Reveal
            secret.
          </p>
          <Input
            type="text"
            value={viewSecret}
            onChange={(e) => setViewSecret(e.target.value)}
            placeholder="0x… viewing secret (not viewPub)"
            className="mt-3 h-11 dash-mono"
          />
          <Label className="mt-3 block text-xs font-medium text-muted-foreground">
            Matching viewPub (optional)
            <Input
              type="text"
              value={knownViewPub}
              onChange={(e) => setKnownViewPub(e.target.value)}
              placeholder="0x… merchant viewPub"
              className="mt-1.5 h-11 dash-mono"
            />
          </Label>
          {error ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
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
            {hasScanned ? (
              <Button type="button" variant="outline" onClick={handleClear}>
                Clear
              </Button>
            ) : null}
          </div>
        </AppSurface>

        {hasScanned && stats ? (
          <AppSurface tone="muted" className="py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">
                  {stats.totalScanned}
                </span>{" "}
                blobs scanned
              </span>
              <span>
                <span className="font-semibold text-foreground">
                  {stats.totalMatched}
                </span>{" "}
                notes decrypted
              </span>
              <span>
                Last ledger:{" "}
                <span className="dash-mono text-foreground">
                  {stats.lastLedger}
                </span>
              </span>
            </div>
          </AppSurface>
        ) : null}

        {hasScanned && notes.length > 0 ? (
          <AppSurface padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Decrypted notes ({notes.length})
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Explorer links open the pool contract call, not a classic
                  payment row.
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
            <ul className="divide-y divide-border">
              {notes.map((note) => (
                <li key={note.commitment} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Money value={note.amount} unit="XLM" size="sm" />
                        {note.verified ? (
                          <StatusBadge tone="paid">
                            <CheckCircle className="size-3" />
                            Verified
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="pending">
                            <XCircle className="size-3" />
                            Pending
                          </StatusBadge>
                        )}
                      </div>
                      <p className="mt-1">
                        <MonoId title={note.commitment}>
                          Commitment: {note.commitment.slice(0, 20)}…
                          {note.commitment.slice(-8)}
                        </MonoId>
                      </p>
                      {note.explorerUrl ? (
                        <a
                          href={note.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          View on StellarExpert
                          <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">Ledger</p>
                      <p className="dash-mono text-sm text-foreground">
                        {note.ledger}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </AppSurface>
        ) : null}

        {hasScanned && notes.length === 0 && !error ? (
          <EmptyState
            title="No notes found for this viewing secret"
            description="Common mistake: pasting viewPub instead of the viewing secret. Otherwise no notes were sent to this key yet, or the indexer has no blobs."
          />
        ) : null}
      </div>
    </PanelShell>
  );
}

export function HubBilling() {
  return (
    <PanelShell
      eyebrow="Account"
      title="Billing"
      subtitle="Plans and invoices are not live yet."
    >
      <EmptyState
        title="Billing coming later"
        description="Hypertron is on testnet. There is no production plan, usage meter, or invoice history to show here."
      />
    </PanelShell>
  );
}

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
      subtitle="Profile and session for this account hub."
    >
      <div className="max-w-lg space-y-4">
        <AppSurface>
          <form onSubmit={handleSave} className="space-y-4">
            <SectionLabel>Business profile</SectionLabel>

            <div className="space-y-2">
              <Label htmlFor="biz-name">Business name</Label>
              <Input
                id="biz-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="biz-type">Business type</Label>
              <Input
                id="biz-type"
                value={businessNature}
                onChange={(e) => setBusinessNature(e.target.value)}
                placeholder="Agency, SaaS, marketplace…"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="biz-email">Email</Label>
              <Input
                id="biz-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-11"
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {saved ? (
              <p className="text-sm text-blue-800">Profile saved.</p>
            ) : null}

            <Button type="submit" disabled={saving} className="h-10">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </AppSurface>

        <AppSurface>
          <SectionLabel>Connected wallet</SectionLabel>
          <p className="mt-2 dash-mono text-sm text-foreground">{walletShort}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-5 h-10"
            onClick={onSignOut}
          >
            Sign out
          </Button>
        </AppSurface>
      </div>
    </PanelShell>
  );
}
