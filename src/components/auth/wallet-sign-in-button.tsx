"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runWalletSignInFlow } from "@/lib/wallet-sign-in-flow";

type WalletSignInButtonProps = {
  returnUrl: string;
  onSuccess?: () => void;
  onStart?: () => void;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  children: ReactNode;
  /** Run sign-in immediately when mounted (e.g. after redirect from legacy URL). */
  autoStart?: boolean;
};

export function WalletSignInButton({
  returnUrl,
  onSuccess,
  onStart,
  className,
  variant = "outline",
  size = "default",
  children,
  autoStart = false,
}: WalletSignInButtonProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const runFlow = useCallback(async () => {
    setBusy(true);
    setError(null);
    setStatus(null);
    onStart?.();
    try {
      const result = await runWalletSignInFlow(setStatus);
      if (!result.ok) {
        setError(result.error);
        setBusy(false);
        return;
      }
      setStatus("Redirecting…");
      onSuccess?.();
      window.location.assign(returnUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }, [onStart, onSuccess, returnUrl]);

  useEffect(() => {
    if (!autoStart || autoStarted.current) return;
    autoStarted.current = true;
    void runFlow();
  }, [autoStart, runFlow]);

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        disabled={busy}
        onClick={() => void runFlow()}
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Working…
          </>
        ) : (
          children
        )}
      </Button>
      {status && !error ? <p className="text-xs text-zinc-400">{status}</p> : null}
      {error ? (
        <p className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
