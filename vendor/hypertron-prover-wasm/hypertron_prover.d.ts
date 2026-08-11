/* tslint:disable */
/* eslint-disable */

/**
 * Note commitment `cm = Poseidon(Poseidon(n, k), v)` as `0x`-hex.
 */
export function commitment(n: string, k: string, v: string): string;

/**
 * Decrypt / scan a note blob with a viewing secret. Returns `{ n, k, v }`, or
 * throws if the blob is not addressed to this key. Used by recipients (note
 * discovery) and auditors (compliance disclosure).
 */
export function decrypt_note_blob(view_secret: string, blob: string): string;

/**
 * Prove a shield deposit binds `amount` to a commitment.
 * Public inputs order: `[cm, amount]`.
 */
export function deposit_proof(pk: Uint8Array, params_json: string): string;

/**
 * Encrypt a note to a recipient's viewing pubkey. Returns the on-chain blob
 * (`eph_pub || ciphertext`) as `0x`-hex.
 */
export function encrypt_note_blob(recipient_view: string, n: string, k: string, v: string): string;

/**
 * Generate a viewing keypair. Pass a 32-byte hex `seed` for deterministic
 * derivation, or omit it for a random key. Returns `{ view_secret, view_pub }`.
 */
export function keygen(seed?: string | null): string;

/**
 * Nullifier `nf = Poseidon(n, 0)` as `0x`-hex.
 */
export function nullifier(n: string): string;

/**
 * Install a panic hook that surfaces Rust panics in the JS console. Safe to
 * call more than once; call it once at startup.
 */
export function start(): void;

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
    readonly nullifier: (a: number, b: number, c: number) => void;
    readonly start: () => void;
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
