"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Users, Clock, CheckCircle, XCircle, AlertCircle, Plus, Store } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { MetricsChart } from "@/components/dashboard/metrics-chart"

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
  email: string
  owner_id: string
  created_at: string
}

interface User {
  id: string
  email: string
  full_name?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0, completed: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obter usuário atual
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setIsLoading(false)
          return
        }

        // Obter perfil do usuário
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        setUser(profile)

        // Obter negócios do usuário
        const { data: businessesData } = await supabase
          .from("businesses")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)

        setBusinesses(businessesData || [])

        // Se tiver negócios, obter agendamentos e estatísticas
        if (businessesData && businessesData.length > 0) {
          const primaryBusiness = businessesData[0]

          // Obter próximos agendamentos
          const { data: upcoming } = await supabase
            .from("appointments")
            .select(`
              *,
              clients:client_id(*),
              services:service_id(*)
            `)
            .eq("business_id", primaryBusiness.id)
            .neq("status", "completed")
            .order("start_time", { ascending: true })
            .limit(5)

          setUpcomingAppointments(upcoming || [])

          // Obter agendamentos concluídos
          const { data: completed } = await supabase
            .from("appointments")
            .select(`
              *,
              clients:client_id(*),
              services:service_id(*)
            `)
            .eq("business_id", primaryBusiness.id)
            .eq("status", "completed")
            .order("start_time", { ascending: false })
            .limit(5)

          setCompletedAppointments(completed || [])

          // Obter estatísticas de agendamentos
          const { data: appointments } = await supabase
            .from("appointments")
            .select("status")
            .eq("business_id", primaryBusiness.id)

          if (appointments) {
            const total = appointments.length
            const confirmed = appointments.filter((a) => a.status === "confirmed").length
            const pending = appointments.filter((a) => a.status === "pending").length
            const cancelled = appointments.filter((a) => a.status === "cancelled").length
            const completed = appointments.filter((a) => a.status === "completed").length

            setStats({ total, confirmed, pending, cancelled, completed })
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados do dashboard.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase, toast])

  // Se não tiver negócios, mostrar tela de boas-vindas
  if (!isLoading && businesses.length === 0) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-6">
            <Store className="h-16 w-16 text-[#eb07a4] mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Bem-vindo ao Agendizo!</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Para começar a gerenciar seus agendamentos, crie seu primeiro negócio.
            </p>
          </div>
          <Link href="/dashboard/negocios/novo">
            <Button size="lg" className="gap-2 bg-[#eb07a4] hover:bg-[#d0069a]">
              <Plus className="h-4 w-4" />
              Criar meu primeiro negócio
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {user?.full_name || "Usuário"}! Aqui está um resumo do seu negócio.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 mt-8">
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
            <Clock className="h-4 w-4 text-amber-500" />
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

      <div className="grid gap-6 md:grid-cols-7 mt-8">
        <Card className="col-span-7 md:col-span-4">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>Você tem {upcomingAppointments.length} agendamentos para os próximos dias</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eb07a4]"></div>
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-[#eb07a4]/10 p-2">
                        <Users className="h-4 w-4 text-[#eb07a4]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{appointment.clients?.name || "Cliente"}</p>
                        <p className="text-xs text-muted-foreground">{appointment.services?.name || "Serviço"}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm">{new Date(appointment.start_time).toLocaleDateString("pt-BR")}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(appointment.start_time).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div
                        className={`rounded-full px-2 py-1 text-xs ${
                          appointment.status === "confirmed"
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                            : appointment.status === "pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100"
                              : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                        }`}
                      >
                        {appointment.status === "confirmed"
                          ? "Confirmado"
                          : appointment.status === "pending"
                            ? "Pendente"
                            : "Cancelado"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Nenhum agendamento próximo</div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-7 md:col-span-3">
          <CardHeader>
            <CardTitle>Agendamentos Concluídos</CardTitle>
            <CardDescription>Últimos {completedAppointments.length} agendamentos concluídos</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eb07a4]"></div>
              </div>
            ) : completedAppointments.length > 0 ? (
              <div className="space-y-4">
                {completedAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="rounded-full bg-green-100 dark:bg-green-800 p-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{appointment.clients?.name || "Cliente"}</p>
                        <p className="text-xs text-muted-foreground">{appointment.services?.name || "Serviço"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{new Date(appointment.start_time).toLocaleDateString("pt-BR")}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.start_time).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Nenhum agendamento concluído</div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <MetricsChart />
      </div>
    </div>
  )
}

