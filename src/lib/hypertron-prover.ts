import init, { deposit_proof } from "@hypertron/prover";
import { toBaseUnits } from "@/lib/stellar-network";

let ready: Promise<void> | null = null;

function getDepositPkUrl(): string {
  return process.env.NEXT_PUBLIC_DEPOSIT_PK_URL?.trim() || "/keys/deposit.pk.bin";
}

function getWasmUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PROVER_WASM_URL?.trim() ||
    "/prover/hypertron_prover_bg.wasm"
  );
}

export async function ensureProverReady(): Promise<void> {
  if (!ready) {
    ready = init({ module_or_path: getWasmUrl() }).then(() => undefined);
  }
  await ready;
}

/**
 * Random note secret as 0x-hex (32 bytes).
 * Decimal strings are only accepted up to u128 by parse_fr — hex is required
 * for full-size field elements.
 */
function randomFieldElementHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // Keep below typical scalar bias issues; mod_order is applied in the prover.
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return `0x${hex}`;
}

export type DepositProofResult = {
  n: string;
  k: string;
  amountBaseUnits: string;
  commitment: string;
  proof: string;
};

export async function buildDepositProof(displayAmount: string): Promise<
  | { ok: true; result: DepositProofResult }
  | { ok: false; error: string }
> {
  try {
    await ensureProverReady();
    const amountBaseUnits = toBaseUnits(displayAmount);
    if (amountBaseUnits === "0") {
      return { ok: false, error: "Amount must be greater than zero." };
    }

    const pkRes = await fetch(getDepositPkUrl());
    if (!pkRes.ok) {
      return {
        ok: false,
        error:
          "Deposit proving key not found. Place deposit.pk.bin under public/keys/.",
      };
    }
    const pk = new Uint8Array(await pkRes.arrayBuffer());
    const n = randomFieldElementHex();
    const k = randomFieldElementHex();

    const out = JSON.parse(
      deposit_proof(
        pk,
        JSON.stringify({
          n,
          k,
          amount: amountBaseUnits,
        }),
      ),
    ) as {
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
        n,
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

export function storeNoteSecrets(
  linkId: string,
  secrets: { n: string; k: string; amountBaseUnits: string; commitment: string },
) {
  try {
    const key = `ht_note_${linkId}`;
    localStorage.setItem(key, JSON.stringify({ ...secrets, at: Date.now() }));
  } catch {
    /* ignore quota / private mode */
  }
}
