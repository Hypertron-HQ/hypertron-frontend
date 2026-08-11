import { apiFetch } from "@/lib/api";

export type WalletSession = {
  auth: "wallet";
  walletAddress: string;
};

export type AuthChallenge = {
  challengeId: string;
  message: string;
  expiresAt: string;
};

type ErrorBody = {
  error?: string;
};

async function readJson<T>(res: Response): Promise<T & ErrorBody> {
  return (await res.json().catch(() => ({}))) as T & ErrorBody;
}

export async function requestAuthChallenge(
  walletAddress: string,
): Promise<
  { ok: true; challenge: AuthChallenge } | { ok: false; error: string }
> {
  const res = await apiFetch("/api/auth/challenge", {
    method: "POST",
    body: JSON.stringify({ walletAddress }),
  });
  const json = await readJson<AuthChallenge>(res);

  if (!res.ok || !json.challengeId || !json.message) {
    return { ok: false, error: json.error ?? "Challenge failed." };
  }

  return {
    ok: true,
    challenge: {
      challengeId: json.challengeId,
      message: json.message,
      expiresAt: json.expiresAt,
    },
  };
}

export async function verifyAuth(input: {
  challengeId: string;
  walletAddress: string;
  signedMessage: string;
}): Promise<{ ok: true; walletAddress: string } | { ok: false; error: string }> {
  const res = await apiFetch("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const json = await readJson<{ ok?: boolean; walletAddress?: string }>(res);

  if (!res.ok || !json.ok || !json.walletAddress) {
    return { ok: false, error: json.error ?? "Verification failed." };
  }

  return { ok: true, walletAddress: json.walletAddress };
}

/** Restore wallet session from the HttpOnly cookie via core `/api/auth/me`. */
export async function fetchAuthMe(): Promise<WalletSession | null> {
  try {
    const res = await apiFetch("/api/auth/me", { method: "GET" });
    if (!res.ok) return null;

    const json = await readJson<{
      auth?: string;
      walletAddress?: string;
    }>(res);

    if (json.auth === "wallet" && typeof json.walletAddress === "string") {
      return { auth: "wallet", walletAddress: json.walletAddress };
    }

    return null;
  } catch {
    return null;
  }
}

export async function logoutAuth(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Best-effort: still clear local UI state / redirect even if network fails.
  }
}

export function shortenAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
