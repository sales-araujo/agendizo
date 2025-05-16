import type { Metadata } from "next"
import { Header } from "@/components/marketing/header"
import { Footer } from "@/components/marketing/footer"

export const metadata: Metadata = {
  title: "Política de Cookies | Agendizo",
  description: "Política de cookies da plataforma Agendizo.",
}

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Política de Cookies</h1>
        <p className="text-muted-foreground mb-4">Última atualização: 14 de maio de 2023</p>

        <div className="prose prose-pink max-w-none">
          <h2>1. O que são Cookies?</h2>
          <p>
            Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo (computador, tablet ou
            celular) quando você visita um site. Eles são amplamente utilizados para fazer os sites funcionarem de
            maneira mais eficiente, bem como fornecer informações aos proprietários do site.
          </p>

          <h2>2. Como Usamos Cookies</h2>
          <p>Utilizamos cookies para diversos fins, incluindo:</p>
          <ul>
            <li>
              <strong>Cookies Essenciais:</strong> Necessários para o funcionamento do site. Eles permitem que você
              navegue pelo site e use recursos essenciais, como áreas seguras e sistemas de pagamento.
            </li>
            <li>
              <strong>Cookies Analíticos/de Desempenho:</strong> Permitem-nos reconhecer e contar o número de visitantes
              e ver como os visitantes navegam pelo nosso site. Isso nos ajuda a melhorar o funcionamento do site.
            </li>
            <li>
              <strong>Cookies de Funcionalidade:</strong> Usados para reconhecê-lo quando você retorna ao nosso site.
              Isso nos permite personalizar nosso conteúdo para você e lembrar suas preferências.
            </li>
            <li>
              <strong>Cookies de Direcionamento:</strong> Registram sua visita ao nosso site, as páginas que você
              visitou e os links que seguiu. Usamos essas informações para tornar nosso site e a publicidade exibida
              mais relevantes para seus interesses.
            </li>
          </ul>

          <h2>3. Tipos de Cookies que Utilizamos</h2>
          <p>
            <strong>Cookies de Sessão:</strong> Estes cookies são temporários e são excluídos do seu dispositivo quando
            você fecha o navegador.
          </p>
          <p>
            <strong>Cookies Persistentes:</strong> Estes cookies permanecem no seu dispositivo até expirarem ou até que
            você os exclua.
          </p>
          <p>
            <strong>Cookies Próprios:</strong> Estes cookies são definidos por nós.
          </p>
          <p>
            <strong>Cookies de Terceiros:</strong> Estes cookies são definidos por terceiros, como Google Analytics,
            para coletar informações sobre como os visitantes usam nosso site.
          </p>

          <h2>4. Controle de Cookies</h2>
          <p>
            A maioria dos navegadores permite que você controle cookies através das configurações de preferências. No
            entanto, se você limitar a capacidade dos sites de definir cookies, isso pode piorar sua experiência geral
            de usuário, pois não será mais personalizada para você. Também pode impedir que você salve configurações
            personalizadas, como informações de login.
          </p>

          <h2>5. Cookies Específicos que Utilizamos</h2>
          <table className="min-w-full divide-y divide-gray-200 my-4">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propósito
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duração
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">session</td>
                <td className="px-6 py-4">Mantém o estado da sessão do usuário</td>
                <td className="px-6 py-4">2 horas</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">_ga</td>
                <td className="px-6 py-4">Usado pelo Google Analytics para distinguir usuários</td>
                <td className="px-6 py-4">2 anos</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">_gid</td>
                <td className="px-6 py-4">Usado pelo Google Analytics para distinguir usuários</td>
                <td className="px-6 py-4">24 horas</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">_gat</td>
                <td className="px-6 py-4">Usado pelo Google Analytics para limitar a taxa de solicitações</td>
                <td className="px-6 py-4">1 minuto</td>
              </tr>
            </tbody>
          </table>

          <h2>6. Alterações na Política de Cookies</h2>
          <p>
            Podemos atualizar nossa Política de Cookies periodicamente. Quaisquer alterações serão publicadas nesta
            página com uma data de "última atualização" revisada.
          </p>

          <h2>7. Contato</h2>
          <p>
            Se você tiver alguma dúvida sobre nossa Política de Cookies, entre em contato conosco pelo email:
            cookies@agendizo.com.br
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
