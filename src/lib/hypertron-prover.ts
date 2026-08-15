import { proveInWorker } from "@/lib/prover-worker-client";
import { toBaseUnits } from "@/lib/stellar-network";

let ready: Promise<void> | null = null;

function getDepositPkUrl(): string {
  return process.env.NEXT_PUBLIC_DEPOSIT_PK_URL?.trim() || "/keys/deposit.pk.bin";
}

function getUnshieldPkUrl(): string {
  return (
    process.env.NEXT_PUBLIC_UNSHIELD_PK_URL?.trim() || "/keys/unshield.pk.bin"
  );
}

function getTransferPkUrl(): string {
  return (
    process.env.NEXT_PUBLIC_TRANSFER_PK_URL?.trim() || "/keys/transfer.pk.bin"
  );
}

function getTransfer2PkUrl(): string {
  return (
    process.env.NEXT_PUBLIC_TRANSFER_2_PK_URL?.trim() ||
    "/keys/transfer-2.pk.bin"
  );
}

function getTransfer4PkUrl(): string {
  return (
    process.env.NEXT_PUBLIC_TRANSFER_4_PK_URL?.trim() ||
    "/keys/transfer-4.pk.bin"
  );
}

function getWasmUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PROVER_WASM_URL?.trim() ||
    "/prover/hypertron_prover_bg.wasm"
  );
}

export async function ensureProverReady(): Promise<void> {
  if (!ready) {
    const init = (await import("@hypertron/prover")).default;
    ready = init({ module_or_path: getWasmUrl() }).then(() => undefined);
  }
  await ready;
}

function randomFieldElementHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `0x${hex}`;
}

export type DepositProofResult = {
  ownerPk: string;
  k: string;
  amountBaseUnits: string;
  commitment: string;
  proof: string;
};

export async function buildDepositProof(
  displayAmount: string,
  secrets: { ownerPk: string; k: string },
): Promise<
  { ok: true; result: DepositProofResult } | { ok: false; error: string }
> {
  try {
    const amountBaseUnits = toBaseUnits(displayAmount);
    if (amountBaseUnits === "0") {
      return { ok: false, error: "Amount must be greater than zero." };
    }

    const { ownerPk, k } = secrets;

    const proved = await proveInWorker(
      "deposit",
      getDepositPkUrl(),
      JSON.stringify({ owner_pk: ownerPk, k, amount: amountBaseUnits }),
    );
    if (!proved.ok) return { ok: false, error: proved.error };

    const out = JSON.parse(proved.resultJson) as {
      commitment?: string;
      proof?: string;
      public_inputs?: string[];
    };

    const commitment = out.commitment || out.public_inputs?.[0] || "";
    const proof = out.proof || "";
    if (!commitment || !proof) {
      return { ok: false, error: "Prover returned an incomplete deposit proof." };
    }

    return {
      ok: true,
      result: {
        ownerPk,
        k,
        amountBaseUnits,
        commitment,
        proof,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not build deposit proof.";
    return { ok: false, error: message };
  }
}

export type UnshieldProofResult = {
  root: string;
  nullifier: string;
  changeCm: string;
  proof: string;
  amountBaseUnits: string;
  changeK: string;
};

/**
 * Full-amount unshield (change value = 0). Leaves must be the full ordered tree.
 * Requires spend_sk — viewing decrypt alone cannot unshield.
 */
export async function buildUnshieldProof(input: {
  spendSk: string;
  k: string;
  amountBaseUnits: string;
  leafIndex: number;
  leaves: string[];
  recipientFieldHex: string;
  changeK?: string;
}): Promise<
  { ok: true; result: UnshieldProofResult } | { ok: false; error: string }
> {
  try {
    if (input.leafIndex < 0 || input.leafIndex >= input.leaves.length) {
      return { ok: false, error: "Leaf index is out of range for the tree." };
    }

    const changeK = input.changeK ?? randomFieldElementHex();

    const proved = await proveInWorker(
      "unshield",
      getUnshieldPkUrl(),
      JSON.stringify({
        spend_sk: input.spendSk,
        k: input.k,
        v: input.amountBaseUnits,
        index: input.leafIndex,
        leaves: input.leaves,
        recipient_field: input.recipientFieldHex,
        amount: input.amountBaseUnits,
        change_k: changeK,
      }),
    );
    if (!proved.ok) return { ok: false, error: proved.error };

    const out = JSON.parse(proved.resultJson) as {
      root?: string;
      nullifier?: string;
      change_cm?: string;
      proof?: string;
      public_inputs?: string[];
    };

    const root = out.root || out.public_inputs?.[0] || "";
    const nullifier = out.nullifier || out.public_inputs?.[1] || "";
    const changeCm = out.change_cm || out.public_inputs?.[4] || "";
    const proof = out.proof || "";
    if (!root || !nullifier || !changeCm || !proof) {
      return {
        ok: false,
        error: "Prover returned an incomplete unshield proof.",
      };
    }

    return {
      ok: true,
      result: {
        root,
        nullifier,
        changeCm,
        proof,
        amountBaseUnits: input.amountBaseUnits,
        changeK,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not build unshield proof.";
    return { ok: false, error: message };
  }
}

/** Nullifier nf = Poseidon(spend_sk, k). Requires spend secret — not recoverable from a viewing decrypt. */
export async function computeNullifier(
  spendSk: string,
  k: string,
): Promise<string> {
  await ensureProverReady();
  const { nullifier } = await import("@hypertron/prover");
  return nullifier(spendSk, k);
}

export type TransferProofResult = {
  root: string;
  nullifier: string;
  outCm1: string;
  outCm2: string;
  proof: string;
  recipientBlob: string;
  changeBlob: string;
  out1: { ownerPk: string; k: string; v: string };
  out2: { ownerPk: string; k: string; v: string };
};

/**
 * Build a private transfer proof: spend one note, produce two outputs.
 * out1 = recipient note (owner_pk = recipient spendPub, encrypted to recipientViewPub)
 * out2 = change note (owner_pk = self spendPub, encrypted to selfViewPub)
 */
export async function buildTransferProof(input: {
  spendSk: string;
  k: string;
  v: string;
  leafIndex: number;
  leaves: string[];
  out1OwnerPk: string;
  out1V: string;
  out2OwnerPk: string;
  out2V: string;
  recipientViewPub: string;
  selfViewPub: string;
}): Promise<
  { ok: true; result: TransferProofResult } | { ok: false; error: string }
> {
  try {
    if (input.leafIndex < 0 || input.leafIndex >= input.leaves.length) {
      return { ok: false, error: "Leaf index is out of range for the tree." };
    }

    const out1K = randomFieldElementHex();
    const out2K = randomFieldElementHex();

    const proved = await proveInWorker(
      "transfer",
      getTransferPkUrl(),
      JSON.stringify({
        spend_sk: input.spendSk,
        k: input.k,
        v: input.v,
        index: input.leafIndex,
        leaves: input.leaves,
        out1_owner_pk: input.out1OwnerPk,
        out1_k: out1K,
        out1_v: input.out1V,
        out2_owner_pk: input.out2OwnerPk,
        out2_k: out2K,
        out2_v: input.out2V,
        recipient_view: input.recipientViewPub,
        self_view: input.selfViewPub,
      }),
    );
    if (!proved.ok) return { ok: false, error: proved.error };

    const out = JSON.parse(proved.resultJson) as {
      root?: string;
      nullifier?: string;
      out_cm1?: string;
      out_cm2?: string;
      proof?: string;
      recipient_blob?: string;
      change_blob?: string;
      public_inputs?: string[];
    };

    const root = out.root || out.public_inputs?.[0] || "";
    const nullifier = out.nullifier || out.public_inputs?.[1] || "";
    const outCm1 = out.out_cm1 || out.public_inputs?.[2] || "";
    const outCm2 = out.out_cm2 || out.public_inputs?.[3] || "";
    const proof = out.proof || "";

    if (!root || !nullifier || !outCm1 || !outCm2 || !proof) {
      return {
        ok: false,
        error: "Prover returned an incomplete transfer proof.",
      };
    }

    if (!out.recipient_blob || !out.change_blob) {
      // Encrypting the two output notes is the prover's job; a build that
      // predates `self_view` silently drops the blobs.
      return {
        ok: false,
        error:
          "Prover build is out of date: it did not return the encrypted note blobs. Run `pnpm prover:sync`.",
      };
    }

    return {
      ok: true,
      result: {
        root,
        nullifier,
        outCm1,
        outCm2,
        proof,
        recipientBlob: out.recipient_blob,
        changeBlob: out.change_blob,
        out1: { ownerPk: input.out1OwnerPk, k: out1K, v: input.out1V },
        out2: { ownerPk: input.out2OwnerPk, k: out2K, v: input.out2V },
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not build transfer proof.";
    return { ok: false, error: message };
  }
}

export type TransferNProofResult = {
  arity: 2 | 4;
  root: string;
  nullifiers: string[];
  outCm1: string;
  outCm2: string;
  proof: string;
  recipientBlob: string;
  changeBlob: string;
  out1: { ownerPk: string; k: string; v: string };
  out2: { ownerPk: string; k: string; v: string };
};

/**
 * Build a 2-in or 4-in private transfer proof. Inputs must share one spend key
 * and one Merkle root. Public inputs: [root, nf_1, …, nf_N, out_cm1, out_cm2].
 */
export async function buildTransferNProof(input: {
  arity: 2 | 4;
  spendSk: string;
  notes: { k: string; v: string; leafIndex: number }[];
  leaves: string[];
  out1OwnerPk: string;
  out1V: string;
  out2OwnerPk: string;
  out2V: string;
  recipientViewPub: string;
  selfViewPub: string;
}): Promise<
  { ok: true; result: TransferNProofResult } | { ok: false; error: string }
> {
  try {
    if (input.notes.length !== input.arity) {
      return {
        ok: false,
        error: `Expected ${input.arity} notes, got ${input.notes.length}.`,
      };
    }
    for (const n of input.notes) {
      if (n.leafIndex < 0 || n.leafIndex >= input.leaves.length) {
        return { ok: false, error: "Leaf index is out of range for the tree." };
      }
    }

    const out1K = randomFieldElementHex();
    const out2K = randomFieldElementHex();
    const op = input.arity === 2 ? "transfer2" : "transfer4";
    const pkUrl = input.arity === 2 ? getTransfer2PkUrl() : getTransfer4PkUrl();

    const proved = await proveInWorker(
      op,
      pkUrl,
      JSON.stringify({
        spend_sk: input.spendSk,
        inputs: input.notes.map((n) => ({
          k: n.k,
          v: n.v,
          index: n.leafIndex,
        })),
        leaves: input.leaves,
        out1_owner_pk: input.out1OwnerPk,
        out1_k: out1K,
        out1_v: input.out1V,
        out2_owner_pk: input.out2OwnerPk,
        out2_k: out2K,
        out2_v: input.out2V,
        recipient_view: input.recipientViewPub,
        self_view: input.selfViewPub,
      }),
    );
    if (!proved.ok) return { ok: false, error: proved.error };

    const out = JSON.parse(proved.resultJson) as {
      root?: string;
      nullifiers?: string[];
      out_cm1?: string;
      out_cm2?: string;
      proof?: string;
      recipient_blob?: string;
      change_blob?: string;
      public_inputs?: string[];
    };

    const root = out.root || out.public_inputs?.[0] || "";
    const nullifiers =
      out.nullifiers ||
      (out.public_inputs ?? []).slice(1, 1 + input.arity);
    const outCm1 =
      out.out_cm1 || out.public_inputs?.[1 + input.arity] || "";
    const outCm2 =
      out.out_cm2 || out.public_inputs?.[2 + input.arity] || "";
    const proof = out.proof || "";

    if (
      !root ||
      nullifiers.length !== input.arity ||
      !outCm1 ||
      !outCm2 ||
      !proof
    ) {
      return {
        ok: false,
        error: "Prover returned an incomplete multi-input transfer proof.",
      };
    }
    if (!out.recipient_blob || !out.change_blob) {
      return {
        ok: false,
        error:
          "Prover build is out of date: it did not return the encrypted note blobs. Run `pnpm prover:sync`.",
      };
    }

    return {
      ok: true,
      result: {
        arity: input.arity,
        root,
        nullifiers,
        outCm1,
        outCm2,
        proof,
        recipientBlob: out.recipient_blob,
        changeBlob: out.change_blob,
        out1: { ownerPk: input.out1OwnerPk, k: out1K, v: input.out1V },
        out2: { ownerPk: input.out2OwnerPk, k: out2K, v: input.out2V },
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not build multi-input transfer proof.";
    return { ok: false, error: message };
  }
}

/** @deprecated Prefer merchant note store; kept for any legacy local notes. */
export function storeNoteSecrets(
  linkId: string,
  secrets: {
    ownerPk: string;
    k: string;
    amountBaseUnits: string;
    commitment: string;
  },
) {
  try {
    const key = `ht_note_${linkId}`;
    localStorage.setItem(key, JSON.stringify({ ...secrets, at: Date.now() }));
  } catch {
    /* ignore quota / private mode */
  }
}
