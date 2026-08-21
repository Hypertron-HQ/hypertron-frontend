import {
  Address,
  Contract,
  nativeToScVal,
  hash,
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

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * recipient_field = sha256(xdr(ScVal::Address)) — the contract derives this
 * public input itself via `Address::to_xdr`, which serializes the whole ScVal.
 * Hashing the bare ScAddress instead drops the 4-byte discriminant and the
 * proof fails to verify.
 */
export function recipientFieldHex(stellarAddress: string): string {
  const addr = Address.fromString(stellarAddress);
  const xdrBytes = addr.toScVal().toXDR("raw");
  const digest = hash(xdrBytes);
  return `0x${bytesToHex(digest instanceof Uint8Array ? digest : new Uint8Array(digest))}`;
}

/** Map on-chain HostError codes to something a payer can act on. */
export function formatPoolHostError(raw: string): string {
  if (/Error\(Contract, #4\)/.test(raw) && /insert/i.test(raw)) {
    return (
      "This deposit note is already in the pool (duplicate leaf). " +
      "If you just shielded, wait for confirmation. Otherwise try a new deposit amount."
    );
  }
  if (/Error\(Contract, #4\)/.test(raw)) {
    return (
      "The pool rejected this as a duplicate (nullifier or leaf already used). " +
      "If you already paid this link, it succeeded. Otherwise generate a new link."
    );
  }
  if (/Error\(Contract, #5\)/.test(raw)) {
    return (
      "The pool rejected the ZK proof. The proving keys in this app do not " +
      "match the verifying key registered on this contract."
    );
  }
  return raw;
}

async function signAndSend(
  fromAddress: string,
  buildOp: (contract: Contract) => ReturnType<Contract["call"]>,
): Promise<{ ok: true; hash: string } | { ok: false; error: string }> {
  try {
    const server = new rpc.Server(getSorobanRpcUrl(), { allowHttp: true });
    const account = await server.getAccount(fromAddress);
    const contract = new Contract(getPaymentPoolAddress());

    let tx = new TransactionBuilder(account, {
      fee: "100000",
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(buildOp(contract))
      .setTimeout(180)
      .build();

    const simulated = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulated)) {
      return {
        ok: false,
        error: formatPoolHostError(
          simulated.error || "Soroban simulation failed.",
        ),
      };
    }
    if (!rpc.Api.isSimulationSuccess(simulated)) {
      return { ok: false, error: "Soroban simulation did not succeed." };
    }

    tx = rpc.assembleTransaction(tx, simulated).build();

    const signed = await signTransaction(tx.toXDR(), {
      networkPassphrase: getNetworkPassphrase(),
      address: fromAddress,
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

    const txHash = sent.hash;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const got = await server.getTransaction(txHash);
      if (got.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return { ok: true, hash: txHash };
      }
      if (got.status === rpc.Api.GetTransactionStatus.FAILED) {
        return { ok: false, error: "Transaction failed on-chain." };
      }
    }

    return { ok: true, hash: txHash };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not submit transaction.";
    return { ok: false, error: formatPoolHostError(message) };
  }
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
  const amount = BigInt(input.amountBaseUnits);
  if (amount <= BigInt(0)) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  const commitment = hexToUint8(input.commitmentHex);
  const proof = hexToUint8(input.proofHex);
  if (commitment.length !== 32) {
    return { ok: false, error: "Commitment must be 32 bytes." };
  }

  return signAndSend(input.fromAddress, (contract) =>
    contract.call(
      "deposit",
      new Address(input.fromAddress).toScVal(),
      nativeToScVal(amount, { type: "i128" }),
      nativeToScVal(commitment, { type: "bytes" }),
      nativeToScVal(proof, { type: "bytes" }),
    ),
  );
}

export type PrivacyLevelClaim = {
  sender: boolean;
  receiver: boolean;
  amount: boolean;
  timing: boolean;
  linkability: boolean;
};

/** Honest unshield claim — amount is public on exit. */
export const UNSHIELD_PRIVACY_CLAIM: PrivacyLevelClaim = {
  sender: true,
  receiver: false,
  amount: false,
  timing: false,
  linkability: true,
};

/**
 * A Soroban `#[contracttype]` struct is a map keyed by Symbol. Without this
 * spec the SDK encodes the field names as String and the host traps in
 * `map_unpack_to_linear_memory` with `Error(Value, UnexpectedType)`.
 */
function privacyLevelToScVal(claim: PrivacyLevelClaim) {
  return nativeToScVal(claim, {
    type: {
      sender: ["symbol", "bool"],
      receiver: ["symbol", "bool"],
      amount: ["symbol", "bool"],
      timing: ["symbol", "bool"],
      linkability: ["symbol", "bool"],
    },
  });
}

/**
 * Permissionless unshield: proof binds recipient + amount.
 */
export async function submitPoolUnshield(input: {
  fromAddress: string;
  proofHex: string;
  rootHex: string;
  nullifierHex: string;
  recipientAddress: string;
  amountBaseUnits: string;
  changeCommitmentHex: string;
  claim?: PrivacyLevelClaim;
}): Promise<{ ok: true; hash: string } | { ok: false; error: string }> {
  const amount = BigInt(input.amountBaseUnits);
  if (amount <= BigInt(0)) {
    return { ok: false, error: "Amount must be greater than zero." };
  }

  const proof = hexToUint8(input.proofHex);
  const root = hexToUint8(input.rootHex);
  const nullifier = hexToUint8(input.nullifierHex);
  const changeCm = hexToUint8(input.changeCommitmentHex);
  if (root.length !== 32 || nullifier.length !== 32 || changeCm.length !== 32) {
    return { ok: false, error: "Root, nullifier, and change commitment must be 32 bytes." };
  }

  const claim = input.claim ?? UNSHIELD_PRIVACY_CLAIM;

  return signAndSend(input.fromAddress, (contract) =>
    contract.call(
      "unshield",
      nativeToScVal(proof, { type: "bytes" }),
      nativeToScVal(root, { type: "bytes" }),
      nativeToScVal(nullifier, { type: "bytes" }),
      new Address(input.recipientAddress).toScVal(),
      nativeToScVal(amount, { type: "i128" }),
      nativeToScVal(changeCm, { type: "bytes" }),
      privacyLevelToScVal(claim),
    ),
  );
}

/**
 * Private transfer: spend one note, create two new notes (recipient + change).
 * Amount is NOT visible on-chain.
 */
export async function submitPoolTransfer(input: {
  fromAddress: string;
  proofHex: string;
  rootHex: string;
  nullifierHex: string;
  outCommitment1Hex: string;
  outCommitment2Hex: string;
  note1BlobHex: string;
  note2BlobHex: string;
}): Promise<{ ok: true; hash: string } | { ok: false; error: string }> {
  const proof = hexToUint8(input.proofHex);
  const root = hexToUint8(input.rootHex);
  const nullifier = hexToUint8(input.nullifierHex);
  const outCm1 = hexToUint8(input.outCommitment1Hex);
  const outCm2 = hexToUint8(input.outCommitment2Hex);
  const note1 = hexToUint8(input.note1BlobHex);
  const note2 = hexToUint8(input.note2BlobHex);

  if (root.length !== 32 || nullifier.length !== 32) {
    return { ok: false, error: "Root and nullifier must be 32 bytes." };
  }
  if (outCm1.length !== 32 || outCm2.length !== 32) {
    return { ok: false, error: "Output commitments must be 32 bytes." };
  }

  return signAndSend(input.fromAddress, (contract) =>
    contract.call(
      "transfer",
      nativeToScVal(proof, { type: "bytes" }),
      nativeToScVal(root, { type: "bytes" }),
      nativeToScVal(nullifier, { type: "bytes" }),
      nativeToScVal(outCm1, { type: "bytes" }),
      nativeToScVal(outCm2, { type: "bytes" }),
      nativeToScVal(note1, { type: "bytes" }),
      nativeToScVal(note2, { type: "bytes" }),
    ),
  );
}

/**
 * Private N-in / 2-out transfer (2 or 4 spent notes). Amount is NOT visible.
 */
export async function submitPoolTransferN(input: {
  fromAddress: string;
  proofHex: string;
  rootHex: string;
  nullifierHexes: string[];
  outCommitment1Hex: string;
  outCommitment2Hex: string;
  note1BlobHex: string;
  note2BlobHex: string;
}): Promise<{ ok: true; hash: string } | { ok: false; error: string }> {
  const n = input.nullifierHexes.length;
  if (n !== 2 && n !== 4) {
    return { ok: false, error: "transfer_n requires 2 or 4 nullifiers." };
  }
  const proof = hexToUint8(input.proofHex);
  const root = hexToUint8(input.rootHex);
  const nullifiers = input.nullifierHexes.map(hexToUint8);
  const outCm1 = hexToUint8(input.outCommitment1Hex);
  const outCm2 = hexToUint8(input.outCommitment2Hex);
  const note1 = hexToUint8(input.note1BlobHex);
  const note2 = hexToUint8(input.note2BlobHex);

  if (root.length !== 32 || nullifiers.some((nf) => nf.length !== 32)) {
    return { ok: false, error: "Root and nullifiers must be 32 bytes." };
  }
  if (outCm1.length !== 32 || outCm2.length !== 32) {
    return { ok: false, error: "Output commitments must be 32 bytes." };
  }

  return signAndSend(input.fromAddress, (contract) =>
    contract.call(
      "transfer_n",
      nativeToScVal(proof, { type: "bytes" }),
      nativeToScVal(root, { type: "bytes" }),
      nativeToScVal(nullifiers),
      nativeToScVal(outCm1, { type: "bytes" }),
      nativeToScVal(outCm2, { type: "bytes" }),
      nativeToScVal(note1, { type: "bytes" }),
      nativeToScVal(note2, { type: "bytes" }),
    ),
  );
}
