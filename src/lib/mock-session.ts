const STORAGE_KEY = "hypertron.mock.session";

export type MockSession = {
  walletAddress: string;
  signedInAt: string;
};

/**
 * TODO(auth):
 * - Replace this localStorage session with a real authenticated user from the backend
 *   (e.g. GET /api/auth/me or /user) after Freighter challenge + message signing lands.
 * - Dashboard identity (sidebar wallet) should read from that server response, not
 *   localStorage — localStorage stays only as a Freighter reconnect / UX cache.
 * - Until then, createMockSession / getMockSession are a temporary client-only stand-in.
 */
export function createMockSession(walletAddress: string): MockSession {
  const session: MockSession = {
    walletAddress,
    signedInAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  return session;
}

export function getMockSession(): MockSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MockSession;
    if (!parsed?.walletAddress) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearMockSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function shortenAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
