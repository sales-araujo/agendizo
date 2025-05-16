"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

interface EmptyClientsProps {
  onCreateClient: () => void
}

export function EmptyClients({ onCreateClient }: EmptyClientsProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative w-48 h-48 mb-6">
        <Image src="/placeholder.svg?key=fevws" alt="Nenhum cliente" width={192} height={192} className="opacity-80" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum cliente cadastrado</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Você ainda não possui nenhum cliente cadastrado. Adicione seu primeiro cliente para começar a gerenciar seus
        agendamentos.
      </p>
      <Button onClick={onCreateClient}>
        <UserPlus className="mr-2 h-4 w-4" />
        Adicionar cliente
      </Button>
    </div>
  )
}
