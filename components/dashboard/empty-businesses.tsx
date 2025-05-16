"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"

interface EmptyBusinessesProps {
  onCreateBusiness: () => void
}

export function EmptyBusinesses({ onCreateBusiness }: EmptyBusinessesProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <div className="relative w-24 h-24 mb-6">
        <Building2 className="h-24 w-24 text-primary/20" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum negócio cadastrado</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Você ainda não possui nenhum negócio cadastrado. Adicione seu primeiro negócio para começar a gerenciar seus
        agendamentos.
      </p>
      <Link href="/dashboard/negocios/novo">
        <Button className="gap-2">
          <Building2 className="mr-2 h-4 w-4" />
          Adicionar negócio
        </Button>
      </Link>
    </div>
  )
}
