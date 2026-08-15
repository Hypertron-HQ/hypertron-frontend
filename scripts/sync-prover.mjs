#!/usr/bin/env node
/**
 * Sync the locally built WASM prover into this app.
 *
 * Two copies have to stay byte-identical or proofs fail in confusing ways: the
 * JS glue resolved through `@hypertron/prover` (vendor/) and the `.wasm` the
 * glue fetches at runtime from `/prover/` (public/). wasm-bindgen glue only
 * links against the exact binary it was generated with.
 *
 *   node scripts/sync-prover.mjs [path/to/prover-wasm/pkg/web]
 */

import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const src = resolve(
  appRoot,
  process.argv[2] ?? "../hypertron-contracts/prover-wasm/pkg/web",
);
const vendorDir = join(appRoot, "vendor/hypertron-prover-wasm");
const publicDir = join(appRoot, "public/prover");

const WASM = "hypertron_prover_bg.wasm";
const ARTIFACTS = [
  "hypertron_prover.js",
  "hypertron_prover.d.ts",
  WASM,
  `${WASM}.d.ts`,
];

const MANIFEST = {
  name: "@hypertron/prover",
  version: "0.1.1",
  description:
    "Browser WASM prover for the Hypertron shielded pool. Built from hypertron-contracts/prover-wasm via scripts/sync-prover.mjs — do not edit by hand.",
  license: "Apache-2.0",
  type: "module",
  main: "hypertron_prover.js",
  module: "hypertron_prover.js",
  types: "hypertron_prover.d.ts",
  exports: {
    ".": "./hypertron_prover.js",
    "./web": "./hypertron_prover.js",
  },
  files: [...ARTIFACTS, "README.md"],
  sideEffects: ["./hypertron_prover.js"],
};

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

for (const name of ARTIFACTS) {
  try {
    copyFileSync(join(src, name), join(vendorDir, name));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    console.error(
      `Missing ${join(src, name)}\nBuild it first: (cd ${src.replace(/\/pkg\/web$/, "")} && ./build.sh)`,
    );
    process.exit(1);
  }
}

writeFileSync(
  join(vendorDir, "package.json"),
  `${JSON.stringify(MANIFEST, null, 2)}\n`,
);

// The crate's own README documents the JSON params of each proof function;
// wasm-pack leaves it a level above the per-target output.
copyFileSync(resolve(src, "../../README.md"), join(vendorDir, "README.md"));

mkdirSync(publicDir, { recursive: true });
copyFileSync(join(vendorDir, WASM), join(publicDir, WASM));

const digest = sha256(join(publicDir, WASM));
if (digest !== sha256(join(vendorDir, WASM))) {
  console.error("Copy mismatch: vendor and public WASM differ.");
  process.exit(1);
}

console.log(`Synced prover from ${src}`);
console.log(`  vendor/hypertron-prover-wasm  (glue + wasm)`);
console.log(`  public/prover/${WASM}         sha256 ${digest.slice(0, 12)}…`);
