// src/app/(site)/page.tsx
import { FaqSection } from "@/components/home/faq-section";
import { FeaturesSection } from "@/components/home/features-section";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { ModesSection } from "@/components/home/modes-section";
import { OrbDemoSection } from "@/components/home/orb-demo-section";
import { ProblemSection } from "@/components/home/problem-section";
import { TrustStrip } from "@/components/home/trust-strip";

// Backgrounds alternate exactly: Mint, White, Mint, White, Emerald, Mint, White, Mint, Violet, (Mint footer)
export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <ProblemSection />
      <HowItWorks />
      <ModesSection />
      <FeaturesSection />
      <OrbDemoSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}