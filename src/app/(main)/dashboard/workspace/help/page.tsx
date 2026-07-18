"use client";

import Link from "next/link";
import { ChevronDown, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import {
  WorkspacePageShell,
  workspaceHubBreadcrumbs,
} from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils";

const WORKSPACE_FAQS = [
  {
    q: "How do I invite a team member to this workspace?",
    a: "Go to Employee Management from the sidebar and add members by email or wallet address. Assign roles to control access.",
  },
  {
    q: "Where are my saved compliance templates?",
    a: "Open My Templates under Operations or visit Reports in the workspace sidebar to view templates saved from Compliance Maker.",
  },
  {
    q: "How do I configure workspace widgets?",
    a: "Open Workspace Settings to choose which feature modules appear in your sidebar.",
  },
];

export default function WorkspaceHelpPage() {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <WorkspacePageShell
      breadcrumbs={workspaceHubBreadcrumbs("Help")}
      connectMessage="Connect your wallet to view workspace help."
    >
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h2 className={cn("text-xl font-semibold tracking-tight", t.pageHeading)}>
            Workspace help
          </h2>
          <p className={cn("mt-1 text-sm", t.pageSubheading)}>
            Answers for this workspace. For account billing or platform issues, visit{" "}
            <Link href="/dashboard/support" className="font-medium text-blue-600 hover:underline">
              Hypertron Support
            </Link>
            .
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className={cn("rounded-2xl border shadow-none", t.card)}>
            <CardContent className="flex items-start gap-3 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className={cn("text-sm font-semibold", t.cardTitle)}>Workspace chat</p>
                <p className={cn("mt-0.5 text-xs", t.cardMeta)}>Ask your team admin for access.</p>
              </div>
            </CardContent>
          </Card>
          <Card className={cn("rounded-2xl border shadow-none", t.card)}>
            <CardContent className="flex items-start gap-3 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Mail className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className={cn("text-sm font-semibold", t.cardTitle)}>Admin contact</p>
                <p className={cn("mt-0.5 text-xs", t.cardMeta)}>Reach your workspace owner directly.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={cn("overflow-hidden rounded-2xl border shadow-none", t.card)}>
          <div className={cn("flex items-center gap-3 border-b px-5 py-4", t.cardDivider)}>
            <LifeBuoy className={cn("h-5 w-5", t.cardMeta)} strokeWidth={1.75} />
            <div>
              <p className={cn("text-sm font-semibold", t.cardTitle)}>Common questions</p>
              <p className={cn("text-xs", t.cardMeta)}>Help specific to this workspace</p>
            </div>
          </div>
          <div className={cn("divide-y", t.cardDivider)}>
            {WORKSPACE_FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
                  >
                    <span className={cn("text-sm font-medium", t.cardTitle)}>{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        t.cardMuted,
                        open && "rotate-180"
                      )}
                    />
                  </button>
                  {open ? (
                    <p className={cn("px-5 pb-4 text-sm leading-relaxed", t.cardMeta)}>{faq.a}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <Button variant="ghost" asChild className={cn("w-fit rounded-xl shadow-none", t.outlineBtn)}>
          <Link href="/dashboard/support">Go to Hypertron Support</Link>
        </Button>
      </div>
    </WorkspacePageShell>
  );
}
