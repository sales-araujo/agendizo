import type { Metadata } from "next"
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"

export const metadata: Metadata = {
  title: "Termos de Uso | Agendizo",
  description: "Termos de uso da plataforma Agendizo.",
}

export default function TermosPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Termos de Uso</h1>
        <p className="text-muted-foreground mb-4">Última atualização: 14 de maio de 2023</p>

        <div className="prose prose-pink max-w-none">
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar ou usar o serviço Agendizo, você concorda em cumprir estes Termos de Uso e todas as leis e
            regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar
            este site.
          </p>

          <h2>2. Descrição do Serviço</h2>
          <p>
            O Agendizo é uma plataforma de agendamento online que permite que profissionais e empresas gerenciem seus
            agendamentos, clientes e serviços. Oferecemos diferentes planos de assinatura com funcionalidades variadas.
          </p>

          <h2>3. Contas de Usuário</h2>
          <p>
            Para utilizar o Agendizo, você precisa criar uma conta. Você é responsável por manter a confidencialidade de
            sua senha e é totalmente responsável por todas as atividades que ocorrem em sua conta. Você concorda em
            notificar imediatamente o Agendizo sobre qualquer uso não autorizado de sua conta ou qualquer outra violação
            de segurança.
          </p>

          <h2>4. Pagamentos e Assinaturas</h2>
          <p>
            O Agendizo oferece diferentes planos de assinatura. Ao assinar um plano pago, você concorda em pagar todas
            as taxas associadas ao plano escolhido. As assinaturas são renovadas automaticamente, a menos que você
            cancele antes do próximo ciclo de cobrança.
          </p>

          <h2>5. Cancelamento e Reembolsos</h2>
          <p>
            Você pode cancelar sua assinatura a qualquer momento. Se você cancelar, continuará tendo acesso ao serviço
            até o final do período pago. Não oferecemos reembolsos para períodos parciais.
          </p>

          <h2>6. Uso Aceitável</h2>
          <p>
            Você concorda em usar o Agendizo apenas para fins legais e de acordo com estes Termos. Você não deve usar o
            serviço para:
          </p>
          <ul>
            <li>Violar qualquer lei ou regulamento aplicável</li>
            <li>Infringir os direitos de propriedade intelectual de terceiros</li>
            <li>Transmitir material ofensivo, difamatório ou prejudicial</li>
            <li>Distribuir vírus ou qualquer outro código malicioso</li>
            <li>Interferir ou interromper a integridade ou o desempenho do serviço</li>
          </ul>

          <h2>7. Propriedade Intelectual</h2>
          <p>
            O serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão propriedade exclusiva do
            Agendizo e seus licenciadores. O serviço é protegido por direitos autorais, marcas registradas e outras leis
            de propriedade intelectual.
          </p>

          <h2>8. Limitação de Responsabilidade</h2>
          <p>
            Em nenhuma circunstância o Agendizo, seus diretores, funcionários ou agentes serão responsáveis por
            quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso ou
            incapacidade de usar o serviço.
          </p>

          <h2>9. Alterações nos Termos</h2>
          <p>
            Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos os usuários sobre
            quaisquer alterações significativas. O uso continuado do serviço após tais alterações constitui sua
            aceitação dos novos termos.
          </p>

          <h2>10. Lei Aplicável</h2>
          <p>
            Estes termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar suas disposições
            de conflito de leis.
          </p>

          <h2>11. Contato</h2>
          <p>
            Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco pelo email: termos@agendizo.com.br
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
