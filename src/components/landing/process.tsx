import { ScrollFade } from "./reveal";

const steps = [
  {
    label: "Onboard",
    copy: "Spin up flows that get teams and counterparties ready to transact.",
  },
  {
    label: "Settle",
    copy: "Move capital on Stellar with a rail built for B2B operations.",
  },
  {
    label: "Scale",
    copy: "Keep compliance and privacy programmable as volume grows.",
  },
] as const;

export function LandingProcess() {
  return (
    <section id="protocol" className="landing-paper relative">
      <div className="landing-paper-grid pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 sm:py-12">
        <ScrollFade className="max-w-xl border-t border-[#d5dce6] pt-16">
          <p className="text-[11px] font-medium tracking-[0.2em] text-[#7b8696] uppercase">
            How it works
          </p>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[0.96] tracking-[-0.035em] text-[#1c2433]">
            From signup to settlement
            <br />
            in three moves.
          </h2>
        </ScrollFade>

        <ol className="mt-20 grid gap-16 border-t border-[#d5dce6] py-16 sm:grid-cols-3 sm:gap-10">
          {steps.map((step, index) => (
            <ScrollFade key={step.label} from={0.93} to={0.5} lag={index * 0.14}>
              <li>
                <p className="text-[11px] tracking-[0.18em] text-blue uppercase">
                  0{index + 1}
                </p>
                <h3 className="mt-4 font-display text-2xl tracking-tight text-[#1c2433]">
                  {step.label}
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#5c6778]">
                  {step.copy}
                </p>
              </li>
            </ScrollFade>
          ))}
        </ol>
      </div>
    </section>
  );
}
