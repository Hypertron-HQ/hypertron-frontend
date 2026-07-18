"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useCreateWallet } from "@privy-io/react-auth/extended-chains";
import { findPrivyStellarWallet } from "@/lib/privy-stellar-wallet";
import { useAppSession } from "@/hooks/useAppSession";

export type UsePrivyStellarWalletResult = {
  address: string | null;
  walletId: string | null;
  publicKey: string | null;
  isCreating: boolean;
  isReady: boolean;
  error: string | null;
  createWallet: () => Promise<string | null>;
  syncToServer: (address: string, walletId?: string | null) => Promise<void>;
};

async function postWalletToServer(address: string, walletId?: string | null): Promise<void> {
  await fetch("/api/auth/privy/wallet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      address,
      walletId: walletId ?? undefined,
    }),
  });
}

export function usePrivyStellarWallet(options?: { enabled?: boolean }): UsePrivyStellarWalletResult {
  const enabled = options?.enabled !== false;
  const { isPrivy, loading: sessionLoading } = useAppSession();
  const { ready, authenticated, user } = usePrivy();
  const { createWallet: privyCreateWallet } = useCreateWallet();

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncedAddressRef = useRef<string | null>(null);
  const creatingRef = useRef(false);

  const active = enabled && isPrivy && !sessionLoading;
  const wallet = active && ready && authenticated ? findPrivyStellarWallet(user) : null;
  const address = wallet?.address ?? null;
  const walletId = wallet?.id ?? null;
  const publicKey = wallet?.publicKey ?? null;
  const isReady = active && ready && authenticated;

  const syncToServer = useCallback(async (addr: string, id?: string | null) => {
    if (!addr) return;
    if (syncedAddressRef.current === addr) return;
    try {
      await postWalletToServer(addr, id);
      syncedAddressRef.current = addr;
    } catch {
      // Non-fatal; wallet still usable client-side via Privy.
    }
  }, []);

  const createWallet = useCallback(async (): Promise<string | null> => {
    if (!active || !ready || !authenticated) return null;
    if (creatingRef.current) return address;

    const existing = findPrivyStellarWallet(user);
    if (existing?.address) {
      await syncToServer(existing.address, existing.id);
      return existing.address;
    }

    creatingRef.current = true;
    setIsCreating(true);
    setError(null);

    try {
      const result = await privyCreateWallet({ chainType: "stellar" });
      const created = findPrivyStellarWallet(result.user) ?? findPrivyStellarWallet(user);
      const createdAddress = created?.address ?? null;
      if (!createdAddress) {
        setError("Wallet was created but no Stellar address was returned.");
        return null;
      }
      await syncToServer(createdAddress, created?.id);
      return createdAddress;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not create Stellar wallet.";
      setError(message);
      return null;
    } finally {
      creatingRef.current = false;
      setIsCreating(false);
    }
  }, [active, ready, authenticated, user, address, privyCreateWallet, syncToServer]);

  useEffect(() => {
    if (!isReady || !address) return;
    void syncToServer(address, walletId);
  }, [isReady, address, walletId, syncToServer]);

  return {
    address,
    walletId,
    publicKey,
    isCreating,
    isReady,
    error,
    createWallet,
    syncToServer,
  };
}
