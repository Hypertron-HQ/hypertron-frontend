"use client";

import { useEffect, useRef } from "react";
import { useAppSession } from "@/hooks/useAppSession";
import { usePrivyStellarWallet } from "@/hooks/usePrivyStellarWallet";
import { clearFreighterLocalState } from "@/lib/freighter-storage";

/**
 * Privy sessions use embedded Stellar wallets — never Freighter local state.
 * Auto-provisions a Stellar wallet after Privy login when one does not exist.
 */
export function PrivyStellarWalletSync() {
  const { isPrivy, loading: sessionLoading } = useAppSession();
  const { address, isReady, isCreating, createWallet } = usePrivyStellarWallet({
    enabled: isPrivy,
  });
  const clearedFreighterRef = useRef(false);
  const provisionedRef = useRef(false);

  useEffect(() => {
    if (!isPrivy || sessionLoading) return;
    if (clearedFreighterRef.current) return;
    clearedFreighterRef.current = true;
    clearFreighterLocalState();
  }, [isPrivy, sessionLoading]);

  useEffect(() => {
    if (!isPrivy || sessionLoading || !isReady) return;
    if (address || isCreating || provisionedRef.current) return;
    provisionedRef.current = true;
    void createWallet();
  }, [isPrivy, sessionLoading, isReady, address, isCreating, createWallet]);

  return null;
}
