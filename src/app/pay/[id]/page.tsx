"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getNetwork, signTransaction } from "@stellar/freighter-api";
import { useEffect, useState } from "react";
import { PaymentLiveCheckout } from "@/components/dashboard/payments/payment-live-checkout";
import { HypertronLogoMark } from "@/components/global/hypertron-logo-mark";
import { useFreighter } from "@/hooks/useFreighter";
import { getExplorerTxUrl, STELLAR_NETWORK } from "@/lib/stellar-explorer";
import { isPrivateSettlementEnabled } from "@/lib/privacy-features";
import { normalizePaymentAssetCode, STELLAR_LOGO_URL, type PaymentAssetCode } from "@/lib/stellar-assets";
import {
  buildPaymentXdr,
  getHorizonUrl,
  getNetworkPassphrase,
  submitSignedTransaction,
  type StellarNetwork,
} from "@/lib/stellar-payment";
import {
  notifyPaymentReceived,
  pollPaymentLinkStatus,
} from "@/lib/poll-payment-link-status";

function stellarNetworkLabel(network: StellarNetwork): string {
  return network === "public" ? "Public Mainnet" : "Testnet";
}

function stellarNetworkFromName(name?: string): StellarNetwork | null {
  const normalized = (name || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("public") || normalized.includes("mainnet")) return "public";
  if (normalized.includes("testnet")) return "testnet";
  return null;
}

function stellarNetworkFromPassphrase(passphrase?: string): StellarNetwork | null {
  const normalized = (passphrase || "").trim();
  if (!normalized) return null;
  if (normalized === getNetworkPassphrase("public")) return "public";
  if (normalized === getNetworkPassphrase("testnet")) return "testnet";
  return null;
}

type FetchedLink = {
  amount: string;
  memo: string;
  destinationAddress: string;
  currency: PaymentAssetCode;
  purpose: string | null;
  paymentMethods: string[];
  expiresAt: string | null;
  businessName: string | null;
};

export default function PayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { publicKey, connect, isConnecting } = useFreighter();
  const linkId = typeof params.id === "string" ? params.id : "";

  const [kycName, setKycName] = useState("");
  const [kycEmail, setKycEmail] = useState("");
  const kycComplete =
    kycName.trim().length > 0 &&
    kycEmail.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kycEmail.trim());

  const [payPageUrl, setPayPageUrl] = useState("");
  useEffect(() => {
    if (linkId && typeof window !== "undefined")
      setPayPageUrl(`${window.location.origin}/pay/${linkId}`);
  }, [linkId]);

  const [linkError, setLinkError] = useState<string | null>(null);
  const [fetchedLink, setFetchedLink] = useState<FetchedLink | null>(null);

  useEffect(() => {
    if (!linkId || linkId.startsWith("pl_")) return;
    fetch(`/api/payment-link/${linkId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 410) {
          setLinkError(typeof data?.error === "string" ? data.error : "This payment link has expired.");
          return null;
        }
        if (!res.ok) {
          setLinkError(typeof data?.error === "string" ? data.error : "Payment link not found.");
          return null;
        }
        return data;
      })
      .then((data) => {
        if (data?.destinationAddress) {
          setLinkError(null);
          const methods = Array.isArray(data.paymentMethods)
            ? data.paymentMethods.filter((m: unknown) => typeof m === "string")
            : ["wallet", "qr"];
          setFetchedLink({
            amount: data.amount != null ? String(data.amount) : "",
            memo: data.memo || "",
            destinationAddress: data.destinationAddress,
            currency: normalizePaymentAssetCode(data.currency),
            purpose: typeof data.purpose === "string" ? data.purpose : null,
            paymentMethods: methods.length ? methods : ["wallet", "qr"],
            expiresAt: typeof data.expiresAt === "string" ? data.expiresAt : null,
            businessName: typeof data.businessName === "string" ? data.businessName : null,
          });
        }
      })
      .catch(() => setLinkError("Could not load payment link."));
  }, [linkId]);

  const [customAmount, setCustomAmount] = useState("");
  const isAnyAmountLink = fetchedLink && (fetchedLink.amount === "" || fetchedLink.amount == null);
  const displayAmount = isAnyAmountLink
    ? (customAmount || searchParams.get("amount") || "").trim()
    : (fetchedLink?.amount ?? searchParams.get("amount") ?? "—").trim();

  const memo = fetchedLink?.memo ?? searchParams.get("memo") ?? "";
  const destination =
    fetchedLink?.destinationAddress ??
    searchParams.get("dest") ??
    (process.env.NEXT_PUBLIC_MERCHANT_RECIPIENT?.trim() || null);

  const [payStatus, setPayStatus] = useState<
    "idle" | "building" | "signing" | "submitting" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [confirmationStatus, setConfirmationStatus] = useState<
    "idle" | "confirming" | "confirmed" | "timeout"
  >("idle");

  useEffect(() => {
    if (payStatus !== "success" || !linkId || linkId.startsWith("pl_")) return;

    let cancelled = false;
    setConfirmationStatus("confirming");

    pollPaymentLinkStatus(linkId, { maxAttempts: 15, intervalMs: 2000 })
      .then((result) => {
        if (cancelled) return;
        if (result.status === "paid") {
          setConfirmationStatus("confirmed");
          notifyPaymentReceived(linkId);
          return;
        }
        setConfirmationStatus("timeout");
      })
      .catch(() => {
        if (!cancelled) setConfirmationStatus("timeout");
      });

    return () => {
      cancelled = true;
    };
  }, [payStatus, linkId]);

  const canPay =
    kycComplete &&
    publicKey &&
    destination &&
    displayAmount &&
    displayAmount !== "—" &&
    (payStatus === "idle" || payStatus === "error");

  async function handlePay() {
    if (!publicKey || !destination || !displayAmount || displayAmount === "—") return;
    setPayError(null);
    setPayStatus("building");

    const configuredNetwork = STELLAR_NETWORK;
    const walletNetworkRes = await getNetwork().catch(() => null);
    const walletNetwork =
      stellarNetworkFromPassphrase(walletNetworkRes?.networkPassphrase) ??
      stellarNetworkFromName(walletNetworkRes?.network);

    if (walletNetwork && walletNetwork !== configuredNetwork) {
      setPayError(
        `This payment link uses ${stellarNetworkLabel(configuredNetwork)}, but Freighter is on ${stellarNetworkLabel(walletNetwork)}. Please switch Freighter to ${stellarNetworkLabel(configuredNetwork)} and try again.`
      );
      setPayStatus("error");
      return;
    }

    const horizonUrl = getHorizonUrl(configuredNetwork);
    const networkPassphrase = getNetworkPassphrase(configuredNetwork);
    const assetCode = fetchedLink?.currency ?? "USDC";
    let memoHashBase64: string | undefined;

    if (isPrivateSettlementEnabled()) {
      try {
        const amountPayload = String(displayAmount).replace(/\s*(XLM|USDC|EURC)$/i, "").trim();
        const prepRes = await fetch(`/api/payment-link/${linkId}/prepare-pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountPayload || undefined }),
        });
        const errBody = await prepRes.json().catch(() => ({}));
        if (prepRes.ok) {
          if (errBody.memoHashBase64) memoHashBase64 = errBody.memoHashBase64;
        } else {
          setPayError(
            typeof errBody?.error === "string"
              ? errBody.error
              : `Prepare payment failed (${prepRes.status})`
          );
          setPayStatus("error");
          return;
        }
      } catch (e) {
        setPayError(e instanceof Error ? e.message : "Prepare payment failed");
        setPayStatus("error");
        return;
      }
    }

    const buildResult = await buildPaymentXdr({
      horizonUrl,
      networkPassphrase,
      sourcePublicKey: publicKey,
      destinationPublicKey: destination,
      amount: String(displayAmount),
      assetCode,
      network: configuredNetwork,
      memo: memoHashBase64 ? undefined : memo || undefined,
      memoHashBase64,
    });

    if (!buildResult.success) {
      if (/not found/i.test(buildResult.error)) {
        setPayError(
          `Account not found on ${stellarNetworkLabel(configuredNetwork)}. Make sure your Freighter account is funded on ${stellarNetworkLabel(configuredNetwork)} and try again.`
        );
      } else {
        setPayError(buildResult.error);
      }
      setPayStatus("error");
      return;
    }

    setPayStatus("signing");
    const signResult = await signTransaction(buildResult.xdr, {
      networkPassphrase,
      address: publicKey,
    });

    if (signResult?.error || !signResult?.signedTxXdr) {
      setPayError(signResult?.error?.message ?? "Wallet declined or signing failed");
      setPayStatus("error");
      return;
    }

    setPayStatus("submitting");

    const feeSponsorPublic = process.env.NEXT_PUBLIC_FEE_SPONSOR_PUBLIC_KEY?.trim();
    if (feeSponsorPublic) {
      const sponsoredRes = await fetch(`/api/payment-link/${linkId}/submit-sponsored-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedInnerTxXdr: signResult.signedTxXdr,
          payerPublicKey: publicKey,
        }),
      });
      const sponsoredBody = await sponsoredRes.json().catch(() => ({}));
      if (sponsoredRes.ok && typeof sponsoredBody?.txHash === "string") {
        setTxHash(sponsoredBody.txHash);
        setPayStatus("success");
      } else {
        setPayError(
          typeof sponsoredBody?.error === "string"
            ? sponsoredBody.error
            : `Sponsored submit failed (${sponsoredRes.status})`
        );
        setPayStatus("error");
      }
    } else {
      const submitResult = await submitSignedTransaction(
        horizonUrl,
        networkPassphrase,
        signResult.signedTxXdr
      );

      if (submitResult.success) {
        setTxHash(submitResult.txHash);
        setPayStatus("success");
      } else {
        setPayError(submitResult.error);
        setPayStatus("error");
      }
    }
  }

  const explorerUrl = getExplorerTxUrl(txHash);
  const networkLabel = stellarNetworkLabel(STELLAR_NETWORK);
  const businessName = fetchedLink?.businessName?.trim() || "Hypertron";
  const isLoading = !linkError && !fetchedLink && linkId && !linkId.startsWith("pl_");

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HypertronLogoMark size={32} />
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-slate-900">Hypertron</p>
              <p className="text-[11px] text-slate-500">Secure checkout</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={STELLAR_LOGO_URL}
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px] rounded-full object-cover"
            />
            Stellar · {networkLabel}
          </span>
        </header>

        {linkError ? (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {linkError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <p className="text-sm text-slate-500">Loading payment…</p>
          </div>
        ) : fetchedLink ? (
          <PaymentLiveCheckout
            link={{
              id: linkId,
              amount: fetchedLink.amount,
              currency: fetchedLink.currency,
              purpose: fetchedLink.purpose,
              paymentMethods: fetchedLink.paymentMethods,
              expiresAt: fetchedLink.expiresAt,
              destinationAddress: fetchedLink.destinationAddress,
            }}
            businessName={businessName}
            displayAmount={displayAmount || "—"}
            isAnyAmount={!!isAnyAmountLink}
            customAmount={customAmount || searchParams.get("amount") || ""}
            onCustomAmountChange={setCustomAmount}
            payPageUrl={payPageUrl}
            kycName={kycName}
            kycEmail={kycEmail}
            onKycNameChange={setKycName}
            onKycEmailChange={setKycEmail}
            kycComplete={kycComplete}
            publicKey={publicKey}
            onConnect={connect}
            isConnecting={isConnecting}
            canPay={!!canPay}
            onPay={handlePay}
            payStatus={payStatus}
            payError={payError}
            txHash={txHash}
            explorerUrl={explorerUrl}
            confirmationStatus={confirmationStatus}
            networkLabel={`Recommended network · ${networkLabel}`}
          />
        ) : null}

        <footer className="mt-6 text-center text-[11px] text-slate-500">
          By completing this payment, you agree to Hypertron&apos;s{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          .
        </footer>
      </div>
    </main>
  );
}
