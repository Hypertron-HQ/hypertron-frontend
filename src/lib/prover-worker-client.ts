import { assertProvingKeyDigest, type ProveOp } from "@/lib/proving-key-digest";

type WorkerReq = {
  id: string;
  op: ProveOp;
  wasmUrl: string;
  pkUrl: string;
  paramsJson: string;
};

type WorkerRes =
  | { id: string; ok: true; resultJson: string }
  | { id: string; ok: false; error: string };

let worker: Worker | null = null;
let workerFailed = false;
const pending = new Map<
  string,
  { resolve: (r: WorkerRes) => void }
>();

function getWasmUrl(): string {
  if (typeof window === "undefined") {
    return (
      process.env.NEXT_PUBLIC_PROVER_WASM_URL?.trim() ||
      "/prover/hypertron_prover_bg.wasm"
    );
  }
  const path =
    process.env.NEXT_PUBLIC_PROVER_WASM_URL?.trim() ||
    "/prover/hypertron_prover_bg.wasm";
  return path.startsWith("http")
    ? path
    : `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

function absolutePkUrl(pkUrl: string): string {
  if (typeof window === "undefined" || pkUrl.startsWith("http")) return pkUrl;
  return `${window.location.origin}${pkUrl.startsWith("/") ? "" : "/"}${pkUrl}`;
}

function getWorker(): Worker | null {
  if (workerFailed || typeof window === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(
      new URL("../workers/hypertron-prover.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (event: MessageEvent<WorkerRes>) => {
      const res = event.data;
      const wait = pending.get(res.id);
      if (wait) {
        pending.delete(res.id);
        wait.resolve(res);
      }
    };
    worker.onerror = () => {
      workerFailed = true;
      worker?.terminate();
      worker = null;
      for (const [id, wait] of pending) {
        pending.delete(id);
        wait.resolve({ id, ok: false, error: "Prover worker crashed." });
      }
    };
    return worker;
  } catch {
    workerFailed = true;
    return null;
  }
}

async function proveOnMainThread(
  op: ProveOp,
  pkUrl: string,
  paramsJson: string,
): Promise<string> {
  const init = (await import("@hypertron/prover")).default;
  const { deposit_proof, unshield_proof, transfer_proof, transfer_2_proof, transfer_4_proof } =
    await import("@hypertron/prover");
  await init({ module_or_path: getWasmUrl() });
  const res = await fetch(pkUrl);
  if (!res.ok) throw new Error(`Proving key not found (${pkUrl}).`);
  const pk = new Uint8Array(await res.arrayBuffer());
  await assertProvingKeyDigest(op, pk);
  // Yield so the UI can paint before heavy proving.
  await new Promise((r) => setTimeout(r, 0));
  switch (op) {
    case "deposit":
      return deposit_proof(pk, paramsJson);
    case "unshield":
      return unshield_proof(pk, paramsJson);
    case "transfer":
      return transfer_proof(pk, paramsJson);
    case "transfer2":
      return transfer_2_proof(pk, paramsJson);
    case "transfer4":
      return transfer_4_proof(pk, paramsJson);
  }
}

export async function proveInWorker(
  op: ProveOp,
  pkUrl: string,
  paramsJson: string,
): Promise<{ ok: true; resultJson: string } | { ok: false; error: string }> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const w = getWorker();
  if (w) {
    const result = await new Promise<WorkerRes>((resolve) => {
      pending.set(id, { resolve });
      const req: WorkerReq = {
        id,
        op,
        wasmUrl: getWasmUrl(),
        pkUrl: absolutePkUrl(pkUrl),
        paramsJson,
      };
      w.postMessage(req);
    });
    if (result.ok) return { ok: true, resultJson: result.resultJson };
    // Fall through to main thread on worker logical failure.
  }

  try {
    const resultJson = await proveOnMainThread(op, pkUrl, paramsJson);
    return { ok: true, resultJson };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Proving failed.",
    };
  }
}
