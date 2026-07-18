"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Loader2,
  Play,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Save,
  Settings2,
  FileCheck,
  Scale,
  Zap,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/layout/dashboard-page-header";
import {
  WorkspacePageShell,
  workspaceHubBreadcrumbs,
} from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFreighter } from "@/hooks/useFreighter";
import { cn } from "@/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Citation = {
  title: string;
  url: string;
  published_at?: string | null;
};

type AnalysisOutput = {
  compliance_completion?: number;
  required_licenses?: Array<{
    name: string;
    jurisdiction: string;
    status: string;
    confidence?: string;
    requires_legal_review?: boolean;
    citations?: Citation[];
  }>;
  required_certifications?: Array<{
    name: string;
    status: string;
    confidence?: string;
    requires_legal_review?: boolean;
    citations?: Citation[];
  }>;
  mandatory_controls?: Array<{
    name: string;
    status: string;
    notes: string;
    citations?: Citation[];
  }>;
  registration_status?: { status: string; notes: string };
  missing_steps?: Array<{
    step: string;
    priority: string;
    why_it_matters: string;
    citations?: Citation[];
  }>;
  estimated_timeline?: string;
  action_plan?: Array<{
    week: string;
    deliverables: string[];
    owner: string;
    citations?: Citation[];
  }>;
  solutions?: Array<{
    problem: string;
    solution: string;
    implementation_hint: string;
  }>;
  citations?: Citation[];
};

type FullAnalysisResult = {
  profile: Record<string, unknown>;
  analysis: AnalysisOutput;
  checklist: Array<{ id: string; text: string; done?: boolean }>;
  metadata: { generated_at: string; cached: boolean; model_used: string };
};

type ProfileForm = {
  businessName: string;
  jurisdictions: string;
  businessModel: string;
  custodyFunds: boolean;
  fiatOnOffRamp: boolean;
  retailUsers: boolean;
  usesStablecoin: boolean;
  stellarWallets: string;
  evmWallets: string;
};

const BUSINESS_MODELS = [
  { value: "exchange", label: "Exchange" },
  { value: "custody", label: "Custody" },
  { value: "payments", label: "Payments" },
  { value: "defi", label: "DeFi" },
  { value: "nft", label: "NFT" },
  { value: "other", label: "Other" },
];

const EMPTY_PROFILE_FORM: ProfileForm = {
  businessName: "",
  jurisdictions: "",
  businessModel: "payments",
  custodyFunds: false,
  fiatOnOffRamp: false,
  retailUsers: false,
  usesStablecoin: false,
  stellarWallets: "",
  evmWallets: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    configured: {
      label: "Configured",
      className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    in_progress: {
      label: "In Progress",
      className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    },
    pending: {
      label: "Pending",
      className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    unknown: {
      label: "Unknown",
      className: "bg-muted text-muted-foreground border-border",
    },
  };
  const cfg = map[status] ?? map.unknown;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}

function priorityBadge(priority: string) {
  const map: Record<string, { className: string }> = {
    P0: { className: "bg-red-500/15 text-red-400 border-red-500/30" },
    P1: { className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    P2: { className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  };
  const cfg = map[priority] ?? { className: "bg-muted text-muted-foreground border-border" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
        cfg.className
      )}
    >
      {priority}
    </span>
  );
}

function confidenceBadge(confidence?: string) {
  if (!confidence) return null;
  const map: Record<string, string> = {
    high: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
        map[confidence] ?? map.low
      )}
    >
      {confidence} confidence
    </span>
  );
}

function ownerBadge(owner: string) {
  const map: Record<string, string> = {
    founder: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    legal: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    compliance: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    engineering: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
        map[owner] ?? "bg-muted text-muted-foreground border-border"
      )}
    >
      {owner}
    </span>
  );
}

function CitationList({ citations }: { citations?: Citation[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!citations?.length) return null;
  const shown = expanded ? citations : citations.slice(0, 2);
  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-2">
        {shown.map((c, i) => (
          <a
            key={i}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {c.title || c.url}
          </a>
        ))}
      </div>
      {citations.length > 2 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" /> Show less</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> +{citations.length - 2} more sources</>
          )}
        </button>
      )}
    </div>
  );
}

// ─── Metric cards ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon,
  colorClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 flex items-start gap-3">
      <div className={cn("mt-0.5 rounded-lg p-2", colorClass)}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ComplianceAnalysisPage() {
  const router = useRouter();
  const { publicKey } = useFreighter();

  // Profile state
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>(EMPTY_PROFILE_FORM);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showProfileForm, setShowProfileForm] = useState(false);

  // Analysis state
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Checklist interaction
  const [checklistItems, setChecklistItems] = useState<
    Array<{ id: string; text: string; done: boolean }>
  >([]);
  const [savingVault, setSavingVault] = useState(false);

  // Load profile on wallet connect
  useEffect(() => {
    if (!publicKey) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    fetch(`/api/regintel/profile/org/${encodeURIComponent(publicKey)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProfileId(data.id);
          setProfileForm({
            businessName: data.businessName || "",
            jurisdictions: Array.isArray(data.jurisdictions)
              ? data.jurisdictions.join(", ")
              : "",
            businessModel: data.businessModel || "payments",
            custodyFunds: data.custodyFunds ?? false,
            fiatOnOffRamp: data.fiatOnOffRamp ?? false,
            retailUsers: data.retailUsers ?? false,
            usesStablecoin: data.usesStablecoin ?? false,
            stellarWallets: (data.wallets?.stellar || []).join(", "),
            evmWallets: (data.wallets?.evm || []).join(", "),
          });
        } else {
          setShowProfileForm(true);
        }
      })
      .catch(() => setShowProfileForm(true))
      .finally(() => setProfileLoading(false));
  }, [publicKey]);

  // Sync checklist from result
  useEffect(() => {
    if (result?.checklist) {
      setChecklistItems(
        result.checklist.map((i) => ({ ...i, done: i.done ?? false }))
      );
    }
  }, [result]);

  const handleSaveProfile = () => {
    if (!publicKey) return;
    setProfileError(null);
    setProfileSaving(true);
    const jurisdictions = profileForm.jurisdictions
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!jurisdictions.length) jurisdictions.push("US");

    fetch("/api/regintel/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId: publicKey,
        businessName: profileForm.businessName || undefined,
        jurisdictions,
        businessModel: profileForm.businessModel,
        custodyFunds: profileForm.custodyFunds,
        fiatOnOffRamp: profileForm.fiatOnOffRamp,
        retailUsers: profileForm.retailUsers,
        usesStablecoin: profileForm.usesStablecoin,
        wallets: {
          stellar: profileForm.stellarWallets
            .split(/[,;\s]/)
            .map((s) => s.trim())
            .filter(Boolean),
          evm: profileForm.evmWallets
            .split(/[,;\s]/)
            .map((s) => s.trim())
            .filter(Boolean),
        },
      }),
    })
      .then((res) => {
        if (!res.ok)
          return res
            .json()
            .then((e) => {
              throw new Error(e.detail || e.error || "Failed to save profile");
            });
        return res.json();
      })
      .then((data) => {
        setProfileId(data.id);
        setProfileSaved(true);
        setShowProfileForm(false);
        setTimeout(() => setProfileSaved(false), 3000);
      })
      .catch((e) => setProfileError(e.message || "Failed to save profile"))
      .finally(() => setProfileSaving(false));
  };

  const runFullAnalysis = (force = false) => {
    if (!profileId) return;
    setAnalysisError(null);
    setAnalyzing(true);
    fetch("/api/regintel/compliance/full-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        force,
        includeChecklist: true,
        checklistForm: {
          businessName: profileForm.businessName,
          basedOutOf: profileForm.jurisdictions,
          businessType: profileForm.businessModel,
          geographies: profileForm.jurisdictions,
        },
      }),
    })
      .then((res) => {
        if (!res.ok)
          return res
            .json()
            .then((e) => {
              throw new Error(e.detail || e.error || "Analysis failed");
            });
        return res.json();
      })
      .then((data: FullAnalysisResult) => setResult(data))
      .catch((e) => setAnalysisError(e.message || "Analysis failed"))
      .finally(() => setAnalyzing(false));
  };

  const handleSaveToVault = () => {
    if (!publicKey || checklistItems.length === 0) return;
    setSavingVault(true);
    fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: publicKey.trim(),
        title: "Compliance Analysis – Checklist",
        items: checklistItems.map(({ id, text, done }) => ({ id, text, done })),
      }),
    })
      .then((res) => {
        if (!res.ok)
          return res.json().then((e) => {
            throw new Error(e.error || "Failed to save");
          });
        return res.json();
      })
      .then(() => router.push("/dashboard/document-vault"))
      .catch(() => {})
      .finally(() => setSavingVault(false));
  };

  // ─── Compliance completion score helpers ──────────────────────────────────

  const completion = result?.analysis?.compliance_completion ?? 0;
  const completionPct = Math.round(completion * 100);
  const missingCount = result?.analysis?.missing_steps?.length ?? 0;
  const licenseCount = result?.analysis?.required_licenses?.length ?? 0;
  const controlCount = result?.analysis?.mandatory_controls?.length ?? 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <WorkspacePageShell
      breadcrumbs={workspaceHubBreadcrumbs("Risk Reports")}
      connectMessage="Connect your wallet to access Risk Reports."
    >
      <div className="flex flex-col gap-6">
        <DashboardPageHeader
          variant="hub"
          eyebrow="Risk Reports"
          title={
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-blue-600" strokeWidth={1.75} />
              Compliance Analysis
            </span>
          }
          description="AI-powered web3 compliance roadmap: licenses, controls, risk assessment, and action plan — grounded in regulatory sources."
        />

        {!publicKey ? null : (
          <>
          {/* Loading profile */}
          {profileLoading && (
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
            </p>
          )}

          {!profileLoading && (
            <>
              {/* Profile card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Business Profile
                      </CardTitle>
                      {profileId && !showProfileForm && (
                        <CardDescription className="mt-1">
                          {profileForm.businessName || "Your business"} ·{" "}
                          {profileForm.jurisdictions || "No jurisdictions set"}
                          {result?.metadata?.cached && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              · Analysis cached
                            </span>
                          )}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProfileForm((v) => !v)}
                    >
                      {showProfileForm ? (
                        <><ChevronUp className="h-4 w-4 mr-1" /> Hide</>
                      ) : (
                        <><ChevronDown className="h-4 w-4 mr-1" /> {profileId ? "Edit" : "Setup"}</>
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {showProfileForm && (
                  <CardContent className="space-y-5 border-t pt-5">
                    <div className="space-y-2">
                      <Label htmlFor="ca-businessName">Business name</Label>
                      <Input
                        id="ca-businessName"
                        value={profileForm.businessName}
                        onChange={(e) =>
                          setProfileForm((f) => ({
                            ...f,
                            businessName: e.target.value,
                          }))
                        }
                        placeholder="Acme Crypto Inc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ca-jurisdictions">
                        Jurisdictions (comma-separated, e.g. US, EU, SG)
                      </Label>
                      <Input
                        id="ca-jurisdictions"
                        value={profileForm.jurisdictions}
                        onChange={(e) =>
                          setProfileForm((f) => ({
                            ...f,
                            jurisdictions: e.target.value,
                          }))
                        }
                        placeholder="US, EU"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Business model</Label>
                      <Select
                        value={profileForm.businessModel}
                        onValueChange={(v) =>
                          setProfileForm((f) => ({ ...f, businessModel: v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_MODELS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-5">
                      {(
                        [
                          ["custodyFunds", "Custody of funds"],
                          ["fiatOnOffRamp", "Fiat on/off ramp"],
                          ["retailUsers", "Retail users"],
                          ["usesStablecoin", "Uses stablecoin"],
                        ] as [keyof ProfileForm, string][]
                      ).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`ca-${key}`}
                            checked={!!profileForm[key]}
                            onCheckedChange={(c) =>
                              setProfileForm((f) => ({ ...f, [key]: !!c }))
                            }
                          />
                          <Label htmlFor={`ca-${key}`} className="font-normal">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="ca-stellar">
                          Stellar wallets (optional)
                        </Label>
                        <Input
                          id="ca-stellar"
                          value={profileForm.stellarWallets}
                          onChange={(e) =>
                            setProfileForm((f) => ({
                              ...f,
                              stellarWallets: e.target.value,
                            }))
                          }
                          placeholder="G..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ca-evm">EVM wallets (optional)</Label>
                        <Input
                          id="ca-evm"
                          value={profileForm.evmWallets}
                          onChange={(e) =>
                            setProfileForm((f) => ({
                              ...f,
                              evmWallets: e.target.value,
                            }))
                          }
                          placeholder="0x..."
                        />
                      </div>
                    </div>
                    {profileError && (
                      <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                        {profileError}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <Button onClick={handleSaveProfile} disabled={profileSaving}>
                        {profileSaving ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                        ) : (
                          <><Save className="mr-2 h-4 w-4" /> Save profile</>
                        )}
                      </Button>
                      {profileSaved && (
                        <span className="text-sm text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Saved
                        </span>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* No profile yet */}
              {!profileId && !showProfileForm && (
                <Card className="border-dashed">
                  <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
                    <Scale className="h-10 w-10 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Set up your business profile to run an AI compliance
                      analysis.
                    </p>
                    <Button onClick={() => setShowProfileForm(true)}>
                      <Settings2 className="mr-2 h-4 w-4" /> Set up profile
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Run analysis controls */}
              {profileId && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => runFullAnalysis(false)}
                    disabled={analyzing}
                    size="lg"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Running AI analysis…
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        Run Compliance Analysis
                      </>
                    )}
                  </Button>
                  {result && (
                    <Button
                      variant="outline"
                      onClick={() => runFullAnalysis(true)}
                      disabled={analyzing}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Force refresh
                    </Button>
                  )}
                  {result?.metadata && (
                    <p className="text-xs text-muted-foreground">
                      {result.metadata.cached ? "Using cached result · " : ""}
                      Model: {result.metadata.model_used}
                    </p>
                  )}
                </div>
              )}

              {/* Analysis error */}
              {analysisError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {analysisError}
                </div>
              )}

              {/* ─── Results ─────────────────────────────────────────────── */}
              {result && (
                <div className="space-y-6">
                  {/* Metric overview cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MetricCard
                      label="Compliance score"
                      value={`${completionPct}%`}
                      sub="Estimated completion"
                      icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
                      colorClass="bg-emerald-500/10"
                    />
                    <MetricCard
                      label="Missing steps"
                      value={missingCount}
                      sub="Action required"
                      icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
                      colorClass="bg-amber-500/10"
                    />
                    <MetricCard
                      label="Licenses required"
                      value={licenseCount}
                      sub="Across jurisdictions"
                      icon={<BookOpen className="h-4 w-4 text-blue-400" />}
                      colorClass="bg-blue-500/10"
                    />
                    <MetricCard
                      label="Controls"
                      value={controlCount}
                      sub="Mandatory controls"
                      icon={<Zap className="h-4 w-4 text-purple-400" />}
                      colorClass="bg-purple-500/10"
                    />
                  </div>

                  {/* Compliance completion bar */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Overall Compliance Completion
                      </CardTitle>
                      <CardDescription>
                        Estimated from required items, controls, and licenses
                        for your business profile.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <Progress
                          value={completionPct}
                          className="h-3 flex-1"
                        />
                        <span className="text-sm font-semibold tabular-nums w-10">
                          {completionPct}%
                        </span>
                      </div>
                      {result.analysis.estimated_timeline && (
                        <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Estimated timeline:{" "}
                          {result.analysis.estimated_timeline}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Tabbed results */}
                  <Tabs defaultValue="roadmap" className="space-y-4">
                    <TabsList className="flex-wrap h-auto gap-1">
                      <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
                      <TabsTrigger value="requirements">Requirements</TabsTrigger>
                      <TabsTrigger value="controls">Controls</TabsTrigger>
                      <TabsTrigger value="checklist">
                        Checklist
                        {checklistItems.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {checklistItems.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="solutions">Solutions</TabsTrigger>
                      <TabsTrigger value="sources">Sources</TabsTrigger>
                    </TabsList>

                    {/* ── Roadmap Tab ─────────────────────────────────────── */}
                    <TabsContent value="roadmap" className="space-y-4">
                      {/* Missing steps */}
                      {result.analysis.missing_steps &&
                        result.analysis.missing_steps.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                Missing Steps
                              </CardTitle>
                              <CardDescription>
                                Prioritized actions your business needs to take
                                to reach compliance.
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {result.analysis.missing_steps.map((s, i) => (
                                  <li
                                    key={i}
                                    className="rounded-lg border border-border bg-muted/20 p-3"
                                  >
                                    <div className="flex flex-wrap items-start gap-2">
                                      {priorityBadge(s.priority)}
                                      <span className="font-medium text-sm">
                                        {s.step}
                                      </span>
                                    </div>
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                      {s.why_it_matters}
                                    </p>
                                    <CitationList citations={s.citations} />
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                      {/* Action plan */}
                      {result.analysis.action_plan &&
                        result.analysis.action_plan.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                Action Plan
                              </CardTitle>
                              <CardDescription>
                                Week-by-week deliverables with assigned owners.
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <ol className="space-y-3">
                                {result.analysis.action_plan.map((a, i) => (
                                  <li
                                    key={i}
                                    className="rounded-lg border border-border bg-muted/20 p-3"
                                  >
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <span className="font-medium text-sm">
                                        {a.week}
                                      </span>
                                      {ownerBadge(a.owner)}
                                    </div>
                                    <ul className="space-y-1">
                                      {a.deliverables.map((d, j) => (
                                        <li
                                          key={j}
                                          className="flex items-start gap-2 text-xs text-muted-foreground"
                                        >
                                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                                          {d}
                                        </li>
                                      ))}
                                    </ul>
                                    <CitationList citations={a.citations} />
                                  </li>
                                ))}
                              </ol>
                            </CardContent>
                          </Card>
                        )}

                      {/* Registration status */}
                      {result.analysis.registration_status && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">
                              Registration Status
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-wrap items-start gap-3">
                            {statusBadge(
                              result.analysis.registration_status.status
                            )}
                            <p className="text-sm text-muted-foreground">
                              {result.analysis.registration_status.notes}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* ── Requirements Tab ────────────────────────────────── */}
                    <TabsContent value="requirements" className="space-y-4">
                      {/* Required licenses */}
                      {result.analysis.required_licenses &&
                        result.analysis.required_licenses.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-blue-400" />
                                Required Licenses
                              </CardTitle>
                              <CardDescription>
                                Jurisdiction-specific licenses for web3 / VASP
                                operations.
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-3">
                                {result.analysis.required_licenses.map(
                                  (l, i) => (
                                    <li
                                      key={i}
                                      className="rounded-lg border border-border bg-muted/20 p-3"
                                    >
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-sm">
                                          {l.name}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {l.jurisdiction}
                                        </Badge>
                                        {statusBadge(l.status)}
                                        {confidenceBadge(l.confidence)}
                                        {l.requires_legal_review && (
                                          <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                                            <AlertTriangle className="h-3 w-3" />
                                            Legal review required
                                          </span>
                                        )}
                                      </div>
                                      <CitationList citations={l.citations} />
                                    </li>
                                  )
                                )}
                              </ul>
                            </CardContent>
                          </Card>
                        )}

                      {/* Required certifications */}
                      {result.analysis.required_certifications &&
                        result.analysis.required_certifications.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">
                                Required Certifications & Policies
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ul className="space-y-2">
                                {result.analysis.required_certifications.map(
                                  (c, i) => (
                                    <li
                                      key={i}
                                      className="rounded-lg border border-border bg-muted/20 p-3"
                                    >
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-sm">
                                          {c.name}
                                        </span>
                                        {statusBadge(c.status)}
                                        {confidenceBadge(c.confidence)}
                                        {c.requires_legal_review && (
                                          <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                                            <AlertTriangle className="h-3 w-3" />
                                            Legal review required
                                          </span>
                                        )}
                                      </div>
                                      <CitationList citations={c.citations} />
                                    </li>
                                  )
                                )}
                              </ul>
                            </CardContent>
                          </Card>
                        )}
                    </TabsContent>

                    {/* ── Controls Tab ────────────────────────────────────── */}
                    <TabsContent value="controls" className="space-y-4">
                      {result.analysis.mandatory_controls &&
                      result.analysis.mandatory_controls.length > 0 ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-purple-400" />
                              Mandatory Controls
                            </CardTitle>
                            <CardDescription>
                              KYC, KYB, KYT, Travel Rule, sanctions screening,
                              and more.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3">
                              {result.analysis.mandatory_controls.map(
                                (c, i) => (
                                  <li
                                    key={i}
                                    className="rounded-lg border border-border bg-muted/20 p-3"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium text-sm">
                                        {c.name}
                                      </span>
                                      {statusBadge(c.status)}
                                    </div>
                                    {c.notes && (
                                      <p className="mt-1.5 text-xs text-muted-foreground">
                                        {c.notes}
                                      </p>
                                    )}
                                    <CitationList citations={c.citations} />
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No mandatory controls data available.
                        </p>
                      )}
                    </TabsContent>

                    {/* ── Checklist Tab ───────────────────────────────────── */}
                    <TabsContent value="checklist" className="space-y-4">
                      {checklistItems.length > 0 ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <FileCheck className="h-4 w-4" />
                              AI-Generated Compliance Checklist
                            </CardTitle>
                            <CardDescription>
                              Actionable checklist generated from your business
                              profile. Tick off completed items, then save to
                              your Document vault.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <ul className="space-y-2">
                              {checklistItems.map((item) => (
                                <li
                                  key={item.id}
                                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                                >
                                  <Checkbox
                                    id={item.id}
                                    checked={item.done}
                                    onCheckedChange={() =>
                                      setChecklistItems((prev) =>
                                        prev.map((i) =>
                                          i.id === item.id
                                            ? { ...i, done: !i.done }
                                            : i
                                        )
                                      )
                                    }
                                    className="mt-0.5"
                                  />
                                  <label
                                    htmlFor={item.id}
                                    className={cn(
                                      "text-sm flex-1 cursor-pointer",
                                      item.done &&
                                        "text-muted-foreground line-through"
                                    )}
                                  >
                                    {item.text}
                                  </label>
                                </li>
                              ))}
                            </ul>
                            <Button
                              onClick={handleSaveToVault}
                              disabled={savingVault}
                              variant="outline"
                            >
                              {savingVault ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                              ) : (
                                <><Save className="mr-2 h-4 w-4" /> Save to Document vault</>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          Run the analysis to generate your compliance checklist.
                        </p>
                      )}
                    </TabsContent>

                    {/* ── Solutions Tab ───────────────────────────────────── */}
                    <TabsContent value="solutions" className="space-y-4">
                      {result.analysis.solutions &&
                      result.analysis.solutions.length > 0 ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>Recommended Solutions</CardTitle>
                            <CardDescription>
                              AI-suggested solutions and implementation hints
                              for your compliance gaps.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3">
                              {result.analysis.solutions.map((s, i) => (
                                <li
                                  key={i}
                                  className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5"
                                >
                                  <p className="text-sm">
                                    <span className="font-medium">Problem: </span>
                                    {s.problem}
                                  </p>
                                  <p className="text-sm">
                                    <span className="font-medium">Solution: </span>
                                    {s.solution}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {s.implementation_hint}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No solutions data available.
                        </p>
                      )}
                    </TabsContent>

                    {/* ── Sources Tab ─────────────────────────────────────── */}
                    <TabsContent value="sources" className="space-y-4">
                      {result.analysis.citations &&
                      result.analysis.citations.length > 0 ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>Regulatory Sources & Citations</CardTitle>
                            <CardDescription>
                              All regulatory documents and sources used in this
                              analysis.
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {result.analysis.citations.map((c, i) => (
                                <li key={i} className="text-sm">
                                  <a
                                    href={c.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                    <span>{c.title || c.url}</span>
                                  </a>
                                  {c.published_at && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      {c.published_at}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No citation data available. Add regulatory sources in
                          the RegIntel setup.
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </>
          )}
          </>
        )}
      </div>
    </WorkspacePageShell>
  );
}
