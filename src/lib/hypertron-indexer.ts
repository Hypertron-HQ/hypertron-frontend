import { getStellarNetwork } from "@/lib/stellar-network";

export function getIndexerBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_INDEXER_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:4002"
  );
}

export function getIndexerNetwork(): string {
  return process.env.NEXT_PUBLIC_INDEXER_NETWORK?.trim() || getStellarNetwork();
}

type ErrorBody = { error?: string; message?: string };

async function readJson<T>(res: Response): Promise<T & ErrorBody> {
  return (await res.json().catch(() => ({}))) as T & ErrorBody;
}

export type PoolStatus = {
  lastLedger: number;
  size: number;
  root: string;
  healthy: boolean;
};

export type LeavesResponse = {
  leaves: string[];
  size: number;
  root: string;
};

export async function getPoolStatus(): Promise<
  { ok: true; status: PoolStatus } | { ok: false; error: string }
> {
  try {
    const network = getIndexerNetwork();
    const res = await fetch(
      `${getIndexerBaseUrl()}/v1/pool/${encodeURIComponent(network)}/status`,
      { method: "GET", cache: "no-store" },
    );
    const json = await readJson<PoolStatus>(res);
    if (!res.ok) {
      return {
        ok: false,
        error: json.error ?? json.message ?? "Indexer status failed.",
      };
    }
    return {
      ok: true,
      status: {
        lastLedger: Number(json.lastLedger ?? 0),
        size: Number(json.size ?? 0),
        root: String(json.root ?? ""),
        healthy: Boolean(json.healthy),
      },
    };
  } catch {
    return { ok: false, error: "Could not reach the indexer." };
  }
}

export async function getPoolLeaves(
  since = 0,
): Promise<{ ok: true; data: LeavesResponse } | { ok: false; error: string }> {
  try {
    const network = getIndexerNetwork();
    const res = await fetch(
      `${getIndexerBaseUrl()}/v1/pool/${encodeURIComponent(network)}/leaves?since=${since}`,
      { method: "GET", cache: "no-store" },
    );
    const json = await readJson<LeavesResponse>(res);
    if (!res.ok || !Array.isArray(json.leaves)) {
      return {
        ok: false,
        error: json.error ?? json.message ?? "Indexer leaves failed.",
      };
    }
    return {
      ok: true,
      data: {
        leaves: json.leaves,
        size: Number(json.size ?? json.leaves.length),
        root: String(json.root ?? ""),
      },
    };
  } catch {
    return { ok: false, error: "Could not reach the indexer." };
  }
}

export async function getPoolNullifiers(): Promise<
  { ok: true; nullifiers: string[] } | { ok: false; error: string }
> {
  try {
    const network = getIndexerNetwork();
    const res = await fetch(
      `${getIndexerBaseUrl()}/v1/pool/${encodeURIComponent(network)}/nullifiers`,
      { method: "GET", cache: "no-store" },
    );
    const json = await readJson<{ nullifiers?: string[] }>(res);
    if (!res.ok || !Array.isArray(json.nullifiers)) {
      return {
        ok: false,
        error: json.error ?? json.message ?? "Indexer nullifiers failed.",
      };
    }
    return { ok: true, nullifiers: json.nullifiers };
  } catch {
    return { ok: false, error: "Could not reach the indexer." };
  }
}

export type BlobEntry = {
  blob: string;
  leafIndex: number | null;
  ledger: number;
};

export type BlobsResponse = {
  blobs: BlobEntry[];
};

export async function getPoolBlobs(
  sinceLedger = 0,
): Promise<{ ok: true; data: BlobsResponse } | { ok: false; error: string }> {
  try {
    const network = getIndexerNetwork();
    const res = await fetch(
      `${getIndexerBaseUrl()}/v1/pool/${encodeURIComponent(network)}/blobs?since=${sinceLedger}`,
      { method: "GET", cache: "no-store" },
    );
    const json = await readJson<BlobsResponse>(res);
    if (!res.ok || !Array.isArray(json.blobs)) {
      return {
        ok: false,
        error: json.error ?? json.message ?? "Indexer blobs failed.",
      };
    }
    return {
      ok: true,
      data: {
        blobs: json.blobs.map((b) => ({
          blob: String(b.blob ?? ""),
          leafIndex: b.leafIndex ?? null,
          ledger: Number(b.ledger ?? 0),
        })),
      },
    };
  } catch {
    return { ok: false, error: "Could not reach the indexer." };
  }
}

/** Find leaf index of a commitment (0x-normalized compare). */
export function findLeafIndex(leaves: string[], commitment: string): number {
  const want = commitment.toLowerCase().replace(/^0x/, "");
  return leaves.findIndex(
    (leaf) => leaf.toLowerCase().replace(/^0x/, "") === want,
  );
}

export type CommitmentMeta = {
  leaf: string;
  leafIndex: number | null;
  ledger: number | null;
  txHash: string | null;
};

/**
 * Look up commitment metadata (incl. on-chain tx hash) by leaf hex.
 */
export async function getPoolCommitments(
  leaves: string[],
): Promise<
  { ok: true; commitments: CommitmentMeta[] } | { ok: false; error: string }
> {
  if (leaves.length === 0) {
    return { ok: true, commitments: [] };
  }
  try {
    const network = getIndexerNetwork();
    const unique = [
      ...new Set(
        leaves.map((l) => {
          const cleaned = l.trim().replace(/^0x/i, "").toLowerCase();
          return `0x${cleaned}`;
        }),
      ),
    ];
    const qs = encodeURIComponent(unique.join(","));
    const res = await fetch(
      `${getIndexerBaseUrl()}/v1/pool/${encodeURIComponent(network)}/commitments?leaves=${qs}`,
      { method: "GET", cache: "no-store" },
    );
    const json = await readJson<{ commitments?: CommitmentMeta[] }>(res);
    if (!res.ok || !Array.isArray(json.commitments)) {
      return {
        ok: false,
        error: json.error ?? json.message ?? "Indexer commitments failed.",
      };
    }
    return {
      ok: true,
      commitments: json.commitments.map((c) => ({
        leaf: String(c.leaf ?? ""),
        leafIndex: c.leafIndex ?? null,
        ledger: c.ledger ?? null,
        txHash: c.txHash ? String(c.txHash) : null,
      })),
    };
  } catch {
    return { ok: false, error: "Could not reach the indexer." };
  }
}
