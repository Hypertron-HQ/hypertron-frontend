"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils";

function HubSkeletonCard({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-ui-border/60 bg-white/60", className)}>
      {children}
    </div>
  );
}

export function HubWorkspaceCardSkeleton() {
  return (
    <HubSkeletonCard>
      <div className="border-b border-ui-border/50 px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
      <div className="border-b border-ui-border/50 px-4 py-3.5">
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className="space-y-2 border-b border-ui-border/50 px-5 py-3.5">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex justify-between gap-3">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="p-4 pt-3">
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </HubSkeletonCard>
  );
}

export function HubWorkspacesContentSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="grid gap-5 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <HubSkeletonCard key={i} className="min-h-[240px] p-7">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-3 h-4 w-full max-w-sm" />
            <Skeleton className="mt-2 h-4 w-3/4 max-w-xs" />
            <Skeleton className="mt-auto h-11 w-40 rounded-lg" />
          </HubSkeletonCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[140px] rounded-lg" />
          <Skeleton className="h-9 w-[72px] rounded-lg" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <HubWorkspaceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function HubTemplatesContentSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8">
      <HubSkeletonCard className="min-h-[160px] p-6 sm:p-7">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="mt-4 h-5 w-56" />
        <Skeleton className="mt-2 h-4 w-full max-w-lg" />
        <Skeleton className="mt-2 h-4 w-4/5 max-w-md" />
      </HubSkeletonCard>

      <section>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <HubSkeletonCard key={i}>
              <div className="border-b border-ui-border/50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap gap-1.5">
                  {[0, 1, 2].map((j) => (
                    <Skeleton key={j} className="h-5 w-16 rounded-md" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </HubSkeletonCard>
          ))}
        </div>
      </section>
    </div>
  );
}

export function HubBillingContentSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8">
      <HubSkeletonCard className="px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-8 w-24" />
            <Skeleton className="ml-auto h-3 w-28" />
          </div>
        </div>
      </HubSkeletonCard>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <HubSkeletonCard key={i} className="p-5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="mt-3 h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-full" />
              <div className="mt-4 space-y-2 border-t border-ui-border/50 pt-4">
                {[0, 1, 2].map((j) => (
                  <Skeleton key={j} className="h-3 w-full" />
                ))}
              </div>
            </HubSkeletonCard>
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <HubSkeletonCard className="p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-3 w-36" />
          <Skeleton className="mt-4 h-20 w-full rounded-xl" />
        </HubSkeletonCard>
        <HubSkeletonCard>
          <div className="border-b border-ui-border/50 px-5 py-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-b border-ui-border/40 px-5 py-3.5 last:border-b-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </HubSkeletonCard>
      </div>
    </div>
  );
}

export function HubSettingsContentSkeleton() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 lg:flex-row lg:gap-8">
      <div className="flex shrink-0 flex-row gap-1 lg:w-44 lg:flex-col">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-xl lg:w-full" />
        ))}
      </div>
      <HubSkeletonCard className="min-w-0 flex-1 p-5 sm:p-6">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="mt-2 h-3 w-56" />
        <div className="mt-5 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </HubSkeletonCard>
    </div>
  );
}

export function HubSupportContentSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <HubSkeletonCard key={i} className="p-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="mt-3 h-4 w-24" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-3 h-3 w-20" />
          </HubSkeletonCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <HubSkeletonCard className="lg:col-span-3">
          <div className="border-b border-ui-border/50 px-5 py-4">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-2 h-3 w-52" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 border-b border-ui-border/40 px-5 py-3.5 last:border-b-0">
              <Skeleton className="h-4 w-full max-w-xs" />
              <Skeleton className="h-4 w-4 shrink-0" />
            </div>
          ))}
        </HubSkeletonCard>

        <HubSkeletonCard className="lg:col-span-2 p-5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-2 h-3 w-48" />
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-[120px] w-full rounded-lg" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </HubSkeletonCard>
      </div>
    </div>
  );
}

export function HubSidebarSkeleton() {
  return (
    <aside className="workspace-hub-sidebar flex h-screen w-[220px] shrink-0 flex-col rounded-tl-[28px] border-r border-ui-border/80">
      <div className="px-4 pb-3 pt-5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="px-4 pb-5">
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
      <nav className="flex flex-1 flex-col gap-2 px-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </nav>
      <div className="space-y-3 px-4 pb-5 pt-2">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </aside>
  );
}

export function HubChromeHeaderSkeleton() {
  return (
    <>
      <div className="shrink-0 px-8 py-3">
        <Skeleton className="h-4 w-48" />
      </div>
      <header className="flex items-start justify-between gap-4 px-8 pb-3 pt-5">
        <div className="space-y-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3 w-72" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </header>
    </>
  );
}

export function WorkspacePageShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-transparent">
      <HubSidebarSkeleton />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
        <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-3 lg:px-6">
          <Skeleton className="h-4 w-56" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4 lg:px-6">
          <WorkspaceGenericContentSkeleton />
        </div>
      </div>
    </div>
  );
}

function SkeletonPanel({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-slate-200/90 bg-white", className)}>
      {children}
    </div>
  );
}

export function WorkspacePageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-xl" />
    </div>
  );
}

export function WorkspaceGenericContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <WorkspacePageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <SkeletonPanel key={i} className="h-32 p-5" />
        ))}
      </div>
      <SkeletonPanel className="h-64 p-5" />
    </div>
  );
}

export function WorkspaceOverviewContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonPanel key={i} className="h-36 p-4" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <SkeletonPanel className="h-72 lg:col-span-5 p-5" />
        <SkeletonPanel className="h-72 lg:col-span-4 p-5" />
        <SkeletonPanel className="h-72 lg:col-span-3 p-5" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <SkeletonPanel key={i} className="h-52 p-5" />
        ))}
      </div>
    </div>
  );
}

export function WorkspaceTreasuryContentSkeleton({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {showHeader ? <WorkspacePageHeaderSkeleton /> : null}
      <WorkspaceTreasuryBodySkeleton />
    </div>
  );
}

export function WorkspaceTreasuryBodySkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonPanel key={i} className="p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-24" />
            <Skeleton className="mt-2 h-3 w-28" />
          </SkeletonPanel>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <SkeletonPanel className="lg:col-span-2 p-5">
          <Skeleton className="h-5 w-32" />
          <div className="mt-5 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
            <Skeleton className="mt-2 h-11 w-full rounded-xl" />
          </div>
        </SkeletonPanel>
        <div className="space-y-4">
          <SkeletonPanel className="p-5">
            <Skeleton className="h-4 w-28" />
            <div className="mt-4 space-y-2">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </SkeletonPanel>
          <SkeletonPanel className="h-36 p-5" />
        </div>
      </div>
      <SkeletonPanel className="p-5">
        <Skeleton className="h-4 w-40" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </SkeletonPanel>
    </>
  );
}

export function WorkspacePaymentsContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <SkeletonPanel className="min-h-[420px] p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-64" />
          <div className="mt-6 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
        </SkeletonPanel>
        <div className="space-y-4">
          <SkeletonPanel className="p-5">
            <Skeleton className="h-4 w-28" />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="mt-3 h-12 w-full rounded-lg" />
            ))}
          </SkeletonPanel>
          <SkeletonPanel className="h-40 p-5" />
        </div>
      </div>
    </div>
  );
}

