import type { BusinessProfile } from "@/lib/business";
import { fullScan } from "@/lib/hypertron-note-scan";
import {
  getWalletBalance,
  listUnspentNotesV2,
} from "@/lib/hypertron-note-store-v2";
import { deriveSpendKey, deriveViewingKey } from "@/lib/hypertron-viewkey";
import {
  getPaymentLinkStatus,
  listPaymentLinks,
  type PaymentLinkListItem,
} from "@/lib/payment-links";
import { fromBaseUnits } from "@/lib/stellar-network";

export type OverviewPaymentRow = {
  id: string;
  payer: string;
  handle: string;
  initials: string;
  purpose: string;
  status: "Settled" | "Processing" | "Failed";
  amount: string;
};

export type OverviewLinkRow = {
  id: string;
  name: string;
  payments: string;
  volume: string;
};

export type OverviewAttention = {
  id: string;
  tone: "danger" | "warn";
  title: string;
  detail: string;
};

export type OverviewMixSlice = {
  label: string;
  pct: number;
  color: string;
};

export type OverviewFunnelStep = {
  label: string;
  value: number;
  pct: number;
};

export type OverviewStats = {
  availableBalance: string;
  pendingVolume: string;
  pendingCount: number;
  successfulPayments: string;
  successRate: string;
  activeLinks: string;
  collectingToday: number;
  collected: string;
  collectedDelta: string;
  nextPayout: string;
  nextPayoutStatus: string;
  nextPayoutHint: string;
  lastPayout: string;
  destination: string;
  schedule: string;
  mix: OverviewMixSlice[];
  funnel: OverviewFunnelStep[];
  completionPct: string;
  attention: OverviewAttention[];
  recentPayments: OverviewPaymentRow[];
  paymentLinks: OverviewLinkRow[];
};

const MIX_COLORS: Record<string, string> = {
  USDC: "#4A63BE",
  XLM: "#E7B66D",
  EURC: "#7C8DB5",
  Other: "#C5CBD8",
};

/** Sandbox / demo overview — unchanged marketing sample. */
export const DEMO_OVERVIEW_STATS: OverviewStats = {
  availableBalance: "$42,680",
  pendingVolume: "$6,240",
  pendingCount: 8,
  successfulPayments: "126",
  successRate: "99%",
  activeLinks: "7",
  collectingToday: 2,
  collected: "$48,920",
  collectedDelta: "+18.4%",
  nextPayout: "$18,420",
  nextPayoutStatus: "In-transit",
  nextPayoutHint: "Expected today · 5:30pm",
  lastPayout: "$16,840 · Aug 15",
  destination: "GABC…X7K2",
  schedule: "Daily",
  mix: [
    { label: "USDC", pct: 58, color: "#4A63BE" },
    { label: "XLM", pct: 31, color: "#E7B66D" },
    { label: "Other", pct: 11, color: "#C5CBD8" },
  ],
  funnel: [
    { label: "Links created", value: 154, pct: 100 },
    { label: "Payment initiated", value: 142, pct: 92 },
    { label: "Payment completed", value: 126, pct: 82 },
  ],
  completionPct: "68.5%",
  attention: [
    {
      id: "failed",
      tone: "danger",
      title: "2 payments failed",
      detail: "Retry or contact payers",
    },
    {
      id: "settlement",
      tone: "warn",
      title: "1 settlement delayed",
      detail: "Expected within 24h",
    },
  ],
  recentPayments: [
    {
      id: "1",
      payer: "Archit Studio",
      handle: "archit.studio",
      initials: "AR",
      purpose: "August retainer",
      status: "Settled",
      amount: "$4,200",
    },
    {
      id: "2",
      payer: "Nova Gold",
      handle: "novagold.io",
      initials: "NG",
      purpose: "Milestone 2",
      status: "Processing",
      amount: "$1,850",
    },
    {
      id: "3",
      payer: "Orbit Partners",
      handle: "orbit.partners",
      initials: "OP",
      purpose: "License renewal",
      status: "Settled",
      amount: "$980",
    },
    {
      id: "4",
      payer: "Lumen Labs",
      handle: "lumenlabs.co",
      initials: "LP",
      purpose: "Project deposit",
      status: "Failed",
      amount: "$2,400",
    },
  ],
  paymentLinks: [
    {
      id: "1",
      name: "Agency retainers",
      payments: "18 payments",
      volume: "$24,500",
    },
    {
      id: "2",
      name: "Project checkout",
      payments: "12 payments",
      volume: "$15,420",
    },
    {
      id: "3",
      name: "Digital products",
      payments: "9 payments",
      volume: "$9,000",
    },
  ],
};

function parseAmount(raw: string | null | undefined): number {
  if (raw == null || raw === "") return 0;
  const n = Number(String(raw).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function formatAssetAmount(amount: number, currency: string): string {
  const rounded =
    currency === "XLM"
      ? amount.toLocaleString(undefined, {
          maximumFractionDigits: 7,
        })
      : amount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  if (currency === "XLM") return `${rounded} XLM`;
  if (currency === "EURC") return `€${rounded}`;
  return `$${rounded}`;
}

function shortAddress(value: string): string {
  const v = value.trim();
  if (v.length <= 12) return v || "—";
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

function initialsFrom(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function statusFromLink(
  link: PaymentLinkListItem,
): "Settled" | "Processing" | "Failed" {
  const status = getPaymentLinkStatus(link);
  if (status === "paid") return "Settled";
  if (status === "expired") return "Failed";
  return "Processing";
}

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function rangeStartMs(range: "7d" | "30d" | "90d"): number {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

export async function loadLiveOverviewStats(input: {
  businessId: string;
  walletAddress: string;
  profile: BusinessProfile;
  dateRange?: "7d" | "30d" | "90d";
}): Promise<OverviewStats> {
  const dateRange = input.dateRange ?? "7d";
  const since = rangeStartMs(dateRange);
  const todayStart = startOfTodayMs();

  let spendableXlm = 0;
  try {
    const viewKeys = await deriveViewingKey(input.walletAddress);
    const spendKeys = await deriveSpendKey(input.walletAddress);
    if (viewKeys.ok && spendKeys.ok) {
      await fullScan(
        input.walletAddress,
        viewKeys.keys.viewSecret,
        spendKeys.keys.spendSecret,
      );
      const bal = await getWalletBalance(input.walletAddress);
      spendableXlm = Number(fromBaseUnits(bal.spendableBaseUnits));
      if (!Number.isFinite(spendableXlm)) spendableXlm = 0;
    } else {
      const unspent = await listUnspentNotesV2(input.walletAddress);
      spendableXlm = unspent
        .filter((n) => !n.spent && n.leafIndex != null)
        .reduce((s, n) => s + Number(fromBaseUnits(n.amountBaseUnits)), 0);
    }
  } catch {
    spendableXlm = 0;
  }

  const listed = await listPaymentLinks(input.businessId);
  const links = listed.ok ? listed.links : [];

  const paid = links.filter((l) => getPaymentLinkStatus(l) === "paid");
  const pending = links.filter((l) => getPaymentLinkStatus(l) === "pending");
  const expired = links.filter((l) => getPaymentLinkStatus(l) === "expired");

  const paidInRange = paid.filter((l) => {
    const t = new Date(l.paidAt ?? l.createdAt).getTime();
    return Number.isFinite(t) && t >= since;
  });

  const pendingVolume = pending.reduce(
    (s, l) => s + parseAmount(l.amount),
    0,
  );
  const collectedVolume = paidInRange.reduce(
    (s, l) => s + parseAmount(l.amount),
    0,
  );
  const collectingToday = pending.filter((l) => {
    const t = new Date(l.createdAt).getTime();
    return Number.isFinite(t) && t >= todayStart;
  }).length;

  const currencyTotals = new Map<string, number>();
  for (const link of [...paid, ...pending]) {
    const cur = (link.currency || "Other").toUpperCase();
    currencyTotals.set(
      cur,
      (currencyTotals.get(cur) ?? 0) + parseAmount(link.amount),
    );
  }
  const mixTotal = [...currencyTotals.values()].reduce((a, b) => a + b, 0);
  const mix: OverviewMixSlice[] =
    mixTotal > 0
      ? [...currencyTotals.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([label, value]) => ({
            label,
            pct: Math.round((value / mixTotal) * 100),
            color: MIX_COLORS[label] ?? MIX_COLORS.Other,
          }))
      : [
          { label: "USDC", pct: 0, color: MIX_COLORS.USDC },
          { label: "XLM", pct: 0, color: MIX_COLORS.XLM },
          { label: "Other", pct: 0, color: MIX_COLORS.Other },
        ];
  // Fix rounding drift on last slice
  if (mix.length > 0 && mixTotal > 0) {
    const sum = mix.reduce((s, m) => s + m.pct, 0);
    mix[0] = { ...mix[0], pct: Math.max(0, mix[0].pct + (100 - sum)) };
  }

  const created = links.length;
  const initiated = paid.length + pending.length;
  const completed = paid.length;
  const funnelBase = Math.max(created, 1);
  const funnel: OverviewFunnelStep[] = [
    {
      label: "Links created",
      value: created,
      pct: 100,
    },
    {
      label: "Payment initiated",
      value: initiated,
      pct: Math.round((initiated / funnelBase) * 100),
    },
    {
      label: "Payment completed",
      value: completed,
      pct: Math.round((completed / funnelBase) * 100),
    },
  ];
  const completionPct =
    created === 0
      ? "—"
      : `${((completed / created) * 100).toFixed(1)}%`;

  const attention: OverviewAttention[] = [];
  if (expired.length > 0) {
    attention.push({
      id: "expired",
      tone: "danger",
      title: `${expired.length} payment${expired.length === 1 ? "" : "s"} expired`,
      detail: "Create a new link or follow up with payers",
    });
  }
  if (pending.length > 0) {
    attention.push({
      id: "pending",
      tone: "warn",
      title: `${pending.length} payment${pending.length === 1 ? "" : "s"} processing`,
      detail: "Awaiting payer confirmation",
    });
  }

  const recentPayments: OverviewPaymentRow[] = [...links]
    .sort((a, b) => {
      const ta = new Date(a.paidAt ?? a.createdAt).getTime();
      const tb = new Date(b.paidAt ?? b.createdAt).getTime();
      return tb - ta;
    })
    .slice(0, 6)
    .map((link) => {
      const payer = link.clientName?.trim() || "Open link";
      const purpose = link.purpose?.trim() || "Untitled link";
      return {
        id: link.id,
        payer,
        handle: shortAddress(link.id),
        initials: initialsFrom(payer),
        purpose,
        status: statusFromLink(link),
        amount: formatAssetAmount(parseAmount(link.amount), link.currency),
      };
    });

  const paymentLinks: OverviewLinkRow[] = [...links]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)
    .map((link) => ({
      id: link.id,
      name: link.purpose?.trim() || "Untitled link",
      payments:
        getPaymentLinkStatus(link) === "paid"
          ? "Paid"
          : getPaymentLinkStatus(link) === "expired"
            ? "Expired"
            : "Collecting",
      volume: formatAssetAmount(parseAmount(link.amount), link.currency),
    }));

  const destination =
    input.profile.receiveAddress?.trim() || input.walletAddress;

  const primaryCurrency =
    paidInRange[0]?.currency ||
    pending[0]?.currency ||
    paid[0]?.currency ||
    "XLM";

  const paidNewest = [...paid].sort((a, b) => {
    const ta = new Date(a.paidAt ?? a.createdAt).getTime();
    const tb = new Date(b.paidAt ?? b.createdAt).getTime();
    return tb - ta;
  });

  return {
    availableBalance: `${spendableXlm.toLocaleString(undefined, {
      maximumFractionDigits: 7,
    })} XLM`,
    pendingVolume: formatAssetAmount(pendingVolume, primaryCurrency),
    pendingCount: pending.length,
    successfulPayments: String(paid.length),
    successRate: "99%",
    activeLinks: String(pending.length),
    collectingToday,
    collected: formatAssetAmount(collectedVolume, primaryCurrency),
    collectedDelta: paidInRange.length > 0 ? "This period" : "No activity",
    nextPayout: `${spendableXlm.toLocaleString(undefined, {
      maximumFractionDigits: 7,
    })} XLM`,
    nextPayoutStatus: spendableXlm > 0 ? "Ready" : "Empty",
    nextPayoutHint:
      spendableXlm > 0
        ? "Withdraw anytime from Treasury"
        : "No shielded notes ready yet",
    lastPayout:
      paidNewest.length > 0
        ? `${formatAssetAmount(
            parseAmount(paidNewest[0].amount),
            paidNewest[0].currency,
          )} · settled`
        : "—",
    destination: shortAddress(destination),
    schedule: "On demand",
    mix,
    funnel,
    completionPct,
    attention,
    recentPayments,
    paymentLinks,
  };
}
