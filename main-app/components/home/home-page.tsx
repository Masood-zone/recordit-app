import { CtaSection } from "./cta-section"
import { FeaturesSection } from "./features-section"
import { HeroSection } from "./hero-section"
import { PublicFooter } from "./public-footer"
import { PublicNavbar } from "./public-navbar"

export function HomePage() {
  return (
    <main className="min-h-svh bg-[#f7f9ff] text-[#0d1d2a]">
      <PublicNavbar />
      <HeroSection />
      <FeaturesSection />
      <CtaSection />
      <PublicFooter />
    </main>
  )
}
