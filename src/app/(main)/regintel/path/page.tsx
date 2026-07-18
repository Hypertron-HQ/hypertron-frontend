"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale, Loader2, Play, ExternalLink, FileText } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/layout/header";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFreighter } from "@/hooks/useFreighter";

type AnalysisOutput = {
  compliance_completion?: number;
  required_licenses?: Array<{ name: string; jurisdiction: string; status: string; confidence?: string; requires_legal_review?: boolean; citations?: Array<{ title: string; url: string; published_at?: string | null }> }>;
  required_certifications?: Array<{ name: string; status: string; confidence?: string; requires_legal_review?: boolean; citations?: unknown[] }>;
  mandatory_controls?: Array<{ name: string; status: string; notes: string; citations?: unknown[] }>;
  registration_status?: { status: string; notes: string };
  missing_steps?: Array<{ step: string; priority: string; why_it_matters: string; citations?: unknown[] }>;
  estimated_timeline?: string;
  action_plan?: Array<{ week: string; deliverables: string[]; owner: string; citations?: unknown[] }>;
  solutions?: Array<{ problem: string; solution: string; implementation_hint: string }>;
  citations?: Array<{ title: string; url: string; published_at?: string | null }>;
};

export default function RegintelPathPage() {
  const router = useRouter();
  const { publicKey, disconnect, isConnecting } = useFreighter();
  const [profile, setProfile] = useState<{ id: string; businessName?: string; jurisdictions?: string[] } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisOutput | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    fetch(`/api/regintel/profile/org/${encodeURIComponent(publicKey)}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setProfile(data || null);
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, [publicKey]);

  const runAnalysis = (force?: boolean) => {
    if (!profile?.id) return;
    setError(null);
    setAnalyzing(true);
    fetch("/api/regintel/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ profileId: profile.id, force: !!force }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((e) => { throw new Error(e.detail || e.error || "Analysis failed"); });
        return res.json();
      })
      .then((data) => setAnalysis(data.output || null))
      .catch((e) => setError(e.message || "Analysis failed"))
      .finally(() => setAnalyzing(false));
  };

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">Connect your wallet to view your Regulatory Path.</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader fixed>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Regulatory Path</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitch />
          <Button variant="ghost" size="sm" onClick={() => router.push("/regintel/setup")}>Setup</Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>Dashboard</Button>
          <Button variant="ghost" size="sm" onClick={disconnect} disabled={isConnecting}>Disconnect</Button>
        </div>
      </DashboardHeader>
      <DashboardMain>
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Scale className="h-8 w-8" />
              Regulatory Path
            </h1>
            <p className="text-muted-foreground mt-1">
              Web3 compliance roadmap: licenses, certifications, mandatory controls, and action plan.
            </p>
          </div>

          {profileLoading ? (
            <p className="text-muted-foreground">Loading profile…</p>
          ) : !profile ? (
            <Card>
              <CardHeader>
                <CardTitle>Set up your business profile</CardTitle>
                <CardDescription>
                  Create a profile so we can generate a compliance roadmap for your web3 business.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/regintel/setup")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Create profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>
                    {profile.businessName || "Your business"} · {Array.isArray(profile.jurisdictions) ? profile.jurisdictions.join(", ") : "—"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button onClick={() => runAnalysis(false)} disabled={analyzing}>
                    {analyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running analysis…</> : <><Play className="mr-2 h-4 w-4" /> Run analysis</>}
                  </Button>
                  <Button variant="outline" onClick={() => runAnalysis(true)} disabled={analyzing}>
                    Force refresh
                  </Button>
                  <Button variant="ghost" onClick={() => router.push("/regintel/setup")}>Edit profile</Button>
                </CardContent>
              </Card>

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {analysis && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Compliance completion</CardTitle>
                      <CardDescription>Estimated from required items and your profile.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={(analysis.compliance_completion ?? 0) * 100} className="h-3" />
                      <p className="mt-2 text-sm text-muted-foreground">{Math.round((analysis.compliance_completion ?? 0) * 100)}%</p>
                    </CardContent>
                  </Card>

                  {analysis.required_licenses && analysis.required_licenses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Required licenses</CardTitle>
                        <CardDescription>Jurisdiction-specific licenses for web3/VASP activity.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.required_licenses.map((l, i) => (
                            <li key={i} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                              <span className="font-medium">{l.name}</span> ({l.jurisdiction}) · {l.status}
                              {l.requires_legal_review && <span className="ml-2 text-amber-600">· Requires legal review</span>}
                              {l.citations?.length ? (
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {l.citations.slice(0, 2).map((c, j) => (
                                    <a key={j} href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                      <ExternalLink className="h-3 w-3" /> {c.title || c.url}
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.required_certifications && analysis.required_certifications.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Required certifications / policies</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.required_certifications.map((c, i) => (
                            <li key={i} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                              {c.name} · {c.status}
                              {c.requires_legal_review && <span className="ml-2 text-amber-600">· Requires legal review</span>}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.mandatory_controls && analysis.mandatory_controls.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Mandatory controls</CardTitle>
                        <CardDescription>KYC, KYT, Travel Rule, sanctions screening, etc.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.mandatory_controls.map((c, i) => (
                            <li key={i} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                              <span className="font-medium">{c.name}</span> · {c.status}
                              {c.notes && <p className="text-muted-foreground mt-1">{c.notes}</p>}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.registration_status && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Registration status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{analysis.registration_status.status}</p>
                        <p className="text-muted-foreground text-sm mt-1">{analysis.registration_status.notes}</p>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.missing_steps && analysis.missing_steps.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Missing steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.missing_steps.map((s, i) => (
                            <li key={i} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                              <span className="font-medium">{s.step}</span> [{s.priority}]
                              <p className="text-muted-foreground mt-1">{s.why_it_matters}</p>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.estimated_timeline && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Estimated timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{analysis.estimated_timeline}</p>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.action_plan && analysis.action_plan.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Action plan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {analysis.action_plan.map((a, i) => (
                            <li key={i} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                              <span className="font-medium">{a.week}</span> · Owner: {a.owner}
                              <ul className="list-disc list-inside mt-1 text-muted-foreground">
                                {a.deliverables.map((d, j) => (
                                  <li key={j}>{d}</li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.solutions && analysis.solutions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Solutions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.solutions.map((s, i) => (
                            <li key={i} className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                              <p><span className="font-medium">Problem:</span> {s.problem}</p>
                              <p className="mt-1"><span className="font-medium">Solution:</span> {s.solution}</p>
                              <p className="mt-1 text-muted-foreground">{s.implementation_hint}</p>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.citations && analysis.citations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Sources</CardTitle>
                        <CardDescription>Regulatory and source citations.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {analysis.citations.map((c, i) => (
                            <li key={i}>
                              <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> {c.title || c.url} {c.published_at ? `(${c.published_at})` : ""}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DashboardMain>
    </>
  );
}
