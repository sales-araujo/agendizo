"use client"

import { Button } from "@/components/ui/button"
import { CalendarPlus, Calendar } from "lucide-react"

interface EmptyAppointmentsProps {
  onCreateAppointment?: () => void
}

export function EmptyAppointments({ onCreateAppointment }: EmptyAppointmentsProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 text-muted-foreground">
        <Calendar className="h-24 w-24" strokeWidth={1} />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum agendamento encontrado</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Você ainda não possui nenhum agendamento. Crie seu primeiro agendamento para começar a gerenciar sua agenda.
      </p>
      {onCreateAppointment && (
        <Button onClick={onCreateAppointment} className="bg-[#eb07a4] hover:bg-[#d0069a]">
          <CalendarPlus className="mr-2 h-4 w-4" />
          Criar agendamento
        </Button>
      )}
    </div>
  )
}
