# Contract integration

## Do I need a database or separate backend?

**No.** Payment links do not use MongoDB or any backend storage:

- **Generate link** – Built in the browser. The URL includes `amount`, `memo`, and `dest` (recipient) in the query string, e.g. `/pay/pl_xxx?amount=56&memo=123&dest=G...`.
- **Pay page** – Reads amount, memo, and destination from the URL and does a **classic Stellar XLM payment** (Horizon + Freighter). No database and no Soroban contracts are required.

You do **not** need to run `soroban-escrow/backend` or set **DATABASE_URL** for payment links.

---

## Current flow (no contracts yet)

1. **Generate link** – Builds a URL client-side (no API/DB). Example: `/pay/pl_xxx?amount=56&memo=123`.
2. **Pay page** – Visitor connects Freighter and pays with a **classic Stellar XLM payment** (Horizon). No Soroban contracts are used yet.

---

## Deployed contract IDs (testnet)

After deploying from `soroban-escrow/contracts` with `./deploy-testnet.sh deployer`, add to `landing/.env`:

```env
NEXT_PUBLIC_ESCROW_ENGINE_CONTRACT_ID=CAADI62BFAC4OARW323HMKQ2CBMFSNAEHXXD23V7HUQJACVO57XRRBUV
NEXT_PUBLIC_POOLMANAGER_CONTRACT_ID=CDSOHQQNPLBEMH6WBC6646IH4TJ4SYWLICP6XWJTB7CARWGWPMCPHJAS
```

(Use the IDs from your own deploy output.)

---

## PoolManager (ZK commitment pool) — implemented

On the **Dashboard** (when connected with Freighter), a **ZK commitment pool** card lets you:

1. **Initialize pool** (one-time) – Calls `PoolManager.initialize(admin)` with your wallet as admin.
2. **Add commitment** – Random `secret` + `nullifier` → `PoolManager.commit(secret, nullifier)`. Contract stores Poseidon leaf; root and size update.

Requires `NEXT_PUBLIC_POOLMANAGER_CONTRACT_ID` in `.env`. Prove + withdraw (ZK proof verification) are not implemented yet.

**If you see "trying to invoke non-existent contract function withdraw"**: the deployed contract was built from an older WASM. Rebuild and redeploy PoolManager so the new WASM (with `withdraw`) is deployed, then set the **new** contract ID in `.env`:

```bash
cd soroban-escrow/contracts
cargo build --target wasm32v1-none --release
./deploy-testnet.sh deployer   # or your source key
# Copy the new POOLMANAGER_CONTRACT_ID into landing/.env
```

---

## Using the contracts (optional next steps)

- **EscrowEngine** – For “pay into escrow, release on milestones”: after generating a link you could optionally create an escrow on-chain (user signs `EscrowEngine.create` with Freighter), then store the escrow contract instance ID with the link. The pay page would then need to invoke the contract (deposit) instead of a simple XLM payment.
- **PoolManager** – For commitment / ZK-style flows (e.g. deposit, prove, withdraw).

Right now the app only does simple XLM payments; wiring EscrowEngine into “Generate link” and the pay flow would be a separate feature (Soroban RPC + contract invoke + Freighter signing).
