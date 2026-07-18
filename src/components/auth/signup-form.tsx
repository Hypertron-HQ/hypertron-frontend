"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { homeLaunchPath } from "@/lib/launch-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";
import { isPrivyConfigured } from "@/lib/privy-config";
import { useLoginTransition, loginRedirectDelay } from "@/components/auth/login-transition-provider";
import { Loader2 } from "lucide-react";

function safeReturnUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/")) return "/dashboard";
  if (raw.startsWith("//") || raw.includes("://")) return "/dashboard";
  return raw;
}

const SignUpForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));

  const privyOn = isPrivyConfigured();
  const { ready, authenticated, login } = usePrivy();
  const { startLoginTransition, endLoginTransition, isActive: loginTransitionActive } = useLoginTransition();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => {
        if (!cancelled && res.ok) {
          startLoginTransition("Setting up your workspace…");
          void loginRedirectDelay().then(() => {
            router.replace(returnUrl);
            endLoginTransition();
          });
        }
      })
      .finally(() => {
        if (!cancelled) setCheckingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router, returnUrl, startLoginTransition, endLoginTransition]);

  useEffect(() => {
    if (!privyOn || !ready || !authenticated) return;
    startLoginTransition("Setting up your workspace…");
    void (async () => {
      await loginRedirectDelay();
      router.replace(returnUrl);
      endLoginTransition();
    })();
  }, [privyOn, ready, authenticated, router, returnUrl, startLoginTransition, endLoginTransition]);

  const handleSignUp = useCallback(() => {
    login();
  }, [login]);

  if (checkingSession || loginTransitionActive || (privyOn && ready && authenticated)) {
    return (
      <div className="flex flex-col items-start gap-y-6 py-8 w-full px-0.5">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {checkingSession ? "Checking session…" : "Setting up your workspace…"}
        </p>
      </div>
    );
  }

  if (!privyOn) {
    return (
      <div className="flex flex-col items-start gap-y-6 py-8 w-full px-0.5">
        <h2 className="text-2xl font-semibold">Create your workspace</h2>
        <p className="text-muted-foreground text-sm">
          Configure Privy to enable email signup, or connect a Stellar wallet.
        </p>
        <Button asChild>
          <Link href={homeLaunchPath(returnUrl, { wallet: true })}>Connect Stellar wallet</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-y-6 py-8 w-full px-0.5">
      <h2 className="text-2xl font-semibold">Create your workspace</h2>
      <p className="text-muted-foreground text-sm">
        Start with email or Google. Link Freighter when you are ready to move funds on Stellar.
      </p>

      <Button onClick={handleSignUp} disabled={!ready} className="w-full">
        {!ready ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading…
          </>
        ) : (
          "Get started"
        )}
      </Button>

      <Button variant="outline" asChild className="w-full">
        <Link href={homeLaunchPath(returnUrl, { wallet: true })}>Use Stellar wallet instead</Link>
      </Button>
    </div>
  );
};

export default SignUpForm;
