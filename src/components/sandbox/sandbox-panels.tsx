"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Info,
  RefreshCw,
  Shield,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SANDBOX_NOTES,
  SANDBOX_PAYMENT_LINKS,
  SANDBOX_SPEND_PUB,
  SANDBOX_VIEW_PUB,
  SANDBOX_WORKSPACE,
} from "@/lib/sandbox-demo";
import { cn } from "@/lib/utils";

const fieldCls =
  "h-11 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-[#4A63BE] focus-visible:ring-[#4A63BE]/20";

const primaryBtnCls =
  "inline-flex h-11 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#121F46] to-[#4A63BE] px-6 font-semibold text-white shadow-[0_8px_20px_rgba(18,31,70,0.22)] hover:brightness-110";

type PaymentsSubTab = "collect" | "send" | "subscriptions" | "customers";

const SUB_TABS: { id: PaymentsSubTab; label: string; enabled: boolean }[] = [
  { id: "collect", label: "Collect", enabled: true },
  { id: "send", label: "Send", enabled: true },
  { id: "subscriptions", label: "Subscriptions", enabled: false },
  { id: "customers", label: "Customers", enabled: false },
];

export function SandboxPayments() {
  const [subTab, setSubTab] = useState<PaymentsSubTab>("collect");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [customer, setCustomer] = useState("");
  const [expiry, setExpiry] = useState("30");
  const [metadata, setMetadata] = useState("");
  const [privateSettlement, setPrivateSettlement] = useState(false);
  const [demoToast, setDemoToast] = useState<string | null>(null);

  function showDemo(message: string) {
    setDemoToast(message);
    window.setTimeout(() => setDemoToast(null), 2400);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C9A46A] uppercase">
          Payments
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
          {SANDBOX_WORKSPACE.name} Payments
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Create links, settle on Stellar, and track status for this workspace.
        </p>
      </div>

      <nav
        className="flex gap-5 border-b border-slate-200"
        aria-label="Payments sections"
      >
        {SUB_TABS.map((tab) => {
          const active = subTab === tab.id;
          if (!tab.enabled) {
            return (
              <span
                key={tab.id}
                title="Coming soon"
                className="relative cursor-not-allowed pb-3 text-sm font-medium text-slate-400 opacity-45"
              >
                {tab.label}
              </span>
            );
          }
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={cn(
                "relative pb-3 text-sm font-medium transition-colors",
                active ? "text-[#0F1939]" : "text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-[#121F46] to-[#4A63BE]" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {demoToast ? (
        <div className="rounded-xl border border-[#E7B66D]/40 bg-[#FBF7F0] px-4 py-3 text-sm text-[#0F1939]">
          {demoToast}
        </div>
      ) : null}

      {subTab === "send" ? (
        <SandboxSendPanel onDemo={showDemo} />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-5">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
                  No-code collection
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  Create a Payment Link
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Collect payments in XLM, USDC, or EURC on Stellar. Funds settle
                  to your global pool with memo attribution.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 gap-2 rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700"
                onClick={() => showDemo("Preview is demo-only in sandbox.")}
              >
                Preview Payment Page
                <ExternalLink className="size-3.5" />
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showDemo("Sandbox only — no real payment link was created.");
              }}
              className="flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
                <div className="flex flex-col gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Amount
                    </Label>
                    <div className="flex overflow-hidden rounded-xl border border-slate-200">
                      <Input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-11 flex-1 rounded-none border-0"
                        placeholder="0.00"
                      />
                      <div className="flex h-11 items-center border-l border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                        XLM
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-700">
                        Description{" "}
                        <span className="font-normal text-slate-400">
                          (optional)
                        </span>
                      </Label>
                      <span className="text-xs text-slate-400">
                        {description.length}/140
                      </span>
                    </div>
                    <Input
                      value={description}
                      maxLength={140}
                      onChange={(e) => setDescription(e.target.value)}
                      className={fieldCls}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Customer{" "}
                      <span className="font-normal text-slate-400">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Input
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        placeholder="Enter name, email or wallet address"
                        className={cn(fieldCls, "pr-10")}
                      />
                      <User className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Payment Link Expiry
                    </Label>
                    <div className="relative">
                      <select
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className={cn(
                          fieldCls,
                          "w-full appearance-none px-3 pr-10 outline-none",
                        )}
                      >
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                        <option value="never">Never</option>
                      </select>
                      <Calendar className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Metadata{" "}
                      <span className="font-normal text-slate-400">(optional)</span>
                    </Label>
                    <textarea
                      value={metadata}
                      onChange={(e) => setMetadata(e.target.value)}
                      placeholder="Add order ID, project ID, or any reference"
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4A63BE] focus:ring-2 focus:ring-[#4A63BE]/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-[#F8F9FC] p-5">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
                        Settlement &amp; Privacy
                      </p>
                      <h2 className="mt-1 text-sm font-semibold text-slate-900">
                        How this link settles
                      </h2>
                    </div>
                    <Info className="ml-auto size-3.5 text-slate-400" />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <p className="text-xs text-slate-500">Settlement Rail</p>
                      <p className="text-sm font-semibold text-slate-900">
                        Stellar · XLM
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2 rounded-xl border border-[#E7B66D]/55 bg-[#FBF7F0] px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">
                            Private Settlement
                          </p>
                          <span className="rounded-md bg-[#4A63BE] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                            Beta · Testnet
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {privateSettlement
                            ? "Customer shields XLM first, then pays with a private transfer."
                            : "Public Stellar payment straight to your Freighter wallet (G…) with memo attribution."}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={privateSettlement}
                        onClick={() => setPrivateSettlement((v) => !v)}
                        className={cn(
                          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                          privateSettlement ? "bg-[#C9A46A]" : "bg-slate-300",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                            privateSettlement && "translate-x-5",
                          )}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#4A63BE] text-white">
                      <Wallet className="size-5" strokeWidth={1.9} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {SANDBOX_WORKSPACE.name} Vault
                      </p>
                      <p className="text-xs text-slate-500">
                        {privateSettlement
                          ? "Shielded pool (demo)"
                          : "Transparent settlement"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-4">
                <Button type="submit" className={primaryBtnCls}>
                  Generate Payment Link
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
                  Workspace links
                </p>
                <h2 className="mt-1 text-base font-semibold text-slate-950">
                  Payment links
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Demo links for this sandbox workspace.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl"
                onClick={() => showDemo("Sandbox links are static demo data.")}
              >
                <RefreshCw className="size-3.5" />
                Refresh
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] tracking-[0.08em] text-slate-400 uppercase">
                    <th className="px-4 py-3 font-semibold sm:px-5">Link</th>
                    <th className="px-3 py-3 font-semibold">Amount</th>
                    <th className="px-3 py-3 font-semibold">Customer</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {SANDBOX_PAYMENT_LINKS.map((link) => (
                    <tr
                      key={link.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-3.5 sm:px-5">
                        <p className="font-medium text-slate-900">
                          {link.purpose}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                          {link.id}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 font-medium text-slate-900">
                        {link.volume}
                      </td>
                      <td className="px-3 py-3.5 text-slate-600">
                        {link.customer}
                      </td>
                      <td className="px-3 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            link.status === "paid"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700",
                          )}
                        >
                          {link.status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-slate-500">
                        {link.createdAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SandboxSendPanel({ onDemo }: { onDemo: (msg: string) => void }) {
  const [mode, setMode] = useState<"private" | "public">("private");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [spendPub, setSpendPub] = useState("");
  const [viewPub, setViewPub] = useState("");
  const [memo, setMemo] = useState("");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-5">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
            Disbursements
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
            Send a Payment
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pay from shielded treasury notes. Demo mode — nothing is signed or
            broadcast.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDemo("Sandbox balance is fixed demo data.")}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
        >
          <RefreshCw className="size-3.5" />
          Refresh balance
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onDemo("Sandbox only — no Freighter prompt or on-chain send.");
        }}
        className="flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Send mode
              </Label>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                {(
                  [
                    ["private", "Private"],
                    ["public", "Public"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMode(id)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                      mode === id
                        ? "bg-gradient-to-r from-[#121F46] to-[#4A63BE] text-white"
                        : "text-slate-600",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Amount</Label>
              <div className="flex overflow-hidden rounded-xl border border-slate-200">
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-11 flex-1 rounded-none border-0"
                  placeholder="0.00"
                />
                <div className="flex h-11 items-center border-l border-slate-200 bg-slate-50 px-3 text-sm font-medium">
                  XLM
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Spendable:{" "}
                <span className="font-medium text-slate-700">47 XLM</span> · 3
                ready notes
              </p>
            </div>

            {mode === "public" ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  Recipient wallet
                </Label>
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="G…"
                  className={cn(fieldCls, "font-mono text-[13px]")}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Recipient spend pub
                  </Label>
                  <Input
                    value={spendPub}
                    onChange={(e) => setSpendPub(e.target.value)}
                    placeholder="64-char hex owner_pk"
                    className={cn(fieldCls, "font-mono text-[13px]")}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Recipient view pub
                  </Label>
                  <Input
                    value={viewPub}
                    onChange={(e) => setViewPub(e.target.value)}
                    placeholder="64-char hex viewing key"
                    className={cn(fieldCls, "font-mono text-[13px]")}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Memo{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </Label>
              <Input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Internal note — not written on-chain for private sends"
                className={fieldCls}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-[#F8F9FC] p-5">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
              Source &amp; rail
            </p>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-[#4A63BE] text-white">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">
                    {SANDBOX_WORKSPACE.name} Vault
                  </p>
                  <p className="text-sm font-semibold text-slate-900">47 XLM</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Ready
              </span>
            </div>

            <div className="rounded-xl border border-[#E7B66D]/55 bg-[#FBF7F0] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-slate-900">
                  {mode === "private" ? "Private transfer" : "Public unshield"}
                </p>
                <span className="rounded-md bg-[#4A63BE] px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
                  {mode === "private" ? "Amount hidden" : "Exact note"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Demo UI only. Live workspaces use Freighter + the Hypertron pool
                contract.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Ready note amounts
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SANDBOX_NOTES.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setAmount(note.amount)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-[#FBF7F0]"
                  >
                    {note.amount} XLM
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-4">
          <Button type="submit" className={primaryBtnCls}>
            Send Payment
          </Button>
        </div>
      </form>
    </div>
  );
}

export function SandboxTreasury() {
  const [toast, setToast] = useState<string | null>(null);
  const readyTotal = useMemo(
    () => SANDBOX_NOTES.reduce((s, n) => s + Number(n.amount), 0),
    [],
  );

  function demoAction(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C9A46A] uppercase">
          Balances
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
          Treasury
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Shielded notes from private payment links, plus mock vault balances.
        </p>
      </div>

      {toast ? (
        <div className="rounded-xl border border-[#E7B66D]/40 bg-[#FBF7F0] px-4 py-3 text-sm text-[#0F1939]">
          {toast}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#E7B66D]/70 bg-gradient-to-br from-[#FBF7F0] to-white px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#C9A46A] uppercase">
              Shielded (ready)
            </p>
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#4A63BE] text-white">
              <Shield className="size-4" strokeWidth={1.9} />
            </span>
          </div>
          <p className="mt-3 text-[28px] leading-none font-semibold tracking-tight text-slate-950">
            {readyTotal.toFixed(2)} XLM
          </p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {SANDBOX_NOTES.length} note(s) withdrawable
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            USDC
          </p>
          <p className="mt-3 text-[28px] leading-none font-semibold">$0.00</p>
          <p className="mt-2 text-xs font-medium text-slate-500">Available</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            XLM
          </p>
          <p className="mt-3 text-[28px] leading-none font-semibold">0.00</p>
          <p className="mt-2 text-xs font-medium text-slate-500">Available</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
              Private notes
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              Shielded history
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Demo notes only — not stored in this browser.
            </p>
          </div>
          <button
            type="button"
            onClick={() => demoAction("Sandbox notes are static.")}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_110px_minmax(140px,auto)] gap-2 border-b border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-[11px] font-semibold tracking-[0.08em] text-slate-400 uppercase max-sm:hidden">
            <span>Amount</span>
            <span>Note</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          <ul>
            {SANDBOX_NOTES.map((note) => (
              <li
                key={note.id}
                className="grid grid-cols-1 items-center gap-3 border-b border-slate-100 px-3.5 py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_110px_minmax(140px,auto)] sm:gap-2"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {note.amount} XLM
                </p>
                <div className="max-sm:hidden">
                  <p className="font-mono text-[12px] text-slate-600">
                    {note.id}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {note.origin} · leaf {note.leaf}
                  </p>
                </div>
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="size-3" strokeWidth={2.4} />
                  Ready
                </span>
                <div className="sm:justify-self-end">
                  <button
                    type="button"
                    onClick={() =>
                      demoAction("Sandbox withdraw is disabled — demo only.")
                    }
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#121F46] to-[#4A63BE] px-3.5 text-sm font-semibold text-white"
                  >
                    <Wallet className="size-3.5" />
                    Withdraw
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function SandboxSettings() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C9A46A] uppercase">
          Workspace
        </p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-950">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Name, members, and private settlement for this sandbox workspace.
        </p>
      </div>

      <div className="max-w-lg space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Workspace name
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            {SANDBOX_WORKSPACE.name}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {SANDBOX_WORKSPACE.tier} · {SANDBOX_WORKSPACE.members} members · Role{" "}
            {SANDBOX_WORKSPACE.role}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E7B66D]/55 bg-[#FBF7F0] px-5 py-5">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 size-5 shrink-0 text-[#C9A46A]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Private settlement
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Demo keys only — not derived from Freighter and not saved to any
                backend.
              </p>
              <p className="mt-2 break-all font-mono text-[11px] text-slate-600">
                viewPub {SANDBOX_VIEW_PUB.slice(0, 18)}… · spendPub{" "}
                {SANDBOX_SPEND_PUB.slice(0, 18)}…
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={async () => {
                    await navigator.clipboard.writeText(SANDBOX_VIEW_PUB);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1600);
                  }}
                >
                  {copied ? "Copied view pub" : "Copy demo view pub"}
                </Button>
                <span className="inline-flex items-center rounded-full bg-[#4A63BE]/10 px-2.5 py-1 text-[11px] font-semibold text-[#4A63BE]">
                  Sandbox enabled
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          This is a public demo workspace. No wallet connection or live
          contracts are used here.
        </div>
      </div>
    </div>
  );
}
