"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Users, Clock, CheckCircle, XCircle, AlertCircle, Plus, Store } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { MetricsChart } from "@/components/dashboard/metrics-chart"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useSettings } from '@/lib/contexts/settings-context'
import { useBusinessData } from '@/lib/hooks/use-business-data'
import type { User } from '@supabase/auth-helpers-nextjs'

interface Appointment {
  id: string
  client_id: string
  service_id: string
  business_id: string
  start_time: string
  end_time: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  created_at: string
  clients?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  services?: {
    id: string
    name: string
    price: number
    duration: number
  }
}

interface Business {
  id: string
  name: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const { selectedBusiness } = useSettings()
  const { toast } = useToast()
  const supabase = createClient()

  const { data: appointments, isLoading: appointmentsLoading } = useBusinessData<Appointment>({
    table: 'appointments',
    query: `
      *,
      clients (*),
      services (*)
    `,
  })

  const stats = {
    total: appointments?.length || 0,
    pending: appointments?.filter(a => a.status === "pending").length || 0,
    confirmed: appointments?.filter(a => a.status === "confirmed").length || 0,
    cancelled: appointments?.filter(a => a.status === "cancelled").length || 0,
    completed: appointments?.filter(a => a.status === "completed").length || 0,
  }

  const upcomingAppointments = appointments
    ?.filter(a => new Date(a.start_time) > new Date() && ["pending", "confirmed"].includes(a.status))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5) || []

  const completedAppointments = appointments
    ?.filter(a => a.status === "completed")
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .slice(0, 5) || []

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      setUser(user as User)
    } catch (error) {
      console.error("Error fetching user:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do usuário.",
        variant: "destructive",
      })
    }
  }

  // Função para obter o primeiro nome do usuário
  const getFirstName = (fullName?: string | null) => {
    if (!fullName) return "Visitante"
    return fullName.split(" ")[0]
  }

  if (appointmentsLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {getFirstName(user?.user_metadata?.full_name)}! Aqui está um resumo do seu negócio.
          </p>
        </div>
      </div>

      {selectedBusiness ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Agendamentos</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Agendamentos registrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.confirmed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? `${Math.round((stats.confirmed / stats.total) * 100)}% do total` : "0% do total"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}% do total` : "0% do total"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cancelled}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 ? `${Math.round((stats.cancelled / stats.total) * 100)}% do total` : "0% do total"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Próximos Agendamentos</CardTitle>
                <CardDescription>Os próximos 5 agendamentos do seu negócio.</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{appointment.clients?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.services?.name} - {format(new Date(appointment.start_time), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          appointment.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {appointment.status === "confirmed" ? "Confirmado" : "Pendente"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum agendamento próximo.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Últimos Agendamentos Concluídos</CardTitle>
                <CardDescription>Os últimos 5 agendamentos concluídos.</CardDescription>
              </CardHeader>
              <CardContent>
                {completedAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {completedAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{appointment.clients?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.services?.name} - {format(new Date(appointment.start_time), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Concluído
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum agendamento concluído.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <MetricsChart businessId={selectedBusiness.id} />
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum negócio selecionado</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Selecione um negócio para visualizar suas estatísticas e agendamentos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

