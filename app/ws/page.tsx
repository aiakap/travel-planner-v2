import { auth } from "@/auth";

import { Navigation } from "@/app/ws/components/navigation-ws";
import { HeroSection } from "@/app/ws/components/hero-section-ws";
import { DiscoverSection } from "@/app/ws/components/discover-section-ws";
import { AudienceSection } from "@/app/ws/components/audience-section-ws";
import { CreatorsSection } from "@/app/ws/components/creators-section-ws";
import { FeaturesSection } from "@/app/ws/components/features-section-ws";
import { AICompanionSection } from "@/app/ws/components/ai-companion-section-ws";
import { SupportSection } from "@/app/ws/components/support-section-ws";
import { TrustSection } from "@/app/ws/components/trust-section-ws";
import { CTASection } from "@/app/ws/components/cta-section-ws";
import { Footer } from "@/app/ws/components/footer-ws";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-background">
      <Navigation session={session} />
      <HeroSection />
      <DiscoverSection />
      <AudienceSection />
      <CreatorsSection />
      <FeaturesSection />
      <AICompanionSection />
      <SupportSection />
      <TrustSection />
      <CTASection />
      <Footer />
    </main>
  );
}
