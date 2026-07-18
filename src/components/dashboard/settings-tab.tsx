"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/utils";
import {
  getOnboardingData,
  setOnboardingCompleted,
  BUSINESS_NATURES,
  WIDGETS,
  type OnboardingData,
} from "@/components/onboarding/onboarding-modal";

const defaultData: OnboardingData = {
  name: "",
  email: "",
  businessNature: "",
  selectedWidgets: [],
};

type SettingsTabProps = {
  /** When set, profile is loaded/saved from DB (keyed by wallet). Otherwise localStorage. */
  walletAddress?: string | null;
};

export function SettingsTab({ walletAddress }: SettingsTabProps) {
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(!!walletAddress);

  useEffect(() => {
    if (walletAddress?.trim().length === 56 && walletAddress.startsWith("G")) {
      setLoading(true);
      fetch("/api/business/profile", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : null))
        .then((profile) => {
          if (profile) {
            setData({
              name: profile.name ?? "",
              email: profile.email ?? "",
              businessNature: profile.businessNature ?? "",
              selectedWidgets: Array.isArray(profile.selectedWidgets) ? profile.selectedWidgets : [],
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    const stored = getOnboardingData();
    if (stored) {
      setData({
        name: stored.name ?? "",
        email: stored.email ?? "",
        businessNature: stored.businessNature ?? "",
        selectedWidgets: Array.isArray(stored.selectedWidgets) ? stored.selectedWidgets : [],
      });
    }
  }, [walletAddress]);

  const handleSave = () => {
    if (walletAddress?.trim().length === 56 && walletAddress.startsWith("G")) {
      setSaved(false);
      fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          businessNature: data.businessNature || null,
          selectedWidgets: data.selectedWidgets,
        }),
      })
        .then((res) => {
          if (res.ok) {
            setOnboardingCompleted(data);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }
        })
        .catch(() => {});
      return;
    }
    setOnboardingCompleted(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleWidget = (id: string) => {
    setData((prev) => ({
      ...prev,
      selectedWidgets: prev.selectedWidgets.includes(id)
        ? prev.selectedWidgets.filter((w) => w !== id)
        : [...prev.selectedWidgets, id],
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Profile & preferences</h2>
        <p className="text-sm text-muted-foreground">
          {walletAddress
            ? "Update the details you set during onboarding. Changes are saved to your account (keyed by your wallet)."
            : "Update the details you set during onboarding. Changes are saved to this device."}
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      )}

      <Card className="rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-base">About you</CardTitle>
          <CardDescription>Name and email we use to personalize your experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Name</Label>
            <Input
              id="settings-name"
              placeholder="Your name"
              value={data.name}
              onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              type="email"
              placeholder="you@company.com"
              value={data.email}
              onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-base">Nature of your business</CardTitle>
          <CardDescription>This helps us suggest the right tools.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {BUSINESS_NATURES.map(({ value, label }) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50",
                  data.businessNature === value && "border-primary bg-primary/5"
                )}
              >
                <input
                  type="radio"
                  name="settings-businessNature"
                  value={value}
                  checked={data.businessNature === value}
                  onChange={() => setData((p) => ({ ...p, businessNature: value }))}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-base">Suggestions (widgets)</CardTitle>
          <CardDescription>Select the features you want to use. You can change these anytime.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {WIDGETS.map((w) => {
              const Icon = w.icon;
              const checked = data.selectedWidgets.includes(w.id);
              return (
                <label
                  key={w.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                    checked && "border-primary bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleWidget(w.id)}
                  />
                  <div className="flex flex-1 items-start gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{w.label}</p>
                      <p className="text-xs text-muted-foreground">{w.description}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={loading || !data.name.trim() || !data.email.trim()}>
          {saved ? "Saved" : "Save changes"}
        </Button>
        {saved && (
          <span className="text-sm text-muted-foreground">
            {walletAddress ? "Preferences saved to your account." : "Preferences saved to this device."}
          </span>
        )}
      </div>
    </div>
  );
}
