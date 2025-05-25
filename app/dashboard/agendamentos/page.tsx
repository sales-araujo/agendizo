"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { format, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, CheckCircle, Edit, Trash2, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useSettings } from '@/lib/contexts/settings-context'
import { EmptyPlaceholder } from '@/components/ui/empty-placeholder'
import { useBusinessData } from '@/lib/hooks/use-business-data'

interface Appointment {
  id: string
  client: {
    id: string
    name: string
    email: string
    phone?: string
  }
  service: {
    id: string
    name: string
    price: number
    duration: number
  }
  date: string
  time: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  created_at: string
  notes?: string
}

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed"

export default function AppointmentsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { toast } = useToast()
  const { selectedBusiness } = useSettings()
  const [selectedDate, setSelectedDate] = useState(new Date())

  const dateFilters = useMemo(() => ({
    start_time: {
      gte: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString(),
      lte: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59).toISOString()
    }
  }), [selectedDate])

  const transformAppointment = useCallback((appointment: any) => {
    const client = Array.isArray(appointment.client) ? appointment.client[0] : appointment.client
    const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service
    return {
      id: appointment.id,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone
      },
      service: {
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration
      },
      date: new Date(appointment.start_time).toISOString().split('T')[0],
      time: new Date(appointment.start_time).toTimeString().slice(0, 5),
      status: appointment.status,
      created_at: appointment.created_at,
      notes: appointment.notes
    }
  }, [])

  const { data: appointments, isLoading, error, refresh } = useBusinessData<Appointment>({
    table: 'appointments',
    query: `
      id,
      client:clients(id, name, email, phone),
      service:services(id, name, price, duration),
      start_time,
      end_time,
      status,
      notes,
      created_at
    `,
    transform: transformAppointment,
    filters: dateFilters
  })

  if (!selectedBusiness) {
    return (
      <EmptyPlaceholder>
        <EmptyPlaceholder.Icon name="calendar" />
        <EmptyPlaceholder.Title>Nenhum negócio selecionado</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          Selecione um negócio para ver os agendamentos.
        </EmptyPlaceholder.Description>
      </EmptyPlaceholder>
    )
  }

  const handleNavigate = (direction: "PREV" | "NEXT" | "TODAY") => {
    if (direction === "PREV") {
      setSelectedDate(subMonths(selectedDate, 1))
    } else if (direction === "NEXT") {
      setSelectedDate(addMonths(selectedDate, 1))
    } else if (direction === "TODAY") {
      setSelectedDate(new Date())
    }
  }

  const statusColors: Record<AppointmentStatus, string> = {
    pending: "bg-amber-500 hover:bg-amber-600",
    confirmed: "bg-green-500 hover:bg-green-600",
    completed: "bg-blue-500 hover:bg-blue-600",
    cancelled: "bg-red-500 hover:bg-red-600"
  }

  const statusLabels: Record<AppointmentStatus, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    completed: "Concluído",
    cancelled: "Cancelado"
  }

  const renderCalendar = () => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    const startDate = new Date(monthStart)
    const endDate = new Date(monthEnd)
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)
    const endDayOfWeek = endDate.getDay()
    endDate.setDate(endDate.getDate() + (6 - endDayOfWeek))
    const rows = []
    let days = []
    const day = new Date(startDate)
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
    const header = (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((weekDay) => (
          <div key={weekDay} className="text-center font-medium text-sm py-2">
            {weekDay}
          </div>
        ))}
      </div>
    )
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day)
        const formattedDate = format(cloneDay, "yyyy-MM-dd")
        const isCurrentMonth = cloneDay.getMonth() === selectedDate.getMonth()
        const dayAppointments = appointments.filter((app) => app.date === formattedDate)
        days.push(
          <div
            key={formattedDate}
            className={`min-h-[120px] p-1 border rounded-md ${
              isCurrentMonth ? "bg-white dark:bg-gray-800" : "bg-gray-100 dark:bg-gray-900 text-gray-400"
            }`}
          >
            <div className="text-right p-1">{format(cloneDay, "d")}</div>
            <div className="mt-1 space-y-1">
              {dayAppointments.map((app, i) => (
                <div
                  key={i}
                  className={`text-xs px-1 py-0.5 rounded truncate text-white cursor-pointer ${statusColors[app.status as AppointmentStatus]}`}
                  onClick={() => router.push(`/dashboard/agendamentos/${app.id}`)}
                >
                  {app.time} - {app.client?.name}
                </div>
              ))}
            </div>
          </div>,
        )
        day.setDate(day.getDate() + 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1 mb-1">
          {days}
        </div>,
      )
      days = []
    }
    return (
      <div className="calendar">
        {header}
        {rows}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {(Object.keys(statusLabels) as AppointmentStatus[]).map((status) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
              <span className="text-sm">{statusLabels[status]}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  async function handleDelete(id: string) {
    if (!selectedBusiness?.id) return
    try {
      await supabase.from('appointments').delete().eq('id', id)
      await refresh()
      toast({ title: 'Agendamento excluído com sucesso!' })
    } catch {
      toast({ title: 'Erro ao excluir agendamento', variant: 'destructive' })
    }
  }

  async function handleComplete(id: string) {
    if (!selectedBusiness?.id) return
    try {
      await supabase.from('appointments').update({ status: 'completed' }).eq('id', id)
      await refresh()
      toast({ title: 'Agendamento marcado como concluído!' })
    } catch {
      toast({ title: 'Erro ao concluir agendamento', variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie todos os seus agendamentos em um só lugar.</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/agendamentos/novo")}
            className="gap-2 bg-[#eb07a4] hover:bg-[#d0069a]"
          >
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>
      </div>
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendário de Agendamentos</CardTitle>
              <CardDescription>Visualize seus agendamentos em formato de calendário</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleNavigate("PREV")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleNavigate("TODAY")}
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleNavigate("NEXT")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={refresh}
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-lg font-medium">{format(selectedDate, "MMMM yyyy", { locale: ptBR })}</div>
              </div>
              <div className="mt-4">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-[600px] w-full" />
                  </div>
                ) : (
                  renderCalendar()
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Agendamentos</CardTitle>
              <CardDescription>Visualize todos os seus agendamentos em formato de lista</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-[600px] w-full" />
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">Nenhum agendamento encontrado para este mês.</div>
              ) : (
                <div className="space-y-2">
                  {appointments.map((app) => (
                    <div
                      key={app.id}
                      className="border rounded p-4 hover:bg-muted flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{app.client.name}</div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                          <span className="text-sm text-muted-foreground truncate">{app.service.name}</span>
                          <span className="text-sm text-muted-foreground">{format(new Date(app.date + 'T' + app.time), "dd/MM/yyyy 'às' HH:mm")}</span>
                          <span className={`text-xs px-2 py-1 rounded ${statusColors[app.status as AppointmentStatus]} text-white`}>
                            {statusLabels[app.status as AppointmentStatus]}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-row gap-2 mt-3 md:mt-0 justify-end">
                        {app.status !== 'completed' && (
                          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleComplete(app.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Concluir
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/agendamentos/${app.id}`)}>
                          <Edit className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(app.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
