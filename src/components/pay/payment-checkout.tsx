"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
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
import { submitPoolDeposit, submitPoolTransfer, submitPoolTransferN } from "@/lib/hypertron-pool";
import {
  getPublicPaymentLink,
  claimPaymentLink,
  type PublicPaymentLink,
} from "@/lib/payment-links";
import { buildClassicPaymentXdr } from "@/lib/stellar-classic-pay";
import {
  getPaymentPoolAddress,
  getStellarExpertContractUrl,
  getStellarExpertTxUrl,
  toBaseUnits,
  fromBaseUnits,
} from "@/lib/stellar-network";
import { cn } from "@/lib/utils";
import { deriveViewingKey, deriveSpendKey } from "@/lib/hypertron-viewkey";
import { buildTransferProof, buildTransferNProof } from "@/lib/hypertron-prover";
import { getPoolLeaves } from "@/lib/hypertron-indexer";
import {
  listUnspentNotesV2,
  putNoteV2,
  markNoteSpent,
  selectNotesForAmount,
  type StoredNoteV2,
} from "@/lib/hypertron-note-store-v2";
import { fullScan } from "@/lib/hypertron-note-scan";

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
  const [viewSecret, setViewSecret] = useState<string | null>(null);
  const [viewPub, setViewPub] = useState<string | null>(null);
  const [spendSecret, setSpendSecret] = useState<string | null>(null);
  const [spendPub, setSpendPub] = useState<string | null>(null);
  const [spendableNotes, setSpendableNotes] = useState<StoredNoteV2[] | null>(
    null,
  );
  const [notePickError, setNotePickError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

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

  const checkForSpendableNote = useCallback(
    async (
      walletAddr: string,
      secret: string,
      spendSk: string,
      amountNeeded: string,
    ) => {
      setScanning(true);
      try {
        await fullScan(walletAddr, secret, spendSk);
        const unspent = await listUnspentNotesV2(walletAddr);
        const pick = selectNotesForAmount(unspent, amountNeeded);
        if (pick.ok) {
          setSpendableNotes(pick.notes);
          setNotePickError(null);
        } else {
          setSpendableNotes(null);
          setNotePickError(
            pick.reason === "need_fourth"
              ? "This payment needs four notes (or a larger one). You have three ready notes — top up once more, or wait for another note to confirm."
              : null,
          );
        }
      } finally {
        setScanning(false);
      }
    },
    [],
  );

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

        if (link.amount) {
          setStatus("Checking shielded balance…");
          await checkForSpendableNote(
            result.address,
            vkResult.keys.viewSecret,
            skResult.keys.spendSecret,
            toBaseUnits(link.amount),
          );
        }
      }
    } finally {
      setBusy(false);
      setStatus(null);
    }
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

        const amountBaseUnits = toBaseUnits(link.amount);

        if (spendableNotes && spendSecret && spendPub && viewPub && link.viewPub && link.spendPub) {
          await handleTransferPay(amountBaseUnits);
        } else if (link.shieldCommitment && link.shieldProof) {
          await handleDepositPay(amountBaseUnits);
        } else {
          setError(
            "No shielded balance and no merchant deposit proof. Top up your wallet or ask the merchant to recreate the link.",
          );
          setBusy(false);
          return;
        }
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

  async function handleDepositPay(amountBaseUnits: string) {
    if (!link || !wallet || !link.shieldCommitment || !link.shieldProof) return;

    setStatus("Sign deposit in Freighter…");
    const submitted = await submitPoolDeposit({
      fromAddress: wallet,
      amountBaseUnits,
      commitmentHex: link.shieldCommitment,
      proofHex: link.shieldProof,
    });
    if (!submitted.ok) {
      setError(submitted.error);
      setStatus(null);
      return;
    }
    setTxHash(submitted.hash);
    setStatus("Deposit submitted. The merchant owns this note.");
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
    let submit:
      | { ok: true; hash: string }
      | { ok: false; error: string };

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
            {spendableNotes
              ? "Private transfer · amount hidden"
              : "Private settlement · pool deposit"}
          </>
        ) : (
          <>
            <Wallet className="size-3.5" />
            Public Stellar payment
          </>
        )}
      </div>

      {link.privateSettlement && wallet && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          {scanning ? (
            <p className="flex items-center gap-2 text-slate-600">
              <Loader2 className="size-3.5 animate-spin" />
              Checking shielded balance…
            </p>
          ) : spendableNotes ? (
            <div>
              <p className="font-medium text-emerald-700">
                Using shielded balance
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Paying from {spendableNotes.length} note
                {spendableNotes.length === 1 ? "" : "s"}:{" "}
                {fromBaseUnits(
                  spendableNotes
                    .reduce((s, n) => s + BigInt(n.amountBaseUnits), BigInt(0))
                    .toString(),
                )}{" "}
                XLM (amount will be hidden)
              </p>
            </div>
          ) : notePickError ? (
            <div>
              <p className="font-medium text-amber-700">Need another note</p>
              <p className="mt-1 text-xs text-slate-500">{notePickError}</p>
            </div>
          ) : link.shieldCommitment && link.shieldProof ? (
            <div>
              <p className="font-medium text-amber-700">
                No shielded balance — using deposit
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Amount will be visible on-chain.{" "}
                <a href="/wallet" className="underline">
                  Top up first
                </a>{" "}
                for hidden amounts.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-red-700">
                No shielded balance
              </p>
              <p className="mt-1 text-xs text-slate-500">
                <a href="/wallet" className="underline">
                  Top up your wallet
                </a>{" "}
                to pay this link privately.
              </p>
            </div>
          )}
        </div>
      )}

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
                disabled={
                  busy ||
                  !link.amount ||
                  scanning ||
                  (link.privateSettlement &&
                    !spendableNotes &&
                    (!link.shieldCommitment || !link.shieldProof))
                }
                className="h-11 w-full bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                onClick={handlePay}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Working…
                  </span>
                ) : link.privateSettlement ? (
                  spendableNotes ? (
                    "Pay privately"
                  ) : (
                    "Shield & pay"
                  )
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
