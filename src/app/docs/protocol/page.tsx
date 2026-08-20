import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight } from "lucide-react";
import {
  CodeBlock,
  DocsShell,
  SectionHeading,
  SpecTable,
} from "@/components/docs/docs-shell";

export const metadata: Metadata = {
  description:
    "Technical specification of the Hypertron shielded pool: Groth16 over BLS12-381, Poseidon notes, TransferNCircuit, and the live testnet deployment.",
};

const toc = [
  { href: "#status", label: "Deployment status" },
  { href: "#what", label: "What this is" },
  { href: "#crypto", label: "Cryptographic backend" },
  { href: "#notes", label: "Notes and keys" },
  { href: "#view", label: "Spend vs view" },
  { href: "#tree", label: "Commitment tree" },
  { href: "#circuits", label: "Circuits" },
  { href: "#transfer-n", label: "TransferN" },
  { href: "#vk", label: "VK IDs and testnet" },
  { href: "#indexer", label: "Indexer and DA" },
  { href: "#roadmap", label: "Production hardening" },
] as const;

const noteMath = `owner_pk = Poseidon(spend_sk, 0)
cm       = Poseidon(Poseidon(owner_pk, k), v)
nf       = Poseidon(spend_sk, k)`;

const transferN = `// N ∈ {2, 4}. No dummy-input padding.
Public:  [root, nf_1 … nf_N, out_cm1, out_cm2]
Private: [spend_sk,
          for each input i: k_i, v_i, Merkle path,
          owner_pk1, k1, v1, owner_pk2, k2, v2]
Checks:
  owner = Poseidon(spend_sk, 0)
  each input cm is in root under that owner
  nf_i = Poseidon(spend_sk, k_i)
  out_cm1, out_cm2 open correctly
  v1, v2, each input v are 64-bit
  Σ v_i = v1 + v2`;

const verifyCmd = `# Hashes local artifacts against deployments/testnet.json
# then checks the chain accepts a fresh proof from each PK.
./scripts/verify_deployment.sh`;

export default function ProtocolDocsPage() {
  return (
    <DocsShell pathname="/docs/protocol" toc={toc}>
      <section id="status" className="scroll-mt-28">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-blue-600 uppercase">
          Privacy protocol
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.4rem)] leading-[0.92] font-medium tracking-[-0.05em] text-[#101828]">
          Shielded pool on Stellar.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[#5d6879]">
          Hypertron&apos;s protocol is a permissionless shielded pool: deposit
          into a Poseidon Merkle tree, privately transfer notes, unshield to a
          public Stellar address. Proofs are Groth16 over BLS12-381
          (CAP-0059). The pool is the cryptographic core. The API and workspace
          are consumers of it, not part of the trusted computing base.
        </p>

        <div className="mt-8 border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
            <div className="text-sm leading-6 text-amber-950/80">
              <p className="font-semibold text-amber-950">
                Testnet. Single-coordinator Groth16 setup. No ceremony. No
                audit.
              </p>
              <p className="mt-2">
                Keys were generated 15 Aug 2026 from OS CSPRNG
                (<code className="font-mono text-[12px]">OsRng</code>). No seed
                material exists on disk, so an arbitrary reader cannot replay
                the setup. The coordinator who ran it could have retained the
                toxic waste and{" "}
                <strong>could forge proofs</strong>. That is not a multi-party
                ceremony. Do not put assets of value in this pool.
              </p>
              <p className="mt-2">
                Keys generated before 15 Aug 2026 used public seed{" "}
                <code className="font-mono text-[12px]">1</code>. Those are
                retired. A seed-1 deposit proof verifies{" "}
                <code className="font-mono text-[12px]">false</code> against the
                live verifier.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="what"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Scope"
          title="A production deployment of a shielded-payment primitive."
          copy="The interesting object is the pool: notes, nullifiers, a recent-root window, and on-chain pairing checks. Application layers reuse this tree. They do not get a private anonymity set."
        />
        <p className="mt-6 max-w-2xl text-sm leading-6 text-[#667085]">
          Stellar has an existing research primitive in this class — SDF
          commissioned shielded-payment protocol work (SPP) that showed a
          Groth16 pool is viable on this network. Hypertron is a CAP-0059
          deployment of that construction: live testnet contracts, browser
          proving, an indexer for leaf availability, and merchant-facing
          layers on the same note set. Cite the primitive. This page describes
          Hypertron&apos;s circuits and contracts, not a comparison.
        </p>
        <SpecTable
          columns={["Component", "Responsibility"]}
          rows={[
            [
              "contracts/commitment",
              "Depth-20 Poseidon Merkle tree, 32-root history, insert-only by the pool.",
            ],
            [
              "contracts/nullifier",
              "Persistent spent-nullifier set. Losing a spent nf is a double-spend.",
            ],
            [
              "contracts/verifier",
              "Admin-registered Groth16 VKs. CAP-0059 pairing verification.",
            ],
            [
              "contracts/transfer",
              "Token custody. Atomic deposit / transfer / transfer_n / unshield.",
            ],
            [
              "contracts/compliance",
              "Optional allow/deny at transparent exit only. Not on private transfer.",
            ],
            [
              "prover + prover-wasm",
              "Circuits, setup CLI, Merkle paths, note math, viewing encryption.",
            ],
            [
              "indexer",
              "Ordered leaves beyond RPC retention. Not a verifier. Cannot authorize a spend.",
            ],
          ]}
        />
        <p className="mt-5 text-xs leading-5 text-[#98a2b3]">
          The transfer pool is the only authority that may insert commitments or
          mark nullifiers spent. Verifier-key administration can replace a
          registered VK with no timelock.
        </p>
      </section>

      <section
        id="crypto"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="CAP-0059"
          title="Groth16 over BLS12-381, end to end."
          copy="Pairing in pure contract WASM is not feasible inside Soroban limits. Host functions are a hard dependency, not an optimization."
        />
        <SpecTable
          columns={["Layer", "Choice"]}
          rows={[
            ["Proof system", "Groth16"],
            ["Curve / scalar field", "BLS12-381"],
            ["Off-chain prover", "ark-bls12-381"],
            ["On-chain verifier", "soroban_sdk::crypto::bls12_381"],
            [
              "Note / Merkle hash",
              "Poseidon over the BLS12-381 scalar field (soroban-poseidon on-chain)",
            ],
            [
              "Viewing encryption",
              "X25519 ECDH + SHA-256 domain-separated KDF + ChaCha20-Poly1305",
            ],
            ["Merkle depth", "20 (2^20 leaves)"],
            ["Accepted roots", "Most recent 32"],
            ["Value range", "Explicit 64-bit checks on outputs and amounts"],
          ]}
        />
      </section>

      <section
        id="notes"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Note construction"
          title="Commitment hides contents. Nullifier prevents double-spend."
          copy="A note is an owner public key, a fresh blinding factor, and a value. The spend key never appears on-chain."
        />
        <CodeBlock label="Note algebra">{noteMath}</CodeBlock>
        <ul className="mt-6 max-w-2xl space-y-2 text-sm leading-6 text-[#667085]">
          <li>
            <code className="font-mono text-[12px] text-[#101828]">spend_sk</code>{" "}
            — secret required to spend. Never encrypted into viewing blobs.
          </li>
          <li>
            <code className="font-mono text-[12px] text-[#101828]">owner_pk</code>{" "}
            — public receiving material. Deposit does not require the spend key.
          </li>
          <li>
            <code className="font-mono text-[12px] text-[#101828]">k</code> —
            per-note blinding. Reused k under the same spend key collides
            nullifiers.
          </li>
          <li>
            <code className="font-mono text-[12px] text-[#101828]">v</code> —
            value. Spent input value is constrained by conservation, not a
            second bit decomposition.
          </li>
        </ul>
      </section>

      <section
        id="view"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Disclosure"
          title="Viewing cannot spend."
          copy="The viewing key is an independent X25519 pair. Decrypting a blob reveals owner_pk || k || v. It cannot compute Poseidon(spend_sk, k), so it cannot produce a valid nullifier or witness."
        />
        <p className="mt-6 max-w-2xl text-sm leading-6 text-[#667085]">
          Blob length for a valid AEAD ciphertext is 144 bytes: 32-byte
          ephemeral public key, 96-byte plaintext, 16-byte Poly1305 tag. The
          ChaCha nonce is implicit all-zeros; uniqueness comes from a fresh
          ephemeral key per note.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#667085]">
          Transfer blobs are <strong>not</strong> circuit public inputs. A
          submitter can replace, empty, or omit them without invalidating the
          proof. Scanners must recompute{" "}
          <code className="font-mono text-[12px]">cm</code> from a decrypted
          note and match the published leaf. Ownership still follows the
          proof-bound commitments.
        </p>
      </section>

      <section
        id="tree"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Commitment contract"
          title="Incremental Poseidon tree, depth 20."
          copy="Only the configured pool may insert. Duplicate leaves are rejected. Insertions emit index, leaf, and root. The indexer preserves order after RPC events expire."
        />
      </section>

      <section
        id="circuits"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Circuits"
          title="Separate proving key and VK id per statement."
          copy="Any circuit change needs a new setup and a distinct registration. IDs are deployment configuration, not protocol constants."
        />
        <SpecTable
          columns={["Circuit", "Public inputs", "Statement"]}
          rows={[
            [
              "Deposit · VK 1",
              "[cm, amount]",
              "cm opens to amount. Amount is 64-bit. No spend key required.",
            ],
            [
              "Unshield · VK 2",
              "[root, nf, recipient, amount, change_cm]",
              "Spend one note to a public address; change stays under the same spend key.",
            ],
            [
              "Transfer 1-in/2-out · VK 3",
              "[root, nf, out_cm1, out_cm2]",
              "Spend one note, emit recipient + change. Amounts not public.",
            ],
            [
              "TransferN 2-in/2-out · VK 4",
              "[root, nf_1, nf_2, out_cm1, out_cm2]",
              "Same owner spend key. No dummy padding. Conservation across two inputs.",
            ],
            [
              "TransferN 4-in/2-out · VK 5",
              "[root, nf_1…nf_4, out_cm1, out_cm2]",
              "Consolidation in-circuit. 4-in browser proving time is not published.",
            ],
          ]}
        />
        <p className="mt-5 max-w-2xl text-sm leading-6 text-[#667085]">
          Unshield <code className="font-mono text-[12px]">recipient_field</code>{" "}
          is the BLS12-381 scalar reduction of{" "}
          <code className="font-mono text-[12px]">
            SHA-256(XDR(ScVal::Address(recipient)))
          </code>
          . The contract derives it from the actual payout address, so a
          submitter cannot redirect funds. Unshield does not emit an encrypted
          change blob; the wallet must retain change material. Withdraw UI is
          still the 1-in unshield path.
        </p>
      </section>

      <section
        id="transfer-n"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="TransferNCircuit"
          title="Live arity is 1, 2, and 4. Not 1-in only."
          copy="TransferNCircuit<N> spends N notes under one spend key and emits two outputs. N is a const generic. There is no dummy-input padding, so proving time scales with the payment."
        />
        <CodeBlock label="TransferNCircuit">{transferN}</CodeBlock>
        <p className="mt-6 max-w-2xl text-sm leading-6 text-[#667085]">
          Checkout selects the smallest confirmed-note set whose values sum to
          at least the payment, with size in{" "}
          <code className="font-mono text-[12px]">{`{1, 2, 4}`}</code>. A
          three-note cover takes a fourth owned note when one exists; otherwise
          the caller must top up. There is no 3-in circuit. That hole is
          intentional: a 3-in VK would be another setup, another proving key,
          another registration.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[#667085]">
          Contract entry points:{" "}
          <code className="font-mono text-[12px]">transfer</code> (VK 3) and{" "}
          <code className="font-mono text-[12px]">transfer_n</code> (VK 4 or 5,
          requiring 2 or 4 nullifiers). WASM exports{" "}
          <code className="font-mono text-[12px]">transfer_2_proof</code> and{" "}
          <code className="font-mono text-[12px]">transfer_4_proof</code>.
        </p>
      </section>

      <section
        id="vk"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Testnet · 15 Aug 2026"
          title="The pool that is actually live."
          copy="Pool, commitment, and nullifier were redeployed for multi-input transfer (fresh Merkle tree). Verifier CCHSL7YS… was kept; VK ids 4 and 5 were registered on it."
        />
        <SpecTable
          columns={["Role", "Contract"]}
          rows={[
            ["Pool", "CB2SVTMGQKQVLUHWC5J7K5NOHPXULWEJL452B457NCRW7OKJ42XSVOLL"],
            [
              "Commitment",
              "CD7ZZPCQR7DDZHRNRDUFQ5PKSZK3KVPR3HXKO32NR5QNZWNH2ASVCMTQ",
            ],
            [
              "Nullifier",
              "CCIZPBTVHFO6PCUB7APABIBSIJUUND2WVW6NSA2RBPCEOLUMASKF7KQD",
            ],
            [
              "Verifier",
              "CCHSL7YSPSCT62DBUSCG4CKBJ2I4U4JSBR4RE3YIEGNSEUYXYY7BDIEP",
            ],
            [
              "Token",
              "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC (native XLM SAC)",
            ],
          ]}
        />
        <CodeBlock label="hypertron-contracts">{verifyCmd}</CodeBlock>
        <p className="mt-5 max-w-2xl text-sm leading-6 text-[#667085]">
          A Groth16 pairing check cannot pass against an unrelated verifying
          key, so the script confirms the on-chain keys without trusting{" "}
          <code className="font-mono text-[12px]">deployments/testnet.json</code>{" "}
          or its author. The{" "}
          <code className="font-mono text-[12px]">VkRegistered</code> event
          carries only the vk_id, not the key hash — observers must re-run the
          script after any admin action.
        </p>
        <p className="mt-4">
          <a
            href="https://lab.stellar.org/r/testnet/contract/CB2SVTMGQKQVLUHWC5J7K5NOHPXULWEJL452B457NCRW7OKJ42XSVOLL"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600"
          >
            Open pool on Stellar Lab
            <ArrowUpRight className="size-3.5" />
          </a>
        </p>
      </section>

      <section
        id="indexer"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Data availability"
          title="The chain is authority. The indexer is availability."
          copy="RPC event retention is not a permanent DA layer. The indexer records commitment events, serves ordered leaves, and parses nullifiers[]. It cannot authorize a spend."
        />
        <ul className="mt-6 max-w-2xl space-y-3 text-sm leading-6 text-[#667085]">
          <li>
            The server already cross-checks{" "}
            <code className="font-mono text-[12px]">commitment.root()</code>{" "}
            on-chain before treating an indexer response as current.
          </li>
          <li>
            The browser still builds Merkle paths from served leaves. It does{" "}
            <strong>not</strong> yet recompute the Poseidon root and compare it
            with the on-chain root. Until that check ships, clients depend on
            the indexer for correct path construction, not only availability.
          </li>
          <li>
            Deposit and unshield require{" "}
            <code className="font-mono text-[12px]">require_auth</code> on the
            transparent Stellar account. Private transfer does not: the proof
            binds the state transition, so a relayer can submit. This repository
            does not operate a production relayer. Direct submission exposes the
            submitter (CAP-0015 fee-bump is the intended cover).
          </li>
        </ul>
      </section>

      <section
        id="roadmap"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Roadmap"
          title="Production hardening."
          copy="Testnet is live. These are the remaining protocol and client items before the pool is treated as production infrastructure."
        />
        <SpecTable
          columns={["Work", "Now"]}
          rows={[
            [
              "Transfer arity",
              "Shipped on testnet. VK 3, 4, 5 registered. Checkout selects {1, 2, 4}.",
            ],
            [
              "3-in payments",
              "No dedicated circuit. Selector pads to 4 owned notes or asks for a top-up.",
            ],
            [
              "Confidential checkout",
              "If notes do not cover, checkout still has a transparent deposit path. Remove that fallback.",
            ],
            [
              "Client Merkle check",
              "Server already checks the contract root. Browser should recompute Poseidon from served leaves.",
            ],
            [
              "Relayer",
              "ABI allows relayed transfer. No production relayer yet, so the submitter is public.",
            ],
            [
              "Proof-bound blobs",
              "Commitments are bound. Ciphertext is not. Bind or authenticate note blobs.",
            ],
            [
              "Ceremony and audit",
              "Single-coordinator setup. Next: multi-party ceremony, published transcripts, independent audit.",
            ],
            [
              "Mainnet",
              "After frozen circuits, ceremony, audit, and proving benchmarks.",
            ],
          ]}
        />
        <div className="mt-10 flex flex-wrap gap-4 text-xs font-semibold">
          <Link href="/docs/api" className="text-blue-600">
            Payments API →
          </Link>
          <Link href="/docs/platform" className="text-blue-600">
            Platform →
          </Link>
          <a
            href="https://github.com/Hypertron-HQ/hypertron-contracts/blob/main/docs/SECURITY.md"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#667085]"
          >
            SECURITY.md
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </section>
    </DocsShell>
  );
}
