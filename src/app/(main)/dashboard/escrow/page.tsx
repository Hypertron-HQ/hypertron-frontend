"use client";

import { Button } from "@/components/ui/button";
import { useFreighter } from "@/hooks/useFreighter";
import { useRouter } from "next/navigation";
import { Briefcase } from "lucide-react";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { PlaceholderPage } from "@/components/dashboard/placeholder-page";

export default function EscrowProjectsPage() {
  const router = useRouter();
  const { publicKey } = useFreighter();

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-sm text-muted-foreground">Connect your wallet to open escrow-based project tools.</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <DashboardMain>
      <PlaceholderPage
        icon={Briefcase}
        title="Escrow-based project management"
        description="Tier 3 adds milestone-based escrow on Stellar for delivery and payouts. Implementation is planned; use the workspace for layouts in the meantime."
      />
    </DashboardMain>
  );
}
