/* tslint:disable */
/* eslint-disable */

/**
 * Note commitment `cm = Poseidon(Poseidon(owner_pk, k), v)` as `0x`-hex.
 */
export function commitment(owner_pk: string, k: string, v: string): string;

/**
 * Decrypt / scan a note blob with a viewing secret. Returns
 * `{ owner_pk, n, k, v }`, where `n` is a backward-compatible alias for
 * `owner_pk`, or throws if the blob is not addressed to this key.
 */
export function decrypt_note_blob(view_secret: string, blob: string): string;

/**
 * Prove a shield deposit binds `amount` to a commitment.
 * Public inputs order: `[cm, amount]`.
 */
export function deposit_proof(pk: Uint8Array, params_json: string): string;

/**
 * Encrypt a note to a recipient's viewing pubkey. Returns the on-chain blob
 * (`eph_pub || ciphertext`) as `0x`-hex. The plaintext is `owner_pk || k || v`;
 * the spend key is never encrypted.
 */
export function encrypt_note_blob(recipient_view: string, owner_pk: string, k: string, v: string): string;

/**
 * Generate a viewing keypair. Pass a 32-byte hex `seed` for deterministic
 * derivation, or omit it for a random key. Returns `{ view_secret, view_pub }`.
 */
export function keygen(seed?: string | null): string;

/**
 * Merkle root over an ordered JSON array of `0x` leaf commitments (DEPTH=20).
 * Empty array → empty-tree root. Used by hypertron-indexer for root verification.
 */
export function merkle_root(leaves_json: string): string;

/**
 * Nullifier `nf = Poseidon(spend_sk, k)` as `0x`-hex.
 */
export function nullifier(spend_sk: string, k: string): string;

/**
 * Derive `owner_pk = Poseidon(spend_sk, 0)` as `0x`-hex.
 */
export function owner_pk(spend_sk: string): string;

/**
 * Install a panic hook that surfaces Rust panics in the JS console. Safe to
 * call more than once; call it once at startup.
 */
export function start(): void;

/**
 * Prove a 2-in / 2-out private transfer.
 * Public inputs order: `[root, nf_1, nf_2, out_cm1, out_cm2]`.
 */
export function transfer_2_proof(pk: Uint8Array, params_json: string): string;

/**
 * Prove a 4-in / 2-out private transfer.
 * Public inputs order: `[root, nf_1, nf_2, nf_3, nf_4, out_cm1, out_cm2]`.
 */
export function transfer_4_proof(pk: Uint8Array, params_json: string): string;

/**
 * Prove a fully-private note -> two notes transfer.
 * Public inputs order: `[root, nullifier, out_cm1, out_cm2]`.
 */
export function transfer_proof(pk: Uint8Array, params_json: string): string;

/**
 * Prove an unshield (exit to a public recipient, keep a change note).
 * Public inputs order: `[root, nullifier, recipient, amount, change_cm]`.
 */
export function unshield_proof(pk: Uint8Array, params_json: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly commitment: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly decrypt_note_blob: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly deposit_proof: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly encrypt_note_blob: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
    readonly keygen: (a: number, b: number, c: number) => void;
    readonly merkle_root: (a: number, b: number, c: number) => void;
    readonly nullifier: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly owner_pk: (a: number, b: number, c: number) => void;
    readonly start: () => void;
    readonly transfer_2_proof: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly transfer_4_proof: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly transfer_proof: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly unshield_proof: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly __wbindgen_export: (a: number) => void;
    readonly __wbindgen_export2: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export3: (a: number, b: number) => number;
    readonly __wbindgen_export4: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
