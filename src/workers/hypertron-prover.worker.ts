/**
 * Prover Web Worker — deposit / unshield / transfer off the main thread.
 * Messages: { id, op, wasmUrl, pkUrl, paramsJson }
 */

import init, { deposit_proof, unshield_proof, transfer_proof } from "@hypertron/prover";

import { assertProvingKeyDigest } from "@/lib/proving-key-digest";

type WorkerReq = {
  id: string;
  op: "deposit" | "unshield" | "transfer";
  wasmUrl: string;
  pkUrl: string;
  paramsJson: string;
};

type WorkerRes =
  | { id: string; ok: true; resultJson: string }
  | { id: string; ok: false; error: string };

let ready: Promise<void> | null = null;
let lastWasmUrl = "";

async function ensureInit(wasmUrl: string) {
  if (!ready || lastWasmUrl !== wasmUrl) {
    lastWasmUrl = wasmUrl;
    ready = init({ module_or_path: wasmUrl }).then(() => undefined);
  }
  await ready;
}

async function fetchPk(op: WorkerReq["op"], pkUrl: string): Promise<Uint8Array> {
  const res = await fetch(pkUrl);
  if (!res.ok) throw new Error(`Proving key fetch failed (${res.status}).`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  await assertProvingKeyDigest(op, bytes);
  return bytes;
}

function runProof(op: WorkerReq["op"], pk: Uint8Array, params: string): string {
  switch (op) {
    case "deposit":
      return deposit_proof(pk, params);
    case "unshield":
      return unshield_proof(pk, params);
    case "transfer":
      return transfer_proof(pk, params);
  }
}

self.onmessage = (event: MessageEvent<WorkerReq>) => {
  const msg = event.data;
  void (async () => {
    try {
      await ensureInit(msg.wasmUrl);
      const pk = await fetchPk(msg.op, msg.pkUrl);
      const resultJson = runProof(msg.op, pk, msg.paramsJson);
      const res: WorkerRes = { id: msg.id, ok: true, resultJson };
      self.postMessage(res);
    } catch (error) {
      const res: WorkerRes = {
        id: msg.id,
        ok: false,
        error: error instanceof Error ? error.message : "Prover worker failed.",
      };
      self.postMessage(res);
    }
  })();
};

export {};
