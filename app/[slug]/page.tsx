"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { format, isSameDay, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface TimeSlot {
  id: string
  business_id: string
  day_of_week: number
  time: string
}

interface AppointmentWithRelations {
  id: string
  start_time: string
  end_time: string
  client: {
    name: string
  }
  service: {
    name: string
    duration: number
  }
}

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
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
})

export default function PublicAppointmentPage() {
  const [services, setServices] = useState<Service[]>([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [workingDays, setWorkingDays] = useState<number[]>([])
  const [disabledDates, setDisabledDates] = useState<Date[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      serviceId: "",
      date: new Date(),
      time: "",
      notes: "",
    },
  })

  useEffect(() => {
    fetchBusiness()
  }, [])

  const fetchBusiness = async () => {
    try {
      const { data: business, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", params.slug)
        .single()

      if (error) throw error

      if (!business) {
        toast({
          title: "Erro",
          description: "Negócio não encontrado.",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      setBusinessId(business.id)
      await Promise.all([
        fetchServices(business.id),
        fetchWorkingDays(business.id),
        fetchHolidays(business.id),
        fetchTimeSlots(business.id)
      ])
    } catch (error) {
      console.error("Error fetching business:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar o negócio.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchServices = async (businessId: string) => {
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

  const fetchWorkingDays = async (businessId: string) => {
    try {
      // Primeiro, buscar os horários para todos os dias
      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("business_id", businessId)
        .order("day_of_week")
        .order("time")

      if (timeSlotsError) {
        console.error("Erro ao buscar horários:", timeSlotsError)
        throw timeSlotsError
      }

      setTimeSlots(timeSlotsData || [])

      // Depois, buscar os dias de trabalho
      const { data: workingDaysData, error: workingDaysError } = await supabase
        .from("working_days")
      .select("*")
        .eq("business_id", businessId)

      if (workingDaysError) {
        console.error("Erro ao buscar dias de trabalho:", workingDaysError)
        throw workingDaysError
      }

      // Se não houver dias configurados, usar os dias que têm horários cadastrados
      if (!workingDaysData || workingDaysData.length === 0) {
        const daysWithSlots = [...new Set(timeSlotsData?.map(slot => slot.day_of_week) || [])]
        setWorkingDays(daysWithSlots.length > 0 ? daysWithSlots : [1, 2, 3, 4, 5])
        return
      }

      // Caso contrário, usar os dias marcados como dias de trabalho
      const availableDays = workingDaysData
        .filter(day => day.is_working_day)
        .map(day => day.day_of_week)
      
      setWorkingDays(availableDays)

    } catch (error) {
      console.error("Error fetching working days and time slots:", error)
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar os dias e horários disponíveis.",
        variant: "destructive",
      })
      // Em caso de erro, define os dias úteis como padrão
      setWorkingDays([1, 2, 3, 4, 5])
    }
  }

  const fetchHolidays = async (businessId: string) => {
    try {
      const { data: holidays, error } = await supabase
      .from("holidays")
      .select("*")
        .eq("business_id", businessId)

      if (error) throw error

      const holidayDates = holidays?.map(holiday => new Date(holiday.date)) || []
      setDisabledDates(holidayDates)
    } catch (error) {
      console.error("Error fetching holidays:", error)
      toast({
        title: "Erro ao carregar feriados",
        description: "Não foi possível carregar os feriados.",
        variant: "destructive",
      })
    }
  }

  const fetchTimeSlots = async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("business_id", businessId)
        .order("day_of_week")
        .order("time")

      if (error) throw error
      setTimeSlots(data || [])
    } catch (error) {
      console.error("Error fetching time slots:", error)
      toast({
        title: "Erro ao carregar horários",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      })
    }
  }

  const checkTimeSlotAvailability = async (date: Date, time: string, serviceId: string): Promise<boolean> => {
    try {
      // Get service duration
      const selectedService = services.find((s) => s.id === serviceId)
      if (!selectedService) return false
      
      const duration = selectedService.duration || 60 // Default duration: 60 minutes

      // Calculate start and end times for the new appointment
      const [hours, minutes] = time.split(":")
      const startTime = new Date(date)
      startTime.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10), 0, 0)
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + duration)

      // Verificar se o horário está dentro do horário de funcionamento
      const dayOfWeek = startTime.getDay()
      const timeSlot = timeSlots.find(
        slot => slot.day_of_week === dayOfWeek && slot.time === time
      )
      
      if (!timeSlot) {
        toast({
          title: "Horário indisponível",
          description: "Este horário não está configurado para atendimento.",
          variant: "destructive",
        })
        return false
      }

      // Buscar TODOS os agendamentos que possam conflitar com o novo horário
      const { data: conflicts, error } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          end_time,
          client:clients(name),
          service:services(name, duration)
        `)
        .eq("business_id", businessId)
        .in("status", ["pending", "confirmed"]) // Apenas agendamentos pendentes ou confirmados
        .or(
          `and(start_time.lte.${endTime.toISOString()},end_time.gt.${startTime.toISOString()}),` + // Conflito no início
          `and(start_time.lt.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})` // Conflito no fim
        )
        .returns<AppointmentWithRelations[]>()

      if (error) {
        console.error("Erro ao verificar disponibilidade:", error)
        throw error
      }

      // Se houver conflitos, mostrar detalhes do primeiro conflito
      if (conflicts && conflicts.length > 0) {
        const conflict = conflicts[0]
        const conflictStart = new Date(conflict.start_time)
        const conflictEnd = new Date(conflict.end_time)

        toast({
          title: "Horário ocupado",
          description: `Este horário já está reservado (${format(conflictStart, 'HH:mm')} às ${format(conflictEnd, 'HH:mm')})`,
          variant: "destructive",
        })
        return false
      }

      return true
    } catch (error) {
      console.error("Erro ao verificar disponibilidade:", error)
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar a disponibilidade do horário.",
        variant: "destructive",
      })
      return false
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!businessId) {
      toast({
        title: "Erro",
        description: "Negócio não encontrado.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Primeiro criar o cliente
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .upsert({
          business_id: businessId,
          name: data.name,
          email: data.email,
          phone: data.phone,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Verificar disponibilidade antes de criar o agendamento
      const isAvailable = await checkTimeSlotAvailability(data.date, data.time, data.serviceId)
      
      if (!isAvailable) {
        setIsLoading(false)
        return
      }

      // Combinar data e hora para start_time
      const [hours, minutes] = data.time.split(":")
      const startTime = new Date(data.date)
      startTime.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10), 0, 0)

      // Calcular hora de término com base na duração do serviço
      const selectedService = services.find((s) => s.id === data.serviceId)
      const duration = selectedService?.duration || 60

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + duration)

      // Verificar novamente a disponibilidade antes de inserir
      // (double-check para evitar race conditions)
      const isStillAvailable = await checkTimeSlotAvailability(data.date, data.time, data.serviceId)
      
      if (!isStillAvailable) {
        setIsLoading(false)
        return
      }

      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          business_id: businessId,
          client_id: client.id,
          service_id: data.serviceId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          notes: data.notes,
          status: "pending", // Agendamentos públicos sempre começam como pendentes
        })

      if (appointmentError) throw appointmentError

      toast({
        title: "Agendamento criado",
        description: "Seu agendamento foi criado com sucesso! Aguarde a confirmação.",
        variant: "success",
      })

      router.push(`/${params.slug}/sucesso`)
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

  const generateAvailableTimes = async (date: Date) => {
    if (!businessId || !date) {
      setAvailableTimes([])
      return
    }

    try {
      // Obter os horários do dia da semana selecionado
      const dayOfWeek = date.getDay()
      const dayTimeSlots = timeSlots
        .filter(slot => slot.day_of_week === dayOfWeek)
        .map(slot => slot.time)
        .sort()

      if (dayTimeSlots.length === 0) {
        setAvailableTimes([])
        return
      }

      // Buscar agendamentos existentes para o dia
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: existingAppointments, error } = await supabase
        .from("appointments")
        .select("start_time")
        .eq("business_id", businessId)
        .gte("start_time", startOfDay.toISOString())
        .lt("start_time", endOfDay.toISOString())
        .in("status", ["pending", "confirmed"])

      if (error) throw error

      // Obter os horários ocupados
      const occupiedTimes = new Set(
        existingAppointments?.map(app => format(new Date(app.start_time), "HH:mm")) || []
      )

      // Filtrar horários disponíveis
      const now = new Date()
      const availableTimeSlots = dayTimeSlots.filter(time => {
        // Se for hoje, verificar se o horário já passou
        if (isSameDay(date, now)) {
          const [hours, minutes] = time.split(":")
          const slotTime = new Date(date)
          slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          if (isBefore(slotTime, now)) {
            return false
          }
        }

        // Verificar se o horário está ocupado
        return !occupiedTimes.has(time)
      })

      setAvailableTimes(availableTimeSlots)
    } catch (error) {
      console.error("Error generating available times:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      })
      setAvailableTimes([])
    }
  }

  const isDateDisabled = (date: Date): boolean => {
    if (!businessId) return true

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Verifica se a data é anterior a hoje
    if (isBefore(date, today)) {
      return true
    }

    // Verifica se é um dia de trabalho
    const dayOfWeek = date.getDay()
    if (!workingDays.includes(dayOfWeek)) {
      return true
    }

    // Verifica se é feriado - usando comparação mais precisa
    const isHoliday = disabledDates.some((disabledDate) => {
    return (
        disabledDate.getFullYear() === date.getFullYear() &&
        disabledDate.getMonth() === date.getMonth() &&
        disabledDate.getDate() === date.getDate()
      )
    })
    if (isHoliday) {
      return true
    }

    // Verifica se tem horários configurados para este dia
    const dayTimeSlots = timeSlots.filter(slot => slot.day_of_week === dayOfWeek)
    if (!dayTimeSlots || dayTimeSlots.length === 0) {
      return true
    }

    return false
  }

  return (
    <div className="mx-auto max-w-[42rem]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Agendar Horário</CardTitle>
          <CardDescription>Preencha suas informações e escolha o melhor horário.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Nome</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Email</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Telefone</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="tel" placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Serviço</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="serviceId"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um serviço" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.name} - R$ {service.price.toFixed(2).replace(".", ",")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Data</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
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
                              onSelect={(date) => {
                                field.onChange(date)
                                if (date) {
                                  generateAvailableTimes(date)
                                }
                              }}
                              disabled={isDateDisabled}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Horário</span>
                  </div>
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um horário" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableTimes.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Observações</span>
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Adicione observações sobre o agendamento"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Informações adicionais sobre o agendamento.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Agendando..." : "Agendar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
