import { Networks } from "@stellar/stellar-sdk";

export type StellarNetworkName = "testnet" | "public";

export function getStellarNetwork(): StellarNetworkName {
  const raw = process.env.NEXT_PUBLIC_STELLAR_NETWORK?.trim().toLowerCase();
  return raw === "public" || raw === "mainnet" ? "public" : "testnet";
}

export function getNetworkPassphrase(): string {
  return getStellarNetwork() === "public"
    ? Networks.PUBLIC
    : Networks.TESTNET;
}

export function getHorizonUrl(): string {
  const raw = process.env.NEXT_PUBLIC_HORIZON_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return getStellarNetwork() === "public"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";
}

export function getSorobanRpcUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return getStellarNetwork() === "public"
    ? "https://soroban-rpc.mainnet.stellar.gateway.fm"
    : "https://soroban-testnet.stellar.org";
}

export function getPaymentPoolAddress(): string {
  return (
    process.env.NEXT_PUBLIC_PAYMENT_POOL_ADDRESS?.trim() ||
    "CCXVZOJB67J7ZBQG2UTZCFJ3ZSAMDLSBB62B7KLZNNLO4WQDD3KX6BYP"
  );
}

/** StellarExpert base for the active network (`testnet` | `public`). */
export function getStellarExpertBaseUrl(): string {
  const network = getStellarNetwork() === "public" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${network}`;
}

export function getStellarExpertTxUrl(txHash: string): string {
  return `${getStellarExpertBaseUrl()}/tx/${encodeURIComponent(txHash)}`;
}

export function getStellarExpertContractUrl(contractId: string): string {
  return `${getStellarExpertBaseUrl()}/contract/${encodeURIComponent(contractId)}`;
}

export function getAssetIssuer(currency: string): string | null {
  const code = currency.toUpperCase();
  if (code === "USDC") {
    return process.env.NEXT_PUBLIC_USDC_ISSUER?.trim() || null;
  }
  if (code === "EURC") {
    return process.env.NEXT_PUBLIC_EURC_ISSUER?.trim() || null;
  }
  return null;
}

/** Stellar asset decimals (XLM / USDC / EURC on Stellar = 7). */
export const STELLAR_DECIMALS = 7;

/**
 * Convert a decimal display amount to integer base units (stroops / 7dp).
 * Returns integer string for contract/prover use.
 */
export function toBaseUnits(amount: string, decimals = STELLAR_DECIMALS): string {
  const normalized = amount.replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Invalid amount.");
  }
  const [wholePart, fracPart = ""] = normalized.split(".");
  if (fracPart.length > decimals) {
    throw new Error(`Amount supports at most ${decimals} decimal places.`);
  }
  const paddedFrac = fracPart.padEnd(decimals, "0");
  const combined = `${wholePart}${paddedFrac}`.replace(/^0+(?=\d)/, "");
  return combined || "0";
}

/**
 * Convert integer base units (stroops / 7dp) to decimal display amount.
 */
export function fromBaseUnits(
  baseUnits: string,
  decimals = STELLAR_DECIMALS,
): string {
  const raw = baseUnits.replace(/^0+(?=\d)/, "") || "0";
  if (raw.length <= decimals) {
    const padded = raw.padStart(decimals + 1, "0");
    const whole = padded.slice(0, padded.length - decimals);
    const frac = padded.slice(padded.length - decimals).replace(/0+$/, "");
    return frac ? `${whole}.${frac}` : whole;
  }
  const whole = raw.slice(0, raw.length - decimals);
  const frac = raw.slice(raw.length - decimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole;
}
