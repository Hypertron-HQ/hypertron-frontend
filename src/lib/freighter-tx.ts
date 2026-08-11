import {
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import { getHorizonUrl, getNetworkPassphrase } from "@/lib/stellar-network";

export type FreighterWallet =
  | { ok: true; address: string }
  | { ok: false; error: string; needsInstall?: boolean };

export async function connectFreighterWallet(): Promise<FreighterWallet> {
  try {
    const connected = await isConnected();
    if (!connected?.isConnected) {
      return {
        ok: false,
        error: "Install the Freighter browser extension to continue.",
        needsInstall: true,
      };
    }
  } catch {
    return {
      ok: false,
      error: "Install the Freighter browser extension to continue.",
      needsInstall: true,
    };
  }

  const access = await requestAccess();
  if (access?.error || !access?.address) {
    return {
      ok: false,
      error: access?.error?.message ?? "Could not get wallet address.",
    };
  }
  return { ok: true, address: access.address };
}

export async function signAndSubmitXdr(xdr: string): Promise<
  | { ok: true; hash: string }
  | { ok: false; error: string }
> {
  let signed: Awaited<ReturnType<typeof signTransaction>>;
  try {
    signed = await signTransaction(xdr, {
      networkPassphrase: getNetworkPassphrase(),
    });
  } catch {
    return { ok: false, error: "Freighter signing was cancelled or failed." };
  }

  if (signed?.error || !signed?.signedTxXdr) {
    return {
      ok: false,
      error: signed?.error?.message ?? "Freighter did not return a signed transaction.",
    };
  }

  const res = await fetch(`${getHorizonUrl()}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ tx: signed.signedTxXdr }),
  });

  const json = (await res.json().catch(() => ({}))) as {
    hash?: string;
    title?: string;
    detail?: string;
    extras?: { result_codes?: { transaction?: string; operations?: string[] } };
  };

  if (!res.ok || !json.hash) {
    const opCodes = json.extras?.result_codes?.operations?.join(", ");
    const detail =
      json.detail ||
      opCodes ||
      json.extras?.result_codes?.transaction ||
      json.title ||
      "Transaction submission failed.";
    return { ok: false, error: detail };
  }

  return { ok: true, hash: json.hash };
}
