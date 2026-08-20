import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  ChevronRight,
  Layers3,
  LockKeyhole,
  Radar,
} from "lucide-react";
import { DocsShell, SectionHeading } from "@/components/docs/docs-shell";

export const metadata: Metadata = {
  title: "Documentation — Hypertron",
  description:
    "Hypertron is a privacy interface on Stellar — protocol, API, and platform on one settlement rail.",
};

const toc = [
  { href: "#overview", label: "What Hypertron is" },
  { href: "#layers", label: "Three layers" },
] as const;

const layers = [
  {
    icon: LockKeyhole,
    title: "Protocol",
    audience: "Soroban developers",
    copy: "The privacy primitive: Groth16 over BLS12-381, a depth-20 Poseidon tree, and N-in / 2-out private transfer on a shared pool.",
    href: "/docs/protocol",
    cta: "Read the protocol",
  },
  {
    icon: Braces,
    title: "Payments API",
    audience: "Application developers",
    copy: "Hosted checkout, payment objects, and signed webhooks for products that already have a payment experience.",
    href: "/docs/api",
    cta: "Read the API",
  },
  {
    icon: Layers3,
    title: "Platform",
    audience: "Finance and operations teams",
    copy: "Payment links, treasury, settlement, and viewing-key disclosure in one workspace. Same pool, no new anonymity set.",
    href: "/docs/platform",
    cta: "Read the platform",
  },
] as const;

export default function DocsPage() {
  return (
    <DocsShell pathname="/docs" toc={toc}>
      <section id="overview" className="scroll-mt-28">
        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-blue-600 uppercase">
          <Radar className="size-3.5" />
          Hypertron documentation
        </div>
        <h1 className="mt-5 max-w-3xl font-display text-[clamp(3rem,7vw,5.6rem)] leading-[0.9] font-medium tracking-[-0.055em] text-[#101828]">
          Privacy infrastructure,
          <br />
          <span className="text-[#98a2b3]">one interface.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-[#5d6879] sm:text-lg sm:leading-8">
          Hypertron is a unified privacy interface on Stellar for shielding,
          routing, settlement, and selective disclosure. The protocol is the
          foundation: a permissionless shielded pool. The Payments API and the
          workspace sit on that same note set.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/docs/protocol"
            className="inline-flex h-11 items-center gap-2 bg-blue-600 px-5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Start with the protocol
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="https://github.com/Hypertron-HQ/hypertron-contracts/blob/main/docs/ARCHITECTURE.md"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 border border-[#cfd7e3] bg-white px-5 text-xs font-semibold text-[#344054] transition-colors hover:border-[#98a2b3]"
          >
            Contract architecture
            <ArrowUpRight className="size-4" />
          </a>
        </div>
      </section>

      <section
        id="layers"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Three layers"
          title="Protocol first. Then API. Then platform."
          copy="Every path settles through the same Hypertron pools. Pick the layer your team controls."
        />

        <div className="mt-9 grid gap-px overflow-hidden border border-[#dfe5ed] bg-[#dfe5ed] md:grid-cols-3">
          {layers.map((path) => {
            const Icon = path.icon;
            return (
              <Link
                key={path.title}
                href={path.href}
                className="group bg-white p-6 transition-colors hover:bg-[#fbfcfe]"
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center border border-[#d8e0eb] bg-[#f8fafc] text-blue-600">
                    <Icon className="size-4.5" />
                  </span>
                  <ArrowUpRight className="size-4 text-[#98a2b3] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p className="mt-8 text-[10px] font-semibold tracking-[0.14em] text-[#98a2b3] uppercase">
                  {path.audience}
                </p>
                <h3 className="mt-2 font-display text-xl font-medium tracking-[-0.025em] text-[#101828]">
                  {path.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#667085]">
                  {path.copy}
                </p>
                <span className="mt-7 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                  {path.cta}
                  <ChevronRight className="size-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </DocsShell>
  );
}
