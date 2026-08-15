/**
 * Proving-key integrity check.
 *
 * A proving key only produces usable proofs against the verifying key that was
 * registered on-chain from the same setup. When those keys are rotated, a stale
 * cached `*.pk.bin` keeps proving happily and the chain rejects the result, so
 * the user sees "proof rejected" and no part of the stack points at the real
 * cause. Hashing the fetched bytes turns that into an explicit, actionable
 * error at the point of failure.
 *
 * Expected digests come from `deployments/<network>.json` in hypertron-contracts
 * (`artifacts.<circuit>.pk_sha256`) and must be updated whenever keys rotate.
 */

export type ProveOp = "deposit" | "unshield" | "transfer" | "transfer2" | "transfer4";

const BUILT_IN_SHA256: Record<ProveOp, string> = {
  deposit: "e6298d202bc2adfddca71852c0618eee75961414d39a54ccc7046dd26599e74c",
  unshield: "e87b827477da9ba519ee073ad453f87ac19883b9bf249df9db95e68a366a80ae",
  transfer: "93f01949aab2ca60b67b24306d9c9baa1931c351d1e8ca622e13a5ea3046bfa2",
  transfer2: "c0c5b8c921f8a207cb68f6ee8fe30a0c27ee77682d9fa7d7570a2d71893a30b2",
  transfer4: "a3ddb7c9d0074623244dcb6599f318feacf2ace7755fcf654370ed1ae6c7d1c4",
};

function expectedSha256(op: ProveOp): string {
  const override = {
    deposit: process.env.NEXT_PUBLIC_DEPOSIT_PK_SHA256,
    unshield: process.env.NEXT_PUBLIC_UNSHIELD_PK_SHA256,
    transfer: process.env.NEXT_PUBLIC_TRANSFER_PK_SHA256,
    transfer2: process.env.NEXT_PUBLIC_TRANSFER_2_PK_SHA256,
    transfer4: process.env.NEXT_PUBLIC_TRANSFER_4_PK_SHA256,
  }[op];
  return (override?.trim() || BUILT_IN_SHA256[op]).toLowerCase();
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Throw if the fetched proving key is not the one this build expects.
 *
 * Skipped when SubtleCrypto is unavailable (non-secure context), since failing
 * closed there would block proving for a reason unrelated to key integrity.
 */
export async function assertProvingKeyDigest(
  op: ProveOp,
  bytes: Uint8Array,
): Promise<void> {
  if (typeof crypto === "undefined" || !crypto.subtle) return;

  const expected = expectedSha256(op);
  if (!expected) return;

  const actual = await sha256Hex(bytes);
  if (actual === expected) return;

  throw new Error(
    `The ${op} proving key is out of date, so any proof it produces would be ` +
      `rejected on-chain. Clear your cache and reload to fetch the current key. ` +
      `(expected sha256 ${expected.slice(0, 12)}…, got ${actual.slice(0, 12)}…)`,
  );
}
