import {
  CtaHlsSection,
  LandingFooter,
  LandingPageBackground,
  MissionSection,
  MonoHero,
  NeuralTestimonial,
  ProcessSection,
  SolutionSection,
  TestimonialsSection,
} from "@/components/marketing/mono";

const HomePage = () => {
  return (
    <div className="relative z-10 overflow-x-hidden">
      <LandingPageBackground />
      <MonoHero />
      <NeuralTestimonial />
      <SolutionSection />
      <ProcessSection />
      <MissionSection />
      <TestimonialsSection />
      <CtaHlsSection />
      <LandingFooter />
    </div>
  );
};

export default HomePage;
