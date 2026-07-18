"use client";

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Ticket, Wallet } from "lucide-react";
import { LaunchEmailSignInButton } from "./launch-email-sign-in-button";
import { HeroDashboardPreview } from "./hero-dashboard-preview";
import { HeroBuiltWithStrip } from "./hero-built-with-strip";
import { ShinyText } from "@/components/ui/shiny-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isPrivyConfigured } from "@/lib/privy-config";
import { WalletSignInButton } from "@/components/auth/wallet-sign-in-button";
import { DEMO_SANDBOX_OVERVIEW_PATH } from "@/lib/demo-routes";
import {
  INVITE_VERIFIED_KEY,
  LAUNCH_QUERY_PARAM,
  WALLET_LAUNCH_QUERY_PARAM,
  isInviteVerifiedInSession,
  safeReturnUrl,
} from "@/lib/launch-auth";
import { setPostLoginRedirect } from "@/lib/privy-login-redirect";

const BOOK_DEMO = "https://calendly.com/kararsweta/30min";
/** Static invite gate for Launch (replace with server validation when ready). */
const VALID_INVITE_CODE = "INVITE101";

type LaunchStep = "invite" | "sign-in";

function markInviteVerified() {
  try {
    sessionStorage.setItem(INVITE_VERIFIED_KEY, "1");
  } catch {
    // ignore
  }
}

function MonoHeroInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const privyOn = isPrivyConfigured();
  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));
  const [launchOpen, setLaunchOpen] = useState(false);
  const [launchStep, setLaunchStep] = useState<LaunchStep>("invite");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [walletAutoStart, setWalletAutoStart] = useState(false);
  const inviteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!launchOpen || launchStep !== "invite") return;
    const id = window.setTimeout(() => inviteInputRef.current?.focus(), 80);
    return () => window.clearTimeout(id);
  }, [launchOpen, launchStep]);

  useEffect(() => {
    if (searchParams.get("reason") === "config") {
      setConfigError("Server auth is not fully configured. Contact support if this persists.");
    }
    const launchRequested = searchParams.get(LAUNCH_QUERY_PARAM) === "1";
    const walletRequested = searchParams.get(WALLET_LAUNCH_QUERY_PARAM) === "1";
    if (!launchRequested && !walletRequested) return;

    setLaunchOpen(true);
    if (isInviteVerifiedInSession() || walletRequested) {
      setLaunchStep("sign-in");
      setPostLoginRedirect(returnUrl);
    }
    if (walletRequested) {
      setWalletAutoStart(true);
    }

    const url = new URL(window.location.href);
    url.searchParams.delete(LAUNCH_QUERY_PARAM);
    url.searchParams.delete(WALLET_LAUNCH_QUERY_PARAM);
    url.searchParams.delete("returnUrl");
    url.searchParams.delete("reason");
    window.history.replaceState({}, "", url.pathname + (url.search || "") + url.hash);
  }, [searchParams]);

  const resetLaunchState = useCallback(() => {
    setInviteCode("");
    setInviteError(null);
    setLaunchStep("invite");
  }, []);

  // Scroll-linked 3D tilt for the dashboard preview
  const previewRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: previewRef,
    offset: ["start 95%", "start 30%"],
  });
  // 0 = dashboard entering viewport (tilted), 1 = centered (upright)
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 1], [22, 0]), {
    stiffness: 140,
    damping: 24,
    mass: 0.5,
  });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [0.94, 1]), {
    stiffness: 140,
    damping: 24,
    mass: 0.5,
  });

  const handleLaunchOpenChange = (open: boolean) => {
    setLaunchOpen(open);
    if (!open) resetLaunchState();
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inviteCode.trim().toUpperCase();
    if (trimmed !== VALID_INVITE_CODE) {
      setInviteError("Invalid invite code. Try again or contact us for access.");
      return;
    }
    setInviteError(null);
    markInviteVerified();
    setPostLoginRedirect(returnUrl);
    setLaunchStep("sign-in");
  };

  const finishLaunchAndGoToDashboard = useCallback(() => {
    setLaunchOpen(false);
    resetLaunchState();
    router.push(returnUrl);
  }, [resetLaunchState, router, returnUrl]);

  const handleBackToInvite = () => {
    setLaunchStep("invite");
    setInviteError(null);
  };

  return (
    <section
      id="home"
      className="relative flex w-full flex-col items-center overflow-hidden bg-transparent px-6 pb-16 pt-28 text-center md:px-8 md:pt-40"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="mb-6 relative flex flex-wrap items-center justify-center gap-2.5 rounded-full px-4 py-2 overflow-hidden ring-1 ring-white/10"
          style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black">
            Public beta
          </span>
          <ShinyText
            text="From onboarding to settlement."
            speed={3}
            color="rgba(255,255,255,0.6)"
            shineColor="#ffffff"
            spread={100}
            className="text-sm font-medium"
          />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-2px] text-foreground drop-shadow-sm sm:text-5xl md:text-7xl"
        >
          One{" "}
          <span className="font-serif font-normal italic text-white/90">programmable</span> operating
          layer{" "}
          <span className="font-serif font-normal italic text-white/90">for</span>{" "}
          <span className="bg-gradient-to-br from-white via-white to-blue-200/80 bg-clip-text text-transparent">
            B2B{" "}
            <span className="whitespace-nowrap">payments & operations.</span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-8 max-w-xl text-base leading-relaxed text-white/65 drop-shadow-sm md:text-[15px]"
        >
          Create onboarding flows, collect payments, automate approvals, and settle funds privately
          across global teams.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto flex w-full max-w-md flex-col gap-3 sm:max-w-lg sm:flex-row sm:justify-center"
        >
          <motion.div
            className="w-full sm:flex-1"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href={BOOK_DEMO}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="hero-book-demo-btn"
              className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-6 text-base font-semibold text-background"
            >
              Book a Demo
            </Link>
          </motion.div>
          <motion.div
            className="w-full sm:flex-1"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href={DEMO_SANDBOX_OVERVIEW_PATH}
              data-testid="hero-explore-sandbox-btn"
              className="flex h-12 w-full items-center justify-center rounded-full border border-white/25 bg-transparent px-6 text-base font-semibold text-white hover:bg-white/10"
            >
              Explore Sandbox
            </Link>
          </motion.div>
        </motion.div>

        <HeroBuiltWithStrip />

        <Dialog open={launchOpen} onOpenChange={handleLaunchOpenChange}>
          <DialogContent className="gap-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-0 text-foreground shadow-2xl shadow-black/50 ring-0 backdrop-blur-xl sm:max-w-[420px] [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-lg [&>button]:text-zinc-500 [&>button]:opacity-100 [&>button]:hover:bg-white/[0.06] [&>button]:hover:text-white">
            {launchStep === "invite" ? (
              <>
                <div className="border-b border-white/[0.06] px-6 pb-5 pt-6">
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] ring-1 ring-white/10"
                    aria-hidden
                  >
                    <Ticket className="h-5 w-5 text-white/75" strokeWidth={1.75} />
                  </div>
                  <DialogHeader className="space-y-2 text-left">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                      Early access
                    </p>
                    <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                      Enter invite code
                    </DialogTitle>
                    <DialogDescription className="text-[15px] leading-relaxed text-zinc-400">
                      Hypertron is invite-only during early access. Enter your code to continue.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <form onSubmit={handleInviteSubmit} className="px-6 pb-6">
                  <div className="grid gap-2.5">
                    <Label htmlFor="hypertron-invite-code" className="text-sm font-medium text-zinc-300">
                      Invite code
                    </Label>
                    <Input
                      ref={inviteInputRef}
                      id="hypertron-invite-code"
                      name="inviteCode"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      placeholder="INVITEXXX"
                      value={inviteCode}
                      aria-invalid={inviteError ? true : undefined}
                      aria-describedby={inviteError ? "hypertron-invite-error" : undefined}
                      onChange={(ev) => {
                        setInviteCode(ev.target.value.toUpperCase());
                        if (inviteError) setInviteError(null);
                      }}
                      className="h-12 rounded-xl border-white/20 bg-white/[0.04] font-mono text-base tracking-wider text-white shadow-inner shadow-black/20 placeholder:text-zinc-600 focus-visible:border-white/35 focus-visible:ring-2 focus-visible:ring-white/15 aria-invalid:border-red-400/60 aria-invalid:ring-red-400/20"
                    />
                    {inviteError ? (
                      <p
                        id="hypertron-invite-error"
                        className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                        role="alert"
                      >
                        {inviteError}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500">Codes are not case-sensitive.</p>
                    )}
                  </div>
                  <DialogFooter className="mt-6 flex-col gap-2 sm:flex-col">
                    <Button
                      type="submit"
                      className="h-11 w-full rounded-full bg-white text-base font-semibold text-black hover:bg-white/90"
                    >
                      Continue
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 w-full rounded-full text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                      onClick={() => handleLaunchOpenChange(false)}
                    >
                      Cancel
                    </Button>
                  </DialogFooter>
                  <p className="mt-4 text-center text-xs text-zinc-500">
                    Don&apos;t have a code?{" "}
                    <a
                      href={BOOK_DEMO}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-zinc-300 underline-offset-2 transition-colors hover:text-white hover:underline"
                    >
                      Request access
                    </a>
                  </p>
                </form>
              </>
            ) : (
              <div className="px-6 py-8 sm:py-10">
                <DialogHeader className="space-y-2 text-left">
                  <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                    Choose how to sign in
                  </DialogTitle>
                  <DialogDescription className="text-[15px] leading-relaxed text-zinc-400">
                    Use your work email for the dashboard, or connect a Stellar wallet for on-chain actions.
                  </DialogDescription>
                </DialogHeader>
                {configError ? (
                  <p className="text-sm text-amber-400 px-1" role="alert">
                    {configError}
                  </p>
                ) : null}
                <div className="grid gap-3 py-4">
                  {privyOn ? (
                    <LaunchEmailSignInButton
                      returnUrl={returnUrl}
                      onSuccess={finishLaunchAndGoToDashboard}
                      active={launchOpen && launchStep === "sign-in"}
                    />
                  ) : (
                    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90">
                      Email sign-in is not configured. Use Stellar wallet below, or set Privy env vars.
                    </p>
                  )}

                  <WalletSignInButton
                    returnUrl={returnUrl}
                    autoStart={walletAutoStart}
                    onStart={markInviteVerified}
                    onSuccess={() => {
                      setLaunchOpen(false);
                      resetLaunchState();
                    }}
                    className="h-auto w-full flex-col items-start gap-1 rounded-xl border border-white/20 bg-transparent px-4 py-4 text-left hover:bg-white/[0.06]"
                  >
                    <span className="flex w-full items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-200">
                        <Wallet className="h-5 w-5" />
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-white">Connect Stellar wallet</span>
                        <span className="text-xs font-normal text-zinc-400">
                          Freighter — payments, withdrawals, and signing
                        </span>
                      </span>
                    </span>
                  </WalletSignInButton>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-zinc-400 hover:text-white"
                    onClick={handleBackToInvite}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-zinc-400 hover:text-white"
                    onClick={() => handleLaunchOpenChange(false)}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>

      {/* Dashboard preview with scroll-linked 3D tilt */}
      <div
        ref={previewRef}
        className="relative z-10 mt-16 w-full max-w-5xl px-4 md:mt-20"
        style={{ perspective: "1800px", perspectiveOrigin: "50% 0%" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{
            rotateX,
            scale,
            transformStyle: "preserve-3d",
            transformOrigin: "50% 100%",
          }}
          className="relative will-change-transform"
        >
          {/* Glow beneath the frame */}
          <div
            className="pointer-events-none absolute -inset-x-10 -top-12 h-40 rounded-full blur-3xl"
            style={{ background: "radial-gradient(ellipse at center, rgba(59,130,246,0.35), transparent 70%)" }}
          />
          {/* Frame */}
          <div
            className="pointer-events-none relative overflow-hidden rounded-2xl select-none"
            style={{
              boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 32px 80px rgba(0,0,0,0.6)",
            }}
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="mx-auto flex items-center gap-2 rounded-md bg-white/[0.06] px-3 py-1">
                <span className="font-mono text-[11px] tracking-wide text-white/45">
                  app.hypertron.xyz
                </span>
              </div>
            </div>

            <HeroDashboardPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function MonoHero() {
  return (
    <Suspense fallback={null}>
      <MonoHeroInner />
    </Suspense>
  );
}
