"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WalletSignInButton } from "@/components/auth/wallet-sign-in-button";

type WalletLinkDialogProps = {
  returnUrl: string;
  triggerLabel?: string;
  triggerClassName?: string;
};

/** In-app Freighter linking — stays inside the dashboard chrome, not a standalone page. */
export function WalletLinkDialog({
  returnUrl,
  triggerLabel = "Connect Freighter",
  triggerClassName,
}: WalletLinkDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-zinc-950 text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5 text-amber-200" />
              Link Stellar wallet
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Sign a one-time message in Freighter to link on-chain actions to your account.
            </DialogDescription>
          </DialogHeader>
          <WalletSignInButton
            returnUrl={returnUrl}
            className="h-auto w-full flex-col items-start gap-1 rounded-xl border-white/20 bg-transparent px-4 py-4 text-left hover:bg-white/[0.06]"
            onSuccess={() => setOpen(false)}
          >
            <span className="flex w-full items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-200">
                <Wallet className="h-5 w-5" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-white">Connect Freighter</span>
                <span className="text-xs font-normal text-zinc-400">
                  Payments, withdrawals, and signing
                </span>
              </span>
            </span>
          </WalletSignInButton>
        </DialogContent>
      </Dialog>
    </>
  );
}
