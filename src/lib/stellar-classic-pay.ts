import {
  Asset,
  Horizon,
  Memo,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import {
  getAssetIssuer,
  getHorizonUrl,
  getNetworkPassphrase,
  toBaseUnits,
} from "@/lib/stellar-network";

export async function buildClassicPaymentXdr(input: {
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  currency: string;
  memo: string;
}): Promise<{ ok: true; xdr: string } | { ok: false; error: string }> {
  try {
    const amount = input.amount.replace(/,/g, "").trim();
    if (!amount || Number(amount) <= 0) {
      return { ok: false, error: "Amount must be greater than zero." };
    }

    const destination = input.destinationAddress.trim();
    if (!destination.startsWith("G") || destination.length !== 56) {
      return {
        ok: false,
        error:
          "Classic payments must go to the merchant’s Freighter wallet (G…). This link points at a contract/pool — create a new link with Private Settlement OFF, or set a receive address.",
      };
    }

    const server = new Horizon.Server(getHorizonUrl());
    let account: Awaited<ReturnType<Horizon.Server["loadAccount"]>>;
    try {
      account = await server.loadAccount(input.sourceAddress);
    } catch (loadError) {
      const status =
        loadError &&
        typeof loadError === "object" &&
        "response" in loadError &&
        (loadError as { response?: { status?: number } }).response?.status;
      if (status === 404) {
        return {
          ok: false,
          error:
            "This Freighter account is not on Stellar testnet yet. Open Freighter → Testnet, then fund it via Friendbot (laboratory.stellar.org → Account Creator), and try again.",
        };
      }
      throw loadError;
    }
    const fee = await server.fetchBaseFee();

    const currency = input.currency.toUpperCase();
    let asset = Asset.native();
    if (currency !== "XLM") {
      const issuer = getAssetIssuer(currency);
      if (!issuer) {
        return {
          ok: false,
          error: `Missing issuer for ${currency}. Set NEXT_PUBLIC_${currency}_ISSUER.`,
        };
      }
      asset = new Asset(currency, issuer);
    }

    // Validate precision against Stellar 7dp without changing user display amount.
    toBaseUnits(amount);

    const tx = new TransactionBuilder(account, {
      fee: String(fee),
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(
        Operation.payment({
          destination,
          asset,
          amount,
        }),
      )
      .addMemo(Memo.text(input.memo))
      .setTimeout(180)
      .build();

    return { ok: true, xdr: tx.toXDR() };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not build payment.";
    return { ok: false, error: message };
  }
}
