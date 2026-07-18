"use client";

import { useState } from "react";
import { CheckCheck, Copy, KeyRound, Loader2, Wallet } from "lucide-react";
import { useExportWallet } from "@privy-io/react-auth/extended-chains";
import { useAppSession } from "@/hooks/useAppSession";
import { usePrivyStellarWallet } from "@/hooks/usePrivyStellarWallet";
import { useFreighter } from "@/hooks/useFreighter";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils";
import type { DashboardTheme } from "@/lib/dashboard-theme";
import { PrivyFreighterImportHelper } from "@/components/dashboard/privy-freighter-import-helper";

type Props = {
  theme: DashboardTheme;
};

export function AccountWalletSettings({ theme }: Props) {
  const t = hubThemeClasses(theme);
  const { isPrivy } = useAppSession();
  const privyWallet = usePrivyStellarWallet({ enabled: isPrivy });
  const freighter = useFreighter();
  const { exportWallet } = useExportWallet();

  const isPrivyWallet = isPrivy;
  const publicKey = isPrivy ? privyWallet.address : freighter.publicKey;
  const connect = isPrivy ? privyWallet.createWallet : freighter.connect;
  const isConnecting = isPrivy ? privyWallet.isCreating : freighter.isConnecting;
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleCopy = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleExport = async () => {
    if (!publicKey || !isPrivyWallet) return;
    setExporting(true);
    setExportError(null);
    try {
      await exportWallet({ address: publicKey });
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Could not open export modal.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className={cn("rounded-2xl border shadow-none", t.card)}>
      <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
        <div>
          <p className={cn("text-sm font-semibold", t.cardTitle)}>Stellar wallet</p>
          <p className={cn("mt-0.5 text-xs", t.cardMeta)}>
            {isPrivyWallet
              ? "Your embedded Stellar wallet is managed by Privy. Export your private key to use it in another client."
              : "Your Freighter wallet connected to this session."}
          </p>
        </div>

        {!publicKey ? (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4">
            <p className={cn("text-sm", t.cardMeta)}>
              No Stellar wallet yet. Create one to receive payments and sign transactions.
            </p>
            <Button
              type="button"
              disabled={isConnecting}
              onClick={() => void connect()}
              className="h-10 w-fit rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-none hover:bg-blue-500"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Creating wallet…
                </>
              ) : (
                <>
                  <Wallet className="mr-1.5 h-4 w-4" />
                  Create Stellar wallet
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className={cn("text-xs font-medium", t.cardMeta)}>Public address</p>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 font-mono text-xs break-all",
                  t.dark ? "border-white/10 bg-white/5" : "border-ui-border/80 bg-neutral-50"
                )}
              >
                <span className="min-w-0 flex-1">{publicKey}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => void handleCopy()}
                  aria-label="Copy address"
                >
                  {copied ? (
                    <CheckCheck className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {isPrivyWallet ? (
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={exporting}
                  onClick={() => void handleExport()}
                  className={cn("h-10 w-fit rounded-xl text-sm font-medium shadow-none", t.outlineBtn)}
                >
                  {exporting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Opening export…
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-1.5 h-4 w-4" />
                      Export private key
                    </>
                  )}
                </Button>
                <p className={cn("text-[11px] leading-relaxed", t.cardMeta)}>
                  Step 1: export your hex seed from Privy above. Step 2: convert it for Freighter
                  below. Keys stay in your browser only.
                </p>
                {exportError ? (
                  <p className="text-[11px] text-red-400">{exportError}</p>
                ) : null}
                <PrivyFreighterImportHelper
                  expectedPublicKey={publicKey}
                  themeClasses={{
                    cardMeta: t.cardMeta,
                    cardTitle: t.cardTitle,
                    outlineBtn: t.outlineBtn,
                    dark: t.dark,
                  }}
                />
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
