"use client";

import Link from "next/link";
import { ArrowLeft, Braces, ExternalLink } from "lucide-react";
import { FreighterSignupDialog } from "@/components/auth/freighter-signup-dialog";
import { RequireWalletSession } from "@/components/dashboard/require-wallet-session";
import { WorkspaceDevelopers } from "@/components/dashboard/workspace-developers";
import { shortenAddress } from "@/lib/auth";
import { getDeveloperApiBaseUrl } from "@/lib/developer-api";

export default function DevelopersPage() {
  return (
    <RequireWalletSession unauthenticated={<DeveloperEntry />}>
      {(session) => (
        <div className="min-h-svh bg-[#F4F7FB] text-slate-950">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="font-display text-base font-semibold tracking-tight"
                >
                  Hypertron
                </Link>
                <span className="h-5 w-px bg-slate-200" aria-hidden />
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                  <Braces className="size-4 text-blue-600" />
                  Payments API
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="hidden font-mono text-xs text-slate-500 sm:block">
                  {shortenAddress(session.walletAddress)}
                </span>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-slate-600 hover:text-slate-950"
                >
                  Business dashboard
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
            <WorkspaceDevelopers />
          </main>
        </div>
      )}
    </RequireWalletSession>
  );
}

function DeveloperEntry() {
  const apiBase = getDeveloperApiBaseUrl();

  return (
    <main className="relative flex min-h-svh overflow-hidden bg-void text-fog">
      <div className="landing-atmosphere pointer-events-none absolute inset-0" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <nav className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-mist transition hover:text-fog"
          >
            <ArrowLeft className="size-4" />
            Hypertron
          </Link>
          <a
            href={`${apiBase}/docs`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-mist transition hover:text-fog"
          >
            API docs
            <ExternalLink className="size-3.5" />
          </a>
        </nav>

        <section className="flex flex-1 items-center py-20">
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue/30 bg-blue/10 px-3 py-1.5 text-xs font-medium tracking-[0.14em] text-blue uppercase">
              <Braces className="size-3.5" />
              Hypertron Payments API
            </div>
            <h1 className="font-display text-[clamp(3.25rem,9vw,6.5rem)] leading-[0.92] font-medium tracking-[-0.05em]">
              Build payments
              <br />
              <span className="text-mist">into your product.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-mist sm:text-lg">
              Create test and live API keys, integrate checkout, and manage
              payment events from a dedicated developer console.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <FreighterSignupDialog
                redirectTo="/developers"
                triggerLabel="Open developer console"
                eyebrow="Developer console"
                title="Continue with Freighter"
                description="Connect your Stellar wallet and sign a one-time challenge to manage API keys."
              />
              <span className="text-xs text-haze">
                Testnet access available now
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
