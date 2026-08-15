/**
 * Auditor disclosure library — scan blobs with a third-party viewing key.
 * Unlike hypertron-note-scan.ts (owner-only), this accepts any viewing secret.
 */

import {
  getPoolBlobs,
  getPoolLeaves,
  getPoolCommitments,
  findLeafIndex,
} from "@/lib/hypertron-indexer";
import { ensureProverReady } from "@/lib/hypertron-prover";
import { fromBaseUnits, getStellarExpertTxUrl } from "@/lib/stellar-network";

export type AuditedNote = {
  commitment: string;
  /** Owner public key from decrypt — not a spend secret. */
  ownerPk: string;
  k: string;
  v: string;
  amount: string;
  amountBaseUnits: string;
  leafIndex: number | null;
  ledger: number;
  verified: boolean;
  txHash: string | null;
  explorerUrl: string | null;
};

export type AuditResult = {
  notes: AuditedNote[];
  totalScanned: number;
  totalMatched: number;
  lastLedger: number;
  error?: string;
};

/**
 * Scan pool blobs with an arbitrary viewing secret.
 * Used by auditors to verify private payment contents off-chain.
 */
export async function auditWithViewingKey(
  viewSecret: string,
  sinceLedger = 0,
): Promise<AuditResult> {
  try {
    await ensureProverReady();

    const blobsRes = await getPoolBlobs(sinceLedger);
    if (!blobsRes.ok) {
      return {
        notes: [],
        totalScanned: 0,
        totalMatched: 0,
        lastLedger: sinceLedger,
        error: blobsRes.error,
      };
    }

    const leavesRes = await getPoolLeaves();
    const leaves = leavesRes.ok ? leavesRes.data.leaves : [];

    const { decrypt_note_blob, commitment } = await import("@hypertron/prover");

    const blobs = blobsRes.data.blobs;
    const notes: AuditedNote[] = [];
    let maxLedger = sinceLedger;

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
        const leafIndex = leaves.length > 0 ? findLeafIndex(leaves, cm) : null;
        const verified = leafIndex != null && leafIndex >= 0;

        notes.push({
          commitment: cm,
          ownerPk,
          k: parsed.k,
          v: parsed.v,
          amount: fromBaseUnits(parsed.v),
          amountBaseUnits: parsed.v,
          leafIndex: verified ? leafIndex : null,
          ledger: entry.ledger,
          verified,
          txHash: null,
          explorerUrl: null,
        });
      } catch {
        /* Not addressed to this viewing key — expected */
      }
    }

    if (notes.length > 0) {
      const metaRes = await getPoolCommitments(notes.map((n) => n.commitment));
      if (metaRes.ok) {
        const byLeaf = new Map(
          metaRes.commitments.map((c) => [
            c.leaf.toLowerCase().replace(/^0x/, ""),
            c,
          ]),
        );
        for (const note of notes) {
          const key = note.commitment.toLowerCase().replace(/^0x/, "");
          const meta = byLeaf.get(key);
          if (!meta?.txHash) continue;
          note.txHash = meta.txHash;
          note.explorerUrl = getStellarExpertTxUrl(meta.txHash);
          if (note.leafIndex == null && meta.leafIndex != null) {
            note.leafIndex = meta.leafIndex;
            note.verified = true;
          }
        }
      }
    }

    notes.sort((a, b) => b.ledger - a.ledger);

    return {
      notes,
      totalScanned: blobs.length,
      totalMatched: notes.length,
      lastLedger: maxLedger,
    };
  } catch (error) {
    return {
      notes: [],
      totalScanned: 0,
      totalMatched: 0,
      lastLedger: sinceLedger,
      error: error instanceof Error ? error.message : "Audit scan failed",
    };
  }
}

/** Redacted disclosure fields — never include note fields ownerPk/k. */
export type AuditExportNote = {
  commitment: string;
  amount: string;
  amountBaseUnits: string;
  leafIndex: number | null;
  ledger: number;
  verified: boolean;
  txHash: string | null;
  explorerUrl: string | null;
};

function toExportNote(note: AuditedNote): AuditExportNote {
  return {
    commitment: note.commitment,
    amount: note.amount,
    amountBaseUnits: note.amountBaseUnits,
    leafIndex: note.leafIndex,
    ledger: note.ledger,
    verified: note.verified,
    txHash: note.txHash,
    explorerUrl: note.explorerUrl,
  };
}

/**
 * Export audit results as CSV (amounts + membership only — no note secrets).
 * Viewing decrypt cannot spend; nullifiers require the separate spend key.
 */
export function exportAuditCsv(notes: AuditedNote[]): string {
  const headers = [
    "commitment",
    "amount",
    "amount_base_units",
    "leaf_index",
    "ledger",
    "verified",
    "tx_hash",
    "explorer_url",
  ];

  const rows = notes.map((note) => {
    const row = toExportNote(note);
    return [
      row.commitment,
      row.amount,
      row.amountBaseUnits,
      row.leafIndex?.toString() ?? "",
      row.ledger.toString(),
      row.verified ? "true" : "false",
      row.txHash ?? "",
      row.explorerUrl ?? "",
    ];
  });

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Export audit results as JSON (amounts + membership only — no note secrets).
 */
export function exportAuditJson(notes: AuditedNote[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      noteCount: notes.length,
      warning:
        "Note fields (ownerPk, k) are omitted from this export. A viewing secret decrypts amounts for notes addressed to that key but cannot spend — spending requires the separate spend key, which is never shared with auditors. Explorer links open the pool contract call (opaque args), not a classic payment row.",
      notes: notes.map(toExportNote),
    },
    null,
    2,
  );
}

/**
 * Validate a viewing secret format (64 hex chars with optional 0x prefix).
 */
export function isValidViewingSecret(secret: string): boolean {
  const cleaned = secret.trim().replace(/^0x/i, "");
  return /^[0-9a-fA-F]{64}$/.test(cleaned);
}

/**
 * Normalize a viewing secret to 0x-prefixed lowercase.
 */
export function normalizeViewingSecret(secret: string): string {
  const cleaned = secret.trim().replace(/^0x/i, "").toLowerCase();
  return `0x${cleaned}`;
}

function normalizeHex32(value: string): string {
  return value.trim().replace(/^0x/i, "").toLowerCase();
}

/**
 * True when the pasted value is the viewing *public* key (or equals a known
 * viewPub). Both halves are 64 hex chars, so this is the reliable check.
 */
export function isPastedViewingPublicKey(
  pasted: string,
  knownViewPub?: string | null,
): boolean {
  if (!knownViewPub?.trim()) return false;
  return normalizeHex32(pasted) === normalizeHex32(knownViewPub);
}

export const VIEWING_PUBLIC_KEY_MISTAKE =
  "That looks like the viewing public key (viewPub). Paste the viewing secret instead — the public key can only encrypt notes, not decrypt them.";
