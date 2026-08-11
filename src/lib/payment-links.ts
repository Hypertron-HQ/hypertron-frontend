import { apiFetch } from "@/lib/api";

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

type ErrorBody = { error?: string };

async function readJson<T>(res: Response): Promise<T & ErrorBody> {
  return (await res.json().catch(() => ({}))) as T & ErrorBody;
}

export async function createPaymentLink(input: {
  businessId: string;
  amount: string;
  currency: string;
  purpose?: string;
  clientName?: string;
  metadata?: string;
  expiryDays?: string;
  workflowStage?: string;
}): Promise<
  { ok: true; link: PaymentLinkCreated } | { ok: false; error: string }
> {
  try {
    const res = await apiFetch("/api/payment-link", {
      method: "POST",
      body: JSON.stringify(input),
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
