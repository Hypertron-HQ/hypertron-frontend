"use client";

import { cn } from "@/utils";
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { homeLaunchPath } from "@/lib/launch-auth";

const BOOK_DEMO = "https://calendly.com/kararsweta/30min";
const CONTACT_HREF = "https://x.com/hypertron_hq";
const DOCS_HREF = "/doc";
const SIGN_IN_HREF = homeLaunchPath("/dashboard");

const SCROLL_ENTER = 56;
const SCROLL_EXIT = 20;

function isScrollMorphRoute(pathname: string) {
  return pathname === "/" || pathname.startsWith("/doc");
}

const NAV_ITEMS: { href: string; label: string; external?: boolean }[] = [
  { href: "/#solution", label: "Product" },
  { href: "/#how-it-works", label: "How it works" },
  { href: DOCS_HREF, label: "Docs" },
  { href: CONTACT_HREF, label: "Contact", external: true },
];

const SPRING = { stiffness: 260, damping: 34, mass: 0.85 };
const REDUCED_MOTION_SPRING = { stiffness: 500, damping: 50, mass: 0.1 };

function NavLinkItem({
  href,
  label,
  external,
  linkPaddingX,
  onNavigate,
}: {
  href: string;
  label: string;
  external?: boolean;
  linkPaddingX: MotionValue<number>;
  onNavigate?: () => void;
}) {
  const className =
    "rounded-full py-1.5 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white whitespace-nowrap";

  return (
    <motion.div style={{ paddingLeft: linkPaddingX, paddingRight: linkPaddingX }}>
      {external ? (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          onClick={onNavigate}
        >
          {label}
        </Link>
      ) : (
        <Link href={href} className={className} onClick={onNavigate}>
          {label}
        </Link>
      )}
    </motion.div>
  );
}

const MotionLink = motion.create(Link);

function LandingActions({
  ctaHeight,
  ctaPaddingX,
}: {
  ctaHeight: MotionValue<number>;
  ctaPaddingX: MotionValue<number>;
}) {
  const buttonStyle = {
    height: ctaHeight,
    paddingLeft: ctaPaddingX,
    paddingRight: ctaPaddingX,
  };

  return (
    <>
      <MotionLink
        href={SIGN_IN_HREF}
        data-testid="navbar-sign-in-btn"
        style={buttonStyle}
        className="hidden shrink-0 items-center whitespace-nowrap rounded-full border border-white/20 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:inline-flex"
      >
        Sign in
      </MotionLink>
      <MotionLink
        href={BOOK_DEMO}
        target="_blank"
        rel="noopener noreferrer"
        style={buttonStyle}
        className="hidden shrink-0 items-center whitespace-nowrap rounded-full bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 sm:inline-flex"
      >
        Book a Demo
      </MotionLink>
    </>
  );
}

function MarketingActions() {
  return (
    <Link
      href={SIGN_IN_HREF}
      data-testid="navbar-sign-in-btn"
      className="hidden rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:inline-flex"
    >
      Sign in
    </Link>
  );
}

export function LandingNavbar() {
  const pathname = usePathname();
  const morphOnScroll = isScrollMorphRoute(pathname);
  const reducedMotion = useReducedMotion();

  const springConfig = useMemo(
    () => (reducedMotion ? REDUCED_MOTION_SPRING : SPRING),
    [reducedMotion],
  );

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() => !morphOnScroll);

  const progress = useSpring(morphOnScroll ? 0 : 1, springConfig);

  const outerPaddingTop = useTransform(progress, [0, 1], [20, 10]);
  const barMaxWidth = useTransform(progress, [0, 1], [1400, 920]);
  const barPaddingY = useTransform(progress, [0, 1], [12, 8]);
  const barPaddingX = useTransform(progress, [0, 1], [0, 16]);
  const barGap = useTransform(progress, [0, 1], [16, 8]);
  const barBorderRadius = useTransform(progress, [0, 1], [0, 9999]);
  const glassOpacity = useTransform(progress, [0, 1], [0, 1]);
  const navLinksGap = useTransform(progress, [0, 1], [8, 4]);
  const navLinkPaddingX = useTransform(progress, [0, 1], [14, 10]);
  const ctaHeight = useTransform(progress, [0, 1], [40, 36]);
  const ctaPaddingX = useTransform(progress, [0, 1], [16, 14]);

  useEffect(() => {
    progress.set(scrolled ? 1 : 0);
  }, [scrolled, progress]);

  useEffect(() => {
    if (!morphOnScroll) {
      setScrolled(true);
      progress.set(1);
      return;
    }

    const syncFromScroll = (y: number) => {
      setScrolled((prev) => {
        if (!prev && y > SCROLL_ENTER) return true;
        if (prev && y < SCROLL_EXIT) return false;
        return prev;
      });
    };

    // Snap immediately on route change; hysteresis applies only while scrolling.
    setScrolled(window.scrollY > SCROLL_ENTER);

    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        syncFromScroll(window.scrollY);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [morphOnScroll, pathname, progress]);

  const closeMobile = useCallback(() => setOpen(false), []);

  return (
    <motion.header
      className="fixed left-0 right-0 top-0 z-50 px-6 md:px-10"
      style={{ paddingTop: outerPaddingTop }}
    >
      <motion.div
        className="relative mx-auto flex w-full items-center"
        style={{
          maxWidth: barMaxWidth,
          paddingTop: barPaddingY,
          paddingBottom: barPaddingY,
          paddingLeft: barPaddingX,
          paddingRight: barPaddingX,
          gap: barGap,
          borderRadius: barBorderRadius,
        }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 border border-white/[0.08] bg-black/40 backdrop-blur-xl"
          style={{
            borderRadius: barBorderRadius,
            opacity: glassOpacity,
          }}
        />

        <Link
          href="/"
          className="relative z-10 flex shrink-0 items-center gap-2 text-foreground"
        >
          <Image
            src="/logo.png"
            alt="Hypertron"
            width={36}
            height={36}
            className="h-8 w-8 object-contain md:h-9 md:w-9"
          />
          <span className="text-lg font-bold tracking-tight">Hypertron</span>
        </Link>

        <motion.nav
          className="relative z-10 hidden flex-1 items-center justify-center md:flex"
          style={{ gap: navLinksGap }}
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => (
            <NavLinkItem
              key={item.label}
              href={item.href}
              label={item.label}
              external={"external" in item ? item.external : undefined}
              linkPaddingX={navLinkPaddingX}
            />
          ))}
        </motion.nav>

        <div className="relative z-10 ml-auto flex shrink-0 items-center gap-3">
          {morphOnScroll ? (
            <LandingActions ctaHeight={ctaHeight} ctaPaddingX={ctaPaddingX} />
          ) : (
            <MarketingActions />
          )}

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-foreground md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      {open ? (
        <div
          className={cn(
            "mt-3 flex flex-col gap-1 rounded-2xl border border-white/[0.08] bg-black/80 p-3 backdrop-blur-xl md:hidden",
          )}
        >
          {NAV_ITEMS.map((item) =>
            "external" in item && item.external ? (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-3 py-2.5 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white"
                onClick={closeMobile}
              >
                {item.label === "Contact" ? "Contact us" : item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-2.5 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white"
                onClick={closeMobile}
              >
                {item.label}
              </Link>
            ),
          )}
          <Link
            href={SIGN_IN_HREF}
            className="rounded-md px-3 py-2.5 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white"
            onClick={closeMobile}
          >
            Sign in
          </Link>
          {morphOnScroll ? (
            <Link
              href={BOOK_DEMO}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 rounded-full bg-foreground py-2.5 text-center text-sm font-semibold text-background"
              onClick={closeMobile}
            >
              Book a Demo
            </Link>
          ) : null}
        </div>
      ) : null}
    </motion.header>
  );
}
