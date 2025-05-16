import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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
]

export function FAQ() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Perguntas Frequentes</h2>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
              Encontre respostas para as dúvidas mais comuns sobre o Agendizo.
            </p>
          </div>
        </div>
        <div className="mx-auto max-w-3xl mt-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
