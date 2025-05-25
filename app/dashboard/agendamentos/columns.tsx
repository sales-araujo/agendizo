'use client'

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Appointment {
  id: string
  business_id: string
  client_id: string
  service_id: string
  date: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
}

const statusMap = {
  scheduled: { label: 'Agendado', variant: 'default' },
  completed: { label: 'Concluído', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
} as const

export const columns: ColumnDef<Appointment>[] = [
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => {
      const date = row.getValue("date") as string
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR })
    },
  },
  {
    accessorKey: "start_time",
    header: "Horário Início",
  },
  {
    accessorKey: "end_time",
    header: "Horário Fim",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusMap
      const { label, variant } = statusMap[status]
      return <Badge variant={variant as any}>{label}</Badge>
    },
  },
  {
    accessorKey: "notes",
    header: "Observações",
  },
] 