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
  getStellarNetwork,
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
    const networkLabel =
      getStellarNetwork() === "public" ? "public network" : "testnet";
    let account: Awaited<ReturnType<Horizon.Server["loadAccount"]>>;
    try {
      account = await server.loadAccount(input.sourceAddress);
    } catch (loadError) {
      if (horizonStatus(loadError) === 404) {
        return {
          ok: false,
          error: `This Freighter account is not on Stellar ${networkLabel} yet. Switch Freighter to that network and fund the account, then try again.`,
        };
      }
      throw loadError;
    }

    try {
      await server.loadAccount(destination);
    } catch (loadError) {
      if (horizonStatus(loadError) === 404) {
        return {
          ok: false,
          error: `The merchant receive address does not exist on Stellar ${networkLabel}. Fund ${destination}, then start a new checkout.`,
        };
      }
      throw loadError;
    }

    const currency = input.currency.toUpperCase();
    const balanceError = classicBalanceError(account, amount, currency);
    if (balanceError) return { ok: false, error: balanceError };

    const fee = await server.fetchBaseFee();
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
      .setTimeout(300)
      .build();

    return { ok: true, xdr: tx.toXDR() };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not build payment.";
    return { ok: false, error: message };
  }
}

function horizonStatus(error: unknown): number | undefined {
  if (
    !error ||
    typeof error !== "object" ||
    !("response" in error)
  ) {
    return undefined;
  }
  const status = (error as { response?: { status?: number } }).response?.status;
  return typeof status === "number" ? status : undefined;
}

function classicBalanceError(
  account: Awaited<ReturnType<Horizon.Server["loadAccount"]>>,
  amount: string,
  currency: string,
): string | null {
  if (currency === "XLM") {
    const native = account.balances.find((line) => line.asset_type === "native");
    if (!native) return "This Freighter account has no XLM balance.";
    const available = BigInt(toBaseUnits(native.balance));
    const payment = BigInt(toBaseUnits(amount));
    const reserve = BigInt(2 + account.subentry_count) * BigInt(5000000);
    if (available < payment + reserve) {
      return `Not enough XLM. This account has ${native.balance} XLM and must keep a minimum balance after the ${amount} XLM payment.`;
    }
    return null;
  }

  const line = account.balances.find(
    (entry) => "asset_code" in entry && entry.asset_code === currency,
  );
  if (!line || !("balance" in line)) {
    return `This Freighter account needs a ${currency} trustline before it can pay.`;
  }
  if (BigInt(toBaseUnits(line.balance)) < BigInt(toBaseUnits(amount))) {
    return `Not enough ${currency}. This account has ${line.balance} ${currency}.`;
  }
  return null;
}
