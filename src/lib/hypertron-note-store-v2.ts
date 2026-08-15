/**
 * Note store v2 — keyed by commitment, supports multiple owners and origins.
 *
 * Origins:
 *   - "collect"  : merchant pre-minted note from a Collect link
 *   - "topup"    : customer self-shielded deposit (denominations)
 *   - "received" : note received via transfer (discovered by blob scan)
 *   - "change"   : change note from a transfer spend
 */

import { getPaymentPoolAddress } from "@/lib/stellar-network";

const DB_NAME = "hypertron_notes_v2";
const STORE = "notes";
const VERSION = 1;

export type NoteOrigin = "collect" | "topup" | "received" | "change";

export type StoredNoteV2 = {
  commitment: string;
  poolAddress?: string;
  ownerWallet: string;
  /** Owner public key (= Poseidon(spend_sk, 0)). Legacy notes may still have `n`. */
  ownerPk: string;
  k: string;
  amount: string;
  amountBaseUnits: string;
  leafIndex: number | null;
  spent: boolean;
  origin: NoteOrigin;
  linkId?: string | null;
  salt?: string | null;
  createdAt: number;
  lastSeenLedger?: number | null;
};

/** Raw IndexedDB row — may still use legacy `n` instead of `ownerPk`. */
type StoredNoteV2Raw = Omit<StoredNoteV2, "ownerPk"> & {
  ownerPk?: string;
  n?: string;
};

function normalizeNote(raw: StoredNoteV2Raw): StoredNoteV2 | null {
  const ownerPk = raw.ownerPk ?? raw.n;
  if (!ownerPk || !raw.k || !raw.commitment) return null;
  const { n: _legacyN, ...rest } = raw;
  return { ...rest, ownerPk };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "commitment" });
        os.createIndex("ownerWallet", "ownerWallet", { unique: false });
        os.createIndex("linkId", "linkId", { unique: false });
        os.createIndex("spent", "spent", { unique: false });
        os.createIndex("ownerWallet_spent", ["ownerWallet", "spent"], {
          unique: false,
        });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB tx failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB tx aborted"));
  });
}

export async function putNoteV2(note: StoredNoteV2): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  // Persist ownerPk only (drop legacy `n` if present on the object).
  const { n: _drop, ...clean } = note as StoredNoteV2 & { n?: string };
  tx.objectStore(STORE).put({
    ...clean,
    poolAddress: note.poolAddress ?? getPaymentPoolAddress(),
  });
  await txDone(tx);
  db.close();
}

export async function getNoteV2(
  commitment: string,
): Promise<StoredNoteV2 | null> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const req = tx.objectStore(STORE).get(commitment);
  const result = await new Promise<StoredNoteV2Raw | undefined>(
    (resolve, reject) => {
      req.onsuccess = () => resolve(req.result as StoredNoteV2Raw | undefined);
      req.onerror = () => reject(req.error);
    },
  );
  await txDone(tx);
  db.close();
  if (!result || result.poolAddress !== getPaymentPoolAddress()) return null;
  return normalizeNote(result);
}

export async function listNotesV2(ownerWallet: string): Promise<StoredNoteV2[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const idx = tx.objectStore(STORE).index("ownerWallet");
  const req = idx.getAll(ownerWallet);
  const result = await new Promise<StoredNoteV2Raw[]>((resolve, reject) => {
    req.onsuccess = () => resolve((req.result as StoredNoteV2Raw[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();
  return result
    .filter((note) => note.poolAddress === getPaymentPoolAddress())
    .map(normalizeNote)
    .filter((n): n is StoredNoteV2 => n != null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function listUnspentNotesV2(
  ownerWallet: string,
): Promise<StoredNoteV2[]> {
  const all = await listNotesV2(ownerWallet);
  return all.filter((n) => !n.spent);
}

export async function updateNoteV2(
  commitment: string,
  patch: Partial<StoredNoteV2>,
): Promise<StoredNoteV2 | null> {
  const existing = await getNoteV2(commitment);
  if (!existing) return null;
  const next = { ...existing, ...patch, commitment };
  await putNoteV2(next);
  return next;
}

export async function markNoteSpent(commitment: string): Promise<void> {
  await updateNoteV2(commitment, { spent: true });
}

/**
 * Find the largest unspent note with value >= minAmount.
 */
export async function findSpendableNote(
  ownerWallet: string,
  minAmountBaseUnits: string,
): Promise<StoredNoteV2 | null> {
  const unspent = await listUnspentNotesV2(ownerWallet);
  const min = BigInt(minAmountBaseUnits);
  const candidates = unspent.filter(
    (n) => n.leafIndex != null && BigInt(n.amountBaseUnits) >= min,
  );
  if (candidates.length === 0) return null;
  candidates.sort(
    (a, b) => Number(BigInt(b.amountBaseUnits) - BigInt(a.amountBaseUnits)),
  );
  return candidates[0];
}

/**
 * Get wallet balance summary.
 */
export async function getWalletBalance(ownerWallet: string): Promise<{
  totalBaseUnits: string;
  spendableBaseUnits: string;
  largestNoteBaseUnits: string;
  noteCount: number;
  spendableCount: number;
}> {
  const unspent = await listUnspentNotesV2(ownerWallet);
  let total = BigInt(0);
  let spendable = BigInt(0);
  let largest = BigInt(0);
  let spendableCount = 0;

  for (const note of unspent) {
    const v = BigInt(note.amountBaseUnits);
    total += v;
    if (note.leafIndex != null) {
      spendable += v;
      spendableCount++;
      if (v > largest) largest = v;
    }
  }

  return {
    totalBaseUnits: total.toString(),
    spendableBaseUnits: spendable.toString(),
    largestNoteBaseUnits: largest.toString(),
    noteCount: unspent.length,
    spendableCount,
  };
}
