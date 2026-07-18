"use client";

import Link from "next/link";
import { AlertTriangle, ExternalLink, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useDemoMode } from "@/components/demo/demo-mode-provider";
import {
  getPoolExplorerContractUrl,
  isPrivacyBeta,
  isPrivateSettlementEnabled,
} from "@/lib/privacy-features";
import { cn } from "@/utils";

type PrivacyBetaBannerProps = {
  className?: string;
  /** Shorter copy for tight layouts (e.g. collect tab sidebar). */
  compact?: boolean;
  showTestLinks?: boolean;
};

export function PrivacyBetaBanner({
  className,
  compact = false,
  showTestLinks = true,
}: PrivacyBetaBannerProps) {
  const { isDemo, demoPath } = useDemoMode();

  if (!isPrivacyBeta() || !isPrivateSettlementEnabled()) return null;

  const vaultHref = demoPath("/dashboard/secure-vault");
  const paymentsHref = demoPath("/dashboard/payment-links");

  return (
    <Alert
      className={cn(
        "border-amber-500/35 bg-amber-500/10 text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-50",
        className
      )}
    >
      <Shield className="h-4 w-4 text-amber-600 dark:text-amber-300" />
      <div className="flex flex-wrap items-center gap-2">
        <AlertTitle className="text-amber-950 dark:text-amber-50">
          Stellar privacy payments
        </AlertTitle>
        <Badge
          variant="secondary"
          className="border-amber-500/30 bg-amber-500/20 text-[10px] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100"
        >
          Beta · Testnet
        </Badge>
      </div>
      <AlertDescription className="text-amber-900/90 dark:text-amber-100/90">
        {compact ? (
          <p>
            Private settlement and on-chain commitments are live on Stellar testnet. Not audited —
            do not use with real funds.
          </p>
        ) : (
          <p>
            Test private payment checkout and Soroban commitment pool on Stellar testnet. This
            feature is experimental and not audited — use testnet XLM only.
            {isDemo ? " Connect Freighter on testnet to try commitments." : null}
          </p>
        )}
        {showTestLinks ? (
          <ul className="mt-2.5 flex flex-col gap-1.5 text-sm sm:flex-row sm:flex-wrap sm:gap-x-4">
            <li>
              <Link
                href={vaultHref}
                className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
              >
                Secure vault — add commitments
              </Link>
            </li>
            <li>
              <Link
                href={paymentsHref}
                className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
              >
                Payment links — private checkout
              </Link>
            </li>
            <li>
              <a
                href={getPoolExplorerContractUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
              >
                Pool contract on Stellar Expert
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ul>
        ) : null}
        {!compact ? (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-800/80 dark:text-amber-200/80">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Commitments require a funded Freighter wallet on testnet. Private pay uses hash-memo
            flow when enabled at checkout.
          </p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
