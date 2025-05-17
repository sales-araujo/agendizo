"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, Plus, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppointmentList } from "@/components/dashboard/appointment-list"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/lib/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Business {
  id: string
  name: string
}

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

interface RawAppointment {
  id: string
  client: {
    id: string
    name: string
    email: string
    phone?: string
  }[]
  service: {
    id: string
    name: string
    price: number
    duration: number
  }[]
  scheduled_at: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  created_at: string
  notes?: string
}

export default function AppointmentsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const toast = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])

  useEffect(() => {
    fetchBusinesses()
  }, [])

  useEffect(() => {
    if (businessId) {
      fetchAppointments(businessId)
    }
  }, [businessId, selectedDate])

  async function fetchBusinesses() {
    setIsLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()

      if (!user?.user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("owner_id", user.user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        setBusinesses(data)
        setBusinessId(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching businesses:", error)
      toast.error("Erro", "Não foi possível carregar seus negócios.")
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchAppointments(businessId: string) {
    if (!businessId) {
      setIsLoading(false)
      return
    }

    try {
      // Calcular início e fim do mês selecionado
      const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59)

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          client:clients(id, name, email, phone),
          service:services(id, name, price, duration),
          start_time,
          end_time,
          status,
          notes,
          created_at
        `)
        .eq("business_id", businessId)
        .gte("start_time", monthStart.toISOString())
        .lte("start_time", monthEnd.toISOString())
        .order("start_time", { ascending: true })

      if (error) {
        console.error("Error fetching appointments:", error.message)
        throw error
      }

      // Transform the data to match the Appointment interface
      const transformedData: Appointment[] = (data || []).map(appointment => {
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
      })

      setAppointments(transformedData)
    } catch (error) {
      console.error("Error fetching appointments:", error instanceof Error ? error.message : 'Unknown error')
      toast.error("Erro", "Não foi possível carregar seus agendamentos.")
    } finally {
      setIsLoading(false)
    }
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

  // Cores para os status dos agendamentos
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

  // Função para lidar com a exclusão de um agendamento
  const handleAppointmentDeleted = (id: string) => {
    setAppointments(appointments.filter((app) => app.id !== id))
  }

  // Função para gerar o calendário
  const renderCalendar = () => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    const startDate = new Date(monthStart)
    const endDate = new Date(monthEnd)

    // Ajustar para começar no domingo
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    // Ajustar para terminar no sábado
    const endDayOfWeek = endDate.getDay()
    endDate.setDate(endDate.getDate() + (6 - endDayOfWeek))

    const rows = []
    let days = []
    const day = new Date(startDate)

    // Dias da semana
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

    // Cabeçalho com dias da semana
    const header = (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((weekDay) => (
          <div key={weekDay} className="text-center font-medium text-sm py-2">
            {weekDay}
          </div>
        ))}
      </div>
    )

    // Gerar dias do calendário
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day)
        const formattedDate = format(cloneDay, "yyyy-MM-dd")
        const isCurrentMonth = cloneDay.getMonth() === selectedDate.getMonth()

        // Filtrar agendamentos para este dia
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

        <div className="w-full max-w-xs">
          <Select
            value={businessId || undefined}
            onValueChange={(value) => setBusinessId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um negócio" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                    onClick={() => {
                      if (businessId) {
                        fetchAppointments(businessId)
                      }
                    }}
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
              ) : (
                <AppointmentList
                  appointments={appointments}
                  onAppointmentDeleted={handleAppointmentDeleted}
                  onCreateAppointment={() => router.push("/dashboard/agendamentos/novo")}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
