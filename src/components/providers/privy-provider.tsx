"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { getPrivyAppId, isPrivyConfigured } from "@/lib/privy-config";

type Props = {
  children: React.ReactNode;
};

/**
 * Wraps the app with Privy when NEXT_PUBLIC_PRIVY_APP_ID is set.
 * Email/social login; Stellar wallet is provisioned via Privy embedded wallets.
 */
export function HypertronPrivyProvider({ children }: Props) {
  const appId = getPrivyAppId();

  if (!isPrivyConfigured() || !appId) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#3b82f6",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "off" },
          solana: { createOnLogin: "off" },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
