"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CalendarPlus } from "lucide-react"

interface EmptyAppointmentsProps {
  onCreateAppointment?: () => void
}

export function EmptyAppointments({ onCreateAppointment }: EmptyAppointmentsProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative w-48 h-48 mb-6">
        <Image
          src="/placeholder.svg?key=u554r"
          alt="Nenhum agendamento"
          width={192}
          height={192}
          className="opacity-80"
        />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum agendamento encontrado</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Você ainda não possui nenhum agendamento. Crie seu primeiro agendamento para começar a gerenciar sua agenda.
      </p>
      {onCreateAppointment && (
        <Button onClick={onCreateAppointment}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Criar agendamento
        </Button>
      )}
    </div>
  )
}
