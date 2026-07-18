"use client";

import { useAppSessionContext } from "@/components/auth/app-session-provider";

export type MeResponse =
  | { auth: "wallet"; walletAddress: string }
  | {
      auth: "privy";
      user: { id: string; privyId: string; email: string | null; name: string | null };
      stellarAddress?: string | null;
      privyWalletId?: string | null;
    };

export function useAppSession() {
  return useAppSessionContext();
}
