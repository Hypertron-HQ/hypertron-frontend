"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileBarChart2, ShieldCheck, Upload, X } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/layout/dashboard-page-header";
import {
  WorkspacePageShell,
  workspaceHubBreadcrumbs,
} from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemoMode } from "@/components/demo/demo-mode-provider";
import { useFreighter } from "@/hooks/useFreighter";
import {
  clearLatestComplianceContext,
  clearLatestComplianceResult,
  getLatestComplianceResult,
  setPendingComplianceRequest,
} from "@/lib/compliance-agent-session";
import { getRelevantSourcesForBusiness } from "@/lib/compliance/jurisdiction-knowledge-base";

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;

const COUNTRY_OPTIONS = [
  "India",
  "Singapore",
  "United States",
  "European Union",
  "United Arab Emirates",
  "Middle East",
  "Japan",
  "China",
  "Russia",
  "Australia",
  "Other",
] as const;

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  if (i < 0) return "";
  return filename.slice(i).toLowerCase();
}

function isValidWebsiteUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function dedupeFiles(files: File[]): File[] {
  const seen = new Set<string>();
  const out: File[] = [];
  for (const file of files) {
    const key = `${file.name.toLowerCase()}::${file.size}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(file);
  }
  return out;
}

export default function ComplianceAgentPage() {
  const router = useRouter();
  const { isDemo, demoPath } = useDemoMode();
  const { publicKey } = useFreighter();
  const canUseAgent = isDemo || !!publicKey;

  const [country, setCountry] = useState<string>("");
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [notes, setNotes] = useState("");
  const [companyWebsiteUrl, setCompanyWebsiteUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const hasLastAnalysis = useMemo(() => !!getLatestComplianceResult(), []);
  const regulatorySources = useMemo(
    () => getRelevantSourcesForBusiness(country, businessModel, companyDescription),
    [businessModel, companyDescription, country]
  );

  useEffect(() => {
    if (!isDemo) return;
    setCountry((value) => value || "India");
    setCompanyName((value) => value || "Hypertron Demo");
    setCompanyDescription(
      (value) =>
        value ||
        "Hypertron provides cross-border B2B payment infrastructure for startups and SMEs operating across India and Southeast Asia."
    );
    setBusinessModel(
      (value) =>
        value ||
        "SaaS platform offering payment links, treasury management, and stablecoin settlement for business customers with KYC onboarding."
    );
  }, [isDemo]);

  const onFileInput = (nextFiles: FileList | null) => {
    if (!nextFiles) return;
    const incoming = Array.from(nextFiles);
    const combined = dedupeFiles([...files, ...incoming]);
    if (combined.length > MAX_FILES) {
      setError(`You can upload up to ${MAX_FILES} files.`);
      return;
    }
    for (const file of combined) {
      const ext = getExtension(file.name);
      if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
        setError("Unsupported file type. Supported types are PDF, DOCX, and TXT.");
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File too large: ${file.name}. Maximum size is 10MB.`);
        return;
      }
    }
    setFiles(combined);
    setError(null);
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const validateRequiredFields = (): string | null => {
    const name = companyName.trim();
    const description = companyDescription.trim();
    const model = businessModel.trim();
    if (!country) return "Country/Region is required.";
    if (name.length < 2 || name.length > 120) return "Company name must be between 2 and 120 characters.";
    if (description.length < 10 || description.length > 500) return "Company description must be between 10 and 500 characters.";
    if (model.length < 20 || model.length > 1000) return "Business model must be between 20 and 1000 characters.";
    if (companyWebsiteUrl.trim() && !isValidWebsiteUrl(companyWebsiteUrl.trim())) {
      return "Invalid company website URL. Only public http/https URLs are allowed.";
    }
    if (notes.trim().length > 3000) return "Notes can be up to 3000 characters.";
    return null;
  };

  const continueToLoading = () => {
    const validationError = validateRequiredFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    clearLatestComplianceResult();
    clearLatestComplianceContext();
    const companyDetails = [
      `Company name: ${companyName.trim()}`,
      `Company description: ${companyDescription.trim()}`,
    ].join("\n");
    const website = companyWebsiteUrl.trim();
    setPendingComplianceRequest({
      country,
      companyName: companyName.trim(),
      companyDescription: companyDescription.trim(),
      companyDetails,
      businessModel: businessModel.trim(),
      notes: notes.trim(),
      companyWebsiteUrl: website,
      websites: website ? [website] : [],
      regulatorySources,
      files,
    });
    router.push(demoPath("/dashboard/compliance-agent/loading"));
  };

  return (
    <WorkspacePageShell
      breadcrumbs={workspaceHubBreadcrumbs("Compliance")}
      connectMessage={isDemo ? undefined : "Connect your wallet to use Compliance Agent."}
    >
      <div className="flex flex-col gap-6">
        <DashboardPageHeader
          variant="hub"
          eyebrow="Compliance"
          title={
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-blue-600" strokeWidth={1.75} />
              Compliance Agent
            </span>
          }
          description={
            isDemo
              ? "Try the full compliance flow with sample data. Analysis runs against the live Compliance Agent backend."
              : "Configure your context and launch AI analysis. You will be redirected to a live analysis screen."
          }
          end={
            hasLastAnalysis ? (
              <Button
                variant="outline"
                className="rounded-xl border-ui-border/80 bg-white hover:bg-neutral-50"
                onClick={() => router.push(demoPath("/dashboard/compliance-agent/analysis"))}
              >
                <FileBarChart2 className="mr-2 h-4 w-4" />
                View Last Analysis
              </Button>
            ) : undefined
          }
        />

        {!canUseAgent ? null : (
          <Card>
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>
                Guard rails: company description 10-500 chars, business model 20-1000 chars, optional company website,
                and up to 5 files (PDF/DOCX/TXT, 10MB each). Hypertron resolves official regulatory sources internally.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Country/Region</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country/region" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    We will automatically use trusted regulatory sources for this jurisdiction.
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-900">Safety note</p>
                  <p className="mt-1 text-xs text-amber-800/90">
                    Do not upload secrets unless necessary. AI-generated guidance should be validated with legal and
                    compliance professionals.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Hypertron Labs"
                />
              </div>

              <div className="space-y-2">
                <Label>Company description</Label>
                <Textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="What does your company do, who are your users, and where are you operating?"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Business model</Label>
                <Textarea
                  value={businessModel}
                  onChange={(e) => setBusinessModel(e.target.value)}
                  placeholder="Describe revenue model, product lines, transaction flow, custody and fiat rails."
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Company website URL (optional)</Label>
                <Input
                  value={companyWebsiteUrl}
                  onChange={(e) => setCompanyWebsiteUrl(e.target.value)}
                  placeholder="https://yourcompany.com"
                />
                <p className="text-xs text-muted-foreground">
                  Add only your company website. Regulatory sources are provided by Hypertron from the selected jurisdiction.
                </p>
              </div>

              {country && (
                <details className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-sm">
                  <summary className="cursor-pointer font-medium text-blue-950">
                    Sources Hypertron will check ({regulatorySources.length})
                  </summary>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {regulatorySources.map((source) => (
                      <div key={`${source.name}-${source.url}`} className="rounded-md border border-blue-100 bg-white/70 p-2">
                        <p className="font-medium text-blue-950">{source.name}</p>
                        <p className="mt-1 text-xs capitalize text-blue-800/70">{source.authorityType.replace("_", " ")}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              <div className="space-y-2">
                <Label>Documents (PDF, DOCX, TXT)</Label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                    <Upload className="h-4 w-4" />
                    Upload files
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.docx,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(e) => onFileInput(e.target.files)}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">Max {MAX_FILES} files, 10MB each.</p>
                </div>
                {files.length > 0 && (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={`${file.name}-${file.size}`}
                        className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                      >
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => removeFile(file.name)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Extra notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any constraints, audit timeline, legal counsel notes, or operational details."
                  className="min-h-[90px]"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button onClick={continueToLoading} className="w-full sm:w-auto">
                Start Analysis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </WorkspacePageShell>
  );
}
