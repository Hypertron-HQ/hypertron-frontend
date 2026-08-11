import {
  Address,
  Contract,
  nativeToScVal,
  rpc,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";
import {
  getNetworkPassphrase,
  getPaymentPoolAddress,
  getSorobanRpcUrl,
} from "@/lib/stellar-network";

function strip0x(hex: string): string {
  return hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
}

function hexToUint8(hex: string): Uint8Array {
  const clean = strip0x(hex);
  if (clean.length % 2 !== 0) {
    throw new Error("Invalid hex length.");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Build, simulate, Freighter-sign, and send a pool `deposit` invoke.
 */
export async function submitPoolDeposit(input: {
  fromAddress: string;
  amountBaseUnits: string;
  commitmentHex: string;
  proofHex: string;
}): Promise<{ ok: true; hash: string } | { ok: false; error: string }> {
  try {
    const server = new rpc.Server(getSorobanRpcUrl(), { allowHttp: true });
    const account = await server.getAccount(input.fromAddress);
    const contract = new Contract(getPaymentPoolAddress());

    const amount = BigInt(input.amountBaseUnits);
    if (amount <= BigInt(0)) {
      return { ok: false, error: "Amount must be greater than zero." };
    }

    const commitment = hexToUint8(input.commitmentHex);
    const proof = hexToUint8(input.proofHex);
    if (commitment.length !== 32) {
      return { ok: false, error: "Commitment must be 32 bytes." };
    }

    const op = contract.call(
      "deposit",
      new Address(input.fromAddress).toScVal(),
      nativeToScVal(amount, { type: "i128" }),
      nativeToScVal(commitment, { type: "bytes" }),
      nativeToScVal(proof, { type: "bytes" }),
    );

    let tx = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(op)
      .setTimeout(180)
      .build();

    const simulated = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulated)) {
      return {
        ok: false,
        error: simulated.error || "Soroban simulation failed.",
      };
    }
    if (!rpc.Api.isSimulationSuccess(simulated)) {
      return { ok: false, error: "Soroban simulation did not succeed." };
    }

    tx = rpc.assembleTransaction(tx, simulated).build();

    const signed = await signTransaction(tx.toXDR(), {
      networkPassphrase: getNetworkPassphrase(),
      address: input.fromAddress,
    });

    if (signed?.error || !signed?.signedTxXdr) {
      return {
        ok: false,
        error:
          signed?.error?.message ??
          "Freighter did not return a signed transaction.",
      };
    }

    const sent = await server.sendTransaction(
      TransactionBuilder.fromXDR(signed.signedTxXdr, getNetworkPassphrase()),
    );

    if (sent.status === "ERROR") {
      return { ok: false, error: "Soroban submit failed." };
    }

    const hash = sent.hash;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const got = await server.getTransaction(hash);
      if (got.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return { ok: true, hash };
      }
      if (got.status === rpc.Api.GetTransactionStatus.FAILED) {
        return { ok: false, error: "Deposit transaction failed on-chain." };
      }
    }

    return { ok: true, hash };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not submit pool deposit.";
    return { ok: false, error: message };
  }
}
