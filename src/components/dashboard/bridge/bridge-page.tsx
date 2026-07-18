"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  History,
  Info,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { avalanche, avalancheFuji, mainnet, sepolia } from "wagmi/chains";
import type { EIP1193Provider } from "viem";
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { useFreighter } from "@/hooks/useFreighter";
import {
  BRIDGE_NETWORKS,
  USDC_ASSET_META,
  bridgeNetworkById,
  formatBridgeAddress,
} from "@/lib/bridge/bridge-networks";
import {
  appendBridgeHistory,
  formatBridgeTimeAgo,
  readBridgeHistory,
  type StoredBridgeRecord,
} from "@/lib/bridge/bridge-history";
import {
  getCctpNetworkMode,
  isEvmBridgeChain,
  type BridgeChainId,
} from "@/lib/bridge/cctp-config";
import {
  executeUsdcBridge,
  type BridgeProgressEvent,
} from "@/lib/bridge/execute-usdc-bridge";
import { cn } from "@/utils";

type BridgeStatus = StoredBridgeRecord["status"];

function useBridgeStyles(theme: "light" | "dark") {
  const t = hubThemeClasses(theme);
  return useMemo(
    () => ({
      t,
      panel: cn(
        "rounded-2xl border p-5",
        t.dark ? "border-white/10 bg-white/[0.02]" : "border-slate-200/90 bg-white shadow-sm"
      ),
      kpiCard: cn(
        "flex flex-col gap-2 rounded-2xl border p-3",
        t.dark ? "border-white/10 bg-white/[0.02]" : "border-slate-200/90 bg-white shadow-sm"
      ),
      iconTile: cn(
        "flex h-7 w-7 items-center justify-center rounded-lg",
        t.dark ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-700"
      ),
      stepBadge: cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        t.dark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"
      ),
      label: cn("text-xs font-medium", t.dark ? "text-white/50" : "text-slate-500"),
      sectionTitle: cn("text-sm font-semibold", t.dark ? "text-white" : "text-slate-900"),
      muted: cn("text-xs", t.dark ? "text-white/40" : "text-slate-500"),
      input: cn(
        "h-10 rounded-lg border text-sm",
        t.dark
          ? "border-white/10 bg-white/5 text-white placeholder:text-white/30"
          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
      ),
      selectTrigger: cn(
        "h-10 rounded-lg border text-sm",
        t.dark ? "border-white/10 bg-white/5 text-white" : "border-slate-200 bg-white text-slate-900"
      ),
      selectContent: cn("rounded-lg border shadow-md", t.selectContent),
      selectItem: t.selectItem,
    }),
    [t, theme]
  );
}

const TOKEN_SIZES = {
  sm: "h-5 w-5 text-[9px]",
  md: "h-6 w-6 text-[10px]",
  lg: "h-7 w-7 text-[11px]",
} as const;

function TokenIcon({
  icon,
  short,
  color,
  label,
  size = "md",
}: {
  icon?: string;
  short: string;
  color: string;
  label?: string;
  size?: keyof typeof TOKEN_SIZES;
}) {
  const [failed, setFailed] = useState(false);
  const dimension = TOKEN_SIZES[size];

  if (icon && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt={label ?? short}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-full object-cover ring-1 ring-black/5", dimension)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        dimension
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {short}
    </span>
  );
}

function NetworkIcon({ network, size = "md" }: { network: { short: string; color: string; icon?: string; label?: string }; size?: keyof typeof TOKEN_SIZES }) {
  return <TokenIcon icon={network.icon} short={network.short} color={network.color} label={network.label} size={size} />;
}

function BridgeStatusBadge({ status, dark }: { status: BridgeStatus; dark: boolean }) {
  if (status === "completed") {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", dark ? "border border-emerald-500/25 bg-emerald-500/15 text-emerald-400" : "border border-emerald-200 bg-emerald-50 text-emerald-700")}>
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", dark ? "border border-blue-500/25 bg-blue-500/15 text-blue-300" : "border border-blue-200 bg-blue-50 text-blue-700")}>
        <Clock className="h-3 w-3" />
        In Progress
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", dark ? "border border-red-500/25 bg-red-500/15 text-red-400" : "border border-red-200 bg-red-50 text-red-700")}>
      <XCircle className="h-3 w-3" />
      Failed
    </span>
  );
}

function evmChainIdForBridge(chain: BridgeChainId, mode: ReturnType<typeof getCctpNetworkMode>): number | null {
  if (chain === "ethereum") return mode === "mainnet" ? mainnet.id : sepolia.id;
  if (chain === "avalanche") return mode === "mainnet" ? avalanche.id : avalancheFuji.id;
  return null;
}

export function BridgePageContent() {
  const { theme } = useDashboardTheme();
  const s = useBridgeStyles(theme);
  const dark = theme === "dark";
  const mode = getCctpNetworkMode();

  const { publicKey: stellarAddress, connect: connectStellar, truncatedAddress: stellarTruncated } = useFreighter();
  const { address: evmAddress, connector, chainId, isConnected: evmConnected } = useAccount();
  const { connect, connectors, isPending: evmConnecting } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { publicKey: solanaPublicKey, wallet: solanaWalletState, connect: connectSolana, connecting: solanaConnecting } = useWallet();
  const solanaWallet = (solanaWalletState?.adapter as SignerWalletAdapter | undefined) ?? null;

  const [sourceChain, setSourceChain] = useState<BridgeChainId>("ethereum");
  const [destChain, setDestChain] = useState<BridgeChainId>("stellar");
  const [amount, setAmount] = useState("100");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<StoredBridgeRecord[]>([]);
  const [historyFilter, setHistoryFilter] = useState<"all" | "completed" | "in_progress">("all");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<BridgeProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(readBridgeHistory());
  }, []);

  const sendAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const receive = sendAmount;

  const filteredRecent = useMemo(
    () => (historyFilter === "all" ? history : history.filter((b) => b.status === historyFilter)),
    [history, historyFilter]
  );

  const needsStellarSource = sourceChain === "stellar";
  const needsStellarDest = destChain === "stellar";
  const needsEvmSource = isEvmBridgeChain(sourceChain);
  const needsEvmDest = isEvmBridgeChain(destChain);
  const needsSolanaSource = sourceChain === "solana";
  const needsSolanaDest = destChain === "solana";

  const copyAddress = useCallback((address: string) => {
    void navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, []);

  async function ensureEvmChain(chain: BridgeChainId) {
    const targetId = evmChainIdForBridge(chain, mode);
    if (!targetId || !switchChainAsync || chainId === targetId) return;
    await switchChainAsync({ chainId: targetId });
  }

  async function handleConnectEvm() {
    const injected = connectors[0];
    if (!injected) throw new Error("No EVM wallet found. Install MetaMask or another Web3 wallet.");
    connect({ connector: injected });
  }

  async function handleBridge() {
    setError(null);
    setProgress(null);
    setRunning(true);

    try {
      if (sourceChain === destChain) throw new Error("Choose different source and destination networks.");
      if (sendAmount <= 0) throw new Error("Enter a valid USDC amount.");

      if (needsStellarSource && !stellarAddress) throw new Error("Connect your Stellar wallet (Freighter).");
      if (needsStellarDest && !stellarAddress) throw new Error("Connect your Stellar wallet to receive USDC.");
      if (needsEvmSource && !evmConnected) throw new Error("Connect your EVM wallet for the source network.");
      if (needsEvmDest && !evmConnected) throw new Error("Connect your EVM wallet to receive USDC on destination.");
      if (needsSolanaSource && !solanaPublicKey) throw new Error("Connect your Solana wallet (Phantom).");
      if (needsSolanaDest && !solanaPublicKey) throw new Error("Connect your Solana wallet to receive USDC.");

      if (needsEvmSource) await ensureEvmChain(sourceChain);
      if (needsEvmDest) await ensureEvmChain(destChain);

      let evmProvider: EIP1193Provider | null = null;
      if ((needsEvmSource || needsEvmDest) && connector) {
        evmProvider = (await connector.getProvider()) as EIP1193Provider;
      }

      const recordId = crypto.randomUUID();
      const result = await executeUsdcBridge({
        fromChain: sourceChain,
        toChain: destChain,
        amount,
        stellarAddress,
        evmAddress: evmAddress ?? null,
        evmProvider,
        solanaAddress: solanaPublicKey?.toBase58() ?? null,
        solanaWallet,
        destinationStellarAddress: stellarAddress ?? undefined,
        destinationEvmAddress: evmAddress ?? undefined,
        destinationSolanaAddress: solanaPublicKey?.toBase58(),
        onProgress: (event) => setProgress(event),
      });

      const stored: StoredBridgeRecord = {
        id: recordId,
        amount: sendAmount.toFixed(2),
        asset: "USDC",
        fromChain: sourceChain,
        toChain: destChain,
        status: "completed",
        createdAt: new Date().toISOString(),
        steps: result.steps,
      };
      setHistory(appendBridgeHistory(stored));
      setProgress({ step: "complete", message: "Bridge completed successfully." });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Bridge failed.";
      setError(message);
      setHistory(
        appendBridgeHistory({
          id: crypto.randomUUID(),
          amount: sendAmount.toFixed(2),
          asset: "USDC",
          fromChain: sourceChain,
          toChain: destChain,
          status: "failed",
          createdAt: new Date().toISOString(),
          steps: progress ? [progress] : [],
        })
      );
    } finally {
      setRunning(false);
    }
  }

  const kpis = [
    { label: "Protocol", value: "Circle CCTP", sub: mode === "mainnet" ? "Mainnet" : "Testnet", icon: "networks" as const },
    { label: "Asset", value: "USDC", sub: "Native burn / mint", icon: "volume" as const },
    { label: "Speed", value: "Fast", sub: "Typically 1–5 minutes", icon: "time" as const },
    { label: "Security", value: "Attested", sub: "Circle Iris attestations", icon: "success" as const },
  ];

  const KPI_ICONS: Record<(typeof kpis)[number]["icon"], LucideIcon> = {
    volume: ArrowLeftRight,
    time: Clock,
    networks: Globe,
    success: ShieldCheck,
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className={cn("text-xl font-semibold tracking-tight sm:text-2xl", s.t.pageHeading)}>Bridge</h1>
          <p className={cn("mt-1 max-w-2xl text-sm", s.t.pageSubheading)}>
            Move native USDC between Stellar, Ethereum, Avalanche, and Solana using Circle CCTP ({mode === "mainnet" ? "mainnet" : "testnet"}).
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = KPI_ICONS[kpi.icon];
          return (
            <div key={kpi.label} className={s.kpiCard}>
              <div className="flex items-center gap-2">
                <span className={s.iconTile}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <span className={cn("text-[11px] font-medium", s.t.pageSubheading)}>{kpi.label}</span>
              </div>
              <p className={cn("text-lg font-semibold tracking-tight", s.t.pageHeading)}>{kpi.value}</p>
              <p className={cn("text-[10px] leading-snug", s.t.pageSubheading)}>{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className={s.panel}>
          <div className="flex flex-col gap-6">
            <section className="grid gap-x-6 gap-y-4 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="flex items-start gap-3">
                <span className={s.stepBadge}>1</span>
                <div>
                  <p className={s.sectionTitle}>From</p>
                  <p className={cn("mt-0.5", s.muted)}>Source network and wallet.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className={s.label}>Network</Label>
                  <Select value={sourceChain} onValueChange={(v) => setSourceChain(v as BridgeChainId)}>
                    <SelectTrigger className={s.selectTrigger}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={s.selectContent}>
                      {BRIDGE_NETWORKS.map((network) => (
                        <SelectItem key={network.id} value={network.id} className={cn(s.selectItem, "pl-9")}>
                          <span className="flex items-center gap-2">
                            <NetworkIcon network={network} size="sm" />
                            {network.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className={s.label}>Asset</Label>
                  <div className={cn(s.selectTrigger, "flex items-center gap-2 px-3")}>
                    <TokenIcon icon={USDC_ASSET_META.icon} short="U" color={USDC_ASSET_META.color} label="USDC" size="sm" />
                    <span className="text-sm">USDC</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 sm:col-span-2 dark:border-white/10 dark:bg-white/[0.03]">
                  {needsStellarSource ? (
                    stellarAddress ? (
                      <span className="inline-flex items-center gap-2 text-sm font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Stellar {stellarTruncated}
                      </span>
                    ) : (
                      <Button type="button" size="sm" className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700" onClick={() => void connectStellar()}>
                        Connect Freighter
                      </Button>
                    )
                  ) : needsSolanaSource ? (
                    solanaPublicKey ? (
                      <span className="inline-flex items-center gap-2 text-sm font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {formatBridgeAddress(solanaPublicKey.toBase58())}
                      </span>
                    ) : (
                      <Button type="button" size="sm" className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700" disabled={solanaConnecting} onClick={() => void connectSolana()}>
                        Connect Phantom
                      </Button>
                    )
                  ) : evmConnected && evmAddress ? (
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {formatBridgeAddress(evmAddress)}
                    </span>
                  ) : (
                    <Button type="button" size="sm" className="h-9 rounded-lg bg-blue-600 hover:bg-blue-700" disabled={evmConnecting} onClick={() => void handleConnectEvm()}>
                      Connect EVM Wallet
                    </Button>
                  )}
                  <div className="text-right">
                    <p className={s.label}>You send</p>
                    <p className={cn("text-sm font-semibold tabular-nums", s.t.pageHeading)}>{sendAmount.toFixed(2)} USDC</p>
                  </div>
                </div>
              </div>
            </section>

            <div className={cn("h-px", dark ? "bg-white/10" : "bg-slate-100")} />

            <section className="grid gap-x-6 gap-y-4 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="flex items-start gap-3">
                <span className={s.stepBadge}>2</span>
                <div>
                  <p className={s.sectionTitle}>To</p>
                  <p className={cn("mt-0.5", s.muted)}>Destination network and recipient.</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className={s.label}>Network</Label>
                  <Select value={destChain} onValueChange={(v) => setDestChain(v as BridgeChainId)}>
                    <SelectTrigger className={s.selectTrigger}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={s.selectContent}>
                      {BRIDGE_NETWORKS.filter((n) => n.id !== sourceChain).map((network) => (
                        <SelectItem key={network.id} value={network.id} className={cn(s.selectItem, "pl-9")}>
                          <span className="flex items-center gap-2">
                            <NetworkIcon network={network} size="sm" />
                            {network.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className={s.label}>Asset</Label>
                  <div className={cn(s.selectTrigger, "flex items-center gap-2 px-3")}>
                    <TokenIcon icon={USDC_ASSET_META.icon} short="U" color={USDC_ASSET_META.color} size="sm" />
                    <span className="text-sm">USDC</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2 dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="min-w-0 space-y-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Recipient
                    </span>
                    <div className="flex items-center gap-2">
                      <code className={cn("font-mono text-sm font-medium", s.t.pageHeading)}>
                        {needsStellarDest
                          ? stellarTruncated ?? "Connect Stellar"
                          : needsSolanaDest
                            ? solanaPublicKey
                              ? formatBridgeAddress(solanaPublicKey.toBase58())
                              : "Connect Solana"
                            : evmAddress
                              ? formatBridgeAddress(evmAddress)
                              : "Connect EVM"}
                      </code>
                      {(needsStellarDest && stellarAddress) || (needsSolanaDest && solanaPublicKey) || (needsEvmDest && evmAddress) ? (
                        <button
                          type="button"
                          onClick={() =>
                            copyAddress(
                              needsStellarDest
                                ? stellarAddress!
                                : needsSolanaDest
                                  ? solanaPublicKey!.toBase58()
                                  : evmAddress!
                            )
                          }
                          className={cn("rounded-md p-1 transition-colors", dark ? "text-white/40 hover:bg-white/10 hover:text-white/70" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600")}
                          aria-label="Copy address"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      {copied ? <span className={cn("text-[11px] text-emerald-600", dark && "text-emerald-400")}>Copied</span> : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={s.label}>You receive (est.)</p>
                    <p className={cn("text-sm font-semibold tabular-nums", s.t.pageHeading)}>{receive.toFixed(2)} USDC</p>
                  </div>
                </div>
              </div>
            </section>

            <div className={cn("h-px", dark ? "bg-white/10" : "bg-slate-100")} />

            <section className="grid gap-x-6 gap-y-4 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="flex items-start gap-3">
                <span className={s.stepBadge}>3</span>
                <div>
                  <p className={s.sectionTitle}>Amount</p>
                  <p className={cn("mt-0.5", s.muted)}>Native USDC via Circle CCTP.</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className={s.label}>Amount</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  className={cn(s.input, "h-12 text-lg font-semibold tabular-nums")}
                  inputMode="decimal"
                />
              </div>
            </section>

            {(progress || error) && (
              <div className={cn("rounded-xl border px-4 py-3 text-sm", error ? "border-red-300 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200" : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100")}>
                {error ?? progress?.message}
              </div>
            )}

            <Button
              type="button"
              disabled={running}
              className="h-11 w-full rounded-xl bg-blue-600 text-base font-semibold hover:bg-blue-700"
              onClick={() => void handleBridge()}
            >
              {running ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Bridging USDC…
                </span>
              ) : (
                "Bridge USDC"
              )}
            </Button>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <div className={s.panel}>
            <div className="mb-3">
              <h2 className={cn("text-sm font-semibold", s.t.pageHeading)}>Supported Networks</h2>
              <p className={cn("mt-0.5 text-xs", s.t.pageSubheading)}>USDC via Circle CCTP v2</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {BRIDGE_NETWORKS.map((network) => (
                <NetworkIcon key={network.id} network={network} />
              ))}
            </div>
          </div>

          <div className={s.panel}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className={cn("text-sm font-semibold", s.t.pageHeading)}>Recent Bridges</h2>
                <p className={cn("mt-0.5 text-xs", s.t.pageSubheading)}>Stored locally in this browser</p>
              </div>
              <History className={cn("h-4 w-4 shrink-0", s.muted)} strokeWidth={1.75} />
            </div>
            <nav className={cn("mb-4 flex gap-5 border-b", dark ? "border-white/10" : "border-slate-200")}>
              {([
                { id: "all", label: "All" },
                { id: "completed", label: "Completed" },
                { id: "in_progress", label: "In Progress" },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHistoryFilter(tab.id)}
                  className={cn(
                    "relative pb-2.5 text-sm font-medium transition-colors",
                    historyFilter === tab.id ? (dark ? "text-blue-400" : "text-blue-600") : cn(s.t.pageSubheading, "hover:text-slate-700", dark && "hover:text-slate-200")
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            {filteredRecent.length === 0 ? (
              <p className={cn("py-6 text-center text-xs", s.t.pageSubheading)}>No bridges yet.</p>
            ) : (
              <ul className="space-y-4">
                {filteredRecent.map((item) => {
                  const from = bridgeNetworkById(item.fromChain);
                  const to = bridgeNetworkById(item.toChain);
                  return (
                    <li key={item.id} className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", dark ? "bg-white/10" : "bg-slate-100")}>
                          <NetworkIcon network={from} size="md" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn("truncate text-sm font-medium", s.t.pageHeading)}>
                            {from.label} → {to.label}
                          </p>
                          <p className={cn("whitespace-nowrap text-[11px]", s.t.pageSubheading)}>{formatBridgeTimeAgo(item.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <p className={cn("text-sm font-medium tabular-nums", s.t.pageHeading)}>
                          {item.amount} {item.asset}
                        </p>
                        <BridgeStatusBadge status={item.status} dark={dark} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={s.panel}>
            <h2 className={cn("mb-2 text-sm font-semibold", s.t.pageHeading)}>Need Help?</h2>
            <p className={cn("mb-3 text-xs leading-relaxed", s.t.pageSubheading)}>
              Transfers use Circle CCTP (burn on source, mint on destination). Stellar inbound routes use the CCTP Forwarder contract.
            </p>
            <Button asChild variant="outline" className={cn("h-9 w-full gap-2 rounded-lg", s.t.outlineBtn)}>
              <Link href="https://developers.circle.com/cctp" target="_blank" rel="noopener noreferrer">
                Circle CCTP Docs
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
