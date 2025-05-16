import Link from "next/link"
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Agendizo</h3>
            <p className="text-gray-400">
              Simplifique o agendamento do seu negócio com nossa plataforma completa e intuitiva.
            </p>
            <div className="flex space-x-4">
              <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <Facebook className="h-5 w-5 text-gray-400 hover:text-white" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <Instagram className="h-5 w-5 text-gray-400 hover:text-white" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <Twitter className="h-5 w-5 text-gray-400 hover:text-white" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-5 w-5 text-gray-400 hover:text-white" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Produto</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#recursos" className="text-gray-400 hover:text-white">
                  Recursos
                </Link>
              </li>
              <li>
                <Link href="/precos" className="text-gray-400 hover:text-white">
                  Preços
                </Link>
              </li>
              <li>
                <Link href="/duvidas" className="text-gray-400 hover:text-white">
                  Dúvidas
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/termos" className="text-gray-400 hover:text-white">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-gray-400 hover:text-white">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-400 hover:text-white">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">&copy; {currentYear} Agendizo. Todos os direitos reservados.</p>
          <p className="text-gray-400 mt-4 md:mt-0">
            Desenvolvido por{" "}
            <Link
              href="https://solidusdigital.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Solidus Digital
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
