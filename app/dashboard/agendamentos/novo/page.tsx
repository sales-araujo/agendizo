"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Clock, User, Scissors, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

interface Client {
  id: string
  name: string
  email: string
  phone?: string
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

interface FormData {
  clientId: string
  serviceId: string
  date: Date
  time: string
  notes?: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
}

const formSchema = z.object({
  clientId: z.string({
    required_error: "Por favor, selecione um cliente.",
  }),
  serviceId: z.string({
    required_error: "Por favor, selecione um serviço.",
  }),
  date: z.date({
    required_error: "Por favor, selecione uma data.",
  }),
  time: z.string({
    required_error: "Por favor, selecione um horário.",
  }),
  notes: z.string().optional(),
  status: z
    .enum(["pending", "confirmed", "cancelled", "completed"], {
      required_error: "Por favor, selecione um status.",
    })
    .default("pending"),
})

export default function NewAppointmentPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()

  const clientParam = searchParams.get("client")
  const serviceParam = searchParams.get("service")

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: clientParam || "",
      serviceId: serviceParam || "",
      date: new Date(),
      time: "",
      notes: "",
      status: "pending",
    },
  })

  useEffect(() => {
    fetchBusinesses()
  }, [])

  async function fetchBusinesses() {
    setIsLoading(true)
    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData?.user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        setBusinessId(data[0].id)
        await Promise.all([fetchClients(data[0].id), fetchServices(data[0].id)])
      } else {
        toast({
          title: "Nenhum negócio encontrado",
          description: "Você precisa criar um negócio antes de adicionar agendamentos.",
          variant: "destructive",
        })
        router.push("/dashboard/negocios/novo")
      }
    } catch (error) {
      console.error("Error fetching businesses:", error)
      toast({
        title: "Erro ao carregar negócios",
        description: "Não foi possível carregar seus negócios.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchClients(businessId: string) {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("business_id", businessId)
        .order("name", { ascending: true })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      })
    }
  }

  async function fetchServices(businessId: string) {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .order("name", { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error("Error fetching services:", error)
      toast({
        title: "Erro ao carregar serviços",
        description: "Não foi possível carregar a lista de serviços.",
        variant: "destructive",
      })
    }
  }

  // Gerar horários disponíveis (das 8h às 18h, a cada 30 minutos)
  useEffect(() => {
    const times = []
    for (let hour = 8; hour < 19; hour++) {
      for (const minute of [0, 30]) {
        if (hour === 18 && minute === 30) continue // Não incluir 18:30
        const formattedHour = hour.toString().padStart(2, "0")
        const formattedMinute = minute.toString().padStart(2, "0")
        times.push(`${formattedHour}:${formattedMinute}`)
      }
    }
    setAvailableTimes(times)
  }, [])

  const checkTimeSlotAvailability = async (date: Date, time: string, serviceId: string, excludeAppointmentId?: string) => {
    try {
      // Get service duration
      const selectedService = services.find((s) => s.id === serviceId)
      const duration = selectedService?.duration || 60 // Default duration: 60 minutes

      // Calculate start and end times
      const [hours, minutes] = time.split(":")
      const startTime = new Date(date)
      startTime.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10), 0, 0)
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + duration)

      // Check for conflicts with active appointments only
      const { data: conflicts, error } = await supabase
        .from("appointments")
        .select(`
          *,
          client:clients(name),
          service:services(name, duration)
        `)
        .eq("business_id", businessId)
        .in("status", ["pending", "confirmed"]) // Only check against pending and confirmed appointments
        .or(`and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`)

      if (error) {
        console.error("Error checking conflicts:", error)
        throw error
      }

      // Filter out the current appointment if editing
      const filteredConflicts = excludeAppointmentId
        ? conflicts.filter((conflict) => conflict.id !== excludeAppointmentId)
        : conflicts

      return {
        isAvailable: filteredConflicts.length === 0,
        conflicts: filteredConflicts
      }
    } catch (error) {
      console.error("Error checking time slot availability:", error)
      return {
        isAvailable: false,
        conflicts: []
      }
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!businessId) {
      toast({
        title: "Erro",
        description: "Nenhum negócio encontrado. Crie um negócio primeiro.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Check if the time slot is available
      const { isAvailable, conflicts } = await checkTimeSlotAvailability(data.date, data.time, data.serviceId)
      
      if (!isAvailable && conflicts.length > 0) {
        const conflict = conflicts[0]
        const conflictStartTime = format(new Date(conflict.start_time), "HH:mm")
        const conflictEndTime = format(new Date(conflict.end_time), "HH:mm")
        const conflictDate = format(new Date(conflict.start_time), "dd/MM/yyyy")
        
        toast({
          title: "Horário indisponível",
          description: `Já existe um agendamento para o cliente ${conflict.client.name} neste horário (${conflictStartTime} - ${conflictEndTime} - ${conflictDate}). Por favor, escolha outro horário.`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Combinar data e hora
      const [hours, minutes] = data.time.split(":")
      const startTime = new Date(data.date)
      startTime.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10), 0, 0)

      // Calcular hora de término com base na duração do serviço
      const selectedService = services.find((s) => s.id === data.serviceId)
      const duration = selectedService?.duration || 60 // Duração padrão: 60 minutos

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + duration)

      const { error } = await supabase.from("appointments").insert([
        {
          business_id: businessId,
          client_id: data.clientId,
          service_id: data.serviceId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          notes: data.notes,
          status: data.status,
        },
      ])

      if (error) throw error

      toast({
        title: "Agendamento criado",
        description: "O agendamento foi criado com sucesso.",
        variant: "success",
      })

      router.push("/dashboard/agendamentos")
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast({
        title: "Erro ao criar agendamento",
        description: "Não foi possível criar o agendamento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Novo Agendamento</h1>
          <p className="text-muted-foreground">Crie um novo agendamento para um cliente.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Agendamento</CardTitle>
          <CardDescription>Preencha todos os campos para criar um novo agendamento.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eb07a4]"></div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.length === 0 ? (
                              <SelectItem value="no-clients" disabled>
                                Nenhum cliente cadastrado
                              </SelectItem>
                            ) : (
                              clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Selecione o cliente para este agendamento
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serviço</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um serviço" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.length === 0 ? (
                              <SelectItem value="no-services" disabled>
                                Nenhum serviço cadastrado
                              </SelectItem>
                            ) : (
                              services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name} -{" "}
                                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                                    service.price,
                                  )}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription className="flex items-center gap-1">
                          <Scissors className="h-3 w-3" />
                          Selecione o serviço a ser realizado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                disabled={isLoading}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: ptBR })
                                ) : (
                                  <span>Selecione uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          Selecione a data do agendamento
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um horário" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="h-[200px] overflow-y-auto">
                            {availableTimes.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Selecione o horário do agendamento
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Adicione observações ou instruções especiais"
                          className="resize-none"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormDescription className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Opcional: adicione informações relevantes para este agendamento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="bg-[#eb07a4] hover:bg-[#d0069a]"
          >
            {isLoading ? "Criando..." : "Criar Agendamento"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
