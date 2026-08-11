import { BOOK_DEMO } from "./constants";

export function LandingFooter() {
  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-lg font-medium text-fog">
              Hypertron
            </p>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Unified B2B onboarding and private settlement. One programmable
              rail on Stellar — onboarding, compliance, and capital flow.
            </p>
          </div>

          <div className="flex gap-12 text-sm text-mist">
            <div className="flex flex-col gap-2">
              <p className="text-xs tracking-[0.14em] text-haze uppercase">
                Product
              </p>
              <a href="#product" className="hover:text-fog">
                Capabilities
              </a>
              <a href="#how" className="hover:text-fog">
                How it works
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs tracking-[0.14em] text-haze uppercase">
                Company
              </p>
              <a href="#start" className="hover:text-fog">
                Early access
              </a>
              <a
                href={BOOK_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-fog"
              >
                Book a demo
              </a>
            </div>
          </div>
        </div>

        <p
          aria-hidden
          className="font-display select-none text-[clamp(3.5rem,14vw,9rem)] leading-none font-medium tracking-[-0.06em] text-transparent bg-clip-text bg-gradient-to-b from-white/15 to-white/[0.03]"
        >
          HYPERTRON
        </p>

        <div className="flex flex-col gap-2 border-t border-line pt-6 text-sm text-haze sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Hypertron Labs</p>
          <p>Built on Stellar</p>
        </div>
      </div>
    </footer>
  );
}
