import { FreighterSignupDialog } from "@/components/auth/freighter-signup-dialog";
import { Button } from "@/components/ui/button";
import { BOOK_DEMO } from "./constants";

const links = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#start", label: "Get started" },
] as const;

export function LandingNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-line bg-black/40 px-4 backdrop-blur-xl sm:px-6">
        <a
          href="#home"
          className="font-display text-base font-medium tracking-tight text-fog"
        >
          Hypertron
        </a>

        <nav className="hidden items-center gap-7 text-sm text-mist md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-fog"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="glass"
            size="sm"
            className="hidden h-9 px-4 sm:inline-flex"
            asChild
          >
            <a href={BOOK_DEMO} target="_blank" rel="noopener noreferrer">
              Book a Demo
            </a>
          </Button>
          <FreighterSignupDialog />
        </div>
      </div>
    </header>
  );
}
