"use client";

import { ArrowRight, Shield, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AppSurface,
  EmptyState,
  PanelShell,
  SectionLabel,
  StatusBadge,
} from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import type { BusinessProfile } from "@/lib/business";
import { businessToWorkspace } from "@/lib/business";

function shorten(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function HubWorkspaces({
  profile,
  walletAddress,
}: {
  profile: BusinessProfile;
  walletAddress: string;
}) {
  const router = useRouter();
  const workspace = businessToWorkspace(profile, walletAddress);
  const privateReady = Boolean(
    profile.viewPub?.trim() && profile.spendPub?.trim(),
  );

  return (
    <PanelShell
      eyebrow="Account"
      title="Workspace"
      subtitle="Continue into your Freighter-linked business on Stellar."
    >
      <AppSurface className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-navy font-display text-base font-semibold text-white">
              {workspace.initial}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-display text-lg font-semibold tracking-tight text-foreground">
                {workspace.name}
              </h2>
              <p className="mt-0.5 dash-mono text-xs text-muted-foreground">
                {shorten(walletAddress)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="h-10 gap-1.5"
            onClick={() => router.push(`/dashboard/w/${workspace.id}`)}
          >
            Open workspace
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/50 px-4 py-4">
            <SectionLabel>Settlement</SectionLabel>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge tone={privateReady ? "shielded" : "neutral"}>
                <Shield className="size-3" />
                {privateReady ? "Private ready" : "Transparent only"}
              </StatusBadge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {privateReady
                ? "Viewing and spend public keys are published. You can create private payment links."
                : "Enable private settlement in workspace settings before creating shielded links."}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 px-4 py-4">
            <SectionLabel>Wallet</SectionLabel>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Wallet className="size-4 text-muted-foreground" />
              Freighter connected
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Collect payments, scan notes in Treasury, and withdraw when ready.
            </p>
          </div>
        </div>
      </AppSurface>

      {!privateReady ? (
        <EmptyState
          title="Set up private settlement when you need it"
          description="Public payment links work today. Private settlement is optional and stays on testnet until you enable keys in the workspace."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/w/${workspace.id}?tab=settings`)
              }
            >
              Open workspace settings
            </Button>
          }
        />
      ) : null}
    </PanelShell>
  );
}
