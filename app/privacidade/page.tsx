import type { Metadata } from "next"
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"

export const metadata: Metadata = {
  title: "Política de Privacidade | Agendizo",
  description: "Política de privacidade da plataforma Agendizo.",
}

export default function PrivacidadePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-4">Última atualização: 14 de maio de 2023</p>

        <div className="prose prose-pink max-w-none">
          <h2>1. Introdução</h2>
          <p>
            A Agendizo está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como
            coletamos, usamos, divulgamos e protegemos suas informações pessoais quando você usa nossa plataforma.
          </p>

          <h2>2. Informações que Coletamos</h2>
          <p>Podemos coletar os seguintes tipos de informações:</p>
          <ul>
            <li>
              <strong>Informações de Registro:</strong> Nome, endereço de email, senha, etc.
            </li>
            <li>
              <strong>Informações de Perfil:</strong> Foto, biografia, informações de contato, etc.
            </li>
            <li>
              <strong>Informações de Pagamento:</strong> Dados de cartão de crédito, informações de faturamento, etc.
            </li>
            <li>
              <strong>Informações de Uso:</strong> Como você interage com nosso serviço, preferências, etc.
            </li>
            <li>
              <strong>Informações do Dispositivo:</strong> Tipo de dispositivo, sistema operacional, endereço IP, etc.
            </li>
          </ul>

          <h2>3. Como Usamos Suas Informações</h2>
          <p>Usamos suas informações para:</p>
          <ul>
            <li>Fornecer, manter e melhorar nossos serviços</li>
            <li>Processar transações e enviar notificações relacionadas</li>
            <li>Enviar comunicações de marketing, atualizações e promoções</li>
            <li>Responder a suas solicitações, perguntas e feedback</li>
            <li>Monitorar e analisar tendências, uso e atividades</li>
            <li>Detectar, prevenir e resolver problemas técnicos e de segurança</li>
          </ul>

          <h2>4. Compartilhamento de Informações</h2>
          <p>Podemos compartilhar suas informações com:</p>
          <ul>
            <li>
              <strong>Prestadores de Serviços:</strong> Empresas que prestam serviços em nosso nome
            </li>
            <li>
              <strong>Parceiros de Negócios:</strong> Para oferecer produtos ou serviços em conjunto
            </li>
            <li>
              <strong>Conformidade Legal:</strong> Quando exigido por lei ou para proteger direitos
            </li>
          </ul>

          <h2>5. Segurança de Dados</h2>
          <p>
            Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso
            não autorizado, alteração, divulgação ou destruição. No entanto, nenhum método de transmissão pela Internet
            ou método de armazenamento eletrônico é 100% seguro.
          </p>

          <h2>6. Seus Direitos</h2>
          <p>Você tem certos direitos relacionados às suas informações pessoais, incluindo:</p>
          <ul>
            <li>Acessar e receber uma cópia de suas informações</li>
            <li>Retificar informações imprecisas</li>
            <li>Solicitar a exclusão de suas informações</li>
            <li>Restringir ou se opor ao processamento de suas informações</li>
            <li>Portabilidade de dados</li>
          </ul>

          <h2>7. Retenção de Dados</h2>
          <p>
            Mantemos suas informações pelo tempo necessário para fornecer nossos serviços e cumprir nossas obrigações
            legais. Quando não tivermos mais uma necessidade comercial legítima de processar suas informações,
            excluiremos ou anonimizaremos essas informações.
          </p>

          <h2>8. Crianças</h2>
          <p>
            Nossos serviços não são destinados a menores de 18 anos. Não coletamos intencionalmente informações pessoais
            de crianças. Se soubermos que coletamos informações pessoais de uma criança, tomaremos medidas para excluir
            essas informações.
          </p>

          <h2>9. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre quaisquer alterações
            significativas publicando a nova Política de Privacidade nesta página e atualizando a data de "última
            atualização".
          </p>

          <h2>10. Contato</h2>
          <p>
            Se você tiver alguma dúvida sobre esta Política de Privacidade, entre em contato conosco pelo email:
            privacidade@agendizo.com.br
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
