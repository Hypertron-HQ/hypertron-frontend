"use client";

import type { ReactNode } from "react";
import { cn } from "@/utils";

/* ------------------------------------------------------------------ */
/* Primitives — light "dashboard" aesthetic inside a browser frame.    */
/* ------------------------------------------------------------------ */

function BrowserFrame({ url, children }: { url: string; children: ReactNode }) {
  return (
    <figure className="not-prose my-10 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/50 ring-1 ring-white/[0.06]">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100/90 px-3.5 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex-1 truncate rounded-md border border-slate-200 bg-white px-3 py-1 text-center text-[11px] text-slate-400">
          {url}
        </div>
      </div>
      <div className="bg-[#f7f9fc] p-4 sm:p-5">{children}</div>
    </figure>
  );
}

function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Panel className="p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
      {sub ? <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p> : null}
    </Panel>
  );
}

function Field({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-medium text-slate-500">{label}</p>
      <div
        className={cn(
          "flex h-9 items-center rounded-lg border px-3 text-xs",
          accent ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-700",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function PrimaryBtn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Chip({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "blue" | "amber" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  } as const;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", tones[tone])}>
      {children}
    </span>
  );
}

function MiniChart() {
  return (
    <svg viewBox="0 0 240 70" className="h-16 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="docPreviewFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(59,130,246)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="rgb(59,130,246)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 55 C 40 50, 60 30, 100 28 S 170 18, 240 10 L 240 70 L 0 70 Z" fill="url(#docPreviewFill)" />
      <path
        d="M0 55 C 40 50, 60 30, 100 28 S 170 18, 240 10"
        fill="none"
        stroke="rgb(59,130,246)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Per-feature previews                                                */
/* ------------------------------------------------------------------ */

function GettingStartedPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Panel>
        <p className="text-xs font-semibold text-slate-900">Connect Freighter</p>
        <p className="mt-1 text-[11px] text-slate-500">Sign in, then link your Stellar wallet.</p>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400" />
          <span className="text-[11px] text-slate-600">GByz…K7DKN</span>
          <Chip tone="green">Connected</Chip>
        </div>
        <PrimaryBtn className="mt-3">Continue</PrimaryBtn>
      </Panel>
      <Panel>
        <p className="text-xs font-semibold text-slate-900">Create a workspace</p>
        <div className="mt-3 space-y-2">
          {["Business details", "Choose layout", "Enable widgets"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-[11px] text-slate-600">
              <span className={cn("flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white", i === 0 ? "bg-blue-500" : "bg-slate-300")}>{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        <PrimaryBtn className="mt-3">Create workspace</PrimaryBtn>
      </Panel>
    </div>
  );
}

function WorkspacesPreview() {
  const items = [
    { name: "Vertex DAO", tag: "Operations" },
    { name: "Atlas Labs", tag: "Payments" },
    { name: "Northwind", tag: "Treasury" },
  ];
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-900">Workspaces</p>
        <PrimaryBtn className="h-7 px-3">+ New</PrimaryBtn>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((w) => (
          <Panel key={w.name} className="p-3">
            <span className="block h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500" />
            <p className="mt-2 text-xs font-semibold text-slate-900">{w.name}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{w.tag}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function PaymentLinksPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
      <Panel>
        <div className="mb-3 flex gap-2">
          <Chip tone="blue">Collect</Chip>
          <Chip>Send</Chip>
        </div>
        <div className="space-y-3">
          <Field label="Amount" value="250.00" accent />
          <Field label="Asset" value="USDC" />
          <Field label="Memo" value="Invoice #1042" />
        </div>
        <PrimaryBtn className="mt-3">Generate link</PrimaryBtn>
      </Panel>
      <Panel>
        <p className="text-xs font-semibold text-slate-900">Payment link</p>
        <div className="mt-3 flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
          <div className="grid grid-cols-4 gap-0.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className={cn("h-3 w-3 rounded-[2px]", i % 3 === 0 ? "bg-slate-800" : "bg-slate-300")} />
            ))}
          </div>
        </div>
        <div className="mt-3 truncate rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] text-slate-500">
          app.hypertron.xyz/pay/9f2a…
        </div>
      </Panel>
    </div>
  );
}

function SendPaymentsPreview() {
  return (
    <Panel>
      <div className="mb-3 flex gap-2">
        <Chip>Collect</Chip>
        <Chip tone="blue">Send</Chip>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Recipient" value="GA3K…QX7M" />
        <Field label="Asset" value="XLM" />
        <Field label="Amount" value="1,200.00" accent />
        <Field label="Network fee" value="≈ 0.00001 XLM" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">Signed with Freighter</span>
        <PrimaryBtn className="px-5">Review &amp; sign</PrimaryBtn>
      </div>
    </Panel>
  );
}

function CheckoutPreview() {
  return (
    <div className="mx-auto max-w-sm">
      <Panel className="text-center">
        <p className="text-[11px] font-medium text-slate-400">Secured by Hypertron</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">250.00 USDC</p>
        <p className="mt-1 text-[11px] text-slate-500">Invoice #1042, Atlas Labs</p>
        <PrimaryBtn className="mt-4 w-full">Pay with Freighter</PrimaryBtn>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-slate-400">Stellar network, testnet</span>
        </div>
      </Panel>
    </div>
  );
}

function TreasuryPreview() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total treasury" value="$8,450.00" sub="1,240.50 XLM" />
        <StatCard label="Received" value="15,890 XLM" sub="All time" />
        <StatCard label="Pending" value="5" sub="Awaiting payment" />
      </div>
      <Panel>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-900">Treasury overview</p>
          <Chip tone="blue">+12.4%</Chip>
        </div>
        <MiniChart />
      </Panel>
    </div>
  );
}

function SecureVaultPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Panel>
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-900">Secure Vault</p>
          <Chip tone="amber">Beta</Chip>
        </div>
        <div className="mt-3 space-y-3">
          <Field label="Deposit amount" value="500.00 XLM" accent />
        </div>
        <PrimaryBtn className="mt-3">Add commitment</PrimaryBtn>
      </Panel>
      <Panel>
        <p className="text-xs font-semibold text-slate-900">Commitments</p>
        <div className="mt-3 space-y-2">
          {["0x9f…2a4c", "0x71…be03", "0xc3…d5e9"].map((c) => (
            <div key={c} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-[11px] text-slate-600">{c}</span>
              <Chip tone="green">Settled</Chip>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function BridgePreview() {
  return (
    <Panel>
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-slate-900">USDC bridge</p>
        <Chip tone="blue">CCTP</Chip>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <Field label="From" value="Stellar" />
        <span className="pb-2 text-slate-400">→</span>
        <Field label="To" value="Ethereum" />
      </div>
      <div className="mt-3">
        <Field label="Amount" value="1,000.00 USDC" accent />
      </div>
      <PrimaryBtn className="mt-3">Bridge USDC</PrimaryBtn>
      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>Approve</span>
        <span>Burn</span>
        <span>Attest</span>
        <span>Mint</span>
      </div>
    </Panel>
  );
}

function BillingPreview() {
  const tiers = [
    { name: "Starter", price: "$0", active: false },
    { name: "Growth", price: "$49", active: true },
    { name: "Scale", price: "$199", active: false },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {tiers.map((t) => (
        <Panel key={t.name} className={cn(t.active && "border-blue-300 ring-1 ring-blue-200")}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-900">{t.name}</p>
            {t.active ? <Chip tone="blue">Current</Chip> : null}
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900">
            {t.price}
            <span className="text-[10px] font-normal text-slate-400">/mo</span>
          </p>
          <PrimaryBtn className={cn("mt-3", !t.active && "bg-slate-200 text-slate-600")}>
            {t.active ? "Manage" : "Choose"}
          </PrimaryBtn>
        </Panel>
      ))}
    </div>
  );
}

function SupportPreview() {
  const faqs = ["How do I create a workspace?", "How do I change my plan?", "How is my data secured?"];
  return (
    <div className="grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
      <Panel>
        <p className="text-xs font-semibold text-slate-900">FAQ</p>
        <div className="mt-3 space-y-2">
          {faqs.map((q) => (
            <div key={q} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              {q}
              <span className="text-slate-300">+</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <p className="text-xs font-semibold text-slate-900">Support</p>
        <p className="mt-2 text-[11px] text-slate-500">Reach us on X: questions, feedback, and help.</p>
        <a
          href="https://x.com/hypertron_HQ"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          @hypertron_HQ on X
        </a>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Registry + public component                                         */
/* ------------------------------------------------------------------ */

const PREVIEWS: Record<string, { url: string; body: ReactNode }> = {
  "getting-started": { url: "app.hypertron.xyz/dashboard", body: <GettingStartedPreview /> },
  workspaces: { url: "app.hypertron.xyz/dashboard", body: <WorkspacesPreview /> },
  "payment-links": { url: "app.hypertron.xyz/dashboard/payments", body: <PaymentLinksPreview /> },
  "send-payments": { url: "app.hypertron.xyz/dashboard/payments", body: <SendPaymentsPreview /> },
  checkout: { url: "app.hypertron.xyz/pay/9f2a", body: <CheckoutPreview /> },
  treasury: { url: "app.hypertron.xyz/dashboard/treasury", body: <TreasuryPreview /> },
  "secure-vault": { url: "app.hypertron.xyz/dashboard/secure-vault", body: <SecureVaultPreview /> },
  bridge: { url: "app.hypertron.xyz/dashboard/bridge", body: <BridgePreview /> },
  billing: { url: "app.hypertron.xyz/dashboard/billing", body: <BillingPreview /> },
  support: { url: "x.com/hypertron_HQ", body: <SupportPreview /> },
};

export function DocFeaturePreview({ slug }: { slug: string }) {
  const preview = PREVIEWS[slug];
  if (!preview) return null;

  return <BrowserFrame url={preview.url}>{preview.body}</BrowserFrame>;
}
