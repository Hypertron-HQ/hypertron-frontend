import { ArrowUpRight } from "lucide-react";
import { FreighterSignupDialog } from "@/components/auth/freighter-signup-dialog";

const links = [
  { href: "#product", label: "Product" },
  { href: "/developers", label: "Developers" },
  { href: "#protocol", label: "Protocol" },
  { href: "/developers", label: "Docs" },
  { href: "#about", label: "About" },
] as const;

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

export function LandingNavbar() {
  return (
    <header className="landing-nav fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <a
          href="#home"
          className="landing-nav-ink inline-flex items-center gap-2.5 font-display text-[15px] font-medium tracking-[0.14em] uppercase"
        >
          <LogoMark />
          Hypertron
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="landing-nav-ink text-[11px] font-medium tracking-[0.18em] uppercase transition-opacity hover:opacity-60"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="landing-launch">
          <FreighterSignupDialog triggerLabel="Launch app" />
          <ArrowUpRight
            aria-hidden
            className="landing-launch-arrow pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2"
          />
        </div>
      </div>
    </header>
  );
}
