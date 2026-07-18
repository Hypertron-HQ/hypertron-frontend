"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useLoginTransition, loginRedirectDelay } from "@/components/auth/login-transition-provider";
import { isPrivyConfigured } from "@/lib/privy-config";
import {
  consumePostLoginRedirect,
  POST_LOGIN_REDIRECT_KEY,
} from "@/lib/privy-login-redirect";
import { clearLaunchSession } from "@/lib/launch-auth";
import { isProtectedAppPath } from "@/lib/protected-routes";

async function fetchPrivyAccessToken(
  getAccessToken: () => Promise<string | null>
): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = await getAccessToken();
    if (token) return token;
    await new Promise((resolve) => window.setTimeout(resolve, 300));
  }
  return null;
}

function resolvePostLoginTarget(): string {
  return consumePostLoginRedirect() ?? "/dashboard";
}

/**
 * After Privy login, exchanges access token for ht_privy cookie, then redirects to dashboard.
 */
export function PrivyAuthSync() {
  const pathname = usePathname();
  const { ready, authenticated, user, getAccessToken, logout } = usePrivy();
  const { startLoginTransition, endLoginTransition } = useLoginTransition();
  const syncingRef = useRef(false);
  const syncedPrivyIdRef = useRef<string | null>(null);

  const redirectAfterLogin = useCallback(
    async (target: string) => {
      startLoginTransition("Taking you to your dashboard…");
      await loginRedirectDelay();
      // Hard navigation so middleware sees the new ht_privy cookie after OAuth.
      window.location.assign(target);
    },
    [startLoginTransition]
  );

  useEffect(() => {
    if (!isPrivyConfigured() || !ready) return;

    if (!authenticated || !user?.id) {
      syncedPrivyIdRef.current = null;
      endLoginTransition();
      return;
    }

    // Already synced — redirect if OAuth reload left us on a public page.
    if (syncedPrivyIdRef.current === user.id) {
      if (!isProtectedAppPath(pathname)) {
        void redirectAfterLogin(resolvePostLoginTarget());
        return;
      }
      endLoginTransition();
      return;
    }

    void (async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      startLoginTransition("Signing you in…");

      try {
        const token = await fetchPrivyAccessToken(getAccessToken);
        if (!token) {
          endLoginTransition();
          return;
        }

        const res = await fetch("/api/auth/privy/sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "same-origin",
        });

        if (!res.ok) {
          if (res.status === 401) await logout();
          endLoginTransition();
          return;
        }

        syncedPrivyIdRef.current = user.id;
        window.dispatchEvent(new Event("hypertron-session-synced"));

        if (!isProtectedAppPath(pathname)) {
          await redirectAfterLogin(resolvePostLoginTarget());
          return;
        }

        endLoginTransition();
      } catch {
        endLoginTransition();
      } finally {
        syncingRef.current = false;
      }
    })();
  }, [
    ready,
    authenticated,
    user?.id,
    getAccessToken,
    logout,
    pathname,
    startLoginTransition,
    endLoginTransition,
    redirectAfterLogin,
  ]);

  useEffect(() => {
    if (!isPrivyConfigured()) return;
    const onSignOut = () => {
      try {
        sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
        clearLaunchSession();
      } catch {
        // ignore
      }
      syncedPrivyIdRef.current = null;
      endLoginTransition();
      void logout();
    };
    window.addEventListener("hypertron-sign-out", onSignOut);
    return () => window.removeEventListener("hypertron-sign-out", onSignOut);
  }, [logout, endLoginTransition]);

  return null;
}
