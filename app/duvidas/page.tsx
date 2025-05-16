import type { Metadata } from "next"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"

export const metadata: Metadata = {
  title: "Dúvidas Frequentes | Agendizo",
  description: "Encontre respostas para as dúvidas mais comuns sobre o Agendizo.",
}

const faqs = [
  {
    question: "O que é o Agendizo?",
    answer:
      "O Agendizo é uma plataforma completa de agendamento online que permite que profissionais e empresas gerenciem seus agendamentos, clientes e serviços de forma simples e eficiente.",
  },
  {
    question: "Como funciona o período de teste?",
    answer:
      "Oferecemos um período de teste gratuito de 14 dias em todos os nossos planos. Durante esse período, você terá acesso a todas as funcionalidades do plano escolhido, sem compromisso. Não é necessário cartão de crédito para começar.",
  },
  {
    question: "Posso mudar de plano depois?",
    answer:
      "Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento. Se fizer upgrade, a diferença será cobrada proporcionalmente ao tempo restante do seu ciclo de cobrança atual. Se fizer downgrade, o novo valor será aplicado no próximo ciclo de cobrança.",
  },
  {
    question: "Como funciona o agendamento online para meus clientes?",
    answer:
      "Cada negócio cadastrado na plataforma recebe uma página de agendamento personalizada. Você pode compartilhar o link dessa página com seus clientes através de redes sociais, email, WhatsApp ou incorporá-la ao seu site. Seus clientes poderão ver sua disponibilidade em tempo real e agendar serviços sem precisar entrar em contato diretamente.",
  },
  {
    question: "O Agendizo envia lembretes automáticos para os clientes?",
    answer:
      "Sim, o Agendizo envia lembretes automáticos por email para todos os planos. Nos planos Profissional e Enterprise, também oferecemos lembretes por SMS. O plano Enterprise inclui ainda lembretes via WhatsApp.",
  },
  {
    question: "Posso integrar o Agendizo com outros sistemas?",
    answer:
      "Sim, o Agendizo oferece integração com Google Calendar em todos os planos pagos. No plano Enterprise, também disponibilizamos uma API para integração com outros sistemas.",
  },
  {
    question: "Como funciona o suporte técnico?",
    answer:
      "Oferecemos suporte por email para todos os planos. Os planos Profissional e Enterprise contam com suporte prioritário, e o plano Enterprise inclui suporte por telefone em horário comercial.",
  },
  {
    question: "Posso cancelar minha assinatura a qualquer momento?",
    answer:
      "Sim, você pode cancelar sua assinatura a qualquer momento. Se cancelar, você continuará tendo acesso ao sistema até o final do período pago. Não fazemos reembolsos proporcionais para períodos parciais.",
  },
  {
    question: "O Agendizo é seguro? Como ficam meus dados?",
    answer:
      "Sim, o Agendizo utiliza criptografia de ponta a ponta e segue as melhores práticas de segurança da indústria. Todos os dados são armazenados em servidores seguros e estamos em conformidade com a LGPD (Lei Geral de Proteção de Dados).",
  },
  {
    question: "Posso usar o Agendizo em dispositivos móveis?",
    answer:
      "Sim, o Agendizo é totalmente responsivo e pode ser acessado de qualquer dispositivo com acesso à internet, incluindo smartphones e tablets. Também estamos desenvolvendo aplicativos nativos para iOS e Android que serão lançados em breve.",
  },
]

export default function DuvidasPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container max-w-5xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Dúvidas Frequentes</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Encontre respostas para as perguntas mais comuns sobre o Agendizo. Se não encontrar o que procura, entre em
            contato conosco.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <p className="mb-4">Não encontrou o que procurava?</p>
          <a
            href="/contato"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Entre em contato
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
