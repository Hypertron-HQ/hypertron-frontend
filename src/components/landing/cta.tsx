import { ArrowRight } from "lucide-react";
import { BOOK_DEMO } from "./constants";
import { ScrollFade } from "./reveal";

export function LandingCta() {
  return (
    <section id="start" className="landing-paper relative">
      <div className="relative mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8">
        <ScrollFade>
          <div className="flex flex-col gap-10 border-t border-[#d5dce6] py-20 sm:flex-row sm:items-end sm:justify-between sm:py-28">
            <div className="max-w-xl">
              <p className="text-[11px] font-medium tracking-[0.2em] text-[#7b8696] uppercase">
                Early access — invite only
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.2rem,4.4vw,3.8rem)] leading-[0.96] tracking-[-0.035em] text-[#1c2433]">
                Start your rollout.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-[#5c6778] sm:text-base">
                Walk through onboarding, settlements, and the operations
                dashboard on Stellar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={BOOK_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-[#0b1220] px-6 text-[11px] font-semibold tracking-[0.16em] text-white uppercase transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                Book a demo
                <ArrowRight className="size-3.5" />
              </a>
              <a
                href="#product"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-[#c5cedb] px-6 text-[11px] font-semibold tracking-[0.16em] text-[#1c2433] uppercase transition hover:border-[#1c2433] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                Explore product
              </a>
            </div>
          </div>
        </ScrollFade>
      </div>
    </section>
  );
}
