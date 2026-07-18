"use client";

import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFreighter } from "@/hooks/useFreighter";

type Props = {
  show: boolean;
};

/** Shown for Privy sessions while the embedded Stellar wallet is being created. */
export function ConnectWalletBanner({ show }: Props) {
  const { publicKey, connect, isConnecting } = useFreighter();
  if (!show || publicKey) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />
        <div>
          <p className="text-sm font-medium text-amber-50">Set up your Stellar wallet</p>
          <p className="mt-0.5 text-xs text-amber-100/70">
            Privy creates a Stellar wallet for your account. No Freighter extension required.
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isConnecting}
        onClick={() => void connect()}
        className="shrink-0 border-amber-400/30 text-amber-50 hover:bg-amber-400/15"
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            Creating…
          </>
        ) : (
          "Create Stellar wallet"
        )}
      </Button>
    </div>
  );
}
