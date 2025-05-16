"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, Clock, Edit, Loader2, MoreHorizontal, Trash2, User, CheckCircle } from "lucide-react"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

import { EmptyAppointments } from "@/components/dashboard/empty-appointments"

interface AppointmentListProps {
  appointments: any[]
  onAppointmentDeleted: (id: string) => void
  onCreateAppointment?: () => void
}

export function AppointmentList({ appointments, onAppointmentDeleted, onCreateAppointment }: AppointmentListProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [visibleAppointments, setVisibleAppointments] = useState(5)

  const supabase = createClientComponentClient<Database>()

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500 hover:bg-amber-600",
    confirmed: "bg-green-500 hover:bg-green-600",
    completed: "bg-blue-500 hover:bg-blue-600",
    cancelled: "bg-red-500 hover:bg-red-600"
  }

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado"
  }

  const handleDelete = async () => {
    if (!selectedAppointment) return

    setIsDeleting(selectedAppointment.id)
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", selectedAppointment.id)

      if (error) throw error

      onAppointmentDeleted(selectedAppointment.id)
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      })
    } catch (error) {
      console.error("Error deleting appointment:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
      setShowDeleteDialog(false)
      setSelectedAppointment(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Data não disponível"
      const date = typeof dateString === "string" ? parseISO(dateString) : dateString
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString)
      return "Data inválida"
    }
  }

  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return "Hora não disponível"
      
      // If the dateString is already in HH:mm format, return it directly
      if (/^\d{2}:\d{2}$/.test(dateString)) {
        return dateString
      }

      // Otherwise, try to parse it as a date
      const date = typeof dateString === "string" ? parseISO(dateString) : dateString
      if (isNaN(date.getTime())) {
        return "Hora inválida"
      }
      return format(date, "HH:mm")
    } catch (error) {
      console.error("Erro ao formatar hora:", error, dateString)
      return "Hora inválida"
    }
  }

  const loadMore = () => {
    setVisibleAppointments(prev => prev + 5)
  }

  if (!appointments || appointments.length === 0) {
    return <EmptyAppointments onCreateAppointment={onCreateAppointment} />
  }

  return (
    <div className="space-y-4">
      {appointments.slice(0, visibleAppointments).map((appointment) => (
        <Card key={appointment.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{appointment.client?.name || "Cliente não encontrado"}</CardTitle>
                <CardDescription>
                  {appointment.service?.name || "Serviço não encontrado"} - R${" "}
                  {appointment.service?.price ? appointment.service.price.toFixed(2).replace(".", ",") : "0,00"}
                </CardDescription>
              </div>
              <Badge className={statusColors[appointment.status]}>
                {statusLabels[appointment.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid gap-2">
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{formatDate(appointment.date)}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{formatTime(appointment.time)}</span>
              </div>
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{appointment.client?.phone || "Telefone não cadastrado"}</span>
              </div>
              {appointment.notes && (
                <div className="mt-2 text-sm">
                  <p className="font-medium">Observações:</p>
                  <p className="text-muted-foreground">{appointment.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/agendamentos/${appointment.id}`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSelectedAppointment(appointment)
                setShowDeleteDialog(true)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          </CardFooter>
        </Card>
      ))}

      {appointments.length > visibleAppointments && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={loadMore}>
            Ver mais
          </Button>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting === selectedAppointment?.id}
            >
              {isDeleting === selectedAppointment?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
