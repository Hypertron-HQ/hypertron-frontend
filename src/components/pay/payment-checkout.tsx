"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  BadgeCheck,
  Building2,
  Check,
  CheckCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Lock,
  QrCode,
  Share2,
  Shield,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { HypertronLogoMark } from "@/components/dashboard/hypertron-logo-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FREIGHTER_INSTALL_URL } from "@/lib/freighter-connect";
import { connectFreighterWallet, signAndSubmitXdr } from "@/lib/freighter-tx";
import {
  submitPoolDeposit,
  submitPoolTransfer,
  submitPoolTransferN,
} from "@/lib/hypertron-pool";
import {
  getPublicPaymentLink,
  claimPaymentLink,
  checkPaymentLinkStatus,
  type PublicPaymentLink,
} from "@/lib/payment-links";
import { buildClassicPaymentXdr } from "@/lib/stellar-classic-pay";
import {
  getPaymentPoolAddress,
  getStellarExpertContractUrl,
  getStellarExpertTxUrl,
  getStellarNetwork,
  toBaseUnits,
  fromBaseUnits,
} from "@/lib/stellar-network";
import { cn } from "@/lib/utils";
import {
  deriveViewingKey,
  deriveSpendKey,
  deriveNoteSecrets,
  randomSaltHex,
} from "@/lib/hypertron-viewkey";
import {
  buildDepositProof,
  buildTransferProof,
  buildTransferNProof,
} from "@/lib/hypertron-prover";
import { getPoolLeaves } from "@/lib/hypertron-indexer";
import {
  listUnspentNotesV2,
  putNoteV2,
  markNoteSpent,
  selectNotesForAmount,
  getWalletBalance,
  type StoredNoteV2,
} from "@/lib/hypertron-note-store-v2";
import { fullScan } from "@/lib/hypertron-note-scan";

type Props = { linkId: string };
type PayTab = "wallet" | "qr" | "onramp";

const BRAND_FEATURES = [
  { icon: Zap, title: "Fast", desc: "Instant transfer on Stellar" },
  { icon: Shield, title: "Secure", desc: "On Stellar Network" },
  { icon: Lock, title: "Private", desc: "Opt-in private settlement" },
] as const;

const TOKEN_LOGOS: Record<string, string> = {
  XLM: "https://coin-images.coingecko.com/coins/images/100/small/fmpFRHHQ_400x400.jpg",
  USDC: "https://coin-images.coingecko.com/coins/images/6319/small/USDC.png",
  EURC: "https://coin-images.coingecko.com/coins/images/26045/small/EURC.png",
};

function TokenMark({
  currency,
  className,
}: {
  currency: string;
  className?: string;
}) {
  const src = TOKEN_LOGOS[currency.toUpperCase()];
  if (!src) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg bg-[#4A63BE] text-[11px] font-bold text-white",
          className,
        )}
      >
        {currency.slice(0, 1)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={currency}
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  );
}

function splitPaymentDescription(description: string) {
  const trimmed = description.trim();
  if (!trimmed) return { label: "Payment for", subject: "Your order" };
  const prefix = "Payment for ";
  if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
    return { label: "Payment for", subject: trimmed.slice(prefix.length) };
  }
  return { label: "Payment for", subject: trimmed };
}

function formatExpires(expiresAt: string | null): string {
  if (!expiresAt) return "Link does not expire";
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return "Link does not expire";
  return `Expires ${d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

export function PaymentCheckout({ linkId }: Props) {
  const [link, setLink] = useState<PublicPaymentLink | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [wallet, setWallet] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState<"hash" | "address" | "link" | null>(null);
  const [viewSecret, setViewSecret] = useState<string | null>(null);
  const [viewPub, setViewPub] = useState<string | null>(null);
  const [spendSecret, setSpendSecret] = useState<string | null>(null);
  const [spendPub, setSpendPub] = useState<string | null>(null);
  const [spendableNotes, setSpendableNotes] = useState<StoredNoteV2[] | null>(
    null,
  );
  const [notePickError, setNotePickError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [shieldedDisplay, setShieldedDisplay] = useState<string | null>(null);
  const [shieldedNoteCount, setShieldedNoteCount] = useState(0);
  const [pendingNoteCount, setPendingNoteCount] = useState(0);
  const [depositAmount, setDepositAmount] = useState("");
  const [payPageUrl, setPayPageUrl] = useState("");
  const [activeTab, setActiveTab] = useState<PayTab>("wallet");
  const [kycName, setKycName] = useState("");
  const [kycEmail, setKycEmail] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  const kycComplete =
    kycName.trim().length > 0 &&
    kycEmail.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kycEmail.trim());

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPayPageUrl(`${window.location.origin}/pay/${linkId}`);
    }
  }, [linkId]);

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
      if (result.link.amount) {
        setDepositAmount((current) => current || result.link.amount!);
      }
      if (result.link.paymentTxHash) {
        setTxHash(result.link.paymentTxHash);
      }
      const methods = result.link.paymentMethods?.length
        ? result.link.paymentMethods
        : ["wallet", "qr"];
      if (methods.includes("wallet")) setActiveTab("wallet");
      else if (methods.includes("qr")) setActiveTab("qr");
      else if (methods.includes("onramp")) setActiveTab("onramp");
    })();
    return () => {
      cancelled = true;
    };
  }, [linkId]);

  useEffect(() => {
    if (!link || link.paidAt || link.claimedAt || !txHash) return;
    const id = window.setInterval(() => {
      void (async () => {
        // Classic links: ask backend to match Horizon by memo.
        if (!link.privateSettlement) {
          const status = await checkPaymentLinkStatus(linkId, txHash);
          if (status.ok && status.status === "paid") {
            const result = await getPublicPaymentLink(linkId);
            if (result.ok) {
              setLink(result.link);
              if (result.link.paymentTxHash) setTxHash(result.link.paymentTxHash);
            }
            return;
          }
        }
        const result = await getPublicPaymentLink(linkId);
        if (result.ok && (result.link.paidAt || result.link.claimedAt)) {
          setLink(result.link);
          if (result.link.paymentTxHash) setTxHash(result.link.paymentTxHash);
        }
      })();
    }, 5000);
    return () => window.clearInterval(id);
  }, [link, linkId, txHash]);

  const refreshShieldedState = useCallback(
    async (
      walletAddr: string,
      secret: string,
      spendSk: string,
      amountNeeded: string,
    ): Promise<boolean> => {
      setScanning(true);
      try {
        await fullScan(walletAddr, secret, spendSk);
        const [unspent, balance] = await Promise.all([
          listUnspentNotesV2(walletAddr),
          getWalletBalance(walletAddr),
        ]);
        setShieldedDisplay(fromBaseUnits(balance.spendableBaseUnits));
        setShieldedNoteCount(balance.spendableCount);
        setPendingNoteCount(
          unspent.filter((note) => note.leafIndex == null).length,
        );

        if (!amountNeeded) {
          setSpendableNotes(null);
          setNotePickError(null);
          return false;
        }

        const pick = selectNotesForAmount(unspent, amountNeeded);
        if (pick.ok) {
          setSpendableNotes(pick.notes);
          setNotePickError(null);
          return true;
        }
        setSpendableNotes(null);
        setNotePickError(
          pick.reason === "need_fourth"
            ? "This payment needs four notes (or a larger one). Shield a bit more, or wait for another note to confirm."
            : null,
        );
        return false;
      } finally {
        setScanning(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!wallet || !link?.privateSettlement) return;
    const payAmount = link.amount || customAmount.trim();
    if (!payAmount) {
      setSpendableNotes(null);
      setNotePickError(null);
      return;
    }
    void (async () => {
      try {
        const unspent = await listUnspentNotesV2(wallet);
        const pick = selectNotesForAmount(unspent, toBaseUnits(payAmount));
        if (pick.ok) {
          setSpendableNotes(pick.notes);
          setNotePickError(null);
        } else {
          setSpendableNotes(null);
          setNotePickError(
            pick.reason === "need_fourth"
              ? "This payment needs four notes (or a larger one). Shield a bit more, or wait for another note to confirm."
              : null,
          );
        }
      } catch {
        /* ignore local reselect errors */
      }
    })();
  }, [customAmount, link?.amount, link?.privateSettlement, wallet]);

  useEffect(() => {
    if (
      !wallet ||
      !viewSecret ||
      !spendSecret ||
      !link?.privateSettlement ||
      link.paidAt ||
      link.claimedAt
    ) {
      return;
    }
    if (spendableNotes && pendingNoteCount === 0) return;

    const payAmount = link.amount || customAmount.trim();
    const id = window.setInterval(() => {
      void refreshShieldedState(
        wallet,
        viewSecret,
        spendSecret,
        payAmount ? toBaseUnits(payAmount) : "",
      );
    }, 5000);
    return () => window.clearInterval(id);
  }, [
    wallet,
    viewSecret,
    spendSecret,
    link?.privateSettlement,
    link?.paidAt,
    link?.claimedAt,
    link?.amount,
    customAmount,
    spendableNotes,
    pendingNoteCount,
    refreshShieldedState,
  ]);

  async function handleConnect() {
    setError(null);
    setBusy(true);
    setStatus("Connecting wallet…");

    try {
      const result = await connectFreighterWallet();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setWallet(result.address);

      if (link?.privateSettlement) {
        setStatus("Deriving viewing key…");
        const vkResult = await deriveViewingKey(result.address);
        if (!vkResult.ok) {
          setError(vkResult.error);
          return;
        }
        setViewSecret(vkResult.keys.viewSecret);
        setViewPub(vkResult.keys.viewPub);

        setStatus("Deriving spend key…");
        const skResult = await deriveSpendKey(result.address);
        if (!skResult.ok) {
          setError(skResult.error);
          return;
        }
        setSpendSecret(skResult.keys.spendSecret);
        setSpendPub(skResult.keys.spendPub);

        const payAmount = link.amount || customAmount.trim();
        if (!depositAmount.trim() && (link.amount || payAmount)) {
          setDepositAmount(link.amount || payAmount);
        }
        setStatus("Checking shielded balance…");
        await refreshShieldedState(
          result.address,
          vkResult.keys.viewSecret,
          skResult.keys.spendSecret,
          payAmount ? toBaseUnits(payAmount) : "",
        );
      }
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }

  async function handlePay() {
    if (!link || !wallet) return;
    const payAmount = link.amount || customAmount.trim();
    if (!payAmount) {
      setError("Enter an amount to pay.");
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

        const amountBaseUnits = toBaseUnits(payAmount);

        if (
          spendableNotes &&
          spendSecret &&
          spendPub &&
          viewPub &&
          link.viewPub &&
          link.spendPub
        ) {
          await handleTransferPay(amountBaseUnits);
        } else {
          setError(
            "Shield enough XLM on this page first, then pay privately.",
          );
          setBusy(false);
          return;
        }
      } else {
        setStatus("Building payment…");
        const built = await buildClassicPaymentXdr({
          sourceAddress: wallet,
          destinationAddress: link.destinationAddress,
          amount: payAmount,
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
        setStatus("Payment submitted. Confirming…");
        const statusCheck = await checkPaymentLinkStatus(
          link.id,
          submitted.hash,
        );
        if (statusCheck.ok && statusCheck.status === "paid") {
          const refreshed = await getPublicPaymentLink(link.id);
          if (refreshed.ok) setLink(refreshed.link);
          setStatus("Payment confirmed.");
        } else {
          setStatus("Payment submitted. Awaiting confirmation…");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleShieldDeposit() {
    if (!link || !wallet || !spendSecret || !viewSecret) return;
    const amountDisplay = depositAmount.trim();
    if (!amountDisplay) {
      setError("Enter how much XLM to shield.");
      return;
    }

    setBusy(true);
    setError(null);
    setStatus("Building deposit proof…");

    try {
      const salt = randomSaltHex();
      const secrets = await deriveNoteSecrets(spendSecret, salt);
      const proofResult = await buildDepositProof(amountDisplay, secrets);
      if (!proofResult.ok) {
        setError(proofResult.error);
        setStatus(null);
        return;
      }

      setStatus("Sign deposit in Freighter…");
      const submitted = await submitPoolDeposit({
        fromAddress: wallet,
        amountBaseUnits: proofResult.result.amountBaseUnits,
        commitmentHex: proofResult.result.commitment,
        proofHex: proofResult.result.proof,
      });
      if (!submitted.ok) {
        setError(submitted.error);
        setStatus(null);
        return;
      }

      setDepositTxHash(submitted.hash);
      await putNoteV2({
        commitment: proofResult.result.commitment,
        ownerWallet: wallet,
        ownerPk: proofResult.result.ownerPk,
        k: proofResult.result.k,
        amount: amountDisplay,
        amountBaseUnits: proofResult.result.amountBaseUnits,
        leafIndex: null,
        spent: false,
        origin: "topup",
        salt,
        createdAt: Date.now(),
      });

      const payAmount = link.amount || customAmount.trim();
      setPendingNoteCount((count) => count + 1);
      setStatus("Deposit submitted. Waiting for the indexer to confirm…");
      let ready = false;
      for (let i = 0; i < 30; i++) {
        await new Promise((resolve) => window.setTimeout(resolve, 4000));
        ready = await refreshShieldedState(
          wallet,
          viewSecret,
          spendSecret,
          payAmount ? toBaseUnits(payAmount) : "",
        );
        if (ready) break;
        setStatus(
          i < 2
            ? "Deposit submitted. Waiting for the indexer to confirm…"
            : "Indexer is catching up. Pay unlocks when this note is indexed.",
        );
      }

      setStatus(
        ready
          ? "Shielded balance is ready. You can pay privately."
          : "Deposit is on-chain. We’ll keep checking the indexer — Pay unlocks when the note is ready.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed.");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleTransferPay(amountBaseUnits: string) {
    if (
      !link ||
      !wallet ||
      !spendableNotes ||
      spendableNotes.length === 0 ||
      !spendSecret ||
      !spendPub ||
      !viewPub ||
      !link.viewPub ||
      !link.spendPub
    ) {
      return;
    }

    setStatus("Fetching pool leaves…");
    const leavesRes = await getPoolLeaves();
    if (!leavesRes.ok) {
      setError(leavesRes.error);
      setStatus(null);
      return;
    }

    for (const note of spendableNotes) {
      if (note.leafIndex == null) {
        setError("Note is not yet confirmed on-chain. Try again shortly.");
        setStatus(null);
        return;
      }
    }

    const inputV = spendableNotes.reduce(
      (s, n) => s + BigInt(n.amountBaseUnits),
      BigInt(0),
    );
    const payV = BigInt(amountBaseUnits);
    const changeV = inputV - payV;

    if (changeV < BigInt(0)) {
      setError("Insufficient note balance.");
      setStatus(null);
      return;
    }

    const arity = spendableNotes.length;
    if (arity !== 1 && arity !== 2 && arity !== 4) {
      setError("Internal error: unsupported note set size.");
      setStatus(null);
      return;
    }

    const provingStatus =
      arity === 4
        ? "Building 4-input transfer proof (this can take a minute)…"
        : arity === 2
          ? "Building 2-input transfer proof (20-30s)…"
          : "Building transfer proof (10-15s)…";
    setStatus(provingStatus);

    const common = {
      spendSk: spendSecret,
      leaves: leavesRes.data.leaves,
      out1OwnerPk: link.spendPub,
      out1V: amountBaseUnits,
      out2OwnerPk: spendPub,
      out2V: changeV.toString(),
      recipientViewPub: link.viewPub,
      selfViewPub: viewPub,
    };

    let root: string;
    let outCm1: string;
    let outCm2: string;
    let proof: string;
    let recipientBlob: string;
    let changeBlob: string;
    let out2: { ownerPk: string; k: string; v: string };
    let nullifiers: string[];
    let submit: { ok: true; hash: string } | { ok: false; error: string };

    if (arity === 1) {
      const note = spendableNotes[0];
      const proofResult = await buildTransferProof({
        ...common,
        k: note.k,
        v: note.amountBaseUnits,
        leafIndex: note.leafIndex!,
      });
      if (!proofResult.ok) {
        setError(proofResult.error);
        setStatus(null);
        return;
      }
      root = proofResult.result.root;
      outCm1 = proofResult.result.outCm1;
      outCm2 = proofResult.result.outCm2;
      proof = proofResult.result.proof;
      recipientBlob = proofResult.result.recipientBlob;
      changeBlob = proofResult.result.changeBlob;
      out2 = proofResult.result.out2;
      nullifiers = [proofResult.result.nullifier];
      setStatus("Sign transfer in Freighter…");
      submit = await submitPoolTransfer({
        fromAddress: wallet,
        proofHex: proof,
        rootHex: root,
        nullifierHex: nullifiers[0],
        outCommitment1Hex: outCm1,
        outCommitment2Hex: outCm2,
        note1BlobHex: recipientBlob,
        note2BlobHex: changeBlob,
      });
    } else {
      const proofResult = await buildTransferNProof({
        ...common,
        arity,
        notes: spendableNotes.map((n) => ({
          k: n.k,
          v: n.amountBaseUnits,
          leafIndex: n.leafIndex!,
        })),
      });
      if (!proofResult.ok) {
        setError(proofResult.error);
        setStatus(null);
        return;
      }
      root = proofResult.result.root;
      outCm1 = proofResult.result.outCm1;
      outCm2 = proofResult.result.outCm2;
      proof = proofResult.result.proof;
      recipientBlob = proofResult.result.recipientBlob;
      changeBlob = proofResult.result.changeBlob;
      out2 = proofResult.result.out2;
      nullifiers = proofResult.result.nullifiers;
      setStatus("Sign transfer in Freighter…");
      submit = await submitPoolTransferN({
        fromAddress: wallet,
        proofHex: proof,
        rootHex: root,
        nullifierHexes: nullifiers,
        outCommitment1Hex: outCm1,
        outCommitment2Hex: outCm2,
        note1BlobHex: recipientBlob,
        note2BlobHex: changeBlob,
      });
    }

    if (!submit.ok) {
      setError(submit.error);
      setStatus(null);
      return;
    }

    for (const note of spendableNotes) {
      await markNoteSpent(note.commitment);
    }

    if (changeV > BigInt(0)) {
      const changeNote: StoredNoteV2 = {
        commitment: outCm2,
        ownerWallet: wallet,
        ownerPk: out2.ownerPk,
        k: out2.k,
        amount: fromBaseUnits(changeV.toString()),
        amountBaseUnits: changeV.toString(),
        leafIndex: null,
        spent: false,
        origin: "change",
        createdAt: Date.now(),
      };
      await putNoteV2(changeNote);
    }

    setTxHash(submit.hash);
    setSpendableNotes(null);
    setStatus("Private transfer submitted. Claiming link…");

    const claimed = await claimPaymentLink(link.id, submit.hash, outCm1);
    if (!claimed.ok) {
      console.warn("Claim failed:", claimed.error);
    }

    setStatus("Private transfer complete. Amount is hidden on-chain.");
  }

  async function copyText(text: string, kind: "hash" | "address" | "link") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  }

  const networkName = getStellarNetwork() === "public" ? "Mainnet" : "Testnet";
  const networkLabel = `Recommended network · ${networkName}`;

  if (loadError) {
    return (
      <CheckoutPageShell networkLabel={networkName}>
        <div className="rounded-2xl border border-[#E7B66D]/40 bg-white px-6 py-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[#0F1939]">
            {expired ? "Link expired" : "Payment unavailable"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{loadError}</p>
        </div>
      </CheckoutPageShell>
    );
  }

  if (!link) {
    return (
      <CheckoutPageShell networkLabel={networkName}>
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#E7B66D]/35 bg-white">
          <p className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin text-[#4A63BE]" />
            Loading payment…
          </p>
        </div>
      </CheckoutPageShell>
    );
  }

  const paid = Boolean(link.paidAt || link.claimedAt);
  const isAnyAmount = !link.amount;
  const displayAmount = isAnyAmount ? customAmount.trim() : link.amount!;
  const amountLabel = displayAmount
    ? `${displayAmount} ${link.currency}`
    : `— ${link.currency}`;
  const businessName = link.businessName?.trim() || "Hypertron";
  const description = link.purpose?.trim() || "Payment";
  const paymentDesc = splitPaymentDescription(description);
  const enabledMethods = link.paymentMethods?.length
    ? link.paymentMethods
    : ["wallet", "qr"];
  const tabs = (
    [
      { id: "wallet" as const, label: "Wallet", Icon: Wallet },
      { id: "qr" as const, label: "QR Code", Icon: QrCode },
      { id: "onramp" as const, label: "On-Ramp", Icon: Building2 },
    ] as const
  ).filter((t) => enabledMethods.includes(t.id));

  const payDest = link.privateSettlement
    ? getPaymentPoolAddress()
    : link.destinationAddress;

  const canPay =
    Boolean(displayAmount) &&
    !scanning &&
    (!link.privateSettlement || Boolean(spendableNotes));

  const payButtonLabel = !wallet
    ? "Connect Freighter"
    : link.privateSettlement
      ? `Pay privately · ${amountLabel}`
      : `Pay ${amountLabel}`;

  return (
    <CheckoutPageShell networkLabel={networkName}>
      <div className="overflow-hidden rounded-2xl border border-[#E7B66D]/40 bg-white">
        <div className="grid min-h-[620px] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Brand panel */}
          <aside className="relative flex min-h-[320px] flex-col justify-between overflow-hidden bg-gradient-to-b from-[#0F1939] via-[#121F46] to-[#1a2f6b] p-6 lg:min-h-0">
            <div
              className="pointer-events-none absolute inset-0 opacity-50"
              aria-hidden
              style={{
                backgroundImage:
                  "radial-gradient(circle at 18% 88%, rgba(231,182,109,0.18) 0%, transparent 48%), radial-gradient(circle at 82% 12%, rgba(74,99,190,0.28) 0%, transparent 45%)",
              }}
            />
            <div className="relative space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <HypertronLogoMark size={36} variant="brand" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">
                      {businessName}
                    </span>
                    <BadgeCheck className="size-4 shrink-0 text-[#E7B66D]" />
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                    paid
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-[#E7B66D]/20 text-[#E7B66D]",
                  )}
                >
                  {paid ? "Paid" : "Unpaid"}
                </span>
              </div>

              <div>
                <p className="text-sm text-white/70">{paymentDesc.label}</p>
                <p className="mt-0.5 text-lg font-semibold leading-snug text-white">
                  {paymentDesc.subject}
                </p>
              </div>

              <ul className="space-y-3">
                {BRAND_FEATURES.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#4A63BE]/35 text-[#E7B66D]">
                      <Icon className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs text-white/70">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative mt-6 flex items-center gap-2 text-xs text-white/75">
              <Shield className="size-3.5 shrink-0 text-[#E7B66D]" />
              Secured by Hypertron
            </div>
          </aside>

          {/* Checkout panel */}
          <div className="flex min-h-0 flex-col p-6 sm:p-7">
            <div className="shrink-0">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C9A46A] uppercase">
                Amount to pay
              </p>
              {isAnyAmount ? (
                <div className="mt-2">
                  <Label
                    htmlFor="pay-amount"
                    className="text-xs font-medium text-slate-700"
                  >
                    Enter amount ({link.currency})
                  </Label>
                  <div className="mt-1.5 flex overflow-hidden rounded-xl border border-[#E7B66D]/40 focus-within:ring-2 focus-within:ring-[#4A63BE]/25">
                    <Input
                      id="pay-amount"
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 10"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value.trim())}
                      className="h-11 flex-1 rounded-none border-0 bg-white text-lg font-semibold text-[#0F1939] focus-visible:ring-0"
                    />
                    <span className="flex items-center border-l border-[#E7B66D]/30 bg-[#FBF7F0] px-3 text-sm font-medium text-slate-600">
                      {link.currency}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-1 text-3xl font-semibold tracking-tight text-[#0F1939]">
                  {link.amount}{" "}
                  <span className="text-xl font-medium text-slate-500">
                    {link.currency}
                  </span>
                </p>
              )}
            </div>

            {tabs.length > 0 ? (
              <div className="mt-5 shrink-0 space-y-2.5">
                <p className="text-sm font-medium text-slate-700">Pay with</p>
                <div className="flex flex-wrap gap-2">
                  {tabs.map(({ id, label, Icon }) => {
                    const active = activeTab === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveTab(id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "border-[#4A63BE] bg-[#EEF2FF] text-[#4A63BE]"
                            : "border-slate-200 bg-white text-slate-600 hover:border-[#E7B66D]/50",
                        )}
                      >
                        <Icon className="size-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-3 space-y-3 rounded-xl border border-[#E7B66D]/30 bg-[#FBF7F0]/60 px-3.5 py-3">
              <p className="text-xs font-medium text-slate-700">
                Your details (for receipt)
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label
                    htmlFor="pay-kyc-name"
                    className="text-[11px] text-slate-500"
                  >
                    Name
                  </Label>
                  <Input
                    id="pay-kyc-name"
                    value={kycName}
                    onChange={(e) => setKycName(e.target.value)}
                    placeholder="Your name"
                    className="h-9 border-[#E7B66D]/35 bg-white text-sm text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="pay-kyc-email"
                    className="text-[11px] text-slate-500"
                  >
                    Email
                  </Label>
                  <Input
                    id="pay-kyc-email"
                    type="email"
                    value={kycEmail}
                    onChange={(e) => setKycEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-9 border-[#E7B66D]/35 bg-white text-sm text-slate-900"
                  />
                </div>
              </div>
              {kycComplete ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="size-3.5" /> Ready to continue
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Required before paying or using the QR code.
                </p>
              )}
            </div>

            <div className="mt-3 flex min-h-0 flex-1 flex-col">
              {activeTab === "wallet" ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mt-1 flex items-center justify-between gap-3 rounded-xl border border-[#E7B66D]/35 bg-[#FBF7F0]/50 px-3.5 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <TokenMark currency={link.currency} className="size-9" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#0F1939]">
                          {link.currency} on Stellar
                        </p>
                        <p className="text-xs text-slate-500">{networkLabel}</p>
                      </div>
                    </div>
                    <Badge className="shrink-0 border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 hover:bg-emerald-50">
                      Fast &amp; low fees
                    </Badge>
                  </div>

                  {link.privateSettlement ? (
                    <div className="mt-3 space-y-3 rounded-xl border border-[#E7B66D]/40 bg-[#FBF7F0] px-3.5 py-3 text-sm">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-[#C9A46A] uppercase">
                        <Shield className="size-3.5" />
                        Private settlement
                      </p>
                      {!wallet ? (
                        <p className="text-xs text-slate-600">
                          Connect Freighter to see your shielded balance. Pay
                          stays locked until you have enough shielded XLM.
                        </p>
                      ) : scanning && shieldedDisplay == null ? (
                        <p className="flex items-center gap-2 text-xs text-slate-600">
                          <Loader2 className="size-3.5 animate-spin" />
                          Checking shielded balance…
                        </p>
                      ) : (
                        <>
                          <div className="rounded-lg border border-[#E7B66D]/30 bg-white px-3 py-2">
                            <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
                              Shielded balance
                            </p>
                            <p className="mt-0.5 text-lg font-semibold text-[#0F1939]">
                              {shieldedDisplay ?? "0"}{" "}
                              <span className="text-sm font-medium text-slate-500">
                                XLM
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {shieldedNoteCount} ready note
                              {shieldedNoteCount === 1 ? "" : "s"}
                              {pendingNoteCount > 0
                                ? ` · ${pendingNoteCount} confirming`
                                : ""}
                            </p>
                          </div>
                          {spendableNotes ? (
                            <p className="text-xs text-emerald-700">
                              Enough to pay privately from{" "}
                              {spendableNotes.length} note
                              {spendableNotes.length === 1 ? "" : "s"}. Amount
                              stays hidden on the payment.
                            </p>
                          ) : (
                            <p className="text-xs text-amber-800">
                              {pendingNoteCount > 0
                                ? "Your deposit is on-chain. Pay unlocks after the indexer confirms the note — this page keeps checking."
                                : notePickError ||
                                  (displayAmount
                                    ? `Need ${displayAmount} XLM shielded before you can pay. Shield any amount below — the invoice amount, or more for later privacy payments.`
                                    : "Enter an amount, then shield XLM to unlock Pay.")}
                            </p>
                          )}
                          {!paid ? (
                            <div className="space-y-2">
                              <Label
                                htmlFor="shield-amount"
                                className="text-[11px] text-slate-500"
                              >
                                Shield XLM into this wallet
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  id="shield-amount"
                                  type="text"
                                  inputMode="decimal"
                                  placeholder={displayAmount || "e.g. 10"}
                                  value={depositAmount}
                                  onChange={(e) =>
                                    setDepositAmount(e.target.value.trim())
                                  }
                                  className="h-9 flex-1 border-[#E7B66D]/35 bg-white text-sm text-slate-900"
                                  disabled={busy}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={busy || !depositAmount.trim()}
                                  className="h-9 shrink-0 border-[#E7B66D]/45 bg-white px-3 text-xs font-semibold text-[#0F1939] hover:bg-white"
                                  onClick={() => void handleShieldDeposit()}
                                >
                                  {busy && !spendableNotes ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    "Shield"
                                  )}
                                </Button>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                Shielding is a public deposit. The payment
                                itself stays private.
                              </p>
                              {depositTxHash ? (
                                <ExplorerLinks txHash={depositTxHash} showContract />
                              ) : null}
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}

                  {paid ? (
                    <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                      <CheckCircle2 className="mx-auto size-7 text-emerald-600" />
                      <p className="mt-1.5 text-sm font-semibold text-emerald-800">
                        Payment received
                      </p>
                      {txHash || link.paymentTxHash ? (
                        <ExplorerLinks
                          txHash={(txHash || link.paymentTxHash)!}
                          showContract={link.privateSettlement}
                        />
                      ) : null}
                    </div>
                  ) : (
                    <>
                      {wallet ? (
                        <p className="mt-3 truncate font-mono text-[11px] text-slate-500">
                          {wallet}
                        </p>
                      ) : null}
                      <Button
                        type="button"
                        disabled={
                          !kycComplete ||
                          busy ||
                          (wallet ? !canPay : false)
                        }
                        className="mt-3 h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-[#121F46] to-[#4A63BE] text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
                        onClick={() =>
                          void (wallet ? handlePay() : handleConnect())
                        }
                      >
                        {busy &&
                        ( !wallet ||
                          Boolean(spendableNotes) ||
                          !link.privateSettlement) ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            {status || "Working…"}
                          </>
                        ) : (
                          <>
                            <Wallet className="size-4" />
                            {payButtonLabel}
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {status ? (
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      {busy ? (
                        <Loader2 className="size-3.5 shrink-0 animate-spin" />
                      ) : null}
                      {status}
                    </p>
                  ) : null}
                  {error ? (
                    <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      <p>{error}</p>
                      {error.toLowerCase().includes("install") ? (
                        <a
                          href={FREIGHTER_INSTALL_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block font-medium text-[#4A63BE] underline"
                        >
                          Install Freighter
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  {txHash && !paid ? (
                    <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                      <p className="text-sm font-medium text-emerald-800">
                        Transaction submitted
                      </p>
                      <ExplorerLinks
                        txHash={txHash}
                        showContract={link.privateSettlement}
                      />
                      <button
                        type="button"
                        onClick={() => void copyText(txHash, "hash")}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-800"
                      >
                        {copied === "hash" ? (
                          <CheckCheck className="size-3.5" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        {copied === "hash" ? "Copied" : "Copy hash"}
                      </button>
                    </div>
                  ) : null}

                  <TrustFooter />
                </div>
              ) : activeTab === "qr" ? (
                <QrPanel
                  payPageUrl={payPageUrl}
                  copyAddress={payDest}
                  currency={link.currency}
                  expiresAt={link.expiresAt}
                  privateSettlement={link.privateSettlement}
                  detailsComplete={kycComplete}
                  copied={copied}
                  onCopy={(text, kind) => void copyText(text, kind)}
                />
              ) : (
                <OnRampPanel
                  currency={link.currency}
                  vaultName={
                    businessName.endsWith("Vault")
                      ? businessName
                      : `${businessName} Vault`
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </CheckoutPageShell>
  );
}

function CheckoutPageShell({
  children,
  networkLabel,
}: {
  children: ReactNode;
  networkLabel: string;
}) {
  return (
    <main className="min-h-svh w-full bg-[radial-gradient(ellipse_at_top,_#FBF7F0_0%,_#F4F6FB_45%,_#EEF1F8_100%)] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
          <HypertronLogoMark size={32} variant="brand" />
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-[#0F1939]">
                Hypertron
              </p>
              <p className="text-[11px] text-slate-500">Secure checkout</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E7B66D]/45 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <span className="size-2 rounded-full bg-[#4A63BE]" />
            Stellar · {networkLabel}
          </span>
        </header>

        {children}

        <footer className="mt-6 text-center text-[11px] text-slate-500">
          By completing this payment, you agree to Hypertron&apos;s{" "}
          <Link href="/terms" className="text-[#4A63BE] hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#4A63BE] hover:underline">
            Privacy Policy
          </Link>
          .
        </footer>
      </div>
    </main>
  );
}

function TrustFooter() {
  return (
    <div className="mt-auto flex shrink-0 flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 text-[#C9A46A]" />
        Private &amp; secure payments
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Shield className="size-3.5 text-[#C9A46A]" />
        Opt-in privacy available
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Check className="size-3.5 text-[#C9A46A]" />
        Proof of payment
      </span>
    </div>
  );
}

function QrPanel({
  payPageUrl,
  copyAddress,
  currency,
  expiresAt,
  privateSettlement,
  detailsComplete,
  copied,
  onCopy,
}: {
  payPageUrl: string;
  copyAddress: string;
  currency: string;
  expiresAt: string | null;
  privateSettlement: boolean;
  detailsComplete: boolean;
  copied: "hash" | "address" | "link" | null;
  onCopy: (text: string, kind: "address" | "link") => void;
}) {
  const qrSize = 148;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="rounded-xl border border-[#E7B66D]/40 bg-[#FBF7F0] px-3.5 py-2.5">
        <p className="text-sm font-medium text-[#0F1939]">
          {privateSettlement
            ? "Private settlement enabled"
            : "Public Stellar payment"}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {privateSettlement
            ? "Scan to open this checkout. You’ll shield XLM first, then pay privately."
            : "Scan with any wallet app, or copy the destination address."}
        </p>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-[#0F1939]">
        Scan with any wallet
      </h3>
      <p className="mt-0.5 text-xs text-slate-500">
        Use your wallet app to scan the QR code and complete the payment.
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex shrink-0 justify-center sm:justify-start">
          <div className="relative rounded-xl border border-[#E7B66D]/50 bg-white p-2.5">
            <div
              className={cn(!detailsComplete && "pointer-events-none select-none blur-md")}
            >
              {payPageUrl ? (
                <div className="relative">
                  <QRCodeSVG
                    value={payPageUrl}
                    size={qrSize}
                    level="H"
                    includeMargin={false}
                    bgColor="#FFFFFF"
                    fgColor="#0F1939"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full border-[3px] border-white">
                      <HypertronLogoMark size={28} variant="brand" />
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center justify-center bg-slate-100 text-xs text-slate-500"
                  style={{ width: qrSize, height: qrSize }}
                >
                  Loading…
                </div>
              )}
            </div>
            {!detailsComplete ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 px-3 text-center backdrop-blur-sm">
                <p className="text-xs font-medium text-[#0F1939]">
                  Enter your name and email above to unlock
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-[#E7B66D]/35 bg-white px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <TokenMark currency={currency} className="size-7" />
              <p className="truncate text-xs font-medium text-[#0F1939]">
                {currency} on Stellar
              </p>
            </div>
            <Badge className="gap-0.5 border-emerald-200 bg-emerald-50 px-1.5 text-[10px] text-emerald-700 hover:bg-emerald-50">
              <Check className="size-2.5" />
              Verified
            </Badge>
          </div>

          <p className="break-all font-mono text-[10px] leading-relaxed text-slate-500">
            {copyAddress}
          </p>

          <div className="grid grid-cols-3 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!detailsComplete}
              className="h-8 gap-1 border-[#E7B66D]/45 bg-white px-2 text-[11px] text-[#0F1939] hover:bg-[#FBF7F0]"
              onClick={() => onCopy(copyAddress, "address")}
            >
              <Copy className="size-3" />
              {copied === "address" ? "Copied" : "Copy"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 border-[#E7B66D]/45 bg-white px-2 text-[11px] text-[#0F1939] hover:bg-[#FBF7F0]"
              onClick={() =>
                payPageUrl &&
                window.open(payPageUrl, "_blank", "noopener,noreferrer")
              }
              disabled={!payPageUrl || !detailsComplete}
            >
              <Wallet className="size-3" />
              Open
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1 border-[#E7B66D]/45 bg-white px-2 text-[11px] text-[#0F1939] hover:bg-[#FBF7F0]"
              onClick={() => onCopy(payPageUrl, "link")}
              disabled={!payPageUrl || !detailsComplete}
            >
              <Share2 className="size-3" />
              {copied === "link" ? "Copied" : "Share"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-auto flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span className="truncate">{formatExpires(expiresAt)}</span>
      </div>
    </div>
  );
}

const ON_RAMP_PARTNERS = [
  {
    id: "moneygram",
    name: "MoneyGram",
    desc: "Cash pickup · Bank transfer · Cards",
    badge: "Best rate",
  },
  {
    id: "banxa",
    name: "Banxa",
    desc: "Credit / Debit Card · Apple Pay",
    badge: "Secure",
  },
  {
    id: "alchemy",
    name: "Alchemy Pay",
    desc: "Cards · Local methods",
    badge: "Low fees",
  },
] as const;

function OnRampPanel({
  currency,
  vaultName,
}: {
  currency: string;
  vaultName: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h3 className="text-sm font-semibold text-[#0F1939]">
        Buy {currency} with fiat
      </h3>
      <p className="mt-0.5 text-xs text-slate-500">
        Pay via a partner — {currency} is delivered to{" "}
        <span className="font-medium text-slate-700">{vaultName}</span>.
      </p>

      <ul className="mt-3 space-y-2">
        {ON_RAMP_PARTNERS.map((partner) => (
          <li
            key={partner.id}
            className="flex items-center gap-2.5 rounded-lg border border-[#E7B66D]/35 bg-white px-3 py-2.5"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[#E7B66D]/30 bg-[#FBF7F0] text-[10px] font-bold text-[#4A63BE]">
              {partner.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="text-xs font-semibold text-[#0F1939]">
                  {partner.name}
                </p>
                <Badge className="border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[9px] text-emerald-700 hover:bg-emerald-50">
                  {partner.badge}
                </Badge>
              </div>
              <p className="truncate text-[10px] text-slate-500">
                {partner.desc}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled
              className="h-8 shrink-0 bg-[#4A63BE]/50 px-3 text-xs text-white"
            >
              Soon
            </Button>
          </li>
        ))}
      </ul>

      <TrustFooter />
    </div>
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
