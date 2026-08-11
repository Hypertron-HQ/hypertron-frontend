const STORAGE_KEY = "hypertron.mock.session";

export type MockSession = {
  walletAddress: string;
  signedInAt: string;
};

const MOCK_WALLET = "GMOCKHYPERTRONDEMOWALLETADDRESS000000000000000001";

export function createMockSession(): MockSession {
  const session: MockSession = {
    walletAddress: MOCK_WALLET,
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
