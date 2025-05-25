'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TimeSlot {
  id: string
  business_id: string
  day_of_week: string
  start_time: string
  end_time: string
  is_available: boolean
  created_at: string
  name: string
}

export const columns: ColumnDef<TimeSlot>[] = [
  {
    accessorKey: 'name',
    header: 'Horário',
  },
  {
    accessorKey: 'day_of_week',
    header: 'Dia da Semana',
  },
  {
    accessorKey: 'start_time',
    header: 'Horário de Início',
  },
  {
    accessorKey: 'end_time',
    header: 'Horário de Término',
  },
  {
    accessorKey: 'is_available',
    header: 'Disponível',
    cell: ({ row }) => (
      <span className={row.original.is_available ? 'text-green-500' : 'text-red-500'}>
        {row.original.is_available ? 'Sim' : 'Não'}
      </span>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const timeSlot = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 