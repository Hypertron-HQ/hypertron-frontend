"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Vault,
  Shield,
  ShieldCheck,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { cn } from "@/utils";

interface VaultSetupProps {
  businessId: string;
  userWalletAddress: string | null;
  onVaultCreated?: () => void;
}

type VaultType = "custodial" | "hybrid" | "external";

interface VaultInfo {
  hasVault: boolean;
  vaultAddress: string | null;
  vaultType: VaultType | null;
  vaultName: string | null;
  vaultCoSigner: string | null;
  balance: {
    xlm: string;
    usdc: string;
    xlmRaw: number;
    usdcRaw: number;
  } | null;
  network: string;
}

export function VaultSetup({ businessId, userWalletAddress, onVaultCreated }: VaultSetupProps) {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);

  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<VaultType>("hybrid");
  const [externalAddress, setExternalAddress] = useState("");
  const [copied, setCopied] = useState(false);

  const panelCls = cn("w-full overflow-hidden rounded-2xl border", t.card);
  const optionCls = (active: boolean) =>
    cn(
      "relative flex h-full cursor-pointer flex-col rounded-xl border p-5 transition-all",
      active
        ? t.dark
          ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]"
          : "border-blue-400 bg-blue-50/80 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]"
        : t.dark
          ? "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
          : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
    );
  const codeCls = cn(
    "flex-1 truncate rounded-lg border px-3 py-2 font-mono text-xs",
    t.dark ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-white text-slate-700"
  );
  const inputCls = cn(
    "mt-1.5 h-9 w-full rounded-lg border px-3 font-mono text-xs focus:outline-none",
    t.dark
      ? "border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-white/25"
      : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-400"
  );

  const fetchVaultInfo = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/vault/treasury?businessId=${businessId}`, {
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = await res.json();
        setVaultInfo(data);
      }
    } catch (e) {
      console.error("Failed to fetch vault info:", e);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchVaultInfo();
  }, [fetchVaultInfo]);

  async function handleCreateVault() {
    setError(null);
    setSuccess(null);
    setCreating(true);

    try {
      const body: Record<string, string> = {
        businessId,
        vaultType: selectedType,
      };

      if (selectedType === "hybrid") {
        if (!userWalletAddress) {
          setError("Connect your wallet to create a hybrid vault");
          return;
        }
        body.coSignerAddress = userWalletAddress;
      }

      if (selectedType === "external") {
        if (!externalAddress.trim() || !externalAddress.startsWith("G")) {
          setError("Enter a valid Stellar address (G...)");
          return;
        }
        body.externalAddress = externalAddress.trim();
      }

      const res = await fetch("/api/vault/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create vault");
        return;
      }

      setSuccess(data.message || "Vault created successfully");
      await fetchVaultInfo();
      onVaultCreated?.();
    } catch {
      setError("Failed to create vault");
    } finally {
      setCreating(false);
    }
  }

  function copyAddress() {
    if (vaultInfo?.vaultAddress) {
      navigator.clipboard.writeText(vaultInfo.vaultAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={cn("h-6 w-6 animate-spin", t.cardMuted)} />
      </div>
    );
  }

  if (vaultInfo?.hasVault) {
    return (
      <div className={panelCls}>
        <div
          className={cn(
            "border-b px-6 py-5 lg:px-8",
            t.dark
              ? "border-white/10 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40"
              : "border-slate-100 bg-gradient-to-r from-emerald-50/80 via-white to-sky-50/50"
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                  t.dark ? "border-emerald-500/20 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50"
                )}
              >
                <Vault className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className={cn("text-base font-semibold", t.pageHeading)}>
                  {vaultInfo.vaultName || "Treasury Vault"}
                </p>
                <p className={cn("mt-0.5 text-sm capitalize", t.pageSubheading)}>
                  {vaultInfo.vaultType} mode
                  {vaultInfo.vaultType === "hybrid" && " · Requires your signature for withdrawals"}
                  {vaultInfo.vaultType === "external" && " · Your own wallet"}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                t.dark
                  ? "border-emerald-500/20 bg-emerald-500/12 text-emerald-400"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Active
            </span>
          </div>
        </div>

        <div className="space-y-5 p-6 lg:p-8">
          <div>
            <p className={cn("mb-2 text-xs font-medium uppercase tracking-wide", t.pageSubheading)}>
              Vault Address
            </p>
            <div className="flex items-center gap-2">
              <code className={codeCls}>{vaultInfo.vaultAddress}</code>
              <Button variant="ghost" size="sm" onClick={copyAddress} className="h-9 w-9 shrink-0 p-0">
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className={cn("h-4 w-4", t.cardMuted)} />
                )}
              </Button>
              <a
                href={`https://stellar.expert/explorer/${vaultInfo.network}/account/${vaultInfo.vaultAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <ExternalLink className={cn("h-4 w-4", t.cardMuted)} />
                </Button>
              </a>
            </div>
          </div>

          {vaultInfo.balance && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                className={cn(
                  "rounded-xl border p-5",
                  t.dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                )}
              >
                <p className={cn("text-xs font-medium", t.pageSubheading)}>USDC Balance</p>
                <p className={cn("mt-1 text-2xl font-bold tracking-tight", t.pageHeading)}>
                  {vaultInfo.balance.usdc}
                  <span className={cn("ml-1.5 text-sm font-medium", t.pageSubheading)}>USDC</span>
                </p>
              </div>
              <div
                className={cn(
                  "rounded-xl border p-5",
                  t.dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
                )}
              >
                <p className={cn("text-xs font-medium", t.pageSubheading)}>XLM Balance</p>
                <p className={cn("mt-1 text-2xl font-bold tracking-tight", t.pageHeading)}>
                  {vaultInfo.balance.xlm}
                  <span className={cn("ml-1.5 text-sm font-medium", t.pageSubheading)}>XLM</span>
                </p>
              </div>
            </div>
          )}

          {vaultInfo.vaultType === "hybrid" && vaultInfo.vaultCoSigner && (
            <div>
              <p className={cn("mb-2 text-xs font-medium uppercase tracking-wide", t.pageSubheading)}>
                Your Co-Signer Wallet
              </p>
              <code className={cn(codeCls, "block")}>{vaultInfo.vaultCoSigner}</code>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={panelCls}>
      <div
        className={cn(
          "border-b px-6 py-6 lg:px-8 lg:py-7",
          t.dark
            ? "border-white/10 bg-gradient-to-r from-blue-950/50 via-slate-900/70 to-cyan-950/30"
            : "border-slate-100 bg-gradient-to-r from-blue-50/90 via-white to-cyan-50/60"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-sm",
                t.dark ? "border-cyan-500/20 bg-cyan-500/10" : "border-blue-200 bg-white"
              )}
            >
              <Vault className="h-6 w-6 text-cyan-500" />
            </div>
            <div className="max-w-2xl">
              <h2 className={cn("text-lg font-semibold tracking-tight", t.pageHeading)}>
                Create Treasury Vault
              </h2>
              <p className={cn("mt-1 text-sm leading-relaxed", t.pageSubheading)}>
                Set up a dedicated Stellar account to receive payments directly and enable withdrawals
                from your workspace.
              </p>
            </div>
          </div>
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium sm:inline-flex",
              t.dark
                ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
                : "border-amber-200 bg-amber-50 text-amber-800"
            )}
          >
            Required to unlock treasury
          </span>
        </div>
      </div>

      <div className="space-y-6 p-6 lg:p-8">
        <div>
          <p className={cn("mb-4 text-sm font-medium", t.pageHeading)}>Choose vault type</p>
          <RadioGroup
            value={selectedType}
            onValueChange={(v) => setSelectedType(v as VaultType)}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            <label htmlFor="vault-hybrid" className={optionCls(selectedType === "hybrid")}>
              <RadioGroupItem
                value="hybrid"
                id="vault-hybrid"
                className="absolute right-4 top-4"
              />
              <div
                className={cn(
                  "mb-4 flex h-10 w-10 items-center justify-center rounded-lg border",
                  t.dark ? "border-emerald-500/20 bg-emerald-500/10" : "border-emerald-200 bg-emerald-50"
                )}
              >
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("text-sm font-semibold", t.pageHeading)}>Hybrid (Multisig)</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    t.dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                  )}
                >
                  Recommended
                </span>
              </div>
              <p className={cn("mt-2 flex-1 text-xs leading-relaxed", t.pageSubheading)}>
                Both you and Hypertron must sign withdrawals. Best security balance for teams.
              </p>
              {selectedType === "hybrid" && !userWalletAddress && (
                <p className="mt-3 text-xs font-medium text-amber-500">
                  Connect your wallet first to use hybrid mode.
                </p>
              )}
            </label>

            <label htmlFor="vault-custodial" className={optionCls(selectedType === "custodial")}>
              <RadioGroupItem
                value="custodial"
                id="vault-custodial"
                className="absolute right-4 top-4"
              />
              <div
                className={cn(
                  "mb-4 flex h-10 w-10 items-center justify-center rounded-lg border",
                  t.dark ? "border-cyan-500/20 bg-cyan-500/10" : "border-cyan-200 bg-cyan-50"
                )}
              >
                <Shield className="h-5 w-5 text-cyan-500" />
              </div>
              <span className={cn("text-sm font-semibold", t.pageHeading)}>Custodial</span>
              <p className={cn("mt-2 flex-1 text-xs leading-relaxed", t.pageSubheading)}>
                Hypertron manages your vault. One-click withdrawals with server-held keys.
              </p>
            </label>

            <label htmlFor="vault-external" className={optionCls(selectedType === "external")}>
              <RadioGroupItem
                value="external"
                id="vault-external"
                className="absolute right-4 top-4"
              />
              <div
                className={cn(
                  "mb-4 flex h-10 w-10 items-center justify-center rounded-lg border",
                  t.dark ? "border-violet-500/20 bg-violet-500/10" : "border-violet-200 bg-violet-50"
                )}
              >
                <Wallet className="h-5 w-5 text-violet-500" />
              </div>
              <span className={cn("text-sm font-semibold", t.pageHeading)}>External Wallet</span>
              <p className={cn("mt-2 flex-1 text-xs leading-relaxed", t.pageSubheading)}>
                Use your own wallet address. Payments go directly to you — no vault account needed.
              </p>
            </label>
          </RadioGroup>
        </div>

        {selectedType === "external" && (
          <div
            className={cn(
              "rounded-xl border p-4",
              t.dark ? "border-white/10 bg-white/[0.03]" : "border-slate-200 bg-slate-50/60"
            )}
          >
            <Label htmlFor="external-address" className={cn("text-xs font-medium", t.pageSubheading)}>
              Your Stellar Address
            </Label>
            <input
              id="external-address"
              type="text"
              placeholder="G..."
              value={externalAddress}
              onChange={(e) => setExternalAddress(e.target.value)}
              className={inputCls}
            />
          </div>
        )}

        {error && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-3",
              t.dark ? "border-red-500/20 bg-red-500/10" : "border-red-200 bg-red-50"
            )}
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-3",
              t.dark ? "border-emerald-500/20 bg-emerald-500/[0.06]" : "border-emerald-200 bg-emerald-50"
            )}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <p className="text-sm text-emerald-600">{success}</p>
          </div>
        )}

        <div
          className={cn(
            "flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between",
            t.dark ? "border-white/10" : "border-slate-100"
          )}
        >
          <p className={cn("text-xs leading-relaxed sm:max-w-md", t.pageSubheading)}>
            Your vault is created on Stellar testnet. You can receive USDC and XLM once set up.
          </p>
          <Button
            onClick={handleCreateVault}
            disabled={creating || (selectedType === "hybrid" && !userWalletAddress)}
            className={cn(
              "h-11 shrink-0 rounded-xl px-8 font-semibold shadow-sm",
              t.dark
                ? "bg-blue-600 text-white hover:bg-blue-500 disabled:bg-white/10 disabled:text-slate-500"
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400"
            )}
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Vault...
              </>
            ) : (
              "Create Vault"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
