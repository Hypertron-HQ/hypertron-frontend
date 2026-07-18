"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Palette,
  CheckCheck,
  Sun,
  Moon,
  CreditCard,
  Loader2,
  Wallet,
} from "lucide-react";
import { useHubPageMeta } from "@/components/dashboard/workspace-hub/hub-page-meta-context";
import { HubSettingsContentSkeleton } from "@/components/dashboard/workspace-hub/hub-content-skeletons";
import { hubNavBreadcrumbs } from "@/lib/hub-nav-routes";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFreighter } from "@/hooks/useFreighter";
import { useAppSession } from "@/hooks/useAppSession";
import { AccountWalletSettings } from "@/components/dashboard/account-wallet-settings";
import { cn } from "@/utils";
import {
  getOnboardingData,
  setOnboardingCompleted,
  type OnboardingData,
} from "@/components/onboarding/onboarding-modal";
import type { DashboardTheme } from "@/lib/dashboard-theme";

type AccountSection = "profile" | "wallet" | "appearance";

const navItems: { id: AccountSection; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export default function AccountSettingsPage() {
  const { publicKey } = useFreighter();
  const { isPrivy } = useAppSession();
  const { theme, setTheme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const [section, setSection] = useState<AccountSection>("profile");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(!!publicKey);
  const [saving, setSaving] = useState(false);

  useHubPageMeta({
    breadcrumbs: hubNavBreadcrumbs("Settings"),
    title: "Settings",
    subtitle: "Manage your Hypertron account and preferences.",
  });

  useEffect(() => {
    if (isPrivy || (publicKey?.trim().length === 56 && publicKey.startsWith("G"))) {
      setLoading(true);
      fetch("/api/business/profile", { credentials: "same-origin" })
        .then((res) => (res.ok ? res.json() : null))
        .then((profile) => {
          if (profile) {
            setUsername(profile.name ?? "");
            setEmail(profile.email ?? "");
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    setLoading(false);
    const stored = getOnboardingData();
    if (stored) {
      setUsername(stored.name ?? "");
      setEmail(stored.email ?? "");
    }
  }, [publicKey, isPrivy]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const data: OnboardingData = {
      name: username.trim(),
      email: email.trim(),
      businessNature: "",
      selectedWidgets: [],
    };

    try {
      if (isPrivy || (publicKey?.trim().length === 56 && publicKey.startsWith("G"))) {
        const res = await fetch("/api/business/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ name: data.name, email: data.email }),
        });
        if (!res.ok) return;
      } else {
        setOnboardingCompleted(data);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("profile-updated"));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = cn(
    "h-10 rounded-lg border shadow-none",
    t.dark
      ? "border-white/10 bg-white/5 text-slate-100 placeholder:text-slate-500 focus:border-blue-500/40 focus:ring-blue-500/20"
      : "border-ui-border/80 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500/40 focus:ring-blue-500/20"
  );

  if (loading) {
    return <HubSettingsContentSkeleton />;
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 lg:flex-row lg:gap-8">
      <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-44 lg:flex-col">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
              section === id ? t.sidebarNavActive : t.sidebarNav
            )}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </nav>

      <div className="min-w-0 flex-1">
        {section === "profile" ? (
          <Card className={cn("rounded-2xl border shadow-none", t.card)}>
            <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
              <div>
                <p className={cn("text-sm font-semibold", t.cardTitle)}>Profile</p>
                <p className={cn("mt-0.5 text-xs", t.cardMeta)}>
                  Your personal account details across all workspaces.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="account-name" className={cn("text-xs", t.cardMeta)}>
                    Display name
                  </Label>
                  <Input
                    id="account-name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="account-email" className={cn("text-xs", t.cardMeta)}>
                    Email
                  </Label>
                  <Input
                    id="account-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  onClick={handleSaveProfile}
                  disabled={loading || saving}
                  className={cn(
                    "h-10 rounded-xl px-5 text-sm font-semibold shadow-none",
                    saved
                      ? "bg-emerald-600 text-white hover:bg-emerald-600"
                      : "hub-cta bg-blue-600 text-white hover:bg-blue-500"
                  )}
                >
                  {saved ? (
                    <>
                      <CheckCheck className="mr-1.5 h-4 w-4" /> Saved
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    "Save profile"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  asChild
                  className={cn("h-10 rounded-xl text-sm font-medium shadow-none", t.outlineBtn)}
                >
                  <Link href="/dashboard/billing">
                    <CreditCard className="mr-1.5 h-4 w-4" />
                    Billing & Plans
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {section === "wallet" ? <AccountWalletSettings theme={theme} /> : null}

        {section === "appearance" ? (
          <Card className={cn("rounded-2xl border shadow-none", t.card)}>
            <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
              <div>
                <p className={cn("text-sm font-semibold", t.cardTitle)}>Appearance</p>
                <p className={cn("mt-0.5 text-xs", t.cardMeta)}>
                  Choose how Hypertron looks across the hub and your workspaces.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    {
                      id: "dark" as DashboardTheme,
                      label: "Dark",
                      description: "True black with blue and amber ambience.",
                      icon: Moon,
                      preview: "bg-black",
                    },
                    {
                      id: "light" as DashboardTheme,
                      label: "Light",
                      description: "Lavender, sky blue, and warm amber mesh gradient.",
                      icon: Sun,
                      preview:
                        "bg-[radial-gradient(circle_at_0%_0%,#b197fc_0%,transparent_50%),radial-gradient(circle_at_100%_0%,#ffb347_0%,transparent_50%),radial-gradient(circle_at_0%_100%,#74a0ff_0%,transparent_50%),radial-gradient(circle_at_100%_100%,#f5c6d0_0%,transparent_50%),#f5f0ff]",
                    },
                  ] as const
                ).map(({ id, label, description, icon: Icon, preview }) => {
                  const selected = theme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTheme(id)}
                      className={cn(
                        "flex flex-col gap-3 rounded-xl border p-4 text-left transition-all",
                        selected
                          ? t.dark
                            ? "border-blue-500/50 bg-blue-500/10 ring-1 ring-blue-500/30"
                            : "border-blue-400/70 bg-blue-50/50 ring-1 ring-blue-200/80"
                          : cn(t.card, "hover:border-blue-300/60")
                      )}
                    >
                      <div
                        className={cn(
                          "h-16 w-full rounded-lg border shadow-inner",
                          t.dark ? "border-white/10" : "border-slate-200",
                          preview
                        )}
                      />
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "rounded-lg p-2",
                            t.dark ? "bg-white/10" : "bg-neutral-100"
                          )}
                        >
                          <Icon className={cn("h-4 w-4", t.cardMeta)} />
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-sm font-semibold", t.cardTitle)}>{label}</p>
                          <p className={cn("mt-0.5 text-[11px] leading-relaxed", t.cardMeta)}>
                            {description}
                          </p>
                        </div>
                        {selected ? (
                          <CheckCheck className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
