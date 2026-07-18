"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoginTransition } from "@/components/auth/login-transition-provider";
import { setPostLoginRedirect } from "@/lib/privy-login-redirect";

type Props = {
  returnUrl: string;
  onSuccess: () => void;
  /** When true, watch for completed server session after Privy auth. */
  active: boolean;
};

export function LaunchEmailSignInButton({ returnUrl, onSuccess, active }: Props) {
  const { ready, authenticated, login } = usePrivy();
  const { isActive: loginTransitionActive } = useLoginTransition();
  const handledRef = useRef(false);
  const [completing, setCompleting] = useState(false);

  const handleLogin = () => {
    setPostLoginRedirect(returnUrl);
    login();
  };

  const isLoading = completing || loginTransitionActive || (active && ready && authenticated);

  // Fallback when OAuth does not full-reload: wait for ht_privy cookie then redirect
  useEffect(() => {
    if (!active || !ready || !authenticated || handledRef.current) return;

    let cancelled = false;
    setCompleting(true);

    const waitForSession = async () => {
      for (let i = 0; i < 30; i += 1) {
        if (cancelled) return;
        const res = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (res.ok) {
          handledRef.current = true;
          onSuccess();
          return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      if (!cancelled) setCompleting(false);
    };

    void waitForSession();
    return () => {
      cancelled = true;
    };
  }, [active, ready, authenticated, onSuccess]);

  return (
    <Button
      type="button"
      className="h-auto w-full flex-col items-start gap-1 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-4 text-left hover:bg-white/10"
      onClick={handleLogin}
      disabled={!ready || isLoading}
    >
      <span className="flex w-full items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-white">
            {isLoading ? "Signing you in…" : "Continue with email or Google"}
          </span>
          <span className="text-xs font-normal text-zinc-400">
            {isLoading
              ? "Just a moment while we set things up"
              : "Best for teams, compliance, and day-to-day ops"}
          </span>
        </span>
      </span>
    </Button>
  );
}
