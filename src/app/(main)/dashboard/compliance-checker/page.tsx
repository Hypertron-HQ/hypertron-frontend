"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, Save, FileCheck } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/layout/header";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFreighter } from "@/hooks/useFreighter";
import { cn } from "@/utils";

type ChecklistItem = { id: string; text: string; done?: boolean };

export type ComplianceFormState = {
  businessName: string;
  email: string;
  basedOutOf: string;
  businessType: string;
  businessTypeCustom: string;
  geographies: string;
  products: string;
  monthlyTransactions: string;
  avgTransactionValueUsd: string;
  opsHourlyRateUsd: string;
  complianceHourlyRateUsd: string;
  platformCostUsdMonth: string;
  constraints: string;
};

const BUSINESS_TYPES = [
  "Stablecoin issuer",
  "NGO",
  "RWA platform",
  "Treasuries",
  "Agency",
  "Fintech",
  "Other",
] as const;

const emptyForm: ComplianceFormState = {
  businessName: "",
  email: "",
  basedOutOf: "",
  businessType: "",
  businessTypeCustom: "",
  geographies: "",
  products: "",
  monthlyTransactions: "",
  avgTransactionValueUsd: "",
  opsHourlyRateUsd: "65",
  complianceHourlyRateUsd: "85",
  platformCostUsdMonth: "",
  constraints: "",
};

function formToPayload(form: ComplianceFormState): Record<string, string> {
  const type = form.businessType === "Other" ? form.businessTypeCustom : form.businessType;
  return {
    businessName: form.businessName,
    email: form.email,
    basedOutOf: form.basedOutOf,
    businessType: type,
    geographies: form.geographies,
    products: form.products,
    monthlyTransactions: form.monthlyTransactions,
    avgTransactionValueUsd: form.avgTransactionValueUsd,
    opsHourlyRateUsd: form.opsHourlyRateUsd,
    complianceHourlyRateUsd: form.complianceHourlyRateUsd,
    platformCostUsdMonth: form.platformCostUsdMonth,
    constraints: form.constraints,
  };
}

function payloadToForm(p: Record<string, unknown> | null): ComplianceFormState {
  if (!p || typeof p !== "object") return { ...emptyForm };
  const get = (k: string) => (typeof (p as Record<string, unknown>)[k] === "string" ? (p as Record<string, string>)[k] : "");
  const rawType = get("businessType") || emptyForm.businessType;
  const isPreset = (BUSINESS_TYPES as readonly string[]).includes(rawType);
  return {
    businessName: get("businessName") || emptyForm.businessName,
    email: get("email") || emptyForm.email,
    basedOutOf: get("basedOutOf") || emptyForm.basedOutOf,
    businessType: isPreset ? rawType : "Other",
    businessTypeCustom: isPreset ? "" : rawType,
    geographies: get("geographies") || emptyForm.geographies,
    products: get("products") || emptyForm.products,
    monthlyTransactions: get("monthlyTransactions") || emptyForm.monthlyTransactions,
    avgTransactionValueUsd: get("avgTransactionValueUsd") || emptyForm.avgTransactionValueUsd,
    opsHourlyRateUsd: get("opsHourlyRateUsd") || emptyForm.opsHourlyRateUsd,
    complianceHourlyRateUsd: get("complianceHourlyRateUsd") || emptyForm.complianceHourlyRateUsd,
    platformCostUsdMonth: get("platformCostUsdMonth") || emptyForm.platformCostUsdMonth,
    constraints: get("constraints") || emptyForm.constraints,
  };
}

export default function ComplianceCheckerPage() {
  const router = useRouter();
  const { publicKey, disconnect, isConnecting } = useFreighter();
  const [form, setForm] = useState<ComplianceFormState>(emptyForm);
  const [profileLoading, setProfileLoading] = useState(true);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith("G")) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    fetch("/api/business/profile", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const fromApi = payloadToForm({
            ...(data.complianceForm ?? {}),
            businessName: data.name ?? "",
            email: data.email ?? "",
          });
          setForm(fromApi);
        }
      })
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, [publicKey]);

  const update = (updates: Partial<ComplianceFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setSaveProfileSuccess(false);
  };

  const handleSaveProfile = () => {
    if (!publicKey) return;
    setError(null);
    setSaving(true);
    const payload = formToPayload(form);
    fetch("/api/business/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        name: form.businessName || null,
        email: form.email || null,
        businessNature: form.businessType || form.businessTypeCustom || null,
        complianceForm: payload,
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((e) => { throw new Error(e.error || "Failed to save"); });
        return res.json();
      })
      .then(() => setSaveProfileSuccess(true))
      .catch((e) => setError(e.message || "Failed to save profile"))
      .finally(() => setSaving(false));
  };

  const handleGenerate = () => {
    if (!publicKey) return;
    setError(null);
    setGenerating(true);
    const payload = formToPayload(form);
    fetch("/api/compliance/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((e) => { throw new Error(e.error || "Failed to generate"); });
        return res.json();
      })
      .then((data) => setItems((data.items ?? []).map((i: { id: string; text: string }) => ({ ...i, done: false }))))
      .catch((e) => setError(e.message || "Failed to generate checklist"))
      .finally(() => setGenerating(false));
  };

  const handleSave = () => {
    if (!publicKey || items.length === 0) return;
    setError(null);
    setSaving(true);
    fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        title: "Regulatory & compliance checklist",
        items: items.map((i) => ({ id: i.id, text: i.text, done: i.done ?? false })),
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((e) => { throw new Error(e.error || "Failed to save"); });
        return res.json();
      })
      .then(() => router.push("/dashboard/document-vault"))
      .catch((e) => setError(e.message || "Failed to save to Document vault"))
      .finally(() => setSaving(false));
  };

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">Connect your wallet to use the Compliance checker.</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader fixed>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Compliance checker</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitch />
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
          <Button variant="ghost" size="sm" onClick={disconnect} disabled={isConnecting}>
            Disconnect
          </Button>
        </div>
      </DashboardHeader>
      <DashboardMain>
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-8 w-8" />
              Compliance checker
            </h1>
            <p className="text-muted-foreground mt-1">
              Fill in your business details below. We use this to tailor the regulatory and compliance checklist. Then generate your checklist via OpenAI.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Business profile</CardTitle>
              <CardDescription>
                Editable form. Save to keep your details; then generate the regulatory & compliance checklist.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileLoading ? (
                <p className="text-muted-foreground text-sm">Loading profile…</p>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business name</Label>
                      <Input
                        id="businessName"
                        value={form.businessName}
                        onChange={(e) => update({ businessName: e.target.value })}
                        placeholder="e.g. Acme Inc"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => update({ email: e.target.value })}
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="basedOutOf">Based out of (HQ / jurisdiction)</Label>
                    <Input
                      id="basedOutOf"
                      value={form.basedOutOf}
                      onChange={(e) => update({ basedOutOf: e.target.value })}
                      placeholder="e.g. Delaware, US or London, UK"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type of business / sector</Label>
                    <div className="flex flex-wrap gap-2">
                      {BUSINESS_TYPES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => update({ businessType: t })}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                            form.businessType === t
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {form.businessType === "Other" && (
                      <Input
                        className="mt-2"
                        value={form.businessTypeCustom}
                        onChange={(e) => update({ businessTypeCustom: e.target.value })}
                        placeholder="Specify custom type"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="geographies">Geographical location(s)</Label>
                    <Input
                      id="geographies"
                      value={form.geographies}
                      onChange={(e) => update({ geographies: e.target.value })}
                      placeholder="e.g. US, IN, PH (comma-separated country codes or regions)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="products">Products / services (comma-separated)</Label>
                    <Input
                      id="products"
                      value={form.products}
                      onChange={(e) => update({ products: e.target.value })}
                      placeholder="e.g. cross-border payments, custody"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyTransactions">Monthly transactions (volume)</Label>
                      <Input
                        id="monthlyTransactions"
                        value={form.monthlyTransactions}
                        onChange={(e) => update({ monthlyTransactions: e.target.value })}
                        placeholder="e.g. 120000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avgTransactionValueUsd">Avg transaction value (USD)</Label>
                      <Input
                        id="avgTransactionValueUsd"
                        value={form.avgTransactionValueUsd}
                        onChange={(e) => update({ avgTransactionValueUsd: e.target.value })}
                        placeholder="e.g. 120"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="opsHourlyRateUsd">Ops hourly rate (USD)</Label>
                      <Input
                        id="opsHourlyRateUsd"
                        value={form.opsHourlyRateUsd}
                        onChange={(e) => update({ opsHourlyRateUsd: e.target.value })}
                        placeholder="e.g. 65"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complianceHourlyRateUsd">Compliance hourly rate (USD)</Label>
                      <Input
                        id="complianceHourlyRateUsd"
                        value={form.complianceHourlyRateUsd}
                        onChange={(e) => update({ complianceHourlyRateUsd: e.target.value })}
                        placeholder="e.g. 85"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="platformCostUsdMonth">Platform cost (USD/month)</Label>
                    <Input
                      id="platformCostUsdMonth"
                      value={form.platformCostUsdMonth}
                      onChange={(e) => update({ platformCostUsdMonth: e.target.value })}
                      placeholder="e.g. 2500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="constraints">Constraints / requirements</Label>
                    <Input
                      id="constraints"
                      value={form.constraints}
                      onChange={(e) => update({ constraints: e.target.value })}
                      placeholder="e.g. OFAC screening required, budget limit 10k"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleSaveProfile} disabled={saving} variant="outline">
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save profile
                        </>
                      )}
                    </Button>
                    {saveProfileSuccess && (
                      <span className="text-sm text-muted-foreground self-center">Profile saved.</span>
                    )}
                    <Button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="mt-0"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating checklist…
                        </>
                      ) : (
                        <>
                          <FileCheck className="mr-2 h-4 w-4" />
                          Generate regulatory & compliance checklist
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated checklist</CardTitle>
                <CardDescription>
                  Review the items below. You can tick completed items, then save this list to your Document vault.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
                    >
                      <Checkbox
                        id={item.id}
                        checked={item.done ?? false}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={item.id}
                        className={cn(
                          "text-sm flex-1 cursor-pointer",
                          item.done && "text-muted-foreground line-through"
                        )}
                      >
                        {item.text}
                      </label>
                    </li>
                  ))}
                </ul>
                <Button onClick={handleSave} disabled={saving} className="mt-2">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save to Document vault
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardMain>
    </>
  );
}
