import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Pronto para transformar seu negócio?
            </h2>
            <p className="mx-auto max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Comece a usar o Agendizo hoje mesmo e veja como é fácil gerenciar seus agendamentos.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Link href="/registro">
              <Button size="lg" variant="secondary" className="w-full min-[400px]:w-auto">
                Comece grátis
              </Button>
            </Link>
            <Link href="/contato">
              <Button size="lg" variant="secondary" className="w-full min-[400px]:w-auto">
                Fale conosco
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
