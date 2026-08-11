const capabilities = [
  {
    title: "Onboarding flows",
    copy: "Stand up counterparties and teams with workflows that feed directly into settlement.",
  },
  {
    title: "Compliance in the loop",
    copy: "Keep checks and approvals inside the same rail — not a side tool someone forgets.",
  },
  {
    title: "Private settlement",
    copy: "Move capital on Stellar with a privacy pool that stays programmable and defensible.",
  },
  {
    title: "One operations layer",
    copy: "Replace fragmented dashboards with a single surface for payments and B2B ops.",
  },
] as const;

export function LandingProduct() {
  return (
    <section id="product" className="relative border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div className="max-w-md">
          <p className="text-xs font-medium tracking-[0.18em] text-yellow uppercase">
            The product
          </p>
          <h2 className="mt-4 font-display text-3xl tracking-tight text-fog sm:text-4xl">
            B2B operations on Stellar, with{" "}
            <em className="font-serif font-normal italic">privacy</em> you can
            program.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-mist">
            Hypertron unifies onboarding, compliance, and settlement so execution
            stays one pipeline — not a pile of tools.
          </p>
        </div>

        <ul className="divide-y divide-line border-y border-line">
          {capabilities.map((item) => (
            <li
              key={item.title}
              className="grid gap-2 py-6 sm:grid-cols-[11rem_1fr] sm:gap-8"
            >
              <h3 className="text-sm font-medium tracking-tight text-fog">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-mist">{item.copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
