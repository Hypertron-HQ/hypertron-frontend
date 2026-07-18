"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarClock,
  Globe2,
  Loader2,
  Mail,
  MessageCircle,
  Newspaper,
  RefreshCcw,
  Send,
  Slack,
  Sparkles,
  Target,
} from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/layout/dashboard-page-header";
import {
  WorkspacePageShell,
  workspaceHubBreadcrumbs,
} from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useFreighter } from "@/hooks/useFreighter";


type Sentiment = "up" | "down" | "neutral";

type MarketSignal = {
  id: string;
  title: string;
  url: string;
  source?: string | null;
  summary?: string | null;
  published_date?: string | null;
  sentiment: Sentiment;
  sentiment_score: number;
  impact_score: number;
  category: string;
};

type SentimentOverview = {
  positive: number;
  negative: number;
  neutral: number;
  average_sentiment_score: number;
  average_impact_score: number;
};

type ReportInsight = {
  text: string;
  signal_ids: string[];
};

type ImpactReport = {
  executive_summary: string;
  key_signals: ReportInsight[];
  risks: ReportInsight[];
  opportunities: ReportInsight[];
  compliance_impact: ReportInsight[];
  recommended_actions: ReportInsight[];
  urgency_level: "Low" | "Medium" | "High";
  final_recommendation: string;
  data_quality: "strong" | "moderate" | "limited";
  confidence: number;
  disclaimer: string;
};

type BusinessImpactResponse = {
  business: string;
  industry: string;
  location: string;
  geographies: string[];
  operations_geographies: string[];
  signals_found: MarketSignal[];
  sentiment_overview: SentimentOverview;
  report: ImpactReport;
};

type RnsProfileForm = {
  businessName: string;
  industry: string;
  location: string;
  description: string;
  targetMarket: string;
  businessModel: string;
  riskFocus: string;
  geographies: string;
  operationsGeographies: string;
};

type RnsSchedule = {
  enabled: boolean;
  frequency: "daily" | "weekdays" | "weekly";
  sendHour24: string;
  timezone: string;
  recipientEmail: string;
};

type RnsIntegrations = {
  gmail: boolean;
  whatsapp: boolean;
  telegram: boolean;
  slack: boolean;
};

type BusinessProfileApiResponse = {
  name?: string;
  email?: string;
  businessNature?: string;
  complianceForm?: unknown;
};

const defaultProfileForm: RnsProfileForm = {
  businessName: "",
  industry: "",
  location: "",
  description: "",
  targetMarket: "",
  businessModel: "",
  riskFocus: "regulation, payments, compliance",
  geographies: "",
  operationsGeographies: "",
};

const defaultSchedule: RnsSchedule = {
  enabled: false,
  frequency: "daily",
  sendHour24: "20",
  timezone: "Asia/Singapore",
  recipientEmail: "",
};

const defaultIntegrations: RnsIntegrations = {
  gmail: true,
  whatsapp: false,
  telegram: false,
  slack: false,
};

const defaultSentiment: SentimentOverview = {
  positive: 0,
  negative: 0,
  neutral: 0,
  average_sentiment_score: 0,
  average_impact_score: 0,
};

function parseList(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function formatPublishedDate(value?: string | null): string {
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
}

function sentimentBadgeClass(sentiment: Sentiment): string {
  if (sentiment === "up") return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
  if (sentiment === "down") return "bg-rose-500/15 text-rose-300 border-rose-400/30";
  return "bg-slate-400/10 text-slate-300 border-slate-400/20";
}

function urgencyClass(urgency: ImpactReport["urgency_level"]): string {
  if (urgency === "High") return "bg-rose-500/15 text-rose-300 border-rose-400/30";
  if (urgency === "Medium") return "bg-amber-500/15 text-amber-300 border-amber-400/30";
  return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const payload = await res.json().catch(() => ({}));
  if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
  if (typeof payload?.detail === "string" && payload.detail.trim()) return payload.detail;
  return fallback;
}

export default function RnsPage() {
  const router = useRouter();
  const { publicKey } = useFreighter();

  const [profileForm, setProfileForm] = useState<RnsProfileForm>(defaultProfileForm);
  const [schedule, setSchedule] = useState<RnsSchedule>(defaultSchedule);
  const [integrations, setIntegrations] = useState<RnsIntegrations>(defaultIntegrations);
  const [lookbackHours, setLookbackHours] = useState("24");
  const [maxSignals, setMaxSignals] = useState("20");

  const [profileLoading, setProfileLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [sentimentOverview, setSentimentOverview] = useState<SentimentOverview>(defaultSentiment);
  const [report, setReport] = useState<ImpactReport | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedComplianceForm, setSavedComplianceForm] = useState<Record<string, unknown>>({});

  const canAnalyze = useMemo(() => {
    return (
      profileForm.businessName.trim().length > 0 &&
      profileForm.industry.trim().length > 0 &&
      profileForm.location.trim().length > 0 &&
      profileForm.description.trim().length > 0 &&
      profileForm.targetMarket.trim().length > 0
    );
  }, [profileForm]);

  const buildProfilePayload = () => ({
    business_name: profileForm.businessName.trim(),
    industry: profileForm.industry.trim(),
    location: profileForm.location.trim(),
    description: profileForm.description.trim(),
    target_market: profileForm.targetMarket.trim(),
    business_model: profileForm.businessModel.trim() || null,
    risk_focus: parseList(profileForm.riskFocus),
    geographies: parseList(profileForm.geographies),
    operations_geographies: parseList(profileForm.operationsGeographies),
  });

  useEffect(() => {
    if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith("G")) {
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);

    fetch("/api/business/profile", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: BusinessProfileApiResponse | null) => {
        if (cancelled || !data) return;

        const complianceForm = asObject(data.complianceForm);
        const rns = asObject(complianceForm.rns);

        setSavedComplianceForm(complianceForm);

        setProfileForm((prev) => ({
          ...prev,
          businessName:
            typeof rns.businessName === "string"
              ? rns.businessName
              : (typeof data.name === "string" ? data.name : ""),
          industry:
            typeof rns.industry === "string"
              ? rns.industry
              : (typeof data.businessNature === "string" ? data.businessNature : ""),
          location: typeof rns.location === "string" ? rns.location : prev.location,
          description: typeof rns.description === "string" ? rns.description : prev.description,
          targetMarket: typeof rns.targetMarket === "string" ? rns.targetMarket : prev.targetMarket,
          businessModel: typeof rns.businessModel === "string" ? rns.businessModel : prev.businessModel,
          riskFocus: typeof rns.riskFocus === "string" ? rns.riskFocus : prev.riskFocus,
          geographies: typeof rns.geographies === "string" ? rns.geographies : prev.geographies,
          operationsGeographies:
            typeof rns.operationsGeographies === "string"
              ? rns.operationsGeographies
              : prev.operationsGeographies,
        }));

        const savedSchedule = asObject(rns.schedule);
        setSchedule((prev) => ({
          enabled: typeof savedSchedule.enabled === "boolean" ? savedSchedule.enabled : prev.enabled,
          frequency:
            savedSchedule.frequency === "daily" ||
            savedSchedule.frequency === "weekdays" ||
            savedSchedule.frequency === "weekly"
              ? savedSchedule.frequency
              : prev.frequency,
          sendHour24:
            typeof savedSchedule.sendHour24 === "string"
              ? savedSchedule.sendHour24
              : prev.sendHour24,
          timezone:
            typeof savedSchedule.timezone === "string"
              ? savedSchedule.timezone
              : prev.timezone,
          recipientEmail:
            typeof savedSchedule.recipientEmail === "string"
              ? savedSchedule.recipientEmail
              : (typeof data.email === "string" ? data.email : prev.recipientEmail),
        }));

        const savedIntegrations = asObject(rns.integrations);
        setIntegrations((prev) => ({
          gmail: typeof savedIntegrations.gmail === "boolean" ? savedIntegrations.gmail : prev.gmail,
          whatsapp:
            typeof savedIntegrations.whatsapp === "boolean" ? savedIntegrations.whatsapp : prev.whatsapp,
          telegram:
            typeof savedIntegrations.telegram === "boolean" ? savedIntegrations.telegram : prev.telegram,
          slack: typeof savedIntegrations.slack === "boolean" ? savedIntegrations.slack : prev.slack,
        }));

        if (typeof rns.lookbackHours === "string") setLookbackHours(rns.lookbackHours);
        if (typeof rns.maxSignals === "string") setMaxSignals(rns.maxSignals);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const savePreferences = async () => {
    if (!publicKey) return;
    setSavingPrefs(true);
    setStatusMessage(null);
    setErrorMessage(null);

    const rnsPayload = {
      businessName: profileForm.businessName.trim(),
      industry: profileForm.industry.trim(),
      location: profileForm.location.trim(),
      description: profileForm.description.trim(),
      targetMarket: profileForm.targetMarket.trim(),
      businessModel: profileForm.businessModel.trim(),
      riskFocus: profileForm.riskFocus.trim(),
      geographies: profileForm.geographies.trim(),
      operationsGeographies: profileForm.operationsGeographies.trim(),
      lookbackHours,
      maxSignals,
      schedule,
      integrations,
      updatedAt: new Date().toISOString(),
    };

    const complianceForm = {
      ...savedComplianceForm,
      rns: rnsPayload,
    };

    const payload = {
      name: profileForm.businessName.trim() || null,
      email: schedule.recipientEmail.trim() || null,
      businessNature: profileForm.industry.trim() || null,
      complianceForm,
    };

    try {
      const res = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Failed to save RNS settings"));
      }

      const data = (await res.json()) as BusinessProfileApiResponse;
      setSavedComplianceForm(asObject(data.complianceForm));
      setStatusMessage("RNS settings saved.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSavingPrefs(false);
    }
  };

  const fetchLatestNews = async () => {
    if (!canAnalyze) {
      setErrorMessage("Fill in business details first.");
      return;
    }

    setFetchingNews(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/agentic/rns/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: buildProfilePayload(),
          lookback_hours: Number(lookbackHours),
          max_signals: Number(maxSignals),
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Failed to fetch news"));
      }

      const data = (await res.json()) as {
        signals_found?: MarketSignal[];
        sentiment_overview?: SentimentOverview;
      };

      setSignals(data.signals_found ?? []);
      setSentimentOverview(data.sentiment_overview ?? defaultSentiment);
      setReport(null);
      setLastRunAt(new Date().toISOString());
      setStatusMessage("Latest news refreshed.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to fetch latest news");
    } finally {
      setFetchingNews(false);
    }
  };

  const analyzeBusinessImpact = async () => {
    if (!canAnalyze) {
      setErrorMessage("Fill in business details first.");
      return;
    }

    setAnalyzing(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/agentic/rns/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: buildProfilePayload() }),
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Failed to analyze impact"));
      }

      const data = (await res.json()) as BusinessImpactResponse;
      setSignals(data.signals_found ?? []);
      setSentimentOverview(data.sentiment_overview ?? defaultSentiment);
      setReport(data.report ?? null);
      setLastRunAt(new Date().toISOString());
      setStatusMessage("Business impact analysis completed.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to analyze business impact");
    } finally {
      setAnalyzing(false);
    }
  };

  const sendEmailReport = async () => {
    if (!canAnalyze) {
      setErrorMessage("Fill in business details first.");
      return;
    }

    if (!schedule.recipientEmail.trim()) {
      setErrorMessage("Add a recipient email before sending report.");
      return;
    }

    setSendingEmail(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/agentic/rns/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: buildProfilePayload(),
          recipient_email: schedule.recipientEmail.trim(),
          lookback_hours: Number(lookbackHours),
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Failed to send report email"));
      }

      setStatusMessage("Report email sent.");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send report email");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <WorkspacePageShell
      breadcrumbs={workspaceHubBreadcrumbs("Regulations")}
      connectMessage="Connect your wallet to use Regulation News Sniper."
    >
      <div className="flex flex-col gap-6">
        {!publicKey ? null : (
          <>
          <DashboardPageHeader
            variant="hub"
            eyebrow="Regulations"
            title="RNS: Regulation News Sniper"
            description="Track daily news signals by geography, score sentiment impact on your business, and schedule report workflows."
            end={
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={savePreferences}
                  disabled={savingPrefs || profileLoading}
                  className="border-white/20 bg-white/[0.05]"
                >
                  {savingPrefs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Settings
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchLatestNews}
                  disabled={fetchingNews || analyzing || profileLoading}
                  className="border-white/20 bg-white/[0.05]"
                >
                  {fetchingNews ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                  Refresh News
                </Button>
                <Button
                  type="button"
                  onClick={analyzeBusinessImpact}
                  disabled={analyzing || fetchingNews || profileLoading}
                >
                  {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Analyze Impact
                </Button>
              </div>
            }
          />

          {statusMessage ? <p className="text-sm text-emerald-300">{statusMessage}</p> : null}
          {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}

          <div className="grid gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-5">
              <Card className="border-white/[0.12] bg-white/[0.02]">
                <CardHeader>
                  <CardTitle className="text-xl">Business Input</CardTitle>
                  <CardDescription>Enter business profile details to analyze how current news impacts operations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rns-business-name">Business name</Label>
                    <Input
                      id="rns-business-name"
                      value={profileForm.businessName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Hypertron"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="rns-industry">Industry</Label>
                      <Input
                        id="rns-industry"
                        value={profileForm.industry}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, industry: e.target.value }))}
                        placeholder="Web3 payments and stablecoin payroll"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rns-location">Primary location</Label>
                      <Input
                        id="rns-location"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="Singapore"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rns-description">Business description</Label>
                    <Textarea
                      id="rns-description"
                      value={profileForm.description}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe product, payment rails, compliance scope, and workflows."
                      className="min-h-[110px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rns-market">Target market</Label>
                    <Textarea
                      id="rns-market"
                      value={profileForm.targetMarket}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, targetMarket: e.target.value }))}
                      placeholder="Startups, DAOs, agencies, cross-border businesses"
                      className="min-h-[90px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rns-model">Business model</Label>
                    <Input
                      id="rns-model"
                      value={profileForm.businessModel}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, businessModel: e.target.value }))}
                      placeholder="SaaS subscription with stablecoin payment infrastructure"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rns-risk-focus">Risk focus (comma-separated)</Label>
                    <Input
                      id="rns-risk-focus"
                      value={profileForm.riskFocus}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, riskFocus: e.target.value }))}
                      placeholder="regulation, stablecoins, payroll, compliance"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="rns-geographies">Customer geographies</Label>
                      <Input
                        id="rns-geographies"
                        value={profileForm.geographies}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, geographies: e.target.value }))}
                        placeholder="Singapore, UAE, India"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rns-ops-geographies">Operations geographies</Label>
                      <Input
                        id="rns-ops-geographies"
                        value={profileForm.operationsGeographies}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, operationsGeographies: e.target.value }))}
                        placeholder="Singapore, UAE"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/[0.12] bg-white/[0.02]">
                <CardHeader>
                  <CardTitle className="text-xl">Scheduling and Integrations</CardTitle>
                  <CardDescription>
                    Schedule report delivery settings and choose integration channels. Non-Gmail channels are UI-ready and will be wired next.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Enable scheduled reports</p>
                      <p className="text-xs text-muted-foreground">Daily end-of-day summary workflow.</p>
                    </div>
                    <Switch
                      checked={schedule.enabled}
                      onCheckedChange={(checked) => setSchedule((prev) => ({ ...prev, enabled: checked }))}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={schedule.frequency}
                        onValueChange={(value: "daily" | "weekdays" | "weekly") =>
                          setSchedule((prev) => ({ ...prev, frequency: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekdays">Weekdays</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Send hour (24h)</Label>
                      <Input
                        value={schedule.sendHour24}
                        onChange={(e) => setSchedule((prev) => ({ ...prev, sendHour24: e.target.value }))}
                        placeholder="20"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select value={schedule.timezone} onValueChange={(value) => setSchedule((prev) => ({ ...prev, timezone: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Singapore">Asia/Singapore</SelectItem>
                          <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Recipient email</Label>
                      <Input
                        type="email"
                        value={schedule.recipientEmail}
                        onChange={(e) => setSchedule((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                        placeholder="founder@hypertron.space"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Mail className="h-4 w-4" /> Gmail
                        </div>
                        <Switch
                          checked={integrations.gmail}
                          onCheckedChange={(checked) => setIntegrations((prev) => ({ ...prev, gmail: checked }))}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Available via SMTP when backend credentials are configured.</p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </div>
                        <Switch
                          checked={integrations.whatsapp}
                          onCheckedChange={(checked) => setIntegrations((prev) => ({ ...prev, whatsapp: checked }))}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">UI ready. Delivery integration pending.</p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Send className="h-4 w-4" /> Telegram
                        </div>
                        <Switch
                          checked={integrations.telegram}
                          onCheckedChange={(checked) => setIntegrations((prev) => ({ ...prev, telegram: checked }))}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">UI ready. Delivery integration pending.</p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Slack className="h-4 w-4" /> Slack
                        </div>
                        <Switch
                          checked={integrations.slack}
                          onCheckedChange={(checked) => setIntegrations((prev) => ({ ...prev, slack: checked }))}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">UI ready. Delivery integration pending.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>News lookback window</Label>
                      <Select value={lookbackHours} onValueChange={setLookbackHours}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">Last 24 hours</SelectItem>
                          <SelectItem value="48">Last 48 hours</SelectItem>
                          <SelectItem value="72">Last 72 hours</SelectItem>
                          <SelectItem value="168">Last 7 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max news signals</Label>
                      <Select value={maxSignals} onValueChange={setMaxSignals}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/20 bg-white/[0.05]"
                    onClick={sendEmailReport}
                    disabled={sendingEmail || !integrations.gmail}
                  >
                    {sendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    Send Test Report (Gmail)
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 xl:col-span-7">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-white/[0.12] bg-white/[0.02]">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Globe2 className="h-4 w-4" /> Positive
                    </div>
                    <p className="text-2xl font-semibold text-emerald-300">{sentimentOverview.positive}</p>
                  </CardContent>
                </Card>
                <Card className="border-white/[0.12] bg-white/[0.02]">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Building2 className="h-4 w-4" /> Negative
                    </div>
                    <p className="text-2xl font-semibold text-rose-300">{sentimentOverview.negative}</p>
                  </CardContent>
                </Card>
                <Card className="border-white/[0.12] bg-white/[0.02]">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <Target className="h-4 w-4" /> Neutral
                    </div>
                    <p className="text-2xl font-semibold text-slate-200">{sentimentOverview.neutral}</p>
                  </CardContent>
                </Card>
                <Card className="border-white/[0.12] bg-white/[0.02]">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      <CalendarClock className="h-4 w-4" /> Avg Impact
                    </div>
                    <p className="text-2xl font-semibold text-amber-200">{sentimentOverview.average_impact_score.toFixed(1)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-white/[0.12] bg-white/[0.02]">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">Impact Report</CardTitle>
                      <CardDescription>AI-generated effect analysis based on current signals and your business profile.</CardDescription>
                    </div>
                    {report ? (
                      <Badge className={urgencyClass(report.urgency_level)}>{report.urgency_level} urgency</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report ? (
                    <>
                      <p className="text-sm text-foreground/90">{report.executive_summary}</p>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Risks</p>
                          <ul className="space-y-2 text-sm text-foreground/90">
                            {report.risks.length ? report.risks.map((item, idx) => (
                              <li key={`risk-${idx}`}>- {item.text}</li>
                            )) : <li>- None identified</li>}
                          </ul>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Opportunities</p>
                          <ul className="space-y-2 text-sm text-foreground/90">
                            {report.opportunities.length ? report.opportunities.map((item, idx) => (
                              <li key={`opp-${idx}`}>- {item.text}</li>
                            )) : <li>- None identified</li>}
                          </ul>
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Recommended Actions</p>
                        <ul className="space-y-2 text-sm text-foreground/90">
                          {report.recommended_actions.length ? report.recommended_actions.map((item, idx) => (
                            <li key={`action-${idx}`}>- {item.text}</li>
                          )) : <li>- No action recommendation available</li>}
                        </ul>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Final Recommendation</p>
                        <p className="text-sm text-foreground/90">{report.final_recommendation}</p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Confidence: {report.confidence.toFixed(2)} | Data quality: {report.data_quality}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.02]">
                      <p className="text-sm text-muted-foreground">Run Analyze Impact to generate business effect recommendations.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/[0.12] bg-white/[0.02]">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl">News Signals</CardTitle>
                      <CardDescription>
                        Latest items with sentiment labels and impact scores on your business. {lastRunAt ? `Last run: ${formatPublishedDate(lastRunAt)}` : ""}
                      </CardDescription>
                    </div>
                    <Badge className="border-white/20 bg-white/[0.06] text-white">{signals.length} items</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {signals.length === 0 ? (
                    <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.02]">
                      <p className="text-sm text-muted-foreground">No signals yet. Use Refresh News or Analyze Impact.</p>
                    </div>
                  ) : (
                    signals.map((signal) => (
                      <article key={signal.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge className={sentimentBadgeClass(signal.sentiment)}>{signal.sentiment}</Badge>
                          <Badge className="border-white/20 bg-white/[0.05] text-white">Impact {signal.impact_score.toFixed(1)}/10</Badge>
                          <Badge className="border-white/20 bg-white/[0.05] text-white">Affects: {signal.category}</Badge>
                        </div>
                        <h3 className="text-sm font-medium text-foreground">{signal.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{signal.source || "Unknown source"} | {formatPublishedDate(signal.published_date)}</p>
                        {signal.summary ? <p className="mt-2 text-sm text-foreground/85">{signal.summary}</p> : null}
                        <a
                          href={signal.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-blue-300 hover:text-blue-200"
                        >
                          <Newspaper className="h-3.5 w-3.5" />
                          Open source
                        </a>
                      </article>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          </>
        )}
      </div>
    </WorkspacePageShell>
  );
}
