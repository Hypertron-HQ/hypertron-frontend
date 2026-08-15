import { signMessage } from "@stellar/freighter-api";

const DERIVATION_MSG_VIEW = "hypertron.viewkey.v1";
const DERIVATION_MSG_SPEND = "hypertron.spendkey.v1";
const VIEW_CACHE_PREFIX = "ht_viewkey_v1:";
const SPEND_CACHE_PREFIX = "ht_spendkey_v1:";

export type ViewingKeypair = {
  viewSecret: string;
  viewPub: string;
};

/** Spend secret + public owner_pk = Poseidon(spend_sk, 0). */
export type SpendKeypair = {
  spendSecret: string;
  spendPub: string;
};

type ViewingKeyResult =
  | { ok: true; keys: ViewingKeypair }
  | { ok: false; error: string };

type SpendKeyResult =
  | { ok: true; keys: SpendKeypair }
  | { ok: false; error: string };

let viewMemoryCache: { wallet: string; keys: ViewingKeypair } | null = null;
let spendMemoryCache: { wallet: string; keys: SpendKeypair } | null = null;
let proverReady: Promise<void> | null = null;
const pendingViewDerivations = new Map<string, Promise<ViewingKeyResult>>();
const pendingSpendDerivations = new Map<string, Promise<SpendKeyResult>>();

function getWasmUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PROVER_WASM_URL?.trim() ||
    "/prover/hypertron_prover_bg.wasm"
  );
}

async function ensureProver(): Promise<void> {
  if (!proverReady) {
    const init = (await import("@hypertron/prover")).default;
    proverReady = init({ module_or_path: getWasmUrl() }).then(() => undefined);
  }
  await proverReady;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function encodeSignedPayload(signed: string | Uint8Array): Uint8Array {
  if (typeof signed !== "string") return signed;
  // Freighter may return base64 or hex; try base64 first.
  try {
    const bin = atob(signed);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    const clean = signed.startsWith("0x") ? signed.slice(2) : signed;
    if (/^[0-9a-fA-F]+$/.test(clean) && clean.length % 2 === 0) {
      const out = new Uint8Array(clean.length / 2);
      for (let i = 0; i < out.length; i++) {
        out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
      }
      return out;
    }
    return new TextEncoder().encode(signed);
  }
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return bytesToHex(new Uint8Array(digest));
}

function viewCacheGet(wallet: string): ViewingKeypair | null {
  if (viewMemoryCache?.wallet === wallet) return viewMemoryCache.keys;
  try {
    const raw = sessionStorage.getItem(VIEW_CACHE_PREFIX + wallet);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ViewingKeypair;
    if (!parsed?.viewSecret || !parsed?.viewPub) return null;
    viewMemoryCache = { wallet, keys: parsed };
    return parsed;
  } catch {
    return null;
  }
}

function viewCacheSet(wallet: string, keys: ViewingKeypair) {
  viewMemoryCache = { wallet, keys };
  try {
    sessionStorage.setItem(VIEW_CACHE_PREFIX + wallet, JSON.stringify(keys));
  } catch {
    /* private mode */
  }
}

function spendCacheGet(wallet: string): SpendKeypair | null {
  if (spendMemoryCache?.wallet === wallet) return spendMemoryCache.keys;
  try {
    const raw = sessionStorage.getItem(SPEND_CACHE_PREFIX + wallet);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SpendKeypair;
    if (!parsed?.spendSecret || !parsed?.spendPub) return null;
    spendMemoryCache = { wallet, keys: parsed };
    return parsed;
  } catch {
    return null;
  }
}

function spendCacheSet(wallet: string, keys: SpendKeypair) {
  spendMemoryCache = { wallet, keys };
  try {
    sessionStorage.setItem(SPEND_CACHE_PREFIX + wallet, JSON.stringify(keys));
  } catch {
    /* private mode */
  }
}

/**
 * Deterministic viewing key from Freighter signMessage.
 * view_secret never leaves the browser / never sent to APIs.
 */
export async function deriveViewingKey(
  walletAddress: string,
): Promise<ViewingKeyResult> {
  const cached = viewCacheGet(walletAddress);
  if (cached) return { ok: true, keys: cached };

  const existing = pendingViewDerivations.get(walletAddress);
  if (existing) return existing;

  const pending = (async (): Promise<ViewingKeyResult> => {
    try {
      await ensureProver();
      const signed = await signMessage(DERIVATION_MSG_VIEW, {
        address: walletAddress,
      });
      if (signed?.error || signed?.signedMessage == null) {
        return {
          ok: false,
          error:
            signed?.error?.message ??
            "Freighter did not sign the viewing-key message.",
        };
      }
      const seed = await sha256Hex(encodeSignedPayload(signed.signedMessage));
      const { keygen } = await import("@hypertron/prover");
      const parsed = JSON.parse(keygen(`0x${seed}`)) as {
        view_secret?: string;
        view_pub?: string;
      };
      if (!parsed.view_secret || !parsed.view_pub) {
        return { ok: false, error: "keygen returned an incomplete keypair." };
      }
      const keys: ViewingKeypair = {
        viewSecret: parsed.view_secret,
        viewPub: parsed.view_pub,
      };
      viewCacheSet(walletAddress, keys);
      return { ok: true, keys };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not derive viewing key.";
      return { ok: false, error: message };
    }
  })();

  pendingViewDerivations.set(walletAddress, pending);
  try {
    return await pending;
  } finally {
    if (pendingViewDerivations.get(walletAddress) === pending) {
      pendingViewDerivations.delete(walletAddress);
    }
  }
}

/**
 * Deterministic spend key from a separate Freighter signature.
 * spendSecret never leaves the browser; spendPub (= owner_pk) is safe to publish.
 */
export async function deriveSpendKey(
  walletAddress: string,
): Promise<SpendKeyResult> {
  const cached = spendCacheGet(walletAddress);
  if (cached) return { ok: true, keys: cached };

  const existing = pendingSpendDerivations.get(walletAddress);
  if (existing) return existing;

  const pending = (async (): Promise<SpendKeyResult> => {
    try {
      await ensureProver();
      const signed = await signMessage(DERIVATION_MSG_SPEND, {
        address: walletAddress,
      });
      if (signed?.error || signed?.signedMessage == null) {
        return {
          ok: false,
          error:
            signed?.error?.message ??
            "Freighter did not sign the spend-key message.",
        };
      }
      const seed = await sha256Hex(encodeSignedPayload(signed.signedMessage));
      const spendSecret = `0x${seed}`;
      const { owner_pk } = await import("@hypertron/prover");
      const spendPub = owner_pk(spendSecret);
      if (!spendPub) {
        return { ok: false, error: "owner_pk returned an empty public key." };
      }
      const keys: SpendKeypair = { spendSecret, spendPub };
      spendCacheSet(walletAddress, keys);
      return { ok: true, keys };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not derive spend key.";
      return { ok: false, error: message };
    }
  })();

  pendingSpendDerivations.set(walletAddress, pending);
  try {
    return await pending;
  } finally {
    if (pendingSpendDerivations.get(walletAddress) === pending) {
      pendingSpendDerivations.delete(walletAddress);
    }
  }
}

/**
 * Collect / top-up note secrets from spend key:
 * ownerPk = Poseidon(spend_sk, 0), k = SHA256(spendSecret|salt|k).
 */
export async function deriveNoteSecrets(
  spendSecret: string,
  salt: string,
): Promise<{ ownerPk: string; k: string }> {
  await ensureProver();
  const { owner_pk } = await import("@hypertron/prover");
  const ownerPk = owner_pk(spendSecret);
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(`${spendSecret}|${salt}|k`),
  );
  const k = `0x${bytesToHex(new Uint8Array(digest))}`;
  return { ownerPk, k };
}

export function randomSaltHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${bytesToHex(bytes)}`;
}

export function clearViewingKeyCache(walletAddress?: string) {
  if (walletAddress) {
    if (viewMemoryCache?.wallet === walletAddress) viewMemoryCache = null;
    try {
      sessionStorage.removeItem(VIEW_CACHE_PREFIX + walletAddress);
    } catch {
      /* ignore */
    }
    return;
  }
  viewMemoryCache = null;
}

export function clearSpendKeyCache(walletAddress?: string) {
  if (walletAddress) {
    if (spendMemoryCache?.wallet === walletAddress) spendMemoryCache = null;
    try {
      sessionStorage.removeItem(SPEND_CACHE_PREFIX + walletAddress);
    } catch {
      /* ignore */
    }
    return;
  }
  spendMemoryCache = null;
}
