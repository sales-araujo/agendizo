import { Hero } from "@/components/marketing/hero"
import { Features } from "@/components/marketing/features"
import { Testimonials } from "@/components/marketing/testimonials"
import { Pricing } from "@/components/marketing/pricing"
import { FAQ } from "@/components/marketing/faq"
import { CTA } from "@/components/marketing/cta"
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"
import { LGPDConsent } from "@/components/lgpd-consent"
import { BackToTop } from "@/components/marketing/back-to-top"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <LGPDConsent />
      <BackToTop />
    </div>
  )
}
