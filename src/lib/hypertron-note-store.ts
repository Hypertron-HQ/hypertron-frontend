/** Merchant-side note store (IndexedDB). Salt stays local; never sent on public GET. */

const DB_NAME = "hypertron_notes_v1";
const STORE = "notes";

export type StoredNote = {
  linkId: string;
  businessId: string;
  salt: string;
  amount: string;
  amountBaseUnits: string;
  commitment: string;
  leafIndex?: number | null;
  paidAt?: string | null;
  spent?: boolean;
  createdAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: "linkId" });
        os.createIndex("businessId", "businessId", { unique: false });
        os.createIndex("commitment", "commitment", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB tx failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB tx aborted"));
  });
}

export async function putNote(note: StoredNote): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(note);
  await txDone(tx);
  db.close();
}

export async function getNote(linkId: string): Promise<StoredNote | null> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const req = tx.objectStore(STORE).get(linkId);
  const result = await new Promise<StoredNote | undefined>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as StoredNote | undefined);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();
  return result ?? null;
}

export async function listNotes(businessId: string): Promise<StoredNote[]> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const idx = tx.objectStore(STORE).index("businessId");
  const req = idx.getAll(businessId);
  const result = await new Promise<StoredNote[]>((resolve, reject) => {
    req.onsuccess = () => resolve((req.result as StoredNote[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  db.close();
  return result.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateNote(
  linkId: string,
  patch: Partial<StoredNote>,
): Promise<StoredNote | null> {
  const existing = await getNote(linkId);
  if (!existing) return null;
  const next = { ...existing, ...patch, linkId };
  await putNote(next);
  return next;
}
