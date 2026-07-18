'use client';

import { cn } from '@/utils';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UNICORN_PROJECT_ID = 'rRzTRPRw92XqXB3CREo3';
const UNICORN_SDK_URL = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js';

function hideUnicornBadge() {
  const selectors = [
    'a[href*="unicorn.studio"]',
    '[class*="badge"]',
    '[class*="attribution"]',
    '[id*="badge"]',
    '[id*="attribution"]',
    '[data-us-badge]',
  ];
  selectors.forEach((sel) => {
    try {
      document.querySelectorAll(sel).forEach((el) => {
        const html = el as HTMLElement;
        html.style.setProperty('display', 'none', 'important');
        html.style.setProperty('visibility', 'hidden', 'important');
        html.style.setProperty('opacity', '0', 'important');
        html.style.setProperty('pointer-events', 'none', 'important');
      });
    } catch {
      // ignore
    }
  });
  document.querySelectorAll('a, span, div').forEach((el) => {
    const text = (el.textContent || '').toLowerCase();
    if (text.includes('unicorn.studio') || text.includes('made with unicorn')) {
      (el as HTMLElement).style.setProperty('display', 'none', 'important');
    }
  });
}

function initUnicorn() {
  const u = (window as unknown as { UnicornStudio?: { init: () => void } }).UnicornStudio;
  if (u?.init) {
    u.init();
  }
}

function useUnicornStudio() {
  useEffect(() => {
    hideUnicornBadge();
    const id = setInterval(hideUnicornBadge, 500);
    const t = setTimeout(() => clearInterval(id), 15000);

    const win = window as unknown as { UnicornStudio?: { init: () => void; isInitialized?: boolean } };
    if (win.UnicornStudio?.init) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUnicorn);
      } else {
        initUnicorn();
      }
    } else {
      win.UnicornStudio = { isInitialized: false, init: () => {} };
      const script = document.createElement('script');
      script.src = UNICORN_SDK_URL;
      script.onload = () => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initUnicorn);
        } else {
          initUnicorn();
        }
      };
      (document.head || document.body).appendChild(script);
    }

    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, []);
}

/** Full-viewport Unicorn Studio layer + badge-hiding gradient. Use inside a `relative` section. */
export function UnicornStudioBackground({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useUnicornStudio();

  return (
    <>
      <div
        ref={containerRef}
        data-us-project={UNICORN_PROJECT_ID}
        className={cn(
          'absolute inset-0 z-0 h-full w-full [&>canvas]:!h-full [&>canvas]:!w-full',
          className,
        )}
        style={{ width: '100%', height: '100%' }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[5] h-28"
        style={{ background: 'linear-gradient(to bottom, #000000 0%, #060B13 100%)' }}
        aria-hidden
      />
    </>
  );
}

export function HeroWithUnicorn() {
  return (
    <section className="relative h-screen min-h-screen w-full overflow-hidden bg-black">
      <UnicornStudioBackground />

      <div className="absolute inset-0 z-10 mx-auto w-full max-w-full px-4 md:max-w-screen-xl md:px-12 lg:px-20">
        <div className="pointer-events-none absolute -bottom-24 left-4 z-10 flex max-w-[42rem] flex-col items-start justify-end pb-16 pt-8 md:left-12 md:pb-24 lg:left-20 lg:pb-32">
          <p className="mb-6 text-sm tracking-wide text-white/50 md:mb-4">
            B2B onboarding & payments for Web3
          </p>
          <h1 className="mb-0 font-heading text-2xl font-semibold leading-[1.15] tracking-tight text-white sm:text-3xl md:text-4xl lg:text-6xl">
            <span className="block">The Fastest Way to</span>
            <span className="block">Onboard Clients and </span>
            <span className="block text-white/60">Get Paid in Web3</span>
          </h1>
        </div>

        <div className="pointer-events-auto absolute bottom-4 right-4 z-10 flex w-[280px] flex-col items-end gap-4 rounded-2xl border border-white/20 bg-white/10 p-5 text-right backdrop-blur-xl sm:w-[320px] md:right-12 md:w-[360px] md:p-6 lg:right-20">
          <p className="text-sm leading-relaxed text-white/50">
            Replace manual processes with automated workflows, escrow, approvals, and real-time tracking.
          </p>
          <Button
            asChild
            className="w-full border-0 bg-white/90 font-medium text-black shadow-lg hover:bg-white sm:w-auto"
          >
            <Link
              href="https://calendly.com/kararsweta/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center"
            >
              Book a Demo
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
