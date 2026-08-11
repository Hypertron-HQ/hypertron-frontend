import { BOOK_DEMO } from "./constants";

export function LandingCta() {
  return (
    <section id="start" className="relative">
      <div className="spectrum-line" />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 py-20 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-28">
        <div className="max-w-xl">
          <p className="text-xs font-medium tracking-[0.18em] text-haze uppercase">
            Early access — invite only
          </p>
          <h2 className="mt-4 font-display text-3xl tracking-tight text-fog sm:text-5xl">
            <em className="font-serif font-normal italic">Start</em> your
            rollout
          </h2>
          <p className="mt-4 text-base leading-relaxed text-mist">
            Walk through onboarding, settlements, and the operations dashboard
            on Stellar.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={BOOK_DEMO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-full bg-yellow px-7 text-sm font-medium text-void transition hover:scale-[1.02] hover:bg-[#fffba8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            Book a Demo
          </a>
          <a
            href="#product"
            className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-glass px-7 text-sm font-medium text-fog backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            Explore product
          </a>
        </div>
      </div>
    </section>
  );
}
