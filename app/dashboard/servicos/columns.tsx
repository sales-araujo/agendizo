'use client'

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  price: string
  duration: string
  created_at: string
}

export const columns: ColumnDef<Service>[] = [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      const service = row.original
      return (
        <div>
          <p className="font-medium">{service.name}</p>
          {service.description && (
            <p className="text-sm text-muted-foreground">{service.description}</p>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "duration",
    header: "Duração",
  },
  {
    accessorKey: "price",
    header: "Preço",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const service = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Trash className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 