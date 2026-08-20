import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { getDeveloperApiBaseUrl } from "@/lib/developer-api";

export type DocsNavChild = { href: string; label: string };

export type DocsNavItem = {
  href: string;
  label: string;
  children: readonly DocsNavChild[];
};

export type DocsNavSection = {
  label: string;
  items: readonly DocsNavItem[];
};

export const DOCS_NAV: readonly DocsNavSection[] = [
  {
    label: "Start here",
    items: [
      {
        href: "/docs",
        label: "What Hypertron is",
        children: [
          { href: "#overview", label: "Overview" },
          { href: "#layers", label: "Three layers" },
        ],
      },
    ],
  },
  {
    label: "Protocol",
    items: [
      {
        href: "/docs/protocol",
        label: "Privacy protocol",
        children: [
          { href: "#status", label: "Deployment status" },
          { href: "#what", label: "What this is" },
          { href: "#crypto", label: "Cryptographic backend" },
          { href: "#notes", label: "Notes and keys" },
          { href: "#view", label: "Spend vs view" },
          { href: "#tree", label: "Commitment tree" },
          { href: "#circuits", label: "Circuits" },
          { href: "#transfer-n", label: "TransferN" },
          { href: "#vk", label: "VK IDs and testnet" },
          { href: "#indexer", label: "Indexer and DA" },
          { href: "#roadmap", label: "Production hardening" },
        ],
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        href: "/docs/platform",
        label: "Workspace",
        children: [
          { href: "#overview", label: "What the platform is" },
          { href: "#workspace", label: "Surfaces" },
          { href: "#accept", label: "Accept" },
          { href: "#treasury", label: "Treasury" },
          { href: "#disclose", label: "Disclose" },
          { href: "#trust", label: "What it is not" },
        ],
      },
    ],
  },
  {
    label: "API",
    items: [
      {
        href: "/docs/api",
        label: "Payments API",
        children: [
          { href: "#overview", label: "What the API is" },
          { href: "#auth", label: "Authentication" },
          { href: "#quickstart", label: "Quickstart" },
          { href: "#lifecycle", label: "Payment lifecycle" },
          { href: "#webhooks", label: "Webhooks" },
          { href: "#environments", label: "Environments" },
        ],
      },
    ],
  },
];

export type DocsTocItem = { href: string; label: string };

function pageToc(pathname: string): readonly DocsNavChild[] {
  for (const section of DOCS_NAV) {
    for (const item of section.items) {
      if (isActive(pathname, item.href)) return item.children;
    }
  }
  return [];
}

function LogoMark() {
  return (
    <span aria-hidden className="grid grid-cols-2 gap-[2px]">
      <span className="size-1.5 bg-current" />
      <span className="size-1.5 bg-current" />
      <span className="size-1.5 bg-current" />
      <span className="size-1.5 bg-current" />
    </span>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/docs") return pathname === "/docs";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DocsShell({
  pathname,
  toc,
  children,
}: {
  pathname: string;
  toc?: readonly DocsTocItem[];
  children: ReactNode;
}) {
  const apiBase = getDeveloperApiBaseUrl();
  const headings = toc ?? pageToc(pathname);

  return (
    <div className="surface-light min-h-svh bg-[#f6f8fb] text-[#172033]">
      <header className="sticky top-0 z-50 border-b border-[#dfe5ed] bg-[#f6f8fb]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-display text-[14px] font-medium tracking-[0.14em] text-[#111827] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              <LogoMark />
              Hypertron
            </Link>
            <span className="h-5 w-px bg-[#d7dee8]" aria-hidden />
            <Link href="/docs" className="text-sm font-medium text-[#667085]">
              Docs
            </Link>
          </div>

          <nav className="flex items-center gap-5">
            <a
              href={`${apiBase}/docs`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 text-xs font-medium text-[#667085] transition-colors hover:text-[#101828] sm:inline-flex"
            >
              API reference
              <ArrowUpRight className="size-3.5" />
            </a>
            <Link
              href="/developers"
              className="inline-flex h-9 items-center gap-2 bg-[#101828] px-4 text-[11px] font-semibold tracking-[0.12em] text-white uppercase transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Developer console
              <ArrowRight className="size-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,840px)_220px]">
        <aside className="hidden border-r border-[#e1e6ee] lg:block">
          <div className="sticky top-16 h-[calc(100svh-4rem)] overflow-y-auto px-7 py-10">
            <p className="mb-8 flex items-center gap-2 text-xs font-semibold text-[#344054]">
              <BookOpen className="size-4 text-blue-600" />
              Documentation
            </p>
            <nav className="space-y-8" aria-label="Documentation">
              {DOCS_NAV.map((section) => (
                <div key={section.label}>
                  <p className="mb-3 text-[10px] font-semibold tracking-[0.16em] text-[#98a2b3] uppercase">
                    {section.label}
                  </p>
                  <div className="space-y-3">
                    {section.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <div key={item.href}>
                          <Link
                            href={item.href}
                            className={`block border-l py-1.5 pl-3 text-[13px] transition-colors ${
                              active
                                ? "border-blue-600 font-medium text-[#101828]"
                                : "border-transparent text-[#344054] hover:border-blue-500 hover:text-[#101828]"
                            }`}
                          >
                            {item.label}
                          </Link>
                          <div className="mt-0.5 space-y-0.5 border-l border-[#e8edf3] pl-3">
                            {item.children.map((child) => (
                              <Link
                                key={`${item.href}${child.href}`}
                                href={`${item.href}${child.href}`}
                                className={`block py-1 pl-3 text-[12px] leading-4 transition-colors ${
                                  active
                                    ? "text-[#667085] hover:text-blue-600"
                                    : "text-[#98a2b3] hover:text-[#344054]"
                                }`}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-10 border-t border-[#e1e6ee] pt-6">
              <a
                href="https://github.com/Hypertron-HQ/hypertron-contracts"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#667085] hover:text-[#101828]"
              >
                Contracts on GitHub
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-14">
          <div className="mb-10 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {DOCS_NAV.flatMap((section) =>
              section.items.flatMap((item) => [
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 border px-3 py-2 text-xs ${
                    isActive(pathname, item.href)
                      ? "border-[#101828] bg-white text-[#101828]"
                      : "border-[#d8dee8] bg-white text-[#667085]"
                  }`}
                >
                  {item.label}
                </Link>,
                ...(isActive(pathname, item.href)
                  ? item.children.map((child) => (
                      <a
                        key={`${item.href}${child.href}`}
                        href={child.href}
                        className="shrink-0 border border-[#e8edf3] bg-[#fbfcfe] px-3 py-2 text-xs text-[#667085]"
                      >
                        {child.label}
                      </a>
                    ))
                  : []),
              ]),
            )}
          </div>
          {children}
          <footer className="mt-20 flex flex-col gap-4 border-t border-[#dfe5ed] py-8 text-xs text-[#98a2b3] sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Hypertron Labs</span>
            <div className="flex gap-5">
              <Link href="/">Home</Link>
              <Link href="/docs/protocol">Protocol</Link>
              <Link href="/developers">Developer console</Link>
            </div>
          </footer>
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-16 px-7 py-10">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#98a2b3] uppercase">
              On this page
            </p>
            <nav className="mt-4 space-y-2.5 text-xs text-[#7b8493]">
              {headings.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block transition-colors hover:text-blue-600"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.18em] text-blue-600 uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.02] font-medium tracking-[-0.04em] text-[#101828]">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#667085] sm:text-base sm:leading-7">
        {copy}
      </p>
    </div>
  );
}

export function SpecTable({
  columns,
  rows,
}: {
  columns: readonly string[];
  rows: readonly (readonly string[])[];
}) {
  return (
    <div className="mt-8 overflow-x-auto border border-[#dfe5ed] bg-white">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead className="border-b border-[#e5e9f0] bg-[#f8fafc] text-[10px] font-semibold tracking-[0.12em] text-[#98a2b3] uppercase">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 font-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[#eef1f6] last:border-0">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3.5 align-top leading-5 ${
                    j === 0
                      ? "font-mono text-[11px] text-[#101828]"
                      : "text-[#667085]"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CodeBlock({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <div className="mt-8 min-w-0 overflow-hidden bg-[#0b1020] text-white">
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-4">
        <span className="font-mono text-[10px] tracking-[0.12em] text-white/45 uppercase">
          {label}
        </span>
      </div>
      <pre className="overflow-x-auto p-5 text-[12px] leading-6 text-[#d7e2f4]">
        <code>{children}</code>
      </pre>
    </div>
  );
}
