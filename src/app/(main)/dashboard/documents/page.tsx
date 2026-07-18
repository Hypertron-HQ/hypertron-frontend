"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  FileText,
  Database,
  Wrench,
  ExternalLink,
  Pencil,
  Loader2,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/layout/dashboard-page-header";
import {
  WorkspacePageShell,
  workspaceHubBreadcrumbs,
} from "@/components/dashboard/workspace-hub/workspace-page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFreighter } from "@/hooks/useFreighter";
import { loadSavedTemplates, type SavedTemplate } from "@/lib/my-templates-storage";
import { useOnboardingUi } from "@/components/onboarding";
import { cn } from "@/utils";

function formatSavedAt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function MyTemplatesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { publicKey } = useFreighter();
  const { isOnboardingComplete, openOnboardingQuiz } = useOnboardingUi();
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [, startTransition] = useTransition();
  /** Tracks which row action is navigating: `open:id` | `edit:id` */
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSavedTemplates(publicKey)
      .then((list) => {
        if (!cancelled) setTemplates(list);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/dashboard/workspace")) {
      setPendingNav(null);
      return;
    }
    if (/^\/dashboard\/documents\/.+/.test(pathname)) {
      setPendingNav(null);
    }
  }, [pathname]);

  const hasTemplates = templates.length > 0;

  const runNav = useCallback(
    (key: string, href: string) => {
      setPendingNav(key);
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  const openTemplate = (id: string) => {
    runNav(`open:${id}`, `/dashboard/documents/${encodeURIComponent(id)}`);
  };

  const editTemplate = (id: string) => {
    runNav(
      `edit:${id}`,
      `/dashboard/workspace?template=${encodeURIComponent(id)}`
    );
  };

  const goCreateTemplate = () => {
    if (!isOnboardingComplete) {
      openOnboardingQuiz();
      return;
    }
    startTransition(() => {
      router.push("/dashboard/workspace");
    });
  };

  return (
    <WorkspacePageShell
      breadcrumbs={workspaceHubBreadcrumbs("My Templates")}
      connectMessage="Connect your wallet to view your templates."
    >
      <div className="flex flex-col gap-8">
        <DashboardPageHeader
          variant="hub"
          eyebrow="Documents"
          title="My templates"
          description="Saved from Compliance Maker for this workspace. Open a preview or edit layouts in the workspace builder."
          end={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!!pendingNav}
              className="rounded-full border-ui-border/80 bg-white text-neutral-900 hover:bg-neutral-50"
              onClick={goCreateTemplate}
            >
              <Wrench className="mr-2 h-4 w-4" />
              Create template
            </Button>
          }
        />

        {!publicKey ? null : (
          <section className="overflow-hidden rounded-2xl border border-ui-border/80 bg-white shadow-sm">
            <div className="border-b border-ui-border/60 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                    All templates
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {hasTemplates ? `${templates.length} saved` : "Nothing saved yet"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {!hasTemplates ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ui-border/80 bg-neutral-50/80 px-6 py-16 text-center">
                  <Database className="mb-4 h-12 w-12 text-neutral-300" />
                  <p className="font-medium text-neutral-900">No templates yet</p>
                  <p className="mt-1 max-w-md text-sm text-neutral-500">
                    Run the onboarding quiz and save a bundle — it will show up here.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6 rounded-full border-ui-border/80 bg-white hover:bg-neutral-50"
                    onClick={goCreateTemplate}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Open Compliance Maker
                  </Button>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {templates.map((t) => {
                    const savedLabel = formatSavedAt(t.savedAt);
                    const isOpenPending = pendingNav === `open:${t.id}`;
                    const isEditPending = pendingNav === `edit:${t.id}`;
                    const workspaceHref = `/dashboard/workspace?template=${encodeURIComponent(t.id)}`;

                    return (
                      <li key={t.id}>
                        <div
                          className={cn(
                            "flex flex-col gap-4 rounded-2xl border border-ui-border/80 bg-neutral-50/50 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5",
                            "hover:border-blue-200/80 hover:bg-blue-50/30"
                          )}
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ui-border/60 bg-white">
                              <FileText className="h-5 w-5 text-neutral-500" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate font-medium text-neutral-900">{t.name}</p>
                                <Badge
                                  variant="secondary"
                                  className="shrink-0 rounded-full border border-ui-border/60 bg-white text-[10px] font-medium uppercase tracking-wide text-neutral-500"
                                >
                                  {t.bundleName}
                                </Badge>
                              </div>
                              <p className="text-xs text-neutral-500">
                                {savedLabel ? `Saved ${savedLabel}` : "Saved template"}
                                {t.businessName ? ` · ${t.businessName}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!!pendingNav}
                              className="rounded-full border-ui-border/80 bg-white text-neutral-900 hover:bg-neutral-50"
                              onClick={() => openTemplate(t.id)}
                              onMouseEnter={() =>
                                router.prefetch(
                                  `/dashboard/documents/${encodeURIComponent(t.id)}`
                                )
                              }
                            >
                              {isOpenPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              ) : (
                                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              {isOpenPending ? "Opening…" : "Open"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!!pendingNav}
                              className="rounded-full border-ui-border/80 bg-white text-neutral-700 hover:bg-neutral-50"
                              onClick={() => editTemplate(t.id)}
                              onMouseEnter={() => router.prefetch(workspaceHref)}
                            >
                              {isEditPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              ) : (
                                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              {isEditPending ? "Loading…" : "Edit"}
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </WorkspacePageShell>
  );
}
