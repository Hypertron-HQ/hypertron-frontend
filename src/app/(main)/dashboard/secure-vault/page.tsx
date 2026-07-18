"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFreighter } from "@/hooks/useFreighter";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { DashboardPageHeader } from "@/components/dashboard/layout/dashboard-page-header";
import { PrivacyBetaBanner } from "@/components/dashboard/privacy-beta-banner";
import { ZkCommitmentPool } from "@/components/zk-commitment-pool";
import { useDemoMode } from "@/components/demo/demo-mode-provider";
import { getPoolExplorerContractUrl } from "@/lib/privacy-features";

export default function SecureVaultPage() {
  const { publicKey, connect, isConnecting } = useFreighter();
  const { isDemo } = useDemoMode();

  return (
    <DashboardMain>
      <div className="flex flex-col gap-6">
        <DashboardPageHeader
          eyebrow="Privacy"
          title="Secure vault"
          description="Poseidon commitment pool on Soroban — test private settlement proofs on Stellar testnet."
        />

        <PrivacyBetaBanner />

        {isDemo ? (
          <p className="text-sm text-muted-foreground">
            Demo mode uses the live testnet PoolManager contract. Connect Freighter on{" "}
            <strong>testnet</strong> with a small XLM balance, then add commitments below. Each
            entry is verifiable on Stellar Expert.
          </p>
        ) : null}

        {!publicKey ? (
          <div className="flex max-w-lg flex-col gap-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-8">
            <p className="text-sm text-white/60">
              Connect a Stellar wallet to read pool state and submit test commitments. Freighter on
              testnet is recommended.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void connect()} disabled={isConnecting}>
                {isConnecting ? "Connecting…" : "Connect Freighter"}
              </Button>
              <Button variant="outline" asChild>
                <a
                  href={getPoolExplorerContractUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5"
                >
                  View pool on Stellar Expert
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <ZkCommitmentPool publicKey={publicKey} />
        )}

        <p className="text-xs text-muted-foreground">
          Need testnet XLM? Fund via{" "}
          <Link
            href="https://laboratory.stellar.org/#account-creator?network=test"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Stellar Laboratory Friendbot
          </Link>
          . For private payment checkout, use{" "}
          <Link href={isDemo ? "/demo/dashboard/payment-links" : "/dashboard/payment-links"}>
            Payment links
          </Link>{" "}
          and enable private settlement at pay time.
        </p>
      </div>
    </DashboardMain>
  );
}
