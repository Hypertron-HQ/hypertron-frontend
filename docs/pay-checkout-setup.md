# Pay checkout + privacy deposit setup

## What this adds

- Public checkout at `/pay/{id}` (Stripe-like shared links)
- **Privacy OFF:** Freighter classic Stellar payment (destination + `hpl_` memo)
- **Privacy ON:** client ZK `deposit` into `hypertron-transfer` (XLM testnet pool)

## One-time setup

1. Build the prover and sync it into this app. `@hypertron/prover` resolves to
   `vendor/hypertron-prover-wasm`, which is a committed copy of the local build
   — not the registry package, which lags behind the circuits:

```bash
(cd ../hypertron-contracts/prover-wasm && ./build.sh)
pnpm prover:sync
```

`prover:sync` refreshes both the vendored glue and `public/prover/*.wasm`. The
wasm-bindgen glue only links against the exact binary it was generated with, so
never update one without the other. Re-run it after any change to the prover
crate or `prover-wasm/src/lib.rs`.

2. Copy the proving keys into `public/` (runtime fetch paths):

```bash
mkdir -p public/keys
cp ../hypertron-contracts/vk/deposit.pk.bin public/keys/deposit.pk.bin
```

Note secrets `n` / `k` must be passed as `0x`-hex (decimal is capped at u128 by the prover).

4. Env — copy `.env.example` values. Core must have:

```bash
FRONTEND_URL=http://localhost:3000
```

so created links point at this app’s `/pay/{id}`.

## Local verify

1. Core `:4000`, frontend `:3000`, Freighter on testnet
2. Collect → privacy OFF → open link → Pay with Freighter
3. Collect → privacy ON (XLM) → Shield & pay → check pool on Stellar Lab

Note secrets for private deposits are stored in **browser localStorage** only (`ht_note_{linkId}`). Never sent to Nest.
