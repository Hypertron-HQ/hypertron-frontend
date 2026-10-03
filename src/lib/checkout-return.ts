import { getHorizonUrl } from "@/lib/stellar-network";

export function safeCheckoutReturnUrl(raw: string | null): string | null {
  if (!raw || raw.length > 2000) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  return url.toString();
}

export function checkoutReturnWithTx(returnUrl: string, txHash: string): string {
  const url = new URL(returnUrl);
  url.searchParams.set("tx", txHash);
  return url.toString();
}

export async function waitForSuccessfulTransaction(hash: string): Promise<boolean> {
  const horizon = getHorizonUrl();
  for (let attempt = 0; attempt < 15; attempt += 1) {
    try {
      const response = await fetch(`${horizon}/transactions/${encodeURIComponent(hash)}`);
      if (response.ok) {
        const json = (await response.json()) as { successful?: boolean };
        if (json.successful === true) return true;
        if (json.successful === false) return false;
      }
    } catch {
      // The transaction is not on Horizon until the ledger closes.
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return false;
}
