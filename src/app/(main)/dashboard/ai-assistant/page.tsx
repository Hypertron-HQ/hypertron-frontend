"use client";

import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/layout/header";
import { DashboardMain } from "@/components/dashboard/layout/main";
import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { AiAssistantChat } from "@/components/dashboard/ai-assistant-chat";
import { Button } from "@/components/ui/button";
import { useFreighter } from "@/hooks/useFreighter";

export default function AiAssistantPage() {
  const router = useRouter();
  const { publicKey, disconnect, isConnecting } = useFreighter();

  if (!publicKey) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">Connect your wallet to view this page.</p>
        <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader fixed>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Custom AI Assistant</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitch />
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>Home</Button>
          <Button variant="ghost" size="sm" onClick={disconnect} disabled={isConnecting}>Disconnect</Button>
        </div>
      </DashboardHeader>
      <DashboardMain fixed fluid className="flex min-h-0 flex-col">
        <AiAssistantChat />
      </DashboardMain>
    </>
  );
}
