import { ArrowRight } from "lucide-react";
import { ScrollFade } from "./reveal";

const callouts = [
  {
    title: "Onboarding that settles",
    copy: "Stand up counterparties and teams with workflows that feed directly into the same rail.",
  },
  {
    title: "Compliance in the loop",
    copy: "Keep checks and approvals inside execution — not a side tool someone forgets.",
  },
] as const;

export function LandingProduct() {
  return (
    <section id="product" className="landing-paper relative">
      <div className="landing-paper-grid pointer-events-none absolute inset-0 opacity-90" />

      <div className="relative mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)_minmax(0,0.82fr)] lg:items-end lg:gap-10">
        <ScrollFade className="max-w-md">
          <span
            aria-hidden
            className="mb-6 block size-2 bg-blue"
          />
          <h2 className="font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[0.94] font-medium tracking-[-0.04em] text-[#1c2433]">
            Privacy you
            <br />
            can operate.
          </h2>
          <p className="mt-16 max-w-sm text-sm leading-relaxed text-[#5c6778]">
            By combining onboarding, approvals, and a privacy pool on Stellar,
            Hypertron sets a single standard for how B2B payments move — and
            stay private as volume grows.
          </p>
        </ScrollFade>

        <ScrollFade from={0.92} to={0.5} lag={0.12}>
          <div className="landing-rail-card relative overflow-hidden rounded-sm bg-[#070b14] px-6 pt-7 pb-5 text-white">
            <p className="text-[10px] tracking-[0.2em] text-white/45 uppercase">
              Settlement rail
            </p>
            <p className="mt-8 font-display text-3xl tracking-tight sm:text-4xl">
              Private pool
            </p>
            <p className="mt-3 text-sm text-white/55">
              Programmable notes · USDC · XLM
            </p>
            <div aria-hidden className="landing-rail-pulse mt-10 h-24" />
            <a
              href="/developers"
              className="mt-4 flex h-12 items-center justify-between border-t border-white/10 text-[11px] font-semibold tracking-[0.16em] text-white/80 uppercase transition hover:text-white"
            >
              More in the platform
              <ArrowRight className="size-4" />
            </a>
          </div>
        </ScrollFade>

        <div className="grid gap-12">
          {callouts.map((item, index) => (
            <ScrollFade key={item.title} from={0.94} to={0.55} lag={0.18 + index * 0.1}>
              <article className="border-t border-[#d5dce6] pt-5">
                <h3 className="text-lg font-medium tracking-tight text-[#1c2433]">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#5c6778]">
                  {item.copy}
                </p>
              </article>
            </ScrollFade>
          ))}
        </div>
      </div>
    </section>
  );
}
