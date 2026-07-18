"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale, Loader2, ArrowRight } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/layout/header";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const BUSINESS_MODELS = [
  { value: "exchange", label: "Exchange" },
  { value: "custody", label: "Custody" },
  { value: "payments", label: "Payments" },
  { value: "defi", label: "DeFi" },
  { value: "nft", label: "NFT" },
  { value: "other", label: "Other" },
];

export default function RegintelSetupPage() {
  const router = useRouter();
  const { publicKey, disconnect, isConnecting } = useFreighter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    businessName: "",
    jurisdictions: "" as string,
    businessModel: "payments" as string,
    custodyFunds: false,
    fiatOnOffRamp: false,
    retailUsers: false,
    usesStablecoin: false,
    stellarWallets: "" as string,
    evmWallets: "" as string,
  });

  useEffect(() => {
    if (!publicKey) {
      setLoading(false);
      return;
    }
    fetch(`/api/regintel/profile/org/${encodeURIComponent(publicKey)}`, {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setForm({
            businessName: data.businessName || "",
            jurisdictions: Array.isArray(data.jurisdictions) ? data.jurisdictions.join(", ") : "",
            businessModel: data.businessModel || "payments",
            custodyFunds: data.custodyFunds ?? false,
            fiatOnOffRamp: data.fiatOnOffRamp ?? false,
            retailUsers: data.retailUsers ?? false,
            usesStablecoin: data.usesStablecoin ?? false,
            stellarWallets: (data.wallets?.stellar || []).join(", "),
            evmWallets: (data.wallets?.evm || []).join(", "),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [publicKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;
    setError(null);
    setSaving(true);
    const jurisdictions = form.jurisdictions
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!jurisdictions.length) jurisdictions.push("US");

    fetch("/api/regintel/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        orgId: publicKey,
        businessName: form.businessName || undefined,
        jurisdictions,
        businessModel: form.businessModel,
        custodyFunds: form.custodyFunds,
        fiatOnOffRamp: form.fiatOnOffRamp,
        retailUsers: form.retailUsers,
        usesStablecoin: form.usesStablecoin,
        wallets: {
          stellar: form.stellarWallets.split(/[,;\s]/).map((s) => s.trim()).filter(Boolean),
          evm: form.evmWallets.split(/[,;\s]/).map((s) => s.trim()).filter(Boolean),
        },
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((e) => { throw new Error(e.detail || e.error || "Failed to save"); });
        return res.json();
      })
      .then(() => router.push("/regintel/path"))
      .catch((e) => setError(e.message || "Failed to save"))
      .finally(() => setSaving(false));
  };

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">Connect your wallet to set up your Regulatory Path profile.</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader fixed>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Regulatory Path – Setup</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitch />
          <Button variant="ghost" size="sm" onClick={() => router.push("/regintel/path")}>Path</Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>Dashboard</Button>
          <Button variant="ghost" size="sm" onClick={disconnect} disabled={isConnecting}>Disconnect</Button>
        </div>
      </DashboardHeader>
      <DashboardMain>
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Scale className="h-8 w-8" />
              Regulatory Path – Business Profile
            </h1>
            <p className="text-muted-foreground mt-1">
              Set your business profile and wallets so we can generate a web3 compliance roadmap.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Business profile</CardTitle>
              <CardDescription>
                Used to retrieve relevant regulatory sources and generate your compliance roadmap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business name</Label>
                    <Input
                      id="businessName"
                      value={form.businessName}
                      onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                      placeholder="Acme Crypto Inc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jurisdictions">Jurisdictions (comma-separated, e.g. US, EU, SG)</Label>
                    <Input
                      id="jurisdictions"
                      value={form.jurisdictions}
                      onChange={(e) => setForm((f) => ({ ...f, jurisdictions: e.target.value }))}
                      placeholder="US, EU"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Business model</Label>
                    <Select
                      value={form.businessModel}
                      onValueChange={(v) => setForm((f) => ({ ...f, businessModel: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_MODELS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="custodyFunds"
                        checked={form.custodyFunds}
                        onCheckedChange={(c) => setForm((f) => ({ ...f, custodyFunds: !!c }))}
                      />
                      <Label htmlFor="custodyFunds" className="font-normal">Custody of funds</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fiatOnOffRamp"
                        checked={form.fiatOnOffRamp}
                        onCheckedChange={(c) => setForm((f) => ({ ...f, fiatOnOffRamp: !!c }))}
                      />
                      <Label htmlFor="fiatOnOffRamp" className="font-normal">Fiat on/off ramp</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="retailUsers"
                        checked={form.retailUsers}
                        onCheckedChange={(c) => setForm((f) => ({ ...f, retailUsers: !!c }))}
                      />
                      <Label htmlFor="retailUsers" className="font-normal">Retail users</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="usesStablecoin"
                        checked={form.usesStablecoin}
                        onCheckedChange={(c) => setForm((f) => ({ ...f, usesStablecoin: !!c }))}
                      />
                      <Label htmlFor="usesStablecoin" className="font-normal">Uses stablecoin</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stellarWallets">Stellar wallet addresses (optional, comma-separated)</Label>
                    <Input
                      id="stellarWallets"
                      value={form.stellarWallets}
                      onChange={(e) => setForm((f) => ({ ...f, stellarWallets: e.target.value }))}
                      placeholder="G..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evmWallets">EVM wallet addresses (optional, comma-separated)</Label>
                    <Input
                      id="evmWallets"
                      value={form.evmWallets}
                      onChange={(e) => setForm((f) => ({ ...f, evmWallets: e.target.value }))}
                      placeholder="0x..."
                    />
                  </div>
                  {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : <>Save & go to Regulatory Path</>}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.push("/regintel/path")}>
                      View Path
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardMain>
    </>
  );
}
