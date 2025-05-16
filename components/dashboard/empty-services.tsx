"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface EmptyServicesProps {
  onCreateService: () => void
}

export function EmptyServices({ onCreateService }: EmptyServicesProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative w-48 h-48 mb-6">
        <Image src="/placeholder.svg?key=acppe" alt="Nenhum serviço" width={192} height={192} className="opacity-80" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum serviço cadastrado</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Você ainda não possui nenhum serviço cadastrado. Adicione seu primeiro serviço para começar a oferecer
        agendamentos.
      </p>
      <Button onClick={onCreateService}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar serviço
      </Button>
    </div>
  )
}
