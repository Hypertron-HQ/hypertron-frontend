"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { avalanche, avalancheFuji, mainnet, sepolia } from "wagmi/chains";
import { injected } from "@wagmi/core";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { getCctpNetworkMode } from "@/lib/bridge/cctp-config";
import { getSolanaConnection } from "@/lib/bridge/cctp-bridge-kit";

export function BridgeProviders({ children }: { children: ReactNode }) {
  const mode = getCctpNetworkMode();
  const [queryClient] = useState(() => new QueryClient());
  const solanaWallets = useMemo(() => [new PhantomWalletAdapter()], []);

  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: mode === "mainnet" ? [mainnet, avalanche] : [sepolia, avalancheFuji],
        connectors: [injected({ shimDisconnect: true })],
        transports: {
          [mainnet.id]: http(),
          [avalanche.id]: http(),
          [sepolia.id]: http(),
          [avalancheFuji.id]: http(),
        },
      }),
    [mode]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <ConnectionProvider endpoint={getSolanaConnection().rpcEndpoint}>
          <WalletProvider wallets={solanaWallets} autoConnect>
            {children}
          </WalletProvider>
        </ConnectionProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
