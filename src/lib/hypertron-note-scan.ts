/**
 * Blob scanner — trial-decrypt encrypted note blobs to discover owned notes.
 * Stores discovered notes in v2 store with origin "received".
 *
 * Decrypt yields (owner_pk, k, v). Spent checks require spend_sk separately —
 * a viewing secret alone cannot compute nullifiers.
 */

import {
  getPoolBlobs,
  getPoolLeaves,
  getPoolNullifiers,
  getPoolStatus,
  findLeafIndex,
} from "@/lib/hypertron-indexer";
import {
  putNoteV2,
  getNoteV2,
  updateNoteV2,
  listNotesV2,
  type StoredNoteV2,
} from "@/lib/hypertron-note-store-v2";
import { ensureProverReady, computeNullifier } from "@/lib/hypertron-prover";
import { fromBaseUnits } from "@/lib/stellar-network";

const CURSOR_KEY_PREFIX = "ht_scan_cursor_v2:";

export type ScanState =
  | "idle"
  | "scanning"
  | "ready"
  | "indexer_down"
  | "empty";

export type ScanResult = {
  state: ScanState;
  discovered: number;
  lastLedger: number;
  error?: string;
};

function getCursor(ownerWallet: string): number {
  try {
    const raw = localStorage.getItem(CURSOR_KEY_PREFIX + ownerWallet);
    return raw ? Number.parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

function setCursor(ownerWallet: string, ledger: number): void {
  try {
    localStorage.setItem(CURSOR_KEY_PREFIX + ownerWallet, String(ledger));
  } catch {
    /* private mode */
  }
}

/**
 * Scan blobs since last cursor, trial-decrypt with viewSecret, persist matches.
 */
export async function scanForNotes(
  ownerWallet: string,
  viewSecret: string,
): Promise<ScanResult> {
  try {
    await ensureProverReady();

    const statusRes = await getPoolStatus();
    if (!statusRes.ok) {
      return { state: "indexer_down", discovered: 0, lastLedger: 0, error: statusRes.error };
    }

    const cursor = getCursor(ownerWallet);
    const blobsRes = await getPoolBlobs(cursor);
    if (!blobsRes.ok) {
      return { state: "indexer_down", discovered: 0, lastLedger: cursor, error: blobsRes.error };
    }

    const blobs = blobsRes.data.blobs;
    let discovered = 0;
    let maxLedger = cursor;

    const { decrypt_note_blob, commitment } = await import("@hypertron/prover");

    for (const entry of blobs) {
      if (entry.ledger > maxLedger) maxLedger = entry.ledger;

      try {
        const resultJson = decrypt_note_blob(viewSecret, entry.blob);
        const parsed = JSON.parse(resultJson) as {
          owner_pk?: string;
          n?: string;
          k: string;
          v: string;
        };
        const ownerPk = parsed.owner_pk ?? parsed.n;
        if (!ownerPk || !parsed.k) continue;

        const cm = commitment(ownerPk, parsed.k, parsed.v);

        const existing = await getNoteV2(cm);
        if (existing) {
          if (entry.leafIndex != null && existing.leafIndex == null) {
            await updateNoteV2(cm, {
              leafIndex: entry.leafIndex,
              lastSeenLedger: entry.ledger,
            });
          }
          continue;
        }

        const baseUnits = parsed.v;
        const display = fromBaseUnits(baseUnits);

        const note: StoredNoteV2 = {
          commitment: cm,
          ownerWallet,
          ownerPk,
          k: parsed.k,
          amount: display,
          amountBaseUnits: baseUnits,
          leafIndex: entry.leafIndex,
          spent: false,
          origin: "received",
          createdAt: Date.now(),
          lastSeenLedger: entry.ledger,
        };

        await putNoteV2(note);
        discovered++;
      } catch {
        /* Not addressed to us — expected */
      }
    }

    if (maxLedger > cursor) {
      setCursor(ownerWallet, maxLedger);
    }

    const allNotes = await listNotesV2(ownerWallet);
    const state: ScanState = allNotes.length === 0 ? "empty" : "ready";

    return { state, discovered, lastLedger: maxLedger };
  } catch (error) {
    return {
      state: "indexer_down",
      discovered: 0,
      lastLedger: 0,
      error: error instanceof Error ? error.message : "Scan failed",
    };
  }
}

/**
 * Update leafIndex and spent status for all owned notes.
 * Spent checks need spendSk (nullifier = Poseidon(spend_sk, k)).
 */
export async function refreshNoteStatuses(
  ownerWallet: string,
  spendSk: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const leavesRes = await getPoolLeaves();
    if (!leavesRes.ok) return { ok: false, error: leavesRes.error };

    const nullifiersRes = await getPoolNullifiers();
    if (!nullifiersRes.ok) return { ok: false, error: nullifiersRes.error };

    const leaves = leavesRes.data.leaves;
    const nullifierSet = new Set(
      nullifiersRes.nullifiers.map((n) => n.toLowerCase().replace(/^0x/, "")),
    );

    const notes = await listNotesV2(ownerWallet);

    for (const note of notes) {
      let changed = false;

      if (note.leafIndex == null) {
        const idx = findLeafIndex(leaves, note.commitment);
        if (idx >= 0) {
          note.leafIndex = idx;
          changed = true;
        }
      }

      if (!note.spent) {
        const nf = await computeNullifier(spendSk, note.k);
        const nfNorm = nf.toLowerCase().replace(/^0x/, "");
        if (nullifierSet.has(nfNorm)) {
          note.spent = true;
          changed = true;
        }
      }

      if (changed) {
        await updateNoteV2(note.commitment, {
          leafIndex: note.leafIndex,
          spent: note.spent,
        });
      }
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Refresh failed",
    };
  }
}

/**
 * Full scan: scan for new notes + refresh existing statuses (needs spendSk for spent).
 */
export async function fullScan(
  ownerWallet: string,
  viewSecret: string,
  spendSk: string,
): Promise<ScanResult> {
  const scanRes = await scanForNotes(ownerWallet, viewSecret);
  if (scanRes.state === "indexer_down") return scanRes;

  const refreshRes = await refreshNoteStatuses(ownerWallet, spendSk);
  if (!refreshRes.ok) {
    return { ...scanRes, error: refreshRes.error };
  }

  return scanRes;
}
