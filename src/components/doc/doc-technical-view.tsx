"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/utils";
import { homeLaunchPath } from "@/lib/launch-auth";
import {
  TECHNICAL_DOC,
  TECHNICAL_PAGES,
  getAdjacentTechnical,
  getTechnicalPage,
  technicalHref,
  type TechnicalPage,
} from "@/lib/doc/doc-technical-pages";
import { TechnicalPageContent } from "./doc-technical-content";
import { DocShellLayout, onDocSectionClick } from "./doc-shell-layout";

function TechnicalSidebar({ activeSlug }: { activeSlug: string }) {
  return (
    <nav className="space-y-6">
      <div>
        <Link
          href="/doc"
          className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white/85"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          User guide
        </Link>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
          Architecture
        </p>
        <ul className="space-y-0.5">
          {TECHNICAL_PAGES.map((page) => {
            const href = technicalHref(page.slug);
            const active = page.slug === activeSlug;
            return (
              <li key={page.slug}>
                <Link
                  href={href}
                  className={cn(
                    "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-white/[0.08] font-medium text-white"
                      : "text-white/55 hover:bg-white/[0.04] hover:text-white/85",
                  )}
                >
                  {page.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-t border-white/[0.06] pt-6">
        <Link
          href={homeLaunchPath("/dashboard")}
          className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          Launch app →
        </Link>
      </div>
    </nav>
  );
}

function TechnicalOnThisPage({ page }: { page: TechnicalPage }) {
  if (!page.onThisPage?.length) return null;

  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
        On this page
      </p>
      <ul className="space-y-2 border-l border-white/[0.08] pl-3">
        {page.onThisPage.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              onClick={onDocSectionClick(item.id)}
              className="block text-xs leading-snug text-white/45 transition-colors hover:text-white/80"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocTechnicalView({ slug }: { slug: string }) {
  const page = getTechnicalPage(slug)!;
  const { prev, next } = getAdjacentTechnical(slug);
  const rightRail = page.onThisPage?.length ? <TechnicalOnThisPage page={page} /> : undefined;

  useEffect(() => {
    document.querySelector<HTMLElement>(".doc-shell-main")?.scrollTo(0, 0);
  }, [slug]);

  return (
    <DocShellLayout left={<TechnicalSidebar activeSlug={slug} />} right={rightRail}>
      <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/50">
        {TECHNICAL_DOC.badge}
      </p>

      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
        {page.eyebrow}
      </p>
      <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight text-white md:text-4xl">
        {page.title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-white/55">{page.subtitle}</p>

      <div className="mt-10">
        <TechnicalPageContent slug={slug} />
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
        {prev ? (
          <Link
            href={technicalHref(prev.slug)}
            className="group inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={technicalHref(next.slug)}
            className="group inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"
          >
            {next.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </DocShellLayout>
  );
}

export function DocTechnicalMobileNav() {
  const pathname = usePathname();
  const onTechnical = pathname.startsWith("/doc/technical");

  if (!onTechnical) return null;

  const activeSlug =
    TECHNICAL_PAGES.find((p) => pathname === technicalHref(p.slug))?.slug ?? "overview";

  return (
    <div className="sticky top-[72px] z-20 shrink-0 border-b border-white/[0.06] bg-black/50 px-6 py-3 backdrop-blur-md md:px-10 lg:hidden">
      <select
        className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        value={activeSlug}
        onChange={(e) => {
          window.location.href = technicalHref(e.target.value);
        }}
      >
        {TECHNICAL_PAGES.map((page) => (
          <option key={page.slug} value={page.slug}>
            {page.title}
          </option>
        ))}
      </select>
      <Link
        href="/doc"
        className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white/80"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to user guide
      </Link>
    </div>
  );
}
