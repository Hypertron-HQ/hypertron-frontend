import { BOOK_DEMO } from "./constants";

export function LandingHero() {
  return (
    <section
      id="home"
      className="relative flex min-h-[100svh] flex-col justify-end px-5 pb-20 pt-32 sm:justify-center sm:px-8 sm:pb-28 sm:pt-36"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="hero-enter hero-enter-delay-1 mb-6 inline-flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-yellow uppercase">
          <span
            aria-hidden
            className="inline-block size-1.5 rounded-full bg-yellow shadow-[0_0_12px_rgba(255,249,113,0.7)]"
          />
          Public beta · From onboarding to settlement
        </p>

        <h1 className="hero-enter hero-enter-delay-1 font-display text-[clamp(3.25rem,12vw,7rem)] leading-[0.9] font-medium tracking-[-0.045em] text-fog">
          Hypertron
        </h1>

        <p className="hero-enter hero-enter-delay-2 mt-7 max-w-2xl text-[clamp(1.4rem,3.6vw,2.25rem)] leading-[1.2] font-medium tracking-tight text-fog">
          One{" "}
          <em className="font-serif font-normal italic text-fog/95">
            programmable
          </em>{" "}
          operating layer for B2B payments &amp; operations.
        </p>

        <p className="hero-enter hero-enter-delay-3 mt-5 max-w-lg text-base leading-relaxed text-mist sm:text-lg">
          Create onboarding flows, collect payments, automate approvals, and
          settle funds privately across global teams — on Stellar.
        </p>

        <div className="hero-enter hero-enter-delay-4 mt-10 flex flex-wrap items-center gap-3">
          <a
            href={BOOK_DEMO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-full bg-fog px-7 text-sm font-medium text-void transition hover:scale-[1.02] hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            Book a Demo
          </a>
          <a
            href="#product"
            className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-glass px-7 text-sm font-medium text-fog backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          >
            See the product
          </a>
        </div>
      </div>
    </section>
  );
}
