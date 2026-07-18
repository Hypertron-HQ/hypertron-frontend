"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useFreighter } from "@/hooks/useFreighter";
import {
  WorkspacePageShell,
  workspaceHubBreadcrumbs,
} from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { WorkspaceTreasuryBodySkeleton } from "@/components/dashboard/workspace-hub/hub-content-skeletons";
import { WithdrawPage as WithdrawContent } from "@/components/dashboard/withdraw-page";
import { fallbackBusiness } from "@/data/fallback";
import { useMockDashboardData } from "@/components/demo/demo-mode-provider";

export default function WithdrawPage() {
  const pathname = usePathname();
  const { publicKey } = useFreighter();
  const useMock = useMockDashboardData();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [receiveAddress, setReceiveAddress] = useState<string | null>(null);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (useMock) {
      setBusinessId(fallbackBusiness.businessId);
      setReceiveAddress(fallbackBusiness.receiveAddress);
      setBusinessError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setBusinessError(null);

    fetch("/api/business/profile", { credentials: "same-origin" })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof json?.error === "string" ? json.error : `Failed to load profile (${res.status})`
          );
        }
        return json as { businessId?: string; receiveAddress?: string };
      })
      .then((data) => {
        if (cancelled) return;
        if (typeof data.businessId === "string" && data.businessId.trim()) {
          setBusinessId(data.businessId.trim());
          setReceiveAddress(
            typeof data.receiveAddress === "string" ? data.receiveAddress.trim() : null
          );
          setBusinessError(null);
          return;
        }
        setBusinessId(null);
        setBusinessError("Business profile not found.");
      })
      .catch((e) => {
        if (cancelled) return;
        setBusinessId(null);
        setBusinessError(e instanceof Error ? e.message : "Could not load business profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [publicKey, useMock]);

  return (
    <WorkspacePageShell
      breadcrumbs={workspaceHubBreadcrumbs("Withdraw", pathname)}
      connectMessage="Connect your wallet to withdraw funds."
    >
      <div className="flex flex-col gap-6">
        {loading ? (
          <WorkspaceTreasuryBodySkeleton />
        ) : businessId ? (
          <WithdrawContent
            businessId={businessId}
            walletAddress={publicKey ?? null}
            receiveAddress={receiveAddress}
          />
        ) : (
          <p className="text-sm text-destructive">{businessError ?? "Unable to load treasury."}</p>
        )}
      </div>
    </WorkspacePageShell>
  );
}
