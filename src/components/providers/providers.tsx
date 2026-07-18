"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HypertronPrivyProvider } from "@/components/providers/privy-provider";
import { AppSessionProvider } from "@/components/auth/app-session-provider";
import { LoginTransitionProvider } from "@/components/auth/login-transition-provider";
import { PrivyAuthSync } from "@/components/auth/privy-auth-sync";
import { PrivyStellarWalletSync } from "@/components/auth/privy-stellar-wallet-sync";

interface Props {
  children: React.ReactNode;
}

const Providers = ({ children }: Props) => {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <AppSessionProvider>
        <HypertronPrivyProvider>
          <LoginTransitionProvider>
            <PrivyAuthSync />
            <PrivyStellarWalletSync />
            {children}
          </LoginTransitionProvider>
        </HypertronPrivyProvider>
      </AppSessionProvider>
    </QueryClientProvider>
  );
};

export default Providers;
