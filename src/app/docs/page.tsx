import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  Check,
  ChevronRight,
  CircleDot,
  KeyRound,
  Layers3,
  LockKeyhole,
  Radar,
  Webhook,
} from "lucide-react";
import { getDeveloperApiBaseUrl } from "@/lib/developer-api";

export const metadata: Metadata = {
  title: "Documentation — Hypertron",
  description:
    "Learn how to accept, operate, and integrate private payments on Stellar with Hypertron.",
};

const navigation = [
  {
    label: "Start here",
    items: [
      { href: "#overview", label: "Overview" },
      { href: "#choose-a-path", label: "Choose a path" },
      { href: "#quickstart", label: "API quickstart" },
    ],
  },
  {
    label: "Understand",
    items: [
      { href: "#payment-lifecycle", label: "Payment lifecycle" },
      { href: "#privacy-model", label: "Privacy model" },
      { href: "#environments", label: "Environments" },
    ],
  },
] as const;

const integrationPaths = [
  {
    icon: Layers3,
    title: "Platform",
    audience: "Finance and operations teams",
    copy: "Create payment links, track settlement, manage treasury, and disclose records from one workspace.",
    href: "/dashboard",
    cta: "Open workspace",
    external: false,
  },
  {
    icon: Braces,
    title: "Payments API",
    audience: "Application developers",
    copy: "Create hosted checkout sessions and follow every payment through a small, predictable API.",
    href: "/developers",
    cta: "Get API keys",
    external: false,
  },
  {
    icon: LockKeyhole,
    title: "Privacy protocol",
    audience: "Soroban developers",
    copy: "Call the permissionless pool directly and share the same note set without adopting the dashboard.",
    href: "https://github.com/Hypertron-HQ/hypertron-contracts/blob/main/docs/ARCHITECTURE.md",
    cta: "Read architecture",
    external: true,
  },
] as const;

const lifecycle = [
  {
    label: "Create",
    copy: "Your app creates a payment and receives a hosted checkout URL.",
  },
  {
    label: "Pay",
    copy: "The customer reviews the request and pays with a supported Stellar wallet.",
  },
  {
    label: "Confirm",
    copy: "Hypertron observes the transaction and advances the payment state.",
  },
  {
    label: "Operate",
    copy: "Your team reconciles settlement or responds to payment events.",
  },
] as const;

const curlExample = `curl -X POST "$HYPERTRON_API/v1/payments" \\
  -H "Authorization: Bearer $HYPERTRON_SECRET_KEY" \\
  -H "Idempotency-Key: order_1234" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "125.00",
    "currency": "USDC",
    "description": "Order #1234",
    "customer_email": "customer@example.com",
    "metadata": { "order_id": "ord_1234" }
  }'`;

function LogoMark() {
  return (
    <span aria-hidden className="grid grid-cols-2 gap-[2px]">
      <span className="size-1.5 bg-current" />
      <span className="size-1.5 bg-current" />
      <span className="size-1.5 bg-current" />
      <span className="size-1.5 bg-current" />
    </span>
  );
}

export default function DocsPage() {
  const apiBase = getDeveloperApiBaseUrl();

  return (
    <div className="surface-light min-h-svh bg-[#f6f8fb] text-[#172033]">
      <header className="sticky top-0 z-50 border-b border-[#dfe5ed] bg-[#f6f8fb]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-display text-[14px] font-medium tracking-[0.14em] text-[#111827] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              <LogoMark />
              Hypertron
            </Link>
            <span className="h-5 w-px bg-[#d7dee8]" aria-hidden />
            <span className="text-sm font-medium text-[#667085]">Docs</span>
          </div>

          <nav className="flex items-center gap-5">
            <a
              href={`${apiBase}/docs`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 text-xs font-medium text-[#667085] transition-colors hover:text-[#101828] sm:inline-flex"
            >
              API reference
              <ArrowUpRight className="size-3.5" />
            </a>
            <Link
              href="/developers"
              className="inline-flex h-9 items-center gap-2 bg-[#101828] px-4 text-[11px] font-semibold tracking-[0.12em] text-white uppercase transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Developer console
              <ArrowRight className="size-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,840px)_220px]">
        <aside className="hidden border-r border-[#e1e6ee] lg:block">
          <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-y-auto px-7 py-10">
            <p className="mb-8 flex items-center gap-2 text-xs font-semibold text-[#344054]">
              <BookOpen className="size-4 text-blue-600" />
              Documentation
            </p>
            <nav className="space-y-8" aria-label="Documentation">
              {navigation.map((section) => (
                <div key={section.label}>
                  <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-[#98a2b3] uppercase">
                    {section.label}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block border-l border-transparent py-1.5 pl-3 text-[13px] text-[#667085] transition-colors hover:border-blue-500 hover:text-[#101828]"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-10 border-t border-[#e1e6ee] pt-6">
              <a
                href="https://github.com/Hypertron-HQ"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#667085] hover:text-[#101828]"
              >
                Hypertron on GitHub
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-14">
          <div className="mb-10 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {navigation.flatMap((section) =>
              section.items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="shrink-0 border border-[#d8dee8] bg-white px-3 py-2 text-xs text-[#667085]"
                >
                  {item.label}
                </a>
              )),
            )}
          </div>

          <section id="overview" className="scroll-mt-28">
            <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-blue-600 uppercase">
              <Radar className="size-3.5" />
              Hypertron documentation
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-[clamp(3rem,7vw,5.6rem)] leading-[0.9] font-medium tracking-[-0.055em] text-[#101828]">
              Private payments,
              <br />
              <span className="text-[#98a2b3]">clear operations.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#5d6879] sm:text-lg sm:leading-8">
              Hypertron is payment infrastructure on Stellar. Use the workspace,
              embed hosted checkout through the API, or integrate the privacy
              protocol directly into a Soroban application.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#quickstart"
                className="inline-flex h-11 items-center gap-2 bg-blue-600 px-5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Start with the API
                <ArrowRight className="size-4" />
              </a>
              <a
                href={`${apiBase}/docs`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 border border-[#cfd7e3] bg-white px-5 text-xs font-semibold text-[#344054] transition-colors hover:border-[#98a2b3]"
              >
                Open API reference
                <ArrowUpRight className="size-4" />
              </a>
            </div>
          </section>

          <section
            id="choose-a-path"
            className="scroll-mt-28 border-t border-[#dfe5ed] pt-16 mt-20"
          >
            <SectionHeading
              eyebrow="Three ways in"
              title="Choose the layer you need."
              copy="Each path uses the same payment rail. Start with the interface that matches what your team controls."
            />

            <div className="mt-9 grid gap-px overflow-hidden border border-[#dfe5ed] bg-[#dfe5ed] md:grid-cols-3">
              {integrationPaths.map((path) => {
                const Icon = path.icon;
                const content = (
                  <>
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
                  </>
                );

                return path.external ? (
                  <a
                    key={path.title}
                    href={path.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group bg-white p-6 transition-colors hover:bg-[#fbfcfe]"
                  >
                    {content}
                  </a>
                ) : (
                  <Link
                    key={path.title}
                    href={path.href}
                    className="group bg-white p-6 transition-colors hover:bg-[#fbfcfe]"
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </section>

          <section
            id="quickstart"
            className="scroll-mt-28 border-t border-[#dfe5ed] pt-16 mt-20"
          >
            <SectionHeading
              eyebrow="API quickstart"
              title="Create your first checkout."
              copy="Use a test key while you build. Every create request needs an idempotency key so retries cannot produce duplicate payments."
            />

            <div className="mt-10 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
              <ol className="space-y-5">
                {[
                  {
                    icon: KeyRound,
                    title: "Create a test key",
                    copy: "Open the developer console and create an sk_test_ key.",
                  },
                  {
                    icon: Braces,
                    title: "Create a payment",
                    copy: "Send an amount, currency, and optional customer details.",
                  },
                  {
                    icon: Webhook,
                    title: "Track the result",
                    copy: "Poll the payment or subscribe to payment events.",
                  },
                ].map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <li key={step.title} className="flex gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-[#d8e0eb] bg-white text-blue-600">
                        <Icon className="size-3.5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-[#344054]">
                          <span className="mr-1.5 font-mono text-[#98a2b3]">
                            {index + 1}.
                          </span>
                          {step.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[#7b8493]">
                          {step.copy}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="min-w-0 overflow-hidden bg-[#0b1020] text-white shadow-[0_22px_60px_rgba(31,47,78,0.14)]">
                <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
                  <div className="flex items-center gap-1.5" aria-hidden>
                    <span className="size-2 rounded-full bg-[#ff7b72]" />
                    <span className="size-2 rounded-full bg-[#f2cc60]" />
                    <span className="size-2 rounded-full bg-[#56d364]" />
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.12em] text-white/45 uppercase">
                    Terminal
                  </span>
                </div>
                <pre className="overflow-x-auto p-5 text-[12px] leading-6 text-[#d7e2f4]">
                  <code>{curlExample}</code>
                </pre>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-3 text-[10px] text-white/45">
                  <span>POST /v1/payments</span>
                  <span>USDC · EURC · XLM</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 border border-blue-200 bg-blue-50 px-4 py-3.5">
              <CircleDot className="mt-0.5 size-4 shrink-0 text-blue-600" />
              <p className="text-xs leading-5 text-blue-950/75">
                Keep secret keys on your server. Never expose an{" "}
                <code className="font-mono text-blue-800">sk_test_</code> or{" "}
                <code className="font-mono text-blue-800">sk_live_</code> key in
                browser code.
              </p>
            </div>
          </section>

          <section
            id="payment-lifecycle"
            className="scroll-mt-28 border-t border-[#dfe5ed] pt-16 mt-20"
          >
            <SectionHeading
              eyebrow="Core concept"
              title="A payment is a stateful journey."
              copy="The checkout URL is only the customer-facing step. The payment object remains your source of truth before and after checkout."
            />

            <ol className="relative mt-10 grid gap-0 border-y border-[#dfe5ed] md:grid-cols-4">
              <span
                aria-hidden
                className="absolute top-[29px] right-[12.5%] left-[12.5%] hidden h-px bg-blue-200 md:block"
              />
              {lifecycle.map((step, index) => (
                <li
                  key={step.label}
                  className="relative border-b border-[#e5e9f0] py-6 last:border-b-0 md:border-r md:border-b-0 md:px-5 md:last:border-r-0"
                >
                  <span className="relative z-10 flex size-2.5 rounded-full border-2 border-[#f6f8fb] bg-blue-600 ring-1 ring-blue-300" />
                  <p className="mt-5 font-display text-lg font-medium tracking-tight text-[#101828]">
                    <span className="mr-2 font-mono text-[10px] text-[#98a2b3]">
                      0{index + 1}
                    </span>
                    {step.label}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#667085]">
                    {step.copy}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section
            id="privacy-model"
            className="scroll-mt-28 border-t border-[#dfe5ed] pt-16 mt-20"
          >
            <SectionHeading
              eyebrow="Privacy model"
              title="Private does not mean invisible."
              copy="Hypertron reduces unnecessary public exposure while preserving an explicit path to inspect relevant records."
            />
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Shield",
                  copy: "Payment details do not need to become a public business ledger.",
                },
                {
                  title: "Separate",
                  copy: "Viewing information can be shared without granting spending authority.",
                },
                {
                  title: "Disclose",
                  copy: "Authorized parties can inspect the records required for an audit.",
                },
              ].map((item) => (
                <div key={item.title} className="border-t-2 border-[#101828] pt-5">
                  <Check className="size-4 text-blue-600" />
                  <h3 className="mt-4 text-sm font-semibold text-[#101828]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-[#667085]">
                    {item.copy}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="environments"
            className="scroll-mt-28 border-t border-[#dfe5ed] pt-16 mt-20"
          >
            <SectionHeading
              eyebrow="Environments"
              title="Test first. Move live deliberately."
              copy="Test and live credentials are separate. A key only accesses data created in its own environment."
            />
            <div className="mt-8 overflow-hidden border border-[#dfe5ed] bg-white">
              <div className="grid grid-cols-[110px_minmax(0,1fr)] border-b border-[#e5e9f0] px-5 py-4 text-xs sm:grid-cols-[160px_1fr_1fr]">
                <span className="font-mono text-blue-600">sk_test_</span>
                <span className="text-[#667085]">Build and validate integrations</span>
                <span className="hidden text-right text-[#98a2b3] sm:block">
                  Test environment
                </span>
              </div>
              <div className="grid grid-cols-[110px_minmax(0,1fr)] px-5 py-4 text-xs sm:grid-cols-[160px_1fr_1fr]">
                <span className="font-mono text-[#101828]">sk_live_</span>
                <span className="text-[#667085]">Process production payments</span>
                <span className="hidden text-right text-[#98a2b3] sm:block">
                  Live environment
                </span>
              </div>
            </div>
          </section>

          <section className="mt-20 border border-[#cfd8e6] bg-[#edf3fb] p-7 sm:p-9">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-blue-600 uppercase">
              Go deeper
            </p>
            <div className="mt-4 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl font-medium tracking-[-0.03em] text-[#101828]">
                  Explore every request and response.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-[#667085]">
                  The live reference includes payment, customer, checkout, and
                  webhook endpoint schemas.
                </p>
              </div>
              <a
                href={`${apiBase}/docs`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-[#101828] hover:text-blue-600"
              >
                Open API reference
                <ArrowUpRight className="size-4" />
              </a>
            </div>
          </section>

          <footer className="mt-20 flex flex-col gap-4 border-t border-[#dfe5ed] py-8 text-xs text-[#98a2b3] sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Hypertron Labs</span>
            <div className="flex gap-5">
              <Link href="/">Home</Link>
              <Link href="/developers">Developer console</Link>
              <a
                href="https://github.com/Hypertron-HQ"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </div>
          </footer>
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-16 px-7 py-10">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#98a2b3] uppercase">
              On this page
            </p>
            <nav className="mt-4 space-y-2.5 text-xs text-[#7b8493]">
              {navigation.flatMap((section) =>
                section.items.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block transition-colors hover:text-blue-600"
                  >
                    {item.label}
                  </a>
                )),
              )}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.18em] text-blue-600 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.02] font-medium tracking-[-0.04em] text-[#101828]">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#667085] sm:text-base sm:leading-7">
        {copy}
      </p>
    </div>
  );
}
