import ArtifactsSection from "../modules/landing/artifacts-section"
import CtaSection from "../modules/landing/cta-section"
import FeaturesSection from "../modules/landing/features-section"
import Footer from "../modules/landing/footer"
import Hero from "../modules/landing/hero"
import MemorySection from "../modules/landing/memory-section"
import SchedulesSection from "../modules/landing/schedules-section"

export default function Home() {
  return (
    <main className="flex flex-col">
      <Hero />
      <FeaturesSection />
      <ArtifactsSection />
      <MemorySection />
      <SchedulesSection />
      <CtaSection />
      <Footer />
    </main>
  )
}
