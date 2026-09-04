import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Braces, CircleDot, KeyRound, Webhook } from "lucide-react";
import {
  CodeBlock,
  DocsShell,
  SectionHeading,
  SpecTable,
} from "@/components/docs/docs-shell";
import { getDeveloperApiBaseUrl } from "@/lib/developer-api";

export const metadata: Metadata = {
  description:
    "Create hosted checkout, follow payment state, and receive signed webhooks. The API is a consumer of the Hypertron shielded pool.",
};

const toc = [
  { href: "#overview", label: "What the API is" },
  { href: "#auth", label: "Authentication" },
  { href: "#quickstart", label: "Quickstart" },
  { href: "#lifecycle", label: "Payment lifecycle" },
  { href: "#webhooks", label: "Webhooks" },
  { href: "#assets", label: "Assets" },
  { href: "#environments", label: "Environments" },
] as const;

const curlExample = `curl -X POST "$HYPERTRON_API/v1/payments" \\
  -H "Authorization: Bearer $HYPERTRON_SECRET_KEY" \\
  -H "Idempotency-Key: order_1234" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "25.00",
    "currency": "XLM",
    "description": "Order #1234",
    "customer_email": "customer@example.com",
    "metadata": { "order_id": "ord_1234" }
  }'`;

const lifecycle = [
  {
    label: "Create",
    copy: "POST /v1/payments with an idempotency key. Response includes checkout_url.",
  },
  {
    label: "Pay",
    copy: "Customer opens hosted checkout and pays from a Stellar wallet, privately if they hold covering notes.",
  },
  {
    label: "Confirm",
    copy: "Hypertron observes the chain (or pool events) and advances the payment object.",
  },
  {
    label: "Operate",
    copy: "Poll GET /v1/payments/:id or handle signed webhooks. Cancel while still open.",
  },
] as const;

export default function ApiDocsPage() {
  const apiBase = getDeveloperApiBaseUrl();

  return (
    <DocsShell pathname="/docs/api" toc={toc}>
      <section id="overview" className="scroll-mt-28">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-blue-600 uppercase">
          Payments API
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.4rem)] leading-[0.92] font-medium tracking-[-0.05em] text-[#101828]">
          Hosted checkout on the same pool.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[#5d6879]">
          The Payments API is for products that already have a payment
          experience: commerce, payroll, treasury, or any app that should
          keep owning checkout. Your server creates a{" "}
          <code className="font-mono text-[13px]">Payment</code>, Hypertron
          hosts checkout, the customer pays, you get a stateful object and
          HMAC-signed events. Checkout can spend into the shielded pool; the
          API does not replace the protocol.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/developers"
            className="inline-flex h-11 items-center gap-2 bg-blue-600 px-5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Get API keys
          </Link>
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
        id="auth"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Auth"
          title="Secret keys on the server. Never in the browser."
          copy="Bearer sk_test_ / sk_live_. Environment-scoped: a test key cannot read live payments. Keys are shown once. Store a hash, prefix, and last four."
        />
        <SpecTable
          columns={["Header", "Rule"]}
          rows={[
            ["Authorization", "Required. Bearer secret. Not query, not body."],
            ["Content-Type", "application/json on requests with a body."],
            [
              "Idempotency-Key",
              "Required on POST /v1/payments. 1-255 chars, retained at least 24h.",
            ],
            ["X-Request-Id", "Optional tracing. Response always echoes a request id."],
          ]}
        />
        <p className="mt-5 max-w-2xl text-sm leading-6 text-[#667085]">
          Amounts are decimal strings. Never floats. IDs are opaque prefixes
          (<code className="font-mono text-[12px]">pay_</code>,{" "}
          <code className="font-mono text-[12px]">evt_</code>). Dashboard
          session routes under <code className="font-mono text-[12px]">/api/*</code>{" "}
          are a different control plane. They are not this API.
        </p>
      </section>

      <section
        id="quickstart"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Quickstart"
          title="Create your first checkout."
          copy="Use a test key while you build. Retries with the same idempotency key cannot produce a second payment."
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <ol className="space-y-5">
            {[
              {
                icon: KeyRound,
                title: "Create a test key",
                copy: "Developer console → sk_test_ key. Copy it once.",
              },
              {
                icon: Braces,
                title: "Create a payment",
                copy: "amount, currency, optional customer and metadata.",
              },
              {
                icon: Webhook,
                title: "Track the result",
                copy: "Poll the payment or subscribe to events.",
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
          <CodeBlock label="POST /v1/payments">{curlExample}</CodeBlock>
        </div>
        <div className="mt-6 flex items-start gap-3 border border-blue-200 bg-blue-50 px-4 py-3.5">
          <CircleDot className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <p className="text-xs leading-5 text-blue-950/75">
            Keep secret keys on your server. Never expose{" "}
            <code className="font-mono text-blue-800">sk_test_</code> or{" "}
            <code className="font-mono text-blue-800">sk_live_</code> in
            browser code. Private settlement on the live testnet pool is native
            XLM. USDC on the same circuits is on the production roadmap.
          </p>
        </div>
      </section>

      <section
        id="lifecycle"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Canonical resource"
          title="Payment is the object. Checkout is a URL."
          copy="v1 does not expose PaymentLink as the developer abstraction. Links remain an internal checkout mechanism."
        />
        <ol className="mt-10 grid border-t border-[#dfe5ed] md:grid-cols-4">
          {lifecycle.map((step, index) => (
            <li
              key={step.label}
              className="border-b border-[#e5e9f0] py-7 last:border-b-0 md:border-b-0 md:pr-8 md:pt-8"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full bg-blue-600 ring-4 ring-[#f6f8fb]"
                />
                {index < lifecycle.length - 1 ? (
                  <span
                    aria-hidden
                    className="hidden h-px min-w-0 flex-1 bg-blue-200 md:block"
                  />
                ) : null}
              </div>
              <p className="mt-5 font-display text-lg font-medium tracking-tight text-[#101828]">
                <span className="mr-2 font-mono text-[10px] text-[#98a2b3]">
                  0{index + 1}
                </span>
                {step.label}
              </p>
              <p className="mt-2 max-w-[16rem] text-xs leading-5 text-[#667085]">
                {step.copy}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="webhooks"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Events"
          title="Signed delivery, not a polling substitute you ignore."
          copy="Register endpoints in the developer console. Signing secrets are shown once. Verify HMAC before acting. Test delivery does not create a real PaymentEvent."
        />
        <SpecTable
          columns={["Event", "When"]}
          rows={[
            ["payment.created", "Payment object accepted."],
            ["payment.pending", "Customer action in flight."],
            ["payment.confirmed", "Chain observation passed initial checks."],
            ["payment.completed", "Terminal success."],
            ["payment.failed", "Terminal failure."],
            ["payment.expired", "Window elapsed unpaid."],
            ["payment.canceled", "Merchant canceled an open payment."],
          ]}
        />
      </section>

      <section
        id="assets"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Assets"
          title="The live shielded pool is native XLM."
          copy="Payment objects can name a currency. That is not the same as a live private pool for that asset. Do not treat USDC or EURC as shielded-pool settlement today."
        />
        <SpecTable
          columns={["Asset", "Status"]}
          rows={[
            [
              "XLM",
              "Live on Stellar testnet. Native SAC pool CB2SVTMG... Browser proving, private checkout, and indexed transfers.",
            ],
            [
              "USDC",
              "Planned on the existing privacy circuits. Not a deployed shielded pool. Checkout and treasury will wire it after the USDC testnet pool is verified.",
            ],
            [
              "EURC",
              "May appear as a payment-object currency for classic Stellar checkout. Not a live Hypertron shielded-pool asset.",
            ],
          ]}
        />
      </section>

      <section
        id="environments"
        className="scroll-mt-28 mt-20 border-t border-[#dfe5ed] pt-16"
      >
        <SectionHeading
          eyebrow="Environments"
          title="Test first. Move live deliberately."
          copy="A key only accesses data created in its own environment. Testnet checkout still hits the live native-XLM testnet pool (CB2SVTMG...) when privacy is on. See the protocol page for that trust model."
        />
        <div className="mt-8 overflow-hidden border border-[#dfe5ed] bg-white">
          <div className="grid grid-cols-[110px_minmax(0,1fr)] border-b border-[#e5e9f0] px-5 py-4 text-xs sm:grid-cols-[160px_1fr_1fr]">
            <span className="font-mono text-blue-600">sk_test_</span>
            <span className="text-[#667085]">
              Stellar testnet. Build and validate.
            </span>
            <span className="hidden text-right text-[#98a2b3] sm:block">
              Test environment
            </span>
          </div>
          <div className="grid grid-cols-[110px_minmax(0,1fr)] px-5 py-4 text-xs sm:grid-cols-[160px_1fr_1fr]">
            <span className="font-mono text-[#101828]">sk_live_</span>
            <span className="text-[#667085]">
              Stellar public network. Production payments.
            </span>
            <span className="hidden text-right text-[#98a2b3] sm:block">
              Live environment
            </span>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap gap-4 text-xs font-semibold">
          <Link href="/docs/protocol" className="text-blue-600">
            Privacy protocol →
          </Link>
          <Link href="/docs/platform" className="text-blue-600">
            Merchant payments →
          </Link>
          <Link href="/docs/tooling" className="text-blue-600">
            Developer tooling →
          </Link>
        </div>
      </section>
    </DocsShell>
  );
}
