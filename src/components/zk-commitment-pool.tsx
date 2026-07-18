"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signTransaction } from "@stellar/freighter-api";
import {
  fetchPoolState,
  prepareInitialize,
  prepareCommit,
  randomU256,
  getNetworkPassphrase,
  type PoolState,
  type StellarNetwork,
} from "@/lib/soroban-poolmanager";
import { getPoolExplorerContractUrl, getPoolManagerContractId } from "@/lib/privacy-features";

const NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet") as StellarNetwork;
const CONTRACT_ID = getPoolManagerContractId();

/** Stellar classic account (G...) required for Soroban getAccount. */
function isValidStellarAccountId(value: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(value) === true;
}

function normalizePoolError(message: string): string {
  if (message.includes("accountId is invalid") || message.includes("accountId is an M-address")) {
    return "Use a standard Stellar account (G...). Muxed accounts (M...) are not supported for this action.";
  }
  if (message.includes("Account not found")) {
    return NETWORK === "testnet"
      ? "Account not found on this network. Fund it with testnet XLM first (e.g. via Friendbot)."
      : "Account not found on this network. Fund this account with XLM on mainnet first.";
  }
  return message;
}

async function signWithFreighter(xdr: string, address: string): Promise<string> {
  const result = await signTransaction(xdr, {
    networkPassphrase: getNetworkPassphrase(NETWORK),
    address,
  });
  if (result?.error || !result?.signedTxXdr) {
    throw new Error(result?.error?.message ?? "Wallet declined or signing failed");
  }
  return result.signedTxXdr;
}

interface ZkCommitmentPoolProps {
  /** Connected wallet public key (for init + commit). */
  publicKey: string;
}

export function ZkCommitmentPool({ publicKey }: ZkCommitmentPoolProps) {
  const [poolState, setPoolState] = useState<PoolState | null | "loading">("loading");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<"idle" | "signing" | "sending" | "success" | "error">("idle");
  const [txMessage, setTxMessage] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    if (!CONTRACT_ID) {
      setPoolState(null);
      setError("NEXT_PUBLIC_POOLMANAGER_CONTRACT_ID not set");
      return;
    }
    setError(null);
    setPoolState("loading");
    try {
      const state = await fetchPoolState(CONTRACT_ID, NETWORK);
      setPoolState(state);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPoolState(null);
    }
  }, []);

  useEffect(() => {
    loadState();
  }, [loadState]);

  async function handleInitialize() {
    if (!CONTRACT_ID || !publicKey) return;
    if (!isValidStellarAccountId(publicKey)) {
      setTxMessage("Use a standard Stellar account (G...). This wallet address format is not supported.");
      setTxStatus("error");
      return;
    }
    setTxStatus("signing");
    setTxMessage(null);
    try {
      const prep = await prepareInitialize(CONTRACT_ID, NETWORK, publicKey);
      if (!prep.success) {
        setTxMessage(normalizePoolError(prep.error));
        setTxStatus("error");
        return;
      }
      const signedXdr = await signWithFreighter(prep.xdr, publicKey);
      setTxStatus("sending");
      const send = await prep.signAndSend(signedXdr);
      if (!send.success) {
        setTxMessage(normalizePoolError(send.error));
        setTxStatus("error");
        return;
      }
      setTxMessage(`Initialized. Tx: ${send.hash}`);
      setTxStatus("success");
      await loadState();
    } catch (e) {
      setTxMessage(normalizePoolError(e instanceof Error ? e.message : String(e)));
      setTxStatus("error");
    }
  }

  async function handleAddCommitment() {
    if (!CONTRACT_ID || !publicKey) return;
    if (!isValidStellarAccountId(publicKey)) {
      setTxMessage("Use a standard Stellar account (G...). This wallet address format is not supported.");
      setTxStatus("error");
      return;
    }
    setTxStatus("signing");
    setTxMessage(null);
    try {
      const secret = randomU256();
      const nullifier = randomU256();
      const prep = await prepareCommit(CONTRACT_ID, NETWORK, publicKey, secret, nullifier);
      if (!prep.success) {
        setTxMessage(normalizePoolError(prep.error));
        setTxStatus("error");
        return;
      }
      const signedXdr = await signWithFreighter(prep.xdr, publicKey);
      setTxStatus("sending");
      const send = await prep.signAndSend(signedXdr);
      if (!send.success) {
        setTxMessage(normalizePoolError(send.error));
        setTxStatus("error");
        return;
      }
      setTxMessage(`Verified. Tx: ${send.hash}`);
      setTxStatus("success");
      await loadState();
    } catch (e) {
      setTxMessage(normalizePoolError(e instanceof Error ? e.message : String(e)));
      setTxStatus("error");
    }
  }

  if (!CONTRACT_ID) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Secure vault</CardTitle>
          <CardDescription>
            Configure the secure vault in .env to use this feature.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Secure vault</CardTitle>
        <CardDescription>
          Balance ledger for verified payments. Used internally for payment verification and withdrawals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {poolState === "loading" && <p className="text-muted-foreground text-sm">Loading…</p>}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {poolState && poolState !== "loading" && (
          <div className="text-sm space-y-2">
            <p>
              <span className="text-muted-foreground">Verified entries:</span> {poolState.size}
            </p>
            <p className="text-xs text-muted-foreground">
              <a
                href={getPoolExplorerContractUrl(NETWORK)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                View on Stellar Expert
              </a>
            </p>
          </div>
        )}
        {poolState !== "loading" && poolState === null && (
          <Button onClick={handleInitialize} disabled={txStatus === "signing" || txStatus === "sending"}>
            {txStatus === "signing" ? "Approve in Freighter…" : txStatus === "sending" ? "Sending…" : "Initialize vault"}
          </Button>
        )}
        {poolState && poolState !== "loading" && poolState !== null && (
          <Button onClick={handleAddCommitment} disabled={txStatus === "signing" || txStatus === "sending"}>
            {txStatus === "signing" ? "Approve in Freighter…" : txStatus === "sending" ? "Sending…" : "Add verified entry"}
          </Button>
        )}
        {(txStatus === "success" || txStatus === "error") && txMessage && (
          <p className={txStatus === "error" ? "text-destructive text-sm" : "text-muted-foreground text-sm"}>
            {txStatus === "success" ? "Verification complete." : null} {txMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
