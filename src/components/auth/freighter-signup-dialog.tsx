"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  connectFreighter,
  FREIGHTER_INSTALL_URL,
} from "@/lib/freighter-connect";
import { createMockSession } from "@/lib/mock-session";

type Step = "choose" | "connecting";

export function FreighterSignupDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(next: boolean) {
    if (step === "connecting") return;
    setOpen(next);
    if (!next) {
      setStep("choose");
      setStatus(null);
      setError(null);
    }
  }

  async function handleFreighterSignIn() {
    setStep("connecting");
    setError(null);
    setStatus("Connecting to Freighter…");

    const result = await connectFreighter(setStatus);
    if (!result.ok) {
      if (result.needsInstall) {
        window.open(FREIGHTER_INSTALL_URL, "_blank", "noopener,noreferrer");
      }
      setError(result.error);
      setStep("choose");
      setStatus(null);
      return;
    }

    createMockSession(result.walletAddress);
    setOpen(false);
    setStep("choose");
    setStatus(null);
    router.push("/dashboard");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="fog" size="sm" className="h-9 px-4">
          Sign up
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 overflow-hidden border-line bg-navy p-0 text-fog sm:max-w-md">
        <DialogHeader className="border-b border-line px-5 py-4 text-left">
          <p className="text-xs font-medium tracking-[0.16em] text-yellow uppercase">
            Create account
          </p>
          <DialogTitle className="font-display text-xl tracking-tight text-fog">
            Sign up with Freighter
          </DialogTitle>
          <DialogDescription className="text-mist">
            Connect your Stellar wallet to open the dashboard. Message signing
            auth will be added with the backend.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-5">
          {step === "choose" ? (
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => void handleFreighterSignIn()}
                className="group flex w-full items-center gap-3 rounded-xl border border-line bg-glass px-4 py-3 text-left transition hover:border-blue/50 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue/15 text-sm font-semibold text-blue">
                  F
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fog">
                    Freighter
                  </span>
                  <span className="block text-xs text-haze">
                    Stellar browser wallet
                  </span>
                </span>
                <span className="text-xs text-mist transition group-hover:text-yellow">
                  Continue
                </span>
              </button>
              {error ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-glass px-4 py-5">
              <p className="text-sm font-medium text-fog">
                {status ?? "Connecting Freighter…"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-mist">
                Approve the connection request in the Freighter extension.
              </p>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-yellow via-blue to-cyan" />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
