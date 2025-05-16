import type { Metadata } from "next"
import Image from "next/image"
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"

export const metadata: Metadata = {
  title: "Sobre Nós | Agendizo",
  description: "Conheça a história e a equipe por trás do Agendizo.",
}

export default function SobrePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 bg-accent">
          <div className="container max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight mb-4">Sobre o Agendizo</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Conheça nossa história e a equipe por trás da plataforma que está transformando a forma como
                profissionais gerenciam seus agendamentos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">Nossa História</h2>
                <p className="mb-4">
                  O Agendizo nasceu em 2020, quando um grupo de empreendedores identificou um problema comum entre
                  profissionais autônomos e pequenas empresas: a dificuldade em gerenciar agendamentos de forma
                  eficiente.
                </p>
                <p className="mb-4">
                  Após meses de pesquisa e desenvolvimento, lançamos a primeira versão do Agendizo com o objetivo de
                  simplificar o processo de agendamento e reduzir faltas, permitindo que profissionais se concentrassem
                  no que realmente importa: atender seus clientes com excelência.
                </p>
                <p>
                  Hoje, o Agendizo é utilizado por milhares de profissionais em todo o Brasil, desde cabeleireiros e
                  esteticistas até médicos e advogados, ajudando-os a otimizar seu tempo e aumentar sua produtividade.
                </p>
              </div>
              <div className="relative h-80 rounded-lg overflow-hidden shadow-xl">
                <Image src="/office-team-meeting.png" alt="Equipe Agendizo" fill className="object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nossa Missão e Valores</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-3">Missão</h3>
                <p>
                  Simplificar o gerenciamento de agendamentos para profissionais e empresas, permitindo que se
                  concentrem no que realmente importa: oferecer serviços de qualidade aos seus clientes.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-3">Visão</h3>
                <p>
                  Ser a plataforma de agendamento mais completa e intuitiva do mercado, reconhecida pela excelência e
                  inovação, transformando a forma como profissionais gerenciam seu tempo.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-3">Valores</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Simplicidade</li>
                  <li>Inovação</li>
                  <li>Excelência</li>
                  <li>Transparência</li>
                  <li>Foco no cliente</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-accent">
          <div className="container max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Nossa Equipe</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Carlos Silva",
                  role: "CEO & Co-fundador",
                  bio: "Com mais de 15 anos de experiência em tecnologia, Carlos lidera a visão estratégica do Agendizo.",
                  image: "/professional-man-portrait.png",
                },
                {
                  name: "Ana Oliveira",
                  role: "CTO & Co-fundadora",
                  bio: "Especialista em desenvolvimento de software, Ana é responsável pela arquitetura e inovação tecnológica da plataforma.",
                  image: "/professional-woman-portrait.png",
                },
                {
                  name: "Marcos Santos",
                  role: "Head de Produto",
                  bio: "Com background em UX/UI, Marcos trabalha para garantir que o Agendizo seja intuitivo e fácil de usar.",
                  image: "/professional-man-portrait-glasses.png",
                },
                {
                  name: "Juliana Costa",
                  role: "Head de Marketing",
                  bio: "Especialista em marketing digital, Juliana lidera as estratégias de crescimento e aquisição de clientes.",
                  image: "/placeholder-nkbap.png",
                },
                {
                  name: "Roberto Almeida",
                  role: "Head de Atendimento",
                  bio: "Com vasta experiência em suporte ao cliente, Roberto garante que nossos usuários tenham a melhor experiência possível.",
                  image: "/professional-man-portrait-suit.png",
                },
                {
                  name: "Fernanda Lima",
                  role: "Head de Vendas",
                  bio: "Especialista em vendas B2B, Fernanda lidera a equipe responsável por expandir nossa base de clientes corporativos.",
                  image: "/professional-woman-portrait-business.png",
                },
              ].map((member, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
                  <div className="relative h-64">
                    <Image src={member.image || "/placeholder.svg"} alt={member.name} fill className="object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-muted-foreground">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
