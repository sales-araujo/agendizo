import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white py-16 dark:bg-gray-950 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Simplifique seus agendamentos
              </h1>
              <p className="max-w-[600px] text-gray-500 dark:text-gray-400 md:text-xl">
                Gerencie sua agenda, clientes e serviços em um só lugar. Aumente sua produtividade e ofereça uma
                experiência superior aos seus clientes.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg">
                <Link href="/registro">Começar agora</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto flex items-center justify-center">
            <Image
              src="/scheduling-app-dashboard.png"
              alt="Dashboard do aplicativo de agendamento"
              width={550}
              height={413}
              className="rounded-lg object-cover shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
