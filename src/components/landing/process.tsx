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
    <section id="how" className="relative border-t border-line bg-ink/60">
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="max-w-xl">
          <p className="text-xs font-medium tracking-[0.18em] text-haze uppercase">
            How it works
          </p>
          <h2 className="mt-4 font-display text-3xl tracking-tight text-fog sm:text-4xl">
            From signup to{" "}
            <em className="font-serif font-normal italic">settlement</em> in
            three moves.
          </h2>
        </div>

        <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, index) => (
            <li key={step.label} className="relative">
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute top-3 left-[calc(100%+0.5rem)] hidden h-px w-[calc(100%-1rem)] bg-gradient-to-r from-line via-blue/40 to-transparent sm:block"
                />
              ) : null}
              <div className="mb-4 flex items-baseline gap-3">
                <span className="font-display text-sm tracking-wide text-yellow">
                  0{index + 1}
                </span>
                <h3 className="text-xl font-medium tracking-tight text-fog">
                  {step.label}
                </h3>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-mist">
                {step.copy}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
