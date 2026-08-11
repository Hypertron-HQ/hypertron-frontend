# Pay checkout + privacy deposit setup

## What this adds

- Public checkout at `/pay/{id}` (Stripe-like shared links)
- **Privacy OFF:** Freighter classic Stellar payment (destination + `hpl_` memo)
- **Privacy ON:** client ZK `deposit` into `hypertron-transfer` (XLM testnet pool)

## One-time setup

1. Install the published prover (already in `package.json`):

```bash
cd ../hypertron-frontend
npm install @hypertron/prover@0.1.0
```

2. Copy proving key + WASM into `public/` (runtime fetch paths):

```bash
mkdir -p public/keys public/prover
cp ../hypertron-contracts/vk/deposit.pk.bin public/keys/deposit.pk.bin
cp node_modules/@hypertron/prover/web/hypertron_prover_bg.wasm public/prover/
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
