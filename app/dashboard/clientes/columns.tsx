'use client'

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash } from "lucide-react"

export interface Client {
  id: string
  business_id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  created_at: string
}

interface ColumnActionsProps {
  onEdit: (client: Client) => void
  onDelete: (id: string) => void
}

export const createColumns = ({ onEdit, onDelete }: ColumnActionsProps): ColumnDef<Client>[] => [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      const client = row.original
      return (
        <div>
          <div className="font-medium">{client.name}</div>
          {client.notes && (
            <div className="text-sm text-muted-foreground">{client.notes}</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "E-mail",
    cell: ({ row }) => {
      const email = row.getValue("email") as string
      return email || "-"
    },
  },
  {
    accessorKey: "phone",
    header: "Telefone",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string
      return phone || "-"
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(client.id)}>
              <Trash className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 