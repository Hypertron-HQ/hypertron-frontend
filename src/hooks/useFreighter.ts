/**
 * useFreighter – Stellar wallet for the active session.
 * - Wallet sign-in: Freighter browser extension + localStorage cache.
 * - Privy sign-in: embedded Stellar wallet via Privy (no Freighter state).
 */

import { useState, useCallback, useEffect } from "react";
import { getAddress, isConnected, requestAccess } from "@stellar/freighter-api";
import { useAppSession } from "@/hooks/useAppSession";
import { usePrivyStellarWallet } from "@/hooks/usePrivyStellarWallet";
import {
  FREIGHTER_DISCONNECTED_STORAGE_KEY,
  FREIGHTER_PUBLIC_KEY_STORAGE_KEY,
  FREIGHTER_STATE_EVENT,
} from "@/lib/freighter-storage";

const FREIGHTER_INSTALL_URL = "https://www.freighter.app/";

export interface UseFreighterResult {
  /** Current Stellar address when connected */
  publicKey: string | null;
  /** Connect to Freighter; prompts user to allow the site. Returns address or null on cancel/error */
  connect: () => Promise<string | null>;
  /** Disconnect (clear stored address in this app only) */
  disconnect: () => void;
  /** True while connect() is in progress */
  isConnecting: boolean;
  /** True if Freighter extension is available */
  isAvailable: boolean;
  /** Truncated address for display, e.g. "GABC...XYZ" */
  truncatedAddress: string | null;
  /** True when the address comes from a Privy embedded wallet (not Freighter). */
  isPrivyWallet: boolean;
}

function truncateAddress(addr: string, start = 4, end = 4): string {
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

function useFreighterExtension(enabled: boolean): UseFreighterResult {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const setStoredPublicKey = (value: string | null) => {
      if (value) {
        localStorage.setItem(FREIGHTER_PUBLIC_KEY_STORAGE_KEY, value);
        localStorage.removeItem(FREIGHTER_DISCONNECTED_STORAGE_KEY);
      } else {
        localStorage.removeItem(FREIGHTER_PUBLIC_KEY_STORAGE_KEY);
      }
      window.dispatchEvent(new CustomEvent(FREIGHTER_STATE_EVENT, { detail: { publicKey: value } }));
    };

    const onFreighterStateChanged = (e: Event) => {
      const event = e as CustomEvent<{ publicKey?: string | null }>;
      if (typeof event.detail?.publicKey === "string") {
        setPublicKey(event.detail.publicKey);
        return;
      }
      if (event.detail?.publicKey === null) {
        setPublicKey(null);
      }
    };
    window.addEventListener(FREIGHTER_STATE_EVENT, onFreighterStateChanged as EventListener);

    const disconnectedByUser = localStorage.getItem(FREIGHTER_DISCONNECTED_STORAGE_KEY) === "true";
    const cachedPublicKey = localStorage.getItem(FREIGHTER_PUBLIC_KEY_STORAGE_KEY);
    if (cachedPublicKey) setPublicKey(cachedPublicKey);

    const check = async () => {
      try {
        const res = await isConnected();
        setIsAvailable(res?.isConnected ?? false);
        if (res?.isConnected && !disconnectedByUser) {
          const addrRes = await getAddress();
          if (addrRes?.address && !addrRes?.error) {
            setPublicKey(addrRes.address);
            setStoredPublicKey(addrRes.address);
          }
        }
      } catch {
        setIsAvailable(false);
      }
    };
    void check();
    return () => {
      window.removeEventListener(FREIGHTER_STATE_EVENT, onFreighterStateChanged as EventListener);
    };
  }, [enabled]);

  const connect = useCallback(async (): Promise<string | null> => {
    if (!enabled || typeof window === "undefined") return null;
    setIsConnecting(true);
    try {
      const res = await requestAccess();
      if (res?.address && !res?.error) {
        setPublicKey(res.address);
        setIsAvailable(true);
        localStorage.setItem(FREIGHTER_PUBLIC_KEY_STORAGE_KEY, res.address);
        localStorage.removeItem(FREIGHTER_DISCONNECTED_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(FREIGHTER_STATE_EVENT, { detail: { publicKey: res.address } }));
        return res.address;
      }
      if (res?.error) {
        const msg = String(res.error?.message ?? res.error);
        if (
          msg.toLowerCase().includes("not installed") ||
          msg.toLowerCase().includes("freighter")
        ) {
          window.open(FREIGHTER_INSTALL_URL, "_blank");
        }
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.toLowerCase().includes("not installed") ||
        message.toLowerCase().includes("freighter")
      ) {
        window.open(FREIGHTER_INSTALL_URL, "_blank");
      }
      console.warn("Freighter connect error:", err);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [enabled]);

  const disconnect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    localStorage.removeItem(FREIGHTER_PUBLIC_KEY_STORAGE_KEY);
    localStorage.setItem(FREIGHTER_DISCONNECTED_STORAGE_KEY, "true");
    window.dispatchEvent(new CustomEvent(FREIGHTER_STATE_EVENT, { detail: { publicKey: null } }));
    setPublicKey(null);
  }, [enabled]);

  const truncatedAddress = publicKey ? truncateAddress(publicKey) : null;

  return {
    publicKey,
    connect,
    disconnect,
    isConnecting,
    isAvailable,
    truncatedAddress,
    isPrivyWallet: false,
  };
}

const idleWalletState: UseFreighterResult = {
  publicKey: null,
  connect: async () => null,
  disconnect: () => {},
  isConnecting: false,
  isAvailable: false,
  truncatedAddress: null,
  isPrivyWallet: false,
};

export function useFreighter(): UseFreighterResult {
  const { isPrivy, loading: sessionLoading } = useAppSession();
  const privyWallet = usePrivyStellarWallet({ enabled: isPrivy });
  const freighter = useFreighterExtension(!isPrivy && !sessionLoading);

  if (sessionLoading) {
    return idleWalletState;
  }

  if (isPrivy) {
    const address = privyWallet.address;
    return {
      publicKey: address,
      connect: privyWallet.createWallet,
      disconnect: () => {},
      isConnecting: privyWallet.isCreating,
      isAvailable: true,
      truncatedAddress: address ? truncateAddress(address) : null,
      isPrivyWallet: true,
    };
  }

  return freighter;
}
