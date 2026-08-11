import { LandingCta } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHero } from "@/components/landing/hero";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingProcess } from "@/components/landing/process";
import { LandingProduct } from "@/components/landing/product";

export default function Home() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-x-hidden bg-void text-fog">
      <div
        aria-hidden
        className="landing-atmosphere pointer-events-none fixed inset-0"
      />

      <LandingNavbar />

      <main className="relative z-10 flex flex-1 flex-col">
        <LandingHero />
        <LandingProduct />
        <LandingProcess />
        <LandingCta />
      </main>

      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  );
}
