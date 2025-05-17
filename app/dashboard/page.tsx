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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { User as SupabaseUser } from "@supabase/auth-helpers-nextjs"

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

interface User extends SupabaseUser {
  full_name?: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([])
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchUser()
    fetchBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      fetchStats()
      fetchUpcomingAppointments()
      fetchCompletedAppointments()
    }
  }, [selectedBusiness])

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

  async function fetchBusinesses() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const { data, error } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        setBusinesses(data as Business[])
        setSelectedBusiness(data[0].id)
      }
    } catch (error) {
      console.error("Error fetching businesses:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus negócios.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchStats() {
    if (!selectedBusiness) return

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("status")
        .eq("business_id", selectedBusiness)

      if (error) throw error

      const stats = {
        total: data.length,
        pending: data.filter((a) => a.status === "pending").length,
        confirmed: data.filter((a) => a.status === "confirmed").length,
        cancelled: data.filter((a) => a.status === "cancelled").length,
        completed: data.filter((a) => a.status === "completed").length,
      }

      setStats(stats)
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas.",
        variant: "destructive",
      })
    }
  }

  async function fetchUpcomingAppointments() {
    if (!selectedBusiness) return

    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients (*),
          services (*)
        `)
        .eq("business_id", selectedBusiness)
        .gte("start_time", now)
        .in("status", ["pending", "confirmed"])
        .order("start_time", { ascending: true })
        .limit(5)

      if (error) throw error

      setUpcomingAppointments(data || [])
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os próximos agendamentos.",
        variant: "destructive",
      })
    }
  }

  async function fetchCompletedAppointments() {
    if (!selectedBusiness) return

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          clients (*),
          services (*)
        `)
        .eq("business_id", selectedBusiness)
        .eq("status", "completed")
        .order("start_time", { ascending: false })
        .limit(5)

      if (error) throw error

      setCompletedAppointments(data || [])
    } catch (error) {
      console.error("Error fetching completed appointments:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos concluídos.",
        variant: "destructive",
      })
    }
  }

  // Função para obter o primeiro nome do usuário
  const getFirstName = (fullName?: string | null) => {
    if (!fullName) return "Visitante"
    return fullName.split(" ")[0]
  }

  if (isLoading) {
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

        <div className="w-full max-w-xs">
          <Select
            value={selectedBusiness || undefined}
            onValueChange={(value) => setSelectedBusiness(value)}
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
                <CardDescription>
                  {upcomingAppointments.length === 0
                    ? "Nenhum agendamento próximo"
                    : `${upcomingAppointments.length} ${
                        upcomingAppointments.length === 1 ? "agendamento próximo" : "agendamentos próximos"
                      }`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Adicione novos agendamentos para visualizá-los aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{appointment.clients?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(appointment.start_time), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                        <Button variant="outline" asChild>
                          <Link href={`/dashboard/agendamentos/${appointment.id}`}>Ver detalhes</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agendamentos Concluídos</CardTitle>
                <CardDescription>
                  {completedAppointments.length === 0
                    ? "Nenhum agendamento concluído"
                    : `${completedAppointments.length} ${
                        completedAppointments.length === 1 ? "agendamento concluído" : "agendamentos concluídos"
                      }`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Os agendamentos concluídos aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{appointment.clients?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(appointment.start_time), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>
                        <Button variant="outline" asChild>
                          <Link href={`/dashboard/agendamentos/${appointment.id}`}>Ver detalhes</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <MetricsChart businessId={selectedBusiness} />
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

