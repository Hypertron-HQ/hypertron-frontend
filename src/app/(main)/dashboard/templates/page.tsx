"use client";

import Image from "next/image";
import { ArrowRight, Building2, Landmark, Rocket, Users } from "lucide-react";
import templateIllustration from "@/assets/template.png";
import { useHubPageMeta } from "@/components/dashboard/workspace-hub/hub-page-meta-context";
import { hubNavBreadcrumbs } from "@/lib/hub-nav-routes";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboardingUi } from "@/components/onboarding";
import { cn } from "@/utils";

const STARTER_TEMPLATES = [
  {
    id: "dao",
    name: "DAO",
    icon: Users,
    description: "Governance, treasury, and contributor workflows for decentralized organizations.",
    tags: ["Governance", "Treasury", "Voting"],
    accent: "from-violet-500/15 to-purple-500/5",
  },
  {
    id: "web3-startup",
    name: "Web3 Startup",
    icon: Rocket,
    description: "Payments, compliance, and ops for early-stage crypto teams shipping fast.",
    tags: ["Payments", "Compliance", "Payroll"],
    accent: "from-blue-500/15 to-sky-500/5",
  },
  {
    id: "agency",
    name: "Agency",
    icon: Building2,
    description: "Client onboarding, escrow milestones, and contributor management for agencies.",
    tags: ["Clients", "Escrow", "Onboarding"],
    accent: "from-amber-500/15 to-orange-500/5",
  },
  {
    id: "foundation",
    name: "Foundation",
    icon: Landmark,
    description: "Grant disbursements, reporting, and regulatory tracking for foundations.",
    tags: ["Grants", "Reporting", "Regulations"],
    accent: "from-emerald-500/15 to-teal-500/5",
  },
] as const;

export default function HubTemplatesPage() {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const { openOnboardingQuiz } = useOnboardingUi();

  useHubPageMeta({
    breadcrumbs: hubNavBreadcrumbs("Templates"),
    title: "Templates",
    subtitle: "Pre-built workspace layouts tailored for Web3 companies.",
  });

  return (
    <div className="flex w-full flex-col gap-8">
      <Card className="workspace-hub-action-card--peach relative overflow-hidden rounded-2xl border shadow-none">
        <Image
          src={templateIllustration}
          alt=""
          width={320}
          height={320}
          className="pointer-events-none absolute bottom-0 right-0 z-0 h-[280px] w-[280px] translate-x-[20%] translate-y-[25%] object-contain opacity-80"
        />
        <CardContent className="relative z-10 p-6 sm:p-7">
          <Badge className={cn("border-0 px-2 py-0.5 text-[10px] font-semibold", t.actionBadge)}>
            Template library
          </Badge>
          <h2 className={cn("mt-3 text-lg font-semibold", t.actionTitle)}>
            Start with a proven layout
          </h2>
          <p className={cn("mt-1.5 max-w-lg text-sm leading-relaxed", t.actionBody)}>
            Pick a template to spin up a workspace with the right modules pre-configured — treasury,
            compliance, payments, and more.
          </p>
        </CardContent>
      </Card>

      <section>
        <div className="mb-4">
          <h2 className={cn("text-base font-semibold", t.pageHeading)}>Browse templates</h2>
          <p className={cn("mt-0.5 text-sm", t.pageSubheading)}>
            Each template includes dashboards, workflows, and compliance modules.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {STARTER_TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <Card
                key={template.id}
                className={cn(
                  "overflow-hidden rounded-2xl border shadow-none transition-colors hover:border-blue-300/60",
                  t.card
                )}
              >
                <div
                  className={cn(
                    "border-b px-5 py-4",
                    t.cardDivider,
                    t.dark ? `bg-gradient-to-br ${template.accent}` : `bg-gradient-to-br ${template.accent}`
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-base font-semibold", t.cardTitle)}>{template.name}</p>
                      <p className={cn("mt-1 text-sm leading-relaxed", t.cardMeta)}>
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex flex-wrap gap-1.5">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "rounded-md border px-2 py-0.5 text-[10px] font-medium",
                          t.actionTag
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button
                    type="button"
                    onClick={openOnboardingQuiz}
                    className={cn(
                      "h-10 w-full rounded-xl text-sm font-semibold shadow-none",
                      t.openCta
                    )}
                  >
                    Use template
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
