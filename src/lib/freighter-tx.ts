import {
  getNetwork,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import {
  getHorizonUrl,
  getNetworkPassphrase,
  getStellarNetwork,
} from "@/lib/stellar-network";

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

export async function signAndSubmitXdr(
  xdr: string,
  address?: string,
): Promise<{ ok: true; hash: string } | { ok: false; error: string }> {
  const expectedPassphrase = getNetworkPassphrase();
  const networkName = getStellarNetwork() === "public" ? "Mainnet" : "Testnet";
  const freighterNetwork = await getNetwork();
  if (
    freighterNetwork.error ||
    freighterNetwork.networkPassphrase !== expectedPassphrase
  ) {
    return {
      ok: false,
      error: `Switch Freighter to ${networkName}, then pay again. This checkout submits to Stellar ${networkName}.`,
    };
  }

  let signed: Awaited<ReturnType<typeof signTransaction>>;
  try {
    signed = await signTransaction(xdr, {
      networkPassphrase: expectedPassphrase,
      address,
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

  if (
    address &&
    signed.signerAddress &&
    signed.signerAddress !== address
  ) {
    return {
      ok: false,
      error: `Freighter signed with ${signed.signerAddress}, not the connected account. Select that account in Freighter and pay again.`,
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
    return { ok: false, error: explainHorizonFailure(json) };
  }

  return { ok: true, hash: json.hash };
}

function explainHorizonFailure(json: {
  title?: string;
  detail?: string;
  extras?: { result_codes?: { transaction?: string; operations?: string[] } };
}): string {
  const txCode = json.extras?.result_codes?.transaction;
  const opCodes = (json.extras?.result_codes?.operations ?? []).filter(
    (code) => code && code !== "op_success",
  );

  if (txCode === "tx_bad_auth") {
    return "Freighter signed this for a different network or account. Switch Freighter to the same network as checkout and pay again.";
  }
  if (txCode === "tx_bad_seq") {
    return "The wallet sequence changed before Stellar accepted this payment. Pay again.";
  }
  if (txCode === "tx_too_late") {
    return "The payment expired while waiting for the Freighter signature. Pay again.";
  }
  if (txCode === "tx_insufficient_fee") {
    return "Stellar rejected the transaction fee. Pay again.";
  }
  if (opCodes.includes("op_underfunded")) {
    return "This Freighter account cannot cover the payment and still leave the minimum XLM balance.";
  }
  if (opCodes.includes("op_no_destination")) {
    return "The merchant receive address does not exist on this Stellar network. Fund that account, then start a new checkout.";
  }
  if (opCodes.includes("op_no_trust")) {
    return "This Freighter account has no trustline for the payment asset.";
  }

  const codes = [txCode, ...opCodes].filter(Boolean).join(", ");
  if (codes) return `Stellar rejected the payment (${codes}).`;
  return json.detail || json.title || "Transaction submission failed.";
}
