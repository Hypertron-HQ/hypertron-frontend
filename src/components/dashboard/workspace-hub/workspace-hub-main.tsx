"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import plusIllustration from "@/assets/plus.png";
import templateIllustration from "@/assets/template.png";
import { usePathname, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Users,
  LayoutGrid,
  List,
  ArrowRight,
  Loader2,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MoreVertical,
  Settings,
  Archive,
  ExternalLink,
} from "lucide-react";
import { useDashboardTheme } from "@/components/dashboard/dashboard-theme-provider";
import { WorkspaceHubTopChrome } from "@/components/dashboard/workspace-hub/workspace-hub-chrome";
import { hubThemeClasses } from "@/components/dashboard/workspace-hub/workspace-hub-theme-classes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentBrandAvatar } from "@/components/global/hub-avatar";
import { activateWorkspace } from "@/lib/activate-workspace";
import type { WorkspaceCardModel } from "@/components/dashboard/workspace-hub/workspace-hub-model";
import { HubWorkspaceCardSkeleton } from "@/components/dashboard/workspace-hub/hub-content-skeletons";
import { CreateWorkspaceButton } from "@/components/dashboard/workspace-hub/use-create-workspace-nav";
import { cn } from "@/utils";

export type { WorkspaceCardModel } from "@/components/dashboard/workspace-hub/workspace-hub-model";
export {
  readCreateWorkspaceDraftLogo,
  templatesToWorkspaces,
} from "@/components/dashboard/workspace-hub/workspace-hub-model";

const ROLE_STYLES_LIGHT = {
  Owner: "bg-blue-100 text-blue-800 border-blue-200",
  Admin: "bg-sky-100 text-sky-800 border-sky-200",
  Member: "bg-slate-100 text-slate-700 border-slate-200",
} as const;

const ROLE_STYLES_DARK = {
  Owner: "bg-blue-500/20 text-blue-200 border-blue-500/30",
  Admin: "bg-sky-500/20 text-sky-200 border-sky-500/30",
  Member: "bg-white/10 text-slate-300 border-white/15",
} as const;

function WorkspaceHubCard({
  workspace: ws,
  opening,
  onOpen,
}: {
  workspace: WorkspaceCardModel;
  opening: boolean;
  onOpen: () => void;
}) {
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const roleStyles = t.dark ? ROLE_STYLES_DARK : ROLE_STYLES_LIGHT;

  return (
    <Card className={cn("overflow-hidden rounded-2xl border", t.card)}>
      <div className={cn("px-5 pb-4 pt-5", t.cardHeader)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <PaymentBrandAvatar
              businessName={ws.name}
              logoUrl={ws.logoUrl}
              seed={ws.id}
              size={44}
              className="rounded-xl ring-0"
            />
            <div className="min-w-0 flex flex-col justify-center gap-1">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className={cn("truncate text-[15px] font-semibold leading-none", t.cardTitle)}>
                  {ws.name}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0 text-[10px] font-semibold leading-5",
                    roleStyles[ws.role]
                  )}
                >
                  {ws.role}
                </Badge>
              </div>
              <p className={cn("text-xs leading-none", t.cardMeta)}>
                {ws.type} • {ws.members} members
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg outline-none focus:ring-0 focus-visible:ring-0",
                  t.menuBtn
                )}
                aria-label="Workspace options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn("z-50 min-w-[200px] rounded-xl border", t.menuContent)}
            >
              <DropdownMenuItem
                className={cn("cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", t.menuItem)}
                onSelect={() => onOpen()}
              >
                <ExternalLink className={cn("h-4 w-4", t.menuIcon)} strokeWidth={1.75} />
                Open workspace
              </DropdownMenuItem>
              <DropdownMenuItem asChild className={cn("cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", t.menuItem)}>
                <Link href="/dashboard/settings" className="flex items-center gap-2.5">
                  <Settings className={cn("h-4 w-4", t.menuIcon)} strokeWidth={1.75} />
                  Workspace settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className={cn("cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium", t.menuItem)}>
                <Link href="/dashboard/employee-management" className="flex items-center gap-2.5">
                  <Users className={cn("h-4 w-4", t.menuIcon)} strokeWidth={1.75} />
                  Manage members
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className={cn("my-1", t.menuSeparator)} />
              <DropdownMenuItem
                className={cn(
                  "cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium",
                  t.menuItem,
                  "text-red-400 focus:text-red-300 data-[highlighted]:text-red-300"
                )}
              >
                <Archive className="h-4 w-4 text-red-700" strokeWidth={1.75} />
                Archive workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-0">
        <div className={cn("border-b px-4 py-3.5", t.cardDivider)}>
          <div className={cn("grid grid-cols-3 divide-x", t.cardDivider)}>
            <p className={cn("pr-3 text-left text-lg font-bold tabular-nums leading-none", t.cardStat)}>
              {ws.openTasks}
            </p>
            <p className={cn("px-3 text-left text-lg font-bold tabular-nums leading-none", t.cardStat)}>
              {ws.pendingApprovals}
            </p>
            <p className={cn("pl-3 text-left text-lg font-bold tabular-nums leading-none", t.cardStat)}>
              {ws.complianceAlerts}
            </p>
          </div>
          <div className={cn("mt-1.5 grid grid-cols-3 divide-x", t.cardDivider)}>
            <p className={cn("pr-3 text-left text-xs", t.cardLabel)}>Open Tasks</p>
            <p className={cn("px-3 text-left text-xs", t.cardLabel)}>Pending Approvals</p>
            <p className={cn("pl-3 text-left text-xs", t.cardLabel)}>Compliance Alerts</p>
          </div>
          <div className={cn("mt-1 grid grid-cols-3 divide-x", t.cardDivider)}>
            {ws.openTasks > 0 ? (
              <p className="pr-3 text-left text-[10px] font-medium text-red-400">Needs attention</p>
            ) : (
              <p className={cn("pr-3 text-left text-[10px]", t.cardMuted)}>—</p>
            )}
            {ws.pendingApprovals > 0 ? (
              <p className="px-3 text-left text-[10px] font-medium text-amber-400">Action required</p>
            ) : (
              <p className={cn("px-3 text-left text-[10px]", t.cardMuted)}>—</p>
            )}
            {ws.complianceAlerts > 0 ? (
              <p className="pl-3 text-left text-[10px] font-medium text-red-400">
                {ws.complianceAlerts >= 3 ? "High priority" : "Medium priority"}
              </p>
            ) : (
              <p className="pl-3 text-left text-[10px] font-medium text-emerald-400">All clear</p>
            )}
          </div>
        </div>

        <div className={cn("space-y-2 border-b px-5 py-3.5 text-xs", t.cardDivider)}>
          <div className="flex items-center justify-between gap-3">
            <span className={t.cardRowLabel}>Last accessed</span>
            <span className={cn("font-medium", t.cardRowValue)}>
              {formatDistanceToNow(new Date(ws.lastAccessed), { addSuffix: true })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className={t.cardRowLabel}>Role</span>
            <span className={cn("font-semibold", t.cardRowValueStrong)}>{ws.role}</span>
          </div>
        </div>

        <div className="p-4 pt-3">
          <Button
            type="button"
            variant="ghost"
            disabled={opening}
            onClick={onOpen}
            className={cn(
              "h-11 w-full rounded-xl text-sm font-semibold shadow-none transition-colors active:scale-[0.99]",
              t.openCta
            )}
          >
            Open Workspace
            {opening ? (
              <Loader2 className="ml-1.5 h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <ArrowRight className="ml-1.5 h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type WorkspaceHubMainProps = {
  userName: string;
  workspaces: WorkspaceCardModel[];
  loading: boolean;
  /** When false, top chrome is rendered by the shared hub layout. */
  showChrome?: boolean;
};

export function WorkspaceHubMain({
  userName,
  workspaces,
  loading,
  showChrome = true,
}: WorkspaceHubMainProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useDashboardTheme();
  const t = hubThemeClasses(theme);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("recent");
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    if (pathname?.startsWith("/dashboard/overview")) {
      setOpeningId(null);
    }
  }, [pathname]);

  const filtered = useMemo(() => {
    const list = [...workspaces];
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
    });
    return list;
  }, [workspaces, sort]);

  const handleOpen = async (workspace: WorkspaceCardModel) => {
    setOpeningId(workspace.id);
    try {
      await activateWorkspace(workspace.template);
      router.push("/dashboard/overview");
    } catch {
      setOpeningId(null);
    }
  };

  const firstName = userName.split(" ")[0] || userName;

  return (
    <div
      className={cn(
        "flex flex-1 flex-col overflow-hidden bg-transparent",
        showChrome && "h-screen"
      )}
    >
      {showChrome ? (
        <WorkspaceHubTopChrome
          breadcrumbs={[
            { label: "Overview", href: "/dashboard/overview" },
            { label: "Dashboard", current: true },
          ]}
          title={`Welcome back, ${firstName}! 👋`}
          subtitle="Select a workspace to continue or create a new one."
          workspaces={workspaces}
        />
      ) : null}

      <div
        className={cn(
          "flex-1 overflow-y-auto",
          showChrome ? "px-8 pb-8 pt-4" : "pb-2 pt-2"
        )}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="workspace-hub-action-card--blue relative flex h-full flex-col overflow-hidden rounded-2xl bg-transparent shadow-none">
            <Image
              src={plusIllustration}
              alt=""
              width={420}
              height={420}
              className="pointer-events-none absolute bottom-0 right-0 z-0 h-[420px] w-[420px] translate-x-[28%] translate-y-[40%] object-contain opacity-90 drop-shadow-sm"
            />
            <CardContent className="relative z-10 flex min-h-[240px] flex-1 flex-col p-7">
              <div className="max-w-[min(70%,340px)]">
                <h2 className={cn("text-lg font-semibold", t.actionTitle)}>Create New Workspace</h2>
                <p className={cn("mt-1.5 text-sm leading-relaxed", t.actionBody)}>
                  Start fresh and set up a new workspace for your team or organization.
                </p>
              </div>
              <div className="mt-auto pt-6">
                <CreateWorkspaceButton
                  className="hub-cta h-auto w-fit rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] px-5 py-3 hover:from-[#2563eb] hover:to-[#3b82f6]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="workspace-hub-action-card--peach relative flex h-full flex-col overflow-hidden rounded-2xl bg-transparent shadow-none">
            <Image
              src={templateIllustration}
              alt=""
              width={420}
              height={420}
              className="pointer-events-none absolute bottom-0 right-0 z-0 h-[420px] w-[420px] translate-x-[28%] translate-y-[40%] object-contain opacity-90 drop-shadow-sm"
            />
            <CardContent className="relative z-10 flex min-h-[240px] flex-1 flex-col p-7">
              <div className="max-w-[min(70%,340px)]">
                <div className="flex items-start justify-between gap-3">
                  <h2 className={cn("text-lg font-semibold", t.actionTitle)}>Quick Start with Template</h2>
                  <Badge
                    className={cn(
                      "shrink-0 border-0 px-2 py-0.5 text-[10px] font-semibold",
                      t.actionBadge
                    )}
                  >
                    Coming soon
                  </Badge>
                </div>
                <p className={cn("mt-1.5 text-sm leading-relaxed", t.actionBody)}>
                  Choose from pre-built templates tailored for Web3 companies.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["DAO", "Web3 Startup", "Agency", "Foundation"].map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "rounded border px-1.5 py-0.5 text-[10px] font-medium leading-tight",
                        t.actionTag
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative z-10 mt-auto pt-6">
                <Button
                  type="button"
                  variant="ghost"
                  disabled
                  className={cn(
                    "h-auto w-fit cursor-not-allowed rounded-lg border px-5 py-3 opacity-60 shadow-none",
                    t.templateCta
                  )}
                >
                  Coming soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className={cn("text-lg font-semibold", t.pageHeading)}>Your Workspaces</h2>
            <p className={cn("text-sm", t.pageSubheading)}>Recently accessed</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger
                className={cn(
                  "h-9 w-[140px] rounded-lg border text-sm shadow-none",
                  t.selectTrigger
                )}
              >
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className={cn("rounded-lg border shadow-md", t.selectContent)}>
                <SelectItem value="recent" className={cn("rounded-md", t.selectItem)}>
                  Last Accessed
                </SelectItem>
                <SelectItem value="name" className={cn("rounded-md", t.selectItem)}>
                  Name
                </SelectItem>
              </SelectContent>
            </Select>
            <div className={cn("flex rounded-lg border p-0.5", t.viewToggle)}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-md", view === "grid" && t.viewToggleActive)}
                onClick={() => setView("grid")}
              >
                <LayoutGrid className={cn("h-4 w-4", t.viewToggleIcon)} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8 rounded-md", view === "list" && t.viewToggleActive)}
                onClick={() => setView("list")}
              >
                <List className={cn("h-4 w-4", t.viewToggleIcon)} />
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <HubWorkspaceCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className={cn("mt-6 border-dashed", t.emptyCard)}>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Building2 className={cn("h-12 w-12", t.emptyIcon)} />
              <p className={cn("mt-4 text-sm font-medium", t.emptyTitle)}>No workspaces yet</p>
              <p className={cn("mt-1 max-w-sm text-sm", t.emptyBody)}>
                Create your first workspace to start managing payments, compliance, and operations.
              </p>
              <CreateWorkspaceButton
                className="hub-cta mt-6 rounded-lg bg-blue-600 hover:bg-blue-500"
              />
            </CardContent>
          </Card>
        ) : (
          <div
            className={cn(
              "mt-6 gap-5",
              view === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3" : "flex flex-col"
            )}
          >
            {filtered.map((ws) => (
              <WorkspaceHubCard
                key={ws.id}
                workspace={ws}
                opening={openingId === ws.id}
                onOpen={() => void handleOpen(ws)}
              />
            ))}
          </div>
        )}

        {workspaces.length > 3 ? (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" className={cn("rounded-lg border", t.outlineBtn)}>
              View All Workspaces ({workspaces.length})
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
