"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  CheckCheck,
  Copy,
  ExternalLink,
  Loader2,
  Shield,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FREIGHTER_INSTALL_URL } from "@/lib/freighter-connect";
import { connectFreighterWallet, signAndSubmitXdr } from "@/lib/freighter-tx";
import { submitPoolDeposit } from "@/lib/hypertron-pool";
import { buildDepositProof, storeNoteSecrets } from "@/lib/hypertron-prover";
import {
  getPublicPaymentLink,
  type PublicPaymentLink,
} from "@/lib/payment-links";
import { buildClassicPaymentXdr } from "@/lib/stellar-classic-pay";
import {
  getPaymentPoolAddress,
  getStellarExpertContractUrl,
  getStellarExpertTxUrl,
} from "@/lib/stellar-network";
import { cn } from "@/lib/utils";

type Props = { linkId: string };

export function PaymentCheckout({ linkId }: Props) {
  const [link, setLink] = useState<PublicPaymentLink | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getPublicPaymentLink(linkId);
      if (cancelled) return;
      if (!result.ok) {
        setLoadError(result.error);
        setExpired(Boolean(result.expired));
        return;
      }
      setLink(result.link);
      if (result.link.paymentTxHash) {
        setTxHash(result.link.paymentTxHash);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [linkId]);

  useEffect(() => {
    if (!link || link.paidAt || !txHash) return;
    const id = window.setInterval(() => {
      void (async () => {
        const result = await getPublicPaymentLink(linkId);
        if (result.ok && result.link.paidAt) {
          setLink(result.link);
          if (result.link.paymentTxHash) setTxHash(result.link.paymentTxHash);
        }
      })();
    }, 5000);
    return () => window.clearInterval(id);
  }, [link, linkId, txHash]);

  async function handleConnect() {
    setError(null);
    const result = await connectFreighterWallet();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setWallet(result.address);
  }

  async function handlePay() {
    if (!link || !wallet) return;
    if (!link.amount) {
      setError("This link has no fixed amount.");
      return;
    }

    setBusy(true);
    setError(null);
    setStatus(null);

    try {
      if (link.privateSettlement) {
        if (link.currency.toUpperCase() !== "XLM") {
          setError("Private settlement currently supports XLM only.");
          setBusy(false);
          return;
        }
        setStatus("Building ZK deposit proof…");
        const proved = await buildDepositProof(link.amount);
        if (!proved.ok) {
          setError(proved.error);
          setBusy(false);
          return;
        }
        storeNoteSecrets(link.id, {
          n: proved.result.n,
          k: proved.result.k,
          amountBaseUnits: proved.result.amountBaseUnits,
          commitment: proved.result.commitment,
        });
        setStatus("Sign deposit in Freighter…");
        const submitted = await submitPoolDeposit({
          fromAddress: wallet,
          amountBaseUnits: proved.result.amountBaseUnits,
          commitmentHex: proved.result.commitment,
          proofHex: proved.result.proof,
        });
        if (!submitted.ok) {
          setError(submitted.error);
          setBusy(false);
          setStatus(null);
          return;
        }
        setTxHash(submitted.hash);
        setStatus("Deposit submitted. Note secrets saved in this browser.");
      } else {
        setStatus("Building payment…");
        const built = await buildClassicPaymentXdr({
          sourceAddress: wallet,
          destinationAddress: link.destinationAddress,
          amount: link.amount,
          currency: link.currency,
          memo: link.memo,
        });
        if (!built.ok) {
          setError(built.error);
          setBusy(false);
          setStatus(null);
          return;
        }
        setStatus("Sign in Freighter…");
        const submitted = await signAndSubmitXdr(built.xdr);
        if (!submitted.ok) {
          setError(submitted.error);
          setBusy(false);
          setStatus(null);
          return;
        }
        setTxHash(submitted.hash);
        setStatus("Payment submitted. Awaiting confirmation…");
      }
    } finally {
      setBusy(false);
    }
  }

  async function copyHash() {
    if (!txHash) return;
    try {
      await navigator.clipboard.writeText(txHash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  if (loadError) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          {expired ? "Link expired" : "Payment unavailable"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{loadError}</p>
      </Shell>
    );
  }

  if (!link) {
    return (
      <Shell>
        <p className="inline-flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="size-4 animate-spin" />
          Loading payment…
        </p>
      </Shell>
    );
  }

  const paid = Boolean(link.paidAt);
  const amountLabel = link.amount
    ? `${link.amount} ${link.currency}`
    : `Any amount · ${link.currency}`;

  return (
    <Shell>
      <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
        {link.businessName?.trim() || "Hypertron"} · Checkout
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
        {amountLabel}
      </h1>
      {link.purpose ? (
        <p className="mt-2 text-sm text-slate-500">{link.purpose}</p>
      ) : null}

      <div
        className={cn(
          "mt-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          link.privateSettlement
            ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
            : "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
        )}
      >
        {link.privateSettlement ? (
          <>
            <Shield className="size-3.5" />
            Private settlement · pool deposit
          </>
        ) : (
          <>
            <Wallet className="size-3.5" />
            Public Stellar payment
          </>
        )}
      </div>

      <dl className="mt-6 space-y-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm">
        <Row
          label="Destination"
          value={
            link.privateSettlement
              ? getPaymentPoolAddress()
              : link.destinationAddress
          }
          mono
        />
        {!link.privateSettlement ? (
          <Row label="Memo" value={link.memo} mono />
        ) : (
          <Row
            label="Pool"
            value="hypertron-transfer · XLM testnet"
          />
        )}
      </dl>

      {paid ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-800">Paid</p>
          {txHash || link.paymentTxHash ? (
            <ExplorerLinks
              txHash={(txHash || link.paymentTxHash)!}
              showContract={link.privateSettlement}
            />
          ) : null}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {!wallet ? (
            <Button
              type="button"
              className="h-11 w-full bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
              onClick={handleConnect}
            >
              Connect Freighter
            </Button>
          ) : (
            <>
              <p className="truncate font-mono text-xs text-slate-500">
                {wallet}
              </p>
              <Button
                type="button"
                disabled={busy || !link.amount}
                className="h-11 w-full bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                onClick={handlePay}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Working…
                  </span>
                ) : link.privateSettlement ? (
                  "Shield & pay"
                ) : (
                  "Pay with Freighter"
                )}
              </Button>
            </>
          )}

          {status ? (
            <p className="text-sm text-slate-600">{status}</p>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{error}</p>
              {error.toLowerCase().includes("install") ? (
                <a
                  href={FREIGHTER_INSTALL_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block font-medium text-[#2563EB] underline"
                >
                  Install Freighter
                </a>
              ) : null}
            </div>
          ) : null}
          {txHash ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-medium text-emerald-800">
                Transaction submitted
              </p>
              <ExplorerLinks
                txHash={txHash}
                showContract={link.privateSettlement}
              />
              <button
                type="button"
                onClick={copyHash}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-800"
              >
                {copied ? (
                  <CheckCheck className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "Copied" : "Copy hash"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </Shell>
  );
}

function ExplorerLinks({
  txHash,
  showContract,
}: {
  txHash: string;
  showContract?: boolean;
}) {
  const txUrl = getStellarExpertTxUrl(txHash);
  const contractUrl = showContract
    ? getStellarExpertContractUrl(getPaymentPoolAddress())
    : null;

  return (
    <div className="mt-1 space-y-1.5">
      <a
        href={txUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-start gap-1 break-all font-mono text-xs text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-950"
      >
        <span className="min-w-0">{txHash}</span>
        <ExternalLink className="mt-0.5 size-3 shrink-0" />
      </a>
      {contractUrl ? (
        <a
          href={contractUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-950"
        >
          View pool contract on StellarExpert
          <ExternalLink className="size-3 shrink-0" />
        </a>
      ) : null}
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#F8FAFC] px-6 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd
        className={cn(
          "min-w-0 break-all text-slate-900 sm:text-right",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
