import type { Metadata } from "next"
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"
import { ContactForm } from "@/components/marketing/contact-form"

export const metadata: Metadata = {
  title: "Contato | Agendizo",
  description: "Entre em contato com a equipe do Agendizo para tirar dúvidas ou solicitar suporte.",
}

export default function ContatoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container max-w-5xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Entre em contato</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Estamos aqui para ajudar. Preencha o formulário ao lado ou use um dos canais abaixo para entrar em contato
              conosco.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Email</h3>
                <p className="text-muted-foreground">contato@agendizo.com.br</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Telefone</h3>
                <p className="text-muted-foreground">(11) 4002-8922</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Endereço</h3>
                <p className="text-muted-foreground">
                  Av. Paulista, 1000 - Bela Vista
                  <br />
                  São Paulo - SP, 01310-100
                  <br />
                  Brasil
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Horário de atendimento</h3>
                <p className="text-muted-foreground">
                  Segunda a sexta: 9h às 18h
                  <br />
                  Sábado: 9h às 13h
                </p>
              </div>
            </div>
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
