import { apiFetch, getApiBaseUrl } from "@/lib/api";

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
  createdAt: string;
  url: string;
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

    const res = await apiFetch("/api/payment-link", {
      method: "POST",
      body: JSON.stringify({
        businessId: input.businessId,
        amount: input.amount,
        currency: input.currency,
        purpose: input.purpose,
        clientName: input.clientName,
        metadata,
        expiryDays: input.expiryDays,
        workflowStage: input.workflowStage,
      }),
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
        createdAt: link.createdAt,
        url: link.url,
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
    const res = await fetch(
      `${getApiBaseUrl()}/api/payment-link/${encodeURIComponent(id)}`,
      { method: "GET", credentials: "omit" },
    );
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
      },
    };
  } catch {
    return { ok: false, error: "Could not reach the API." };
  }
}
