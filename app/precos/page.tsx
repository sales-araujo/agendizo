import type { Metadata } from "next"
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"
import { Pricing } from "@/components/marketing/pricing"

export const metadata: Metadata = {
  title: "Preços | Agendizo",
  description: "Conheça os planos e preços do Agendizo para escolher a melhor opção para o seu negócio.",
}

export default function PrecosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container max-w-7xl mx-auto py-12 px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Preços</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Escolha o plano ideal para o seu negócio. Todos os planos incluem acesso completo à plataforma.
            </p>
          </div>
        </div>
        <Pricing showComparison={true} />
      </main>
      <Footer />
    </div>
  )
}
