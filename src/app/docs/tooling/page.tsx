import type { Metadata } from "next";
import Link from "next/link";
import {
  DocsShell,
  SectionHeading,
  SpecTable,
} from "@/components/docs/docs-shell";

export const metadata: Metadata = {
  description:
    "Hypertron developer tooling: reusable SDKs and crates for note discovery, proof generation, relaying, and selective disclosure. Direction of the platform, not a packaged SDK today.",
};

const toc = [
  { href: "#direction", label: "Direction" },
  { href: "#surfaces", label: "What will ship" },
  { href: "#today", label: "What exists today" },
] as const;

export default function ToolingDocsPage() {
  return (
    <DocsShell pathname="/docs/tooling" toc={toc}>
      <section id="direction" className="scroll-mt-28">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-blue-600 uppercase">
          Developer tooling
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.4rem)] leading-[0.92] font-medium tracking-[-0.05em] text-[#101828]">
          Private settlement as an integration, not a circuit rewrite.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[#5d6879]">
          As the protocol matures, Hypertron will expose reusable SDKs, APIs,
          and language-specific crates around the machinery that today lives
          inside our own frontend: note discovery, transaction construction,
          proof generation, relaying, payment verification, and selective
          disclosure.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#5d6879]">
          The goal is a developer experience closer to integrating a payment
          API than implementing a privacy protocol from scratch.
        </p>
      </section>

      <section
        id="surfaces"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Consumers"
          title="What should be able to call this layer."
          copy="Hypertron is not trying to win by inventing another cryptographic primitive. The work is making the existing pool easy to consume."
        />
        <SpecTable
          columns={["Integrator", "Intended outcome"]}
          rows={[
            [
              "Wallet",
              "A private-send option against the shared pool, without embedding circuit engineering in the wallet team.",
            ],
            [
              "DEX",
              "Settle a fill privately so the trade amount is not published on the ledger.",
            ],
            [
              "Payroll",
              "Confidential stablecoin disbursement while deposits and withdrawals stay visible on Stellar.",
            ],
            [
              "Merchant app",
              "Private stablecoin checkout without learning ZK circuits, via workspace or API today, SDK later.",
            ],
            [
              "Any application",
              "Call an API or SDK and let Hypertron handle proving, relaying, and disclosure underneath.",
            ],
          ]}
        />
        <SpecTable
          columns={["Surface", "Job"]}
          rows={[
            [
              "Note discovery",
              "Scan encrypted blobs, match commitments to on-chain leaves, build a local unspent set.",
            ],
            [
              "Transaction construction",
              "Select notes in {1, 2, 4}, assemble public inputs, and choose deposit / transfer / transfer_n / unshield.",
            ],
            [
              "Proof generation",
              "Run Groth16 in a browser worker (or native crate) against the registered proving key.",
            ],
            [
              "Relaying",
              "Submit a valid private transfer so the customer is not the fee payer (CAP-0015).",
            ],
            [
              "Payment verification",
              "Confirm a settlement against the pool without holding a spend key.",
            ],
            [
              "Selective disclosure",
              "Export viewing material, then payment-specific receipts that an auditor can verify independently.",
            ],
          ]}
        />
      </section>

      <section
        id="today"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Current state"
          title="The client logic is ours. It is not a third-party SDK."
          copy="Today you integrate through the open contracts, the Payments API, or the merchant workspace. There is no published typed client for wallets or DEXes."
        />
        <ul className="mt-6 max-w-2xl space-y-3 text-sm leading-6 text-[#667085]">
          <li>
            Browser proving, note math, and checkout coin selection live in
            this frontend and in{" "}
            <code className="font-mono text-[12px] text-[#101828]">
              prover-wasm
            </code>
            . They are not versioned as a public package for integrators.
          </li>
          <li>
            The pool ABI is already callable: Apache-2.0 contracts on Stellar
            testnet. A Soroban app can deposit, transfer, and unshield without
            waiting on the SDK.
          </li>
          <li>
            Relaying, client Merkle-root checks, and invoice-bound receipts are
            still protocol/client work. Packaging them for third parties
            follows those shipping.
          </li>
        </ul>
        <div className="mt-10 flex flex-wrap gap-4 text-xs font-semibold">
          <Link href="/docs/protocol" className="text-blue-600">
            Privacy protocol →
          </Link>
          <Link href="/docs/api" className="text-blue-600">
            Payments API →
          </Link>
          <Link href="/docs/platform" className="text-blue-600">
            Merchant payments →
          </Link>
        </div>
      </section>
    </DocsShell>
  );
}
