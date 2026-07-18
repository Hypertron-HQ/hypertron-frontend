"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PlaceholderPageProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Feature</p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">{description}</p>
      </div>
      <Card className="rounded-2xl border-white/[0.12] bg-transparent backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <CardDescription>This feature is not built yet. Check back later.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            You can use the main Dashboard for payment links, receive address, withdraw, and secure vault.
          </p>
          <Button asChild variant="outline" size="sm" className="w-fit rounded-full border-white/15 bg-white/[0.04] hover:bg-white/[0.08]">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
