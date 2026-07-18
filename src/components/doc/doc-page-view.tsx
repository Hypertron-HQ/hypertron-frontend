"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/utils";
import {
  DOC_NAV,
  getAdjacentDocs,
  getDocHeadings,
  type DocBlock,
  type DocPage,
} from "@/lib/doc/doc-pages";
import { homeLaunchPath } from "@/lib/launch-auth";
import { DocFeaturePreview } from "./doc-feature-preview";
import { DocShellLayout, onDocSectionClick } from "./doc-shell-layout";

function DocBlockView({ block }: { block: DocBlock }) {
  if (block.type === "p") {
    return <p className="text-[15px] leading-7 text-white/70">{block.text}</p>;
  }
  if (block.type === "h2") {
    return (
      <h2 id={block.id} className="scroll-mt-20 pt-8 text-lg font-semibold tracking-tight text-white">
        {block.title}
      </h2>
    );
  }
  if (block.type === "ul") {
    return (
      <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-white/70">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.type === "ol") {
    return (
      <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-7 text-white/70">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    );
  }
  if (block.type === "external-link") {
    return (
      <Link
        href={block.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-blue-400 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-blue-300"
      >
        {block.label} →
      </Link>
    );
  }
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        block.variant === "tip"
          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-100/90"
          : "border-blue-500/20 bg-blue-500/5 text-blue-100/90"
      )}
    >
      {block.text}
    </div>
  );
}

function DocSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-8">
      {DOC_NAV.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = item.slug === "introduction" ? "/doc" : `/doc/${item.slug}`;
              const active = pathname === href;
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    className={cn(
                      "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-white/[0.08] font-medium text-white"
                        : "text-white/55 hover:bg-white/[0.04] hover:text-white/85"
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
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

function DocOnThisPage({ page }: { page: DocPage }) {
  const headings = getDocHeadings(page);
  if (headings.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
        On this page
      </p>
      <ul className="space-y-2 border-l border-white/[0.08] pl-3">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={onDocSectionClick(h.id)}
              className="block text-xs leading-snug text-white/45 transition-colors hover:text-white/80"
            >
              {h.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocPageView({ page }: { page: DocPage }) {
  const { prev, next } = getAdjacentDocs(page.slug);
  const headings = getDocHeadings(page);

  return (
    <DocShellLayout left={<DocSidebar />} right={headings.length > 0 ? <DocOnThisPage page={page} /> : undefined}>
      <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/50">
        Documentation
      </p>

      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
        {page.category}
      </p>
      <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight text-white md:text-4xl">
        {page.title}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-white/55">{page.subtitle}</p>

      {page.quickLinks && page.quickLinks.length > 0 ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {page.quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.14] hover:bg-white/[0.04]"
            >
              <p className="text-sm font-semibold text-white group-hover:text-blue-300">
                {link.title} →
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/45">{link.description}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {page.slug !== "introduction" ? <DocFeaturePreview slug={page.slug} /> : null}

      <div className="mt-10 space-y-4">
        {page.blocks.map((block, i) => (
          <DocBlockView key={`${block.type}-${i}`} block={block} />
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
        {prev ? (
          <Link
            href={prev.slug === "introduction" ? "/doc" : `/doc/${prev.slug}`}
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
            href={`/doc/${next.slug}`}
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

export function DocMobileNav() {
  const pathname = usePathname();
  const flat = DOC_NAV.flatMap((g) => g.items);

  return (
    <div className="sticky top-[72px] z-20 border-b border-white/[0.06] bg-black/50 px-6 py-3 backdrop-blur-md md:px-10 lg:hidden">
      <select
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        value={flat.find((i) => pathname === (i.slug === "introduction" ? "/doc" : `/doc/${i.slug}`))?.slug ?? "introduction"}
        onChange={(e) => {
          const slug = e.target.value;
          window.location.href = slug === "introduction" ? "/doc" : `/doc/${slug}`;
        }}
      >
        {flat.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.title}
          </option>
        ))}
      </select>
    </div>
  );
}
