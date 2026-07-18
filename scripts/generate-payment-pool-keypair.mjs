#!/usr/bin/env node
/**
 * Generate a Stellar G-address for NEXT_PUBLIC_PAYMENT_POOL_ADDRESS (receive-only pool).
 * Fund the PUBLIC key on testnet (Friendbot) or mainnet. Store SECRET only in deployment secrets
 * if the server must send from this account later (withdrawals); receiving needs public key only.
 *
 * Usage: node scripts/generate-payment-pool-keypair.mjs
 */
import { Keypair } from "@stellar/stellar-sdk";

const kp = Keypair.random();
console.log("\nPayment pool keypair (save SECRET in your password manager / .env — never commit):\n");
console.log(`NEXT_PUBLIC_PAYMENT_POOL_ADDRESS=${kp.publicKey()}`);
console.log(`PAYMENT_POOL_SECRET=${kp.secret()}`);
console.log("\nTestnet: fund via https://friendbot.stellar.org?addr=" + kp.publicKey());
console.log("Mainnet pool: TODO — generate a separate keypair for production and fund with XLM + USDC trustline.\n");
