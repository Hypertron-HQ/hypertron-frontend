import { DarkVeil, LandingFooter, LandingNavbar } from "@/components/marketing/mono";
import Link from "next/link";

const BOOK_DEMO = "https://calendly.com/kararsweta/30min";

export default function NotFound() {
  return (
    <div className="marketing-mono min-h-screen bg-black font-default text-foreground antialiased">
      <LandingNavbar />

      <main className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden px-4 pb-28 pt-28 md:px-8">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden style={{ position: "absolute", inset: 0 }}>
          <DarkVeil resolutionScale={0.55} />
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-slate-950/80 via-blue-950/20 to-slate-950/90"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Error 404</p>
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            We can&apos;t find that page
          </h1>
          <p className="mt-5 text-pretty text-base leading-relaxed text-heroSubtitle/85 md:text-lg">
            The link may be mistyped, or this page moved. If you were looking for product docs, try{" "}
            <Link href="/doc" className="font-medium text-foreground underline decoration-white/30 underline-offset-4 hover:decoration-white/60">
              /doc
            </Link>
            .
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3.5 text-center text-base font-semibold text-background transition-opacity hover:opacity-90"
            >
              Back to home
            </Link>
            <Link
              href={BOOK_DEMO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-center text-base font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
