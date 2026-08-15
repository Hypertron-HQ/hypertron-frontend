import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { getDeveloperApiBaseUrl } from "@/lib/developer-api";

export type PaymentLinkCreated = {
  linkId: string;
  url: string;
  qrPayload: string;
  memo: string;
  amount: string | null;
  currency: string;
  expiresAt: string | null;
  paymentMethods: string[];
  destinationAddress: string;
  mode: string;
  shieldSalt?: string | null;
  shieldCommitment?: string | null;
  shieldProof?: string | null;
};

export type PublicPaymentLink = {
  id: string;
  amount: string | null;
  currency: string;
  memo: string;
  destinationAddress: string;
  purpose: string | null;
  businessName: string | null;
  clientName: string | null;
  workflowStage: string | null;
  metadata: string | null;
  paymentMethods: string[];
  expiresAt: string | null;
  paidAt: string | null;
  paymentTxHash: string | null;
  privateSettlement: boolean;
  shieldCommitment: string | null;
  shieldProof: string | null;
  viewPub: string | null;
  /** Merchant owner_pk — required for private transfer payments. */
  spendPub: string | null;
};

export type PaymentLinkListItem = {
  id: string;
  amount: string | null;
  currency: string;
  purpose: string | null;
  clientName: string | null;
  workflowStage: string | null;
  metadata: string | null;
  paymentMethods: string[];
  expiresAt: string | null;
  linkMemo: string | null;
  paidAt: string | null;
  paymentTxHash: string | null;
  claimedAt: string | null;
  claimTxHash: string | null;
  claimOutCommitment: string | null;
  confirmedAt: string | null;
  createdAt: string;
  url: string;
  shieldSalt?: string | null;
  shieldCommitment?: string | null;
  shieldProof?: string | null;
};

export type PaymentLinkStatus = "paid" | "pending" | "expired";

export function getPaymentLinkStatus(link: {
  paidAt: string | null;
  expiresAt: string | null;
}): PaymentLinkStatus {
  if (link.paidAt) return "paid";
  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
    return "expired";
  }
  return "pending";
}

type ErrorBody = { error?: string; expired?: boolean };

async function readJson<T>(res: Response): Promise<T & ErrorBody> {
  return (await res.json().catch(() => ({}))) as T & ErrorBody;
}

type LinkMetadataPayload = {
  note?: string;
  privateSettlement?: boolean;
};

/** Build metadata JSON stored on PaymentLink (includes privacy flag). */
export function buildLinkMetadata(input: {
  note?: string;
  privateSettlement?: boolean;
}): string {
  const payload: LinkMetadataPayload = {
    privateSettlement: Boolean(input.privateSettlement),
  };
  const note = input.note?.trim();
  if (note) payload.note = note;
  return JSON.stringify(payload);
}

export function parsePrivateSettlement(
  metadata: string | null | undefined,
): boolean {
  if (!metadata?.trim()) return false;
  try {
    const parsed = JSON.parse(metadata) as LinkMetadataPayload;
    return Boolean(parsed?.privateSettlement);
  } catch {
    return false;
  }
}

export async function createPaymentLink(input: {
  businessId: string;
  amount: string;
  currency: string;
  purpose?: string;
  clientName?: string;
  metadata?: string;
  note?: string;
  privateSettlement?: boolean;
  expiryDays?: string;
  workflowStage?: string;
  shieldSalt?: string;
  shieldCommitment?: string;
  shieldProof?: string;
}): Promise<
  { ok: true; link: PaymentLinkCreated } | { ok: false; error: string }
> {
  try {
    const metadata =
      input.metadata?.trim() ||
      buildLinkMetadata({
        note: input.note,
        privateSettlement: input.privateSettlement,
      });

    const body: Record<string, unknown> = {
      businessId: input.businessId,
      amount: input.amount,
      currency: input.currency,
      purpose: input.purpose,
      clientName: input.clientName,
      metadata,
      expiryDays: input.expiryDays,
      workflowStage: input.workflowStage,
    };
    if (input.privateSettlement) {
      body.shieldSalt = input.shieldSalt;
      body.shieldCommitment = input.shieldCommitment;
      body.shieldProof = input.shieldProof;
    }

    const res = await apiFetch("/api/payment-link", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const json = await readJson<PaymentLinkCreated>(res);
    if (!res.ok || !json.linkId || !json.url) {
      return {
        ok: false,
        error: json.error ?? "Could not create payment link.",
      };
    }
    return { ok: true, link: json };
  } catch {
    return { ok: false, error: "Could not reach the API." };
  }
}

/** Authenticated list for the Collect dashboard table. */
export async function listPaymentLinks(
  businessId: string,
): Promise<
  { ok: true; links: PaymentLinkListItem[] } | { ok: false; error: string }
> {
  try {
    const res = await apiFetch(
      `/api/payment-link?businessId=${encodeURIComponent(businessId)}`,
      { method: "GET" },
    );
    const json = await readJson<{ links?: PaymentLinkListItem[] }>(res);
    if (!res.ok || !Array.isArray(json.links)) {
      return {
        ok: false,
        error: json.error ?? "Could not load payment links.",
      };
    }

    return {
      ok: true,
      links: json.links.map((link) => ({
        ...link,
        amount:
          link.amount == null
            ? null
            : typeof link.amount === "string"
              ? link.amount
              : String(link.amount),
        currency: link.currency ?? "USDC",
        purpose: link.purpose ?? null,
        clientName: link.clientName ?? null,
        workflowStage: link.workflowStage ?? null,
        metadata: link.metadata ?? null,
        paymentMethods: Array.isArray(link.paymentMethods)
          ? link.paymentMethods
          : [],
        expiresAt: link.expiresAt ?? null,
        linkMemo: link.linkMemo ?? null,
        paidAt: link.paidAt ?? null,
        paymentTxHash: link.paymentTxHash ?? null,
        claimedAt: link.claimedAt ?? null,
        claimTxHash: link.claimTxHash ?? null,
        claimOutCommitment: link.claimOutCommitment ?? null,
        confirmedAt: link.confirmedAt ?? null,
        createdAt: link.createdAt,
        url: link.url,
        shieldSalt: link.shieldSalt ?? null,
        shieldCommitment: link.shieldCommitment ?? null,
        shieldProof: link.shieldProof ?? null,
      })),
    };
  } catch {
    return { ok: false, error: "Could not reach the API." };
  }
}

/** Public checkout fetch — no session cookie required. */
export async function getPublicPaymentLink(
  id: string,
): Promise<
  | { ok: true; link: PublicPaymentLink }
  | { ok: false; error: string; expired?: boolean }
> {
  try {
    // API-owned checkout links use cl_ prefix; Collect links stay on core.
    const url = id.startsWith("cl_")
      ? `${getDeveloperApiBaseUrl()}/v1/checkout-links/${encodeURIComponent(id)}`
      : `${getApiBaseUrl()}/api/payment-link/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: "GET",
      credentials: "omit",
    });
    const json = await readJson<{
      id?: string;
      amount?: string | null;
      currency?: string;
      memo?: string;
      destinationAddress?: string;
      purpose?: string | null;
      businessName?: string | null;
      clientName?: string | null;
      workflowStage?: string | null;
      metadata?: string | null;
      paymentMethods?: string[];
      expiresAt?: string | null;
      paidAt?: string | null;
      paymentTxHash?: string | null;
      shieldCommitment?: string | null;
      shieldProof?: string | null;
      viewPub?: string | null;
      spendPub?: string | null;
    }>(res);

    if (res.status === 410 || json.expired) {
      return {
        ok: false,
        error: json.error ?? "This payment link has expired.",
        expired: true,
      };
    }
    if (!res.ok || !json.id || !json.memo || !json.destinationAddress) {
      return {
        ok: false,
        error: json.error ?? "Payment link not found.",
      };
    }

    return {
      ok: true,
      link: {
        id: json.id,
        amount: json.amount ?? null,
        currency: json.currency ?? "USDC",
        memo: json.memo,
        destinationAddress: json.destinationAddress,
        purpose: json.purpose ?? null,
        businessName: json.businessName ?? null,
        clientName: json.clientName ?? null,
        workflowStage: json.workflowStage ?? null,
        metadata: json.metadata ?? null,
        paymentMethods: Array.isArray(json.paymentMethods)
          ? json.paymentMethods
          : ["wallet", "qr"],
        expiresAt: json.expiresAt ?? null,
        paidAt: json.paidAt ?? null,
        paymentTxHash: json.paymentTxHash ?? null,
        privateSettlement: parsePrivateSettlement(json.metadata),
        shieldCommitment: json.shieldCommitment ?? null,
        shieldProof: json.shieldProof ?? null,
        viewPub: json.viewPub ?? null,
        spendPub: json.spendPub ?? null,
      },
    };
  } catch {
    return { ok: false, error: "Could not reach the API." };
  }
}

/**
 * Payer claims a link after successful transfer payment.
 * Records the transfer tx hash and recipient note commitment.
 */
export async function claimPaymentLink(
  id: string,
  txHash: string,
  outCommitment: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const url = `${getApiBaseUrl()}/api/payment-link/${encodeURIComponent(id)}/claim`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash, outCommitment }),
    });
    const json = await readJson<{ error?: string }>(res);
    if (!res.ok) {
      return { ok: false, error: json.error ?? "Claim failed." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the API." };
  }
}

/**
 * Merchant marks a claimed link settled. Requires the owning session.
 */
export async function confirmPaymentLink(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await apiFetch(
      `/api/payment-link/${encodeURIComponent(id)}/confirm`,
      { method: "POST" },
    );
    const json = await readJson<{ error?: string }>(res);
    if (!res.ok) {
      return { ok: false, error: json.error ?? "Confirm failed." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the API." };
  }
}

function normalizeCommitment(value: string): string {
  return value.trim().toLowerCase().replace(/^0x/, "");
}

/**
 * Settle every claimed link whose output note the merchant can actually see.
 *
 * The payer records `claimOutCommitment` when they pay, but that alone is their
 * word. Decrypting the matching note with our viewing key — and finding it in
 * the tree — is the merchant-side proof that the money arrived, so that is what
 * flips a link from claimed to paid. Returns how many links were confirmed.
 */
export async function confirmSettledLinks(
  links: PaymentLinkListItem[],
  settledCommitments: Iterable<string>,
): Promise<number> {
  const owned = new Set(
    Array.from(settledCommitments, normalizeCommitment),
  );
  if (owned.size === 0) return 0;

  let confirmed = 0;
  for (const link of links) {
    if (link.confirmedAt || link.paidAt) continue;
    if (!link.claimedAt || !link.claimOutCommitment) continue;
    if (!owned.has(normalizeCommitment(link.claimOutCommitment))) continue;

    const res = await confirmPaymentLink(link.id);
    if (res.ok) confirmed++;
  }
  return confirmed;
}
