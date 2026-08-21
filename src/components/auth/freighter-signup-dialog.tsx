"use client";

import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Download,
  Loader2,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FREIGHTER_INSTALL_URL,
  runWalletSignInFlow,
} from "@/lib/freighter-connect";

type Step = "choose" | "connecting";

/** Mirrors the status strings emitted by `runWalletSignInFlow`. */
const FLOW_STEPS = [
  { match: "Connecting", label: "Connect wallet" },
  { match: "Requesting challenge", label: "Request challenge" },
  { match: "Sign in Freighter", label: "Sign the challenge" },
  { match: "Verifying", label: "Verify signature" },
] as const;

export function FreighterSignupDialog({
  redirectTo = "/dashboard",
  triggerLabel = "Sign up",
  triggerClassName,
  eyebrow = "Create account",
  title = "Sign up with Freighter",
  description = "Connect your Stellar wallet and sign a one-time challenge to continue.",
}: {
  redirectTo?: string;
  triggerLabel?: ReactNode;
  triggerClassName?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
} = {}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);

  const connecting = step === "connecting";
  const activeIndex = FLOW_STEPS.findIndex((s) =>
    (status ?? "").startsWith(s.match),
  );

  function handleOpenChange(next: boolean) {
    if (connecting) return;
    setOpen(next);
    if (!next) {
      setStep("choose");
      setStatus(null);
      setError(null);
      setNeedsInstall(false);
    }
  }

  async function handleFreighterSignIn() {
    setStep("connecting");
    setError(null);
    setNeedsInstall(false);
    setStatus("Connecting…");

    const result = await runWalletSignInFlow(setStatus);
    if (!result.ok) {
      if (result.needsInstall) {
        setNeedsInstall(true);
        window.open(FREIGHTER_INSTALL_URL, "_blank", "noopener,noreferrer");
      }
      setError(result.error);
      setStep("choose");
      setStatus(null);
      return;
    }

    setOpen(false);
    setStep("choose");
    setStatus(null);
    window.location.assign(redirectTo);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="fog"
          size="sm"
          className={triggerClassName ?? "h-9 rounded-none px-4"}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="landing-auth-dialog gap-0 overflow-hidden rounded-none border border-white/10 p-0 text-white shadow-2xl shadow-black/60 sm:max-w-md"
      >
        <DialogHeader className="relative border-b border-white/10 px-7 pt-7 pb-6 text-left">
          {/* corner marker, as on the hero card */}
          <span aria-hidden className="absolute top-0 left-0 size-1.5 bg-blue" />

          {!connecting && (
            <DialogClose asChild>
              <button
                type="button"
                aria-label="Close"
                className="absolute top-6 right-6 flex size-8 items-center justify-center rounded-none border border-white/10 text-white/40 transition-colors hover:border-white/30 hover:text-white focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <X className="size-3.5" />
              </button>
            </DialogClose>
          )}

          <p className="text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase">
            {eyebrow}
          </p>
          <DialogTitle className="landing-hero-title mt-3 pr-10 text-[24px] leading-[1.05] tracking-[-0.03em] text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-3 text-[13px] leading-relaxed text-white/50">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="relative px-7 py-7">
          {!connecting ? (
            <div className="grid gap-5">
              <div>
                <p className="mb-3 text-[10px] tracking-[0.2em] text-white/30 uppercase">
                  Choose a wallet
                </p>
                <button
                  type="button"
                  onClick={() => void handleFreighterSignIn()}
                  className="group flex w-full items-center gap-4 rounded-none border border-white/10 bg-white/[0.03] px-4 py-4 text-left transition-colors hover:border-white/25 hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center border border-white/10 bg-white/[0.04] text-blue transition-colors group-hover:border-blue/40">
                    <Wallet className="size-5" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-white">
                      Freighter
                    </span>
                    <span className="mt-1 block text-[12px] text-white/40">
                      Stellar browser wallet
                    </span>
                  </span>
                  <span className="flex size-8 shrink-0 items-center justify-center border border-white/10 text-white/40 transition-colors group-hover:border-white/30 group-hover:text-white">
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              </div>

              {error ? (
                <div className="rounded-none border border-red-400/25 bg-red-500/[0.08] px-4 py-3">
                  <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-red-200">
                    <AlertCircle className="mt-px size-4 shrink-0" />
                    {error}
                  </p>
                  {needsInstall ? (
                    <a
                      href={FREIGHTER_INSTALL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 rounded-none border border-red-400/30 px-3 py-1.5 text-[10px] tracking-[0.16em] text-red-100 uppercase transition-colors hover:bg-red-500/15"
                    >
                      <Download className="size-3.5" />
                      Install Freighter
                    </a>
                  ) : null}
                </div>
              ) : null}

              <p className="flex items-center gap-2.5 border-t border-white/10 pt-5 text-[11.5px] leading-relaxed text-white/35">
                <ShieldCheck className="size-4 shrink-0 text-blue/70" />
                Signature only — Hypertron never sees your secret key.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase">
                Connecting
              </p>

              <ol className="grid gap-3">
                {FLOW_STEPS.map((flowStep, index) => {
                  const done = activeIndex > index;
                  const active = activeIndex === index;
                  return (
                    <li
                      key={flowStep.match}
                      className="flex items-center gap-3.5"
                    >
                      <span
                        className={
                          done || active
                            ? "flex size-6 shrink-0 items-center justify-center border border-blue/40 bg-blue/10 text-blue"
                            : "flex size-6 shrink-0 items-center justify-center border border-white/10 text-white/30"
                        }
                      >
                        {done ? (
                          <Check className="size-3.5" strokeWidth={2.5} />
                        ) : active ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <span className="size-1 bg-current" />
                        )}
                      </span>
                      <span
                        className={
                          done || active
                            ? "text-[13.5px] text-white"
                            : "text-[13.5px] text-white/35"
                        }
                      >
                        {flowStep.label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <p className="border-t border-white/10 pt-5 text-[12.5px] leading-relaxed text-white/45">
                Approve each Freighter prompt to continue. Keep this window
                open.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
