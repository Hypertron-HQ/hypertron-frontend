import { LandingCta } from "@/components/landing/cta";
import { LandingFaq } from "@/components/landing/faq";
import { LandingEcosystem } from "@/components/landing/ecosystem";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHero } from "@/components/landing/hero";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingOperations } from "@/components/landing/operations";
import { LandingPrivacy } from "@/components/landing/privacy";
import { LandingProcess } from "@/components/landing/process";
import { LandingProduct } from "@/components/landing/product";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { LandingWays } from "@/components/landing/ways";

export default function Home() {
  return (
    <div className="landing-root relative flex min-h-full flex-1 flex-col overflow-x-clip">
      <SmoothScroll />
      <LandingNavbar />

      <main className="relative z-10 flex flex-1 flex-col">
        <LandingHero />
        <LandingProduct />
        <div className="landing-journey-span">
          <LandingWays />
          <LandingProcess />
        </div>
        <div className="landing-privacy-span">
          <LandingPrivacy />
          <LandingOperations />
        </div>
        <LandingEcosystem />
        <LandingCta />
        <LandingFaq />
      </main>

      <div className="relative z-10">
        <LandingFooter />
      </div>
    </div>
  );
}
