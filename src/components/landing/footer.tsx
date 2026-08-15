import { BOOK_DEMO } from "./constants";

export function LandingFooter() {
  return (
    <footer id="about" className="landing-paper relative border-t border-[#d5dce6]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-12 px-5 py-14 sm:px-8 sm:py-16">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-lg font-medium tracking-[0.08em] text-[#1c2433] uppercase">
              Hypertron
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#5c6778]">
              Unified B2B onboarding and private settlement. One programmable
              rail on Stellar — onboarding, compliance, and capital flow.
            </p>
          </div>

          <div className="flex gap-14 text-sm text-[#5c6778]">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] tracking-[0.16em] text-[#8a93a3] uppercase">
                Product
              </p>
              <a href="#product" className="hover:text-[#1c2433]">
                Capabilities
              </a>
              <a href="#protocol" className="hover:text-[#1c2433]">
                How it works
              </a>
              <a href="/developers" className="hover:text-[#1c2433]">
                Payments API
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-[11px] tracking-[0.16em] text-[#8a93a3] uppercase">
                Company
              </p>
              <a href="#start" className="hover:text-[#1c2433]">
                Early access
              </a>
              <a
                href={BOOK_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#1c2433]"
              >
                Book a demo
              </a>
            </div>
          </div>
        </div>

        <p
          aria-hidden
          className="font-display select-none text-[clamp(3.5rem,14vw,9rem)] leading-none font-medium tracking-[-0.06em] text-[#1c2433]/[0.07]"
        >
          HYPERTRON
        </p>

        <div className="flex flex-col gap-2 border-t border-[#d5dce6] pt-6 text-sm text-[#8a93a3] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Hypertron Labs</p>
          <p>Built on Stellar</p>
        </div>
      </div>
    </footer>
  );
}
