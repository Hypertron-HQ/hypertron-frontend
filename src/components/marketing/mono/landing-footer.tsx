import Link from "next/link";
import Image from "next/image";
import { cn } from "@/utils";

const DEMO_HREF = "https://calendly.com/kararsweta/30min";
const TWITTER_HREF = "https://x.com/hypertron_HQ";
const DOCS_HREF = "/doc";

const PRODUCT = [
  { label: "Solution", href: "/#solution" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Mission", href: "/#mission" },
  { label: "Pricing", href: "/pricing" },
];

const RESOURCES = [
  { label: "Docs", href: DOCS_HREF },
  { label: "Blog", href: "/resources/blog" },
  { label: "Changelog", href: "/changelog" },
  { label: "Help center", href: "/resources/help" },
];

const COMPANY = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Enterprise", href: "/enterprise" },
  { label: "Contact", href: "mailto:kararsweta@gmail.com" },
];

function Column({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
        {title}
      </p>
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              {...(it.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="text-sm text-white/65 transition-colors hover:text-white"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "relative border-t border-white/10 bg-black px-6 pb-10 pt-16 backdrop-blur-xl md:px-28 md:pt-24",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)] md:gap-8">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Hypertron"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-bold tracking-tight text-foreground">Hypertron</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Unified B2B onboarding and private settlement. One programmable rail on Stellar — onboarding, compliance, and capital flow.
            </p>
            <Link
              href={DEMO_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Book a demo
            </Link>
          </div>
          <Column title="Product" items={PRODUCT} />
          <Column title="Resources" items={RESOURCES} />
          <Column title="Company" items={COMPANY} />
        </div>

        {/* Wordmark */}
        <div className="relative mt-16 select-none overflow-hidden">
          <p
            aria-hidden
            className="bg-gradient-to-b from-white/[0.12] to-white/[0.03] bg-clip-text text-center text-[18vw] font-bold leading-none tracking-tighter text-transparent md:text-[14vw]"
          >
            HYPERTRON
          </p>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} Hypertron Labs. Built on Stellar.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/45">
            <Link
              href={TWITTER_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Twitter / X
            </Link>
            <span className="h-3 w-px bg-white/10" />
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
