import type { ReactNode } from "react"
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"
import { LGPDConsent } from "@/components/lgpd-consent"

interface MarketingLayoutProps {
  children: ReactNode
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <LGPDConsent />
    </div>
  )
}
