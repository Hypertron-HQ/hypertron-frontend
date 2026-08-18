import type { Workspace } from "@/mockdata";

/** Demo workspace used by `/sandbox` — no backend, no wallet. */
export const SANDBOX_WORKSPACE: Workspace = {
  id: "sandbox",
  name: "Hypertron",
  initial: "H",
  logoUrl: null,
  members: 4,
  tier: "Growth",
  role: "Owner",
  lastAccessed: "Just now",
  pulse: [
    { value: "$42,680", label: "Collected", warn: false },
    { value: "$6,240", label: "Pending", warn: false },
    { value: "$48,920", label: "Settled", warn: false },
    { value: "GCJV…OKJT", label: "Wallet", warn: false },
  ],
  latest: {
    highlight: "Ready",
    steps: ["Connect wallet", "Create payment link", "Share checkout"],
  },
  directory: {
    openTasks: "3",
    pendingApprovals: "1",
    complianceAlerts: "0",
  },
};

export const SANDBOX_WALLET = "GCJVGXEEWF0EXAMPLEDEMOADDRESSOKJT";

export const SANDBOX_PAYMENT_LINKS = [
  {
    id: "lnk_agency",
    purpose: "Agency retainers",
    amount: "24500",
    currency: "USDC",
    customer: "Design partners",
    status: "paid" as const,
    createdAt: "Aug 12, 2026",
    payments: "18 payments",
    volume: "$24,500",
  },
  {
    id: "lnk_project",
    purpose: "Project checkout",
    amount: "15420",
    currency: "USDC",
    customer: "Orbit Partners",
    status: "pending" as const,
    createdAt: "Aug 14, 2026",
    payments: "12 payments",
    volume: "$15,420",
  },
  {
    id: "lnk_digital",
    purpose: "Digital products",
    amount: "9000",
    currency: "USDC",
    customer: "—",
    status: "paid" as const,
    createdAt: "Aug 10, 2026",
    payments: "9 payments",
    volume: "$9,000",
  },
];

export const SANDBOX_NOTES = [
  {
    id: "0x5a0bcda6…",
    amount: "11",
    origin: "Received",
    leaf: 13,
    status: "ready" as const,
  },
  {
    id: "0x91c4ef12…",
    amount: "18",
    origin: "Collect",
    leaf: 14,
    status: "ready" as const,
  },
  {
    id: "0x2bb81a90…",
    amount: "18",
    origin: "Received",
    leaf: 15,
    status: "ready" as const,
  },
];

export const SANDBOX_VIEW_PUB =
  "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0";
export const SANDBOX_SPEND_PUB =
  "f0e1d2c3b4a5968778695a4b3c2d1e0f9876543210fedcba9876543210fedcba";
