import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DocsShell,
  SectionHeading,
  SpecTable,
} from "@/components/docs/docs-shell";

export const metadata: Metadata = {
  title: "Platform — Hypertron Docs",
  description:
    "The Hypertron workspace: payment links, treasury, settlement, and viewing-key disclosure on the same shielded pool.",
};

const toc = [
  { href: "#overview", label: "What the platform is" },
  { href: "#workspace", label: "Workspace" },
  { href: "#accept", label: "Accept" },
  { href: "#treasury", label: "Treasury" },
  { href: "#disclose", label: "Disclose" },
  { href: "#trust", label: "What it is not" },
] as const;

export default function PlatformDocsPage() {
  return (
    <DocsShell pathname="/docs/platform" toc={toc}>
      <section id="overview" className="scroll-mt-28">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-blue-600 uppercase">
          Platform
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.4rem)] leading-[0.92] font-medium tracking-[-0.05em] text-[#101828]">
          Operate the pool without becoming the prover.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[#5d6879]">
          The workspace is the application layer on top of the privacy
          protocol. Finance teams create payment requests, watch settlement,
          hold shielded balances, and export records to an auditor — without
          deploying contracts or managing proving keys. Every payment still
          lands in the same Merkle tree described in the protocol docs.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 bg-blue-600 px-5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Open workspace
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs/protocol"
            className="inline-flex h-11 items-center gap-2 border border-[#cfd7e3] bg-white px-5 text-xs font-semibold text-[#344054] transition-colors hover:border-[#98a2b3]"
          >
            Protocol spec
          </Link>
        </div>
      </section>

      <section
        id="workspace"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Control plane"
          title="One workspace, five surfaces."
          copy="Authentication is a Freighter-signed challenge against the core backend. The session cookie authorizes dashboard routes. It is not a spend key and cannot move notes."
        />
        <SpecTable
          columns={["Tab", "Job"]}
          rows={[
            [
              "Overview",
              "Workspace status: open requests, recent settlement, shielded vs liquid balance.",
            ],
            [
              "Payments",
              "Create links, send privately from owned notes, track hosted checkout.",
            ],
            [
              "Treasury",
              "Shielded notes, unshield to a public address, denomination top-up.",
            ],
            [
              "Developers",
              "API keys and webhook endpoints for the Payments API (same workspace).",
            ],
            [
              "Settings",
              "Profile, receive address, viewing-key export for an auditor.",
            ],
          ]}
        />
      </section>

      <section
        id="accept"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Accept"
          title="Payment links and hosted checkout."
          copy="A link is an internal checkout object. The customer-facing URL is /pay/{id}. Privacy-on checkout spends owned notes via transfer or transfer_n. Privacy-off is a classic Stellar payment with an hpl_ memo."
        />
        <ul className="mt-6 max-w-2xl space-y-3 text-sm leading-6 text-[#667085]">
          <li>
            Note selection is{" "}
            <code className="font-mono text-[12px]">{`{1, 2, 4}`}</code> to
            match live VK ids 3, 4, and 5. Three-note covers need a fourth
            owned note or a top-up.
          </li>
          <li>
            If owned notes do not cover the amount, checkout still has a
            transparent deposit fallback. That path puts amount on the explorer.
            Treat confidential checkout as incomplete until that fallback is
            gone.
          </li>
          <li>
            Note secrets for a private deposit live in browser{" "}
            <code className="font-mono text-[12px]">localStorage</code> keyed by
            the link. They are never sent to Nest.
          </li>
        </ul>
      </section>

      <section
        id="treasury"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Treasury"
          title="Shielded balance is a note set, not an account."
          copy="The workspace lists confirmed unspent notes with leaf indices. Unshield is still the 1-in circuit (VK 2): one note out to a public recipient, change retained by the wallet. TransferN consolidation exists in the pool; the withdraw UI is not yet wired to it."
        />
      </section>

      <section
        id="disclose"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Selective disclosure"
          title="Export a viewing secret. Never a spend key."
          copy="An auditor with the viewing secret can decrypt blobs encrypted to that key, recompute commitments, and match on-chain leaves. They cannot derive nullifiers or spend. This is read-only disclosure, not invoice-bound ZK receipts."
        />
        <p className="mt-6 max-w-2xl text-sm leading-6 text-[#667085]">
          Current export is auditor-grade viewing material, not bookkeeper-grade
          reconciliation and not a proof that invoice X settled for amount Y
          without revealing the pool. Those proofs are not in the protocol
          yet.
        </p>
      </section>

      <section
        id="trust"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Boundary"
          title="The workspace is not the trusted core."
          copy="Dashboard, payment-link APIs, and viewing-key export can fail or lie without minting a note. Validity is Groth16 verification plus the commitment and nullifier contracts."
        />
        <SpecTable
          columns={["In the platform", "Not in the platform"]}
          rows={[
            [
              "Payment links, checkout, treasury UI, webhook config",
              "Circuit definitions, VK administration, Merkle insert authority",
            ],
            [
              "Freighter session cookie (ht_dashboard)",
              "spend_sk, proving keys, ceremony transcripts",
            ],
            [
              "Viewing-key auditor export",
              "Invoice-bound ZK receipts, SEP-6 / SEP-24 fiat ramps",
            ],
          ]}
        />
        <div className="mt-10 flex flex-wrap gap-4 text-xs font-semibold">
          <Link href="/docs/protocol" className="text-blue-600">
            Privacy protocol →
          </Link>
          <Link href="/docs/api" className="text-blue-600">
            Payments API →
          </Link>
        </div>
      </section>
    </DocsShell>
  );
}
