import { normalizePaymentAssetCode } from "@/lib/stellar-assets";

export type PaymentLinkPreviewData = {
  amount: string;
  currency?: string;
  description: string;
  customer?: string;
  expiry: string;
  privateSettlement: boolean;
  methods: string[];
  linkId?: string;
  linkUrl?: string;
};

export function buildPaymentPreviewHref(data: PaymentLinkPreviewData): string {
  const params = new URLSearchParams();
  params.set("amount", data.amount);
  if (data.currency) params.set("currency", data.currency);
  params.set("description", data.description);
  if (data.customer?.trim()) params.set("customer", data.customer.trim());
  params.set("expiry", data.expiry);
  params.set("private", data.privateSettlement ? "1" : "0");
  if (data.methods.length) params.set("methods", data.methods.join(","));
  if (data.linkId) params.set("linkId", data.linkId);
  if (data.linkUrl) params.set("linkUrl", data.linkUrl);
  return `/dashboard/payment-links/preview?${params.toString()}`;
}

export function parsePaymentPreviewSearchParams(
  searchParams: URLSearchParams
): PaymentLinkPreviewData {
  const methodsRaw = searchParams.get("methods");
  return {
    amount: searchParams.get("amount")?.trim() || "",
    currency: normalizePaymentAssetCode(searchParams.get("currency")),
    description: searchParams.get("description")?.trim() || "",
    customer: searchParams.get("customer")?.trim() || undefined,
    expiry: searchParams.get("expiry")?.trim() || "30",
    privateSettlement: searchParams.get("private") === "1",
    methods: methodsRaw
      ? methodsRaw.split(",").map((m) => m.trim()).filter(Boolean)
      : ["wallet", "qr", "onramp"],
    linkId: searchParams.get("linkId")?.trim() || undefined,
    linkUrl: searchParams.get("linkUrl")?.trim() || undefined,
  };
}

export function expiryLabel(value: string): string {
  const map: Record<string, string> = {
    "7": "7 days",
    "30": "30 days",
    "90": "90 days",
    never: "Never",
  };
  return map[value] ?? `${value} days`;
}

export function computeExpiryDate(expiryValue: string, from = new Date()): Date | null {
  if (expiryValue === "never") return null;
  const days = Number.parseInt(expiryValue, 10);
  if (!Number.isFinite(days) || days <= 0) return null;
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatPreviewDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatUsdFromUsdc(amount: string): string {
  const n = Number.parseFloat(amount.replace(/,/g, ""));
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
