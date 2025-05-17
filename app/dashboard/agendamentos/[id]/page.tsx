"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { format, isSameDay, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, CheckCircle, CalendarIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "@/components/ui/use-toast"

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

interface Appointment {
  id: string
  client_id: string
  service_id: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  business_id: string
  client: Client
  service: Service
}

interface FormData {
  client_id: string
  service_id: string
  date: Date
  time: string
  status: string
  notes?: string
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
  client_id: z.string().min(1, {
    message: "Por favor, selecione um cliente.",
  }),
  service_id: z.string().min(1, {
    message: "Por favor, selecione um serviço.",
  }),
  date: z.date({
    required_error: "Por favor, selecione uma data.",
  }),
  time: z.string().min(1, {
    message: "Por favor, selecione um horário.",
  }),
  status: z.string().min(1, {
    message: "Por favor, selecione um status.",
  }),
  notes: z.string().optional(),
})

export default function EditAppointmentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [workingDays, setWorkingDays] = useState<number[]>([])
  const [disabledDates, setDisabledDates] = useState<Date[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [originalTime, setOriginalTime] = useState<string>("")

  const supabase = createClientComponentClient<Database>()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: "",
      service_id: "",
      date: undefined,
      time: "",
      status: "",
      notes: "",
    },
  })

  useEffect(() => {
    fetchAppointment()
  }, [id])

  useEffect(() => {
    if (appointment?.business_id) {
      fetchWorkingDays(appointment.business_id)
      fetchHolidays(appointment.business_id)
    }
  }, [appointment?.business_id])

  // Carregar horários disponíveis quando o appointment for carregado
  useEffect(() => {
    if (appointment && form.getValues("date")) {
      generateAvailableTimes(form.getValues("date"))
    }
  }, [appointment])

  async function fetchAppointment() {
    setIsLoading(true)
    try {
      // Fetch appointment details
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select("*, client:clients(*), service:services(*)")
        .eq("id", id)
        .single()

      if (appointmentError) throw appointmentError

      setAppointment(appointmentData)

      // Parse date and time (formato HH:mm)
      const appointmentDate = new Date(appointmentData.start_time)
      const formattedTime = format(appointmentDate, "HH:mm") // Já garante o formato HH:mm

      // Set form values
      form.reset({
        client_id: appointmentData.client_id,
        service_id: appointmentData.service_id,
        date: appointmentDate,
        time: formattedTime,
        status: appointmentData.status,
        notes: appointmentData.notes || "",
      })

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase.from("clients").select("*").order("name")

      if (clientsError) throw clientsError
      setClients(clientsData)

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase.from("services").select("*").order("name")

      if (servicesError) throw servicesError
      setServices(servicesData)

      // Gerar horários disponíveis para a data do agendamento
      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("business_id", appointmentData.business_id)
        .eq("day_of_week", appointmentDate.getDay())
        .order("time")

      if (timeSlotsError) throw timeSlotsError

      // Definir os horários iniciais no formato HH:mm
      const initialTimeSlots = timeSlotsData?.map(slot => {
        // Se o horário já estiver no formato HH:mm, retorna como está
        if (/^\d{2}:\d{2}$/.test(slot.time)) {
          return slot.time
        }
        // Se tiver segundos (HH:mm:ss), remove os segundos
        if (/^\d{2}:\d{2}:\d{2}$/.test(slot.time)) {
          return slot.time.substring(0, 5)
        }
        return slot.time
      }) || []
      
      if (formattedTime && !initialTimeSlots.includes(formattedTime)) {
        initialTimeSlots.push(formattedTime)
      }
      setAvailableTimes(initialTimeSlots.sort())

      setOriginalTime(formattedTime)

    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do agendamento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchWorkingDays(businessId: string) {
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

  async function fetchHolidays(businessId: string) {
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

  const generateAvailableTimes = async (date: Date) => {
    if (!appointment?.business_id) return

    try {
      // Obter os horários do dia da semana selecionado
      const dayOfWeek = date.getDay()
      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("business_id", appointment.business_id)
        .eq("day_of_week", dayOfWeek)
        .order("time")

      if (timeSlotsError) throw timeSlotsError

      // Garantir que os horários estejam no formato HH:mm
      const dayTimeSlots = timeSlotsData?.map(slot => {
        // Se o horário já estiver no formato HH:mm, retorna como está
        if (/^\d{2}:\d{2}$/.test(slot.time)) {
          return slot.time
        }
        // Se tiver segundos (HH:mm:ss), remove os segundos
        if (/^\d{2}:\d{2}:\d{2}$/.test(slot.time)) {
          return slot.time.substring(0, 5)
        }
        return slot.time
      }) || []

      if (dayTimeSlots.length === 0) {
        // Se não houver horários disponíveis, manter apenas o horário atual
        const currentTime = form.getValues("time")
        setAvailableTimes(currentTime ? [currentTime] : [])
        return
      }

      // Filtrar horários já ocupados
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const { data: existingAppointments, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("business_id", appointment.business_id)
        .neq("status", "cancelled")
        .neq("id", id) // Excluir o agendamento atual
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())

      if (error) throw error

      // Filtrar horários disponíveis
      const availableTimeSlots = dayTimeSlots.filter(time => {
        const [hours, minutes] = time.split(":")
        const slotTime = new Date(date)
        slotTime.setHours(Number(hours), Number(minutes), 0, 0)

        // Verificar se o horário já está ocupado
        return !existingAppointments?.some(app => {
          const appointmentStart = new Date(app.start_time)
          const appointmentEnd = new Date(app.end_time)
          return slotTime >= appointmentStart && slotTime < appointmentEnd
        })
      })

      // Adicionar o horário atual se ele não estiver na lista e a data for a mesma do agendamento
      const currentTime = form.getValues("time")
      const currentDate = form.getValues("date")
      if (currentTime && 
          currentDate && 
          isSameDay(currentDate, date) && 
          !availableTimeSlots.includes(currentTime)) {
        availableTimeSlots.push(currentTime)
      }

      // Ordenar os horários
      setAvailableTimes(availableTimeSlots.sort())
    } catch (error) {
      console.error("Error generating available times:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis.",
        variant: "destructive",
      })
    }
  }

  const isDateDisabled = (date: Date): boolean => {
    // Verificar se é um dia de trabalho
    const dayOfWeek = date.getDay()
    if (!workingDays.includes(dayOfWeek)) return true

    // Verificar se é feriado - usando comparação mais precisa
    const isHoliday = disabledDates.some((disabledDate) => {
      return (
        disabledDate.getFullYear() === date.getFullYear() &&
        disabledDate.getMonth() === date.getMonth() &&
        disabledDate.getDate() === date.getDate()
      )
    })
    if (isHoliday) return true

    // Verificar se é uma data passada
    if (isBefore(date, new Date())) return true

    return false
  }

  const checkTimeSlotAvailability = async (date: Date, time: string, serviceId: string, excludeAppointmentId: string): Promise<boolean> => {
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
      const timeSlot = timeSlots.find(slot => {
        // Normalizar o horário do slot para HH:mm
        const slotTime = slot.time.substring(0, 5) // Pega apenas HH:mm
        return slot.day_of_week === dayOfWeek && slotTime === time
      })
      
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
        .eq("business_id", appointment?.business_id)
        .neq("id", excludeAppointmentId) // Excluir o agendamento atual
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
          description: `Já existe um agendamento para ${conflict.client.name} das ${format(conflictStart, 'HH:mm')} às ${format(conflictEnd, 'HH:mm')}`,
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

  const onSubmit = async (values: FormData) => {
    setIsSaving(true)
    try {
      // Se o horário foi alterado, verificar disponibilidade
      if (values.time !== originalTime) {
        const isAvailable = await checkTimeSlotAvailability(values.date, values.time, values.service_id, id)
        
        if (!isAvailable) {
        setIsSaving(false)
        return
        }
      }

      // Combinar data e hora para start_time
      const [hours, minutes] = values.time.split(":")
      const startTime = new Date(values.date)
      startTime.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10), 0, 0)

      // Calcular hora de término com base na duração do serviço
      const selectedService = services.find((s) => s.id === values.service_id)
      const duration = selectedService?.duration || 60

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + duration)

      // Verificar novamente a disponibilidade antes de atualizar
      // (double-check para evitar race conditions)
      if (values.time !== originalTime) {
        const isStillAvailable = await checkTimeSlotAvailability(values.date, values.time, values.service_id, id)
        
        if (!isStillAvailable) {
          setIsSaving(false)
          return
        }
      }

      // Update appointment
      const { error } = await supabase
        .from("appointments")
        .update({
          client_id: values.client_id,
          service_id: values.service_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: values.status,
          notes: values.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi atualizado com sucesso.",
        variant: "success",
      })

      router.push("/dashboard/agendamentos")
    } catch (error) {
      console.error("Error updating appointment:", error)
      toast({
        title: "Erro ao atualizar agendamento",
        description: "Não foi possível atualizar o agendamento.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleComplete = async () => {
    try {
      setIsCompleting(true)

      // Obter a sessão atual do Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        throw new Error("Erro de autenticação")
      }

      const response = await fetch(`/api/appointments/${id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao concluir agendamento")
      }

      toast({
        title: "Agendamento concluído",
        description: "O agendamento foi marcado como concluído e o cliente receberá um email para avaliação.",
        variant: "success",
      })

      router.push("/dashboard/agendamentos")
    } catch (error) {
      console.error("Erro ao concluir agendamento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível concluir o agendamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <Card className="max-w-[42rem] mx-auto">
        <CardHeader>
          <CardTitle>Detalhes do Agendamento</CardTitle>
          <CardDescription>Atualize as informações do agendamento conforme necessário.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Cliente</span>
                  </div>
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
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
                    <span className="text-sm font-medium">Serviço</span>
                  </div>
                <FormField
                  control={form.control}
                  name="service_id"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                              locale={ptBR}
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
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          defaultValue={field.value}
                        >
                      <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um horário">
                                {field.value ? field.value : "Selecione um horário"}
                              </SelectValue>
                            </SelectTrigger>
                      </FormControl>
                          <SelectContent>
                            {availableTimes.length > 0 ? (
                              availableTimes.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none text-muted-foreground">
                                Nenhum horário disponível
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status</span>
                  </div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                {appointment && appointment.status !== "completed" && appointment.status !== "cancelled" && (
                  <Button
                    type="button"
                    onClick={handleComplete}
                    disabled={isCompleting}
                    className="bg-green-500 text-white hover:bg-green-600"
                  >
                    {isCompleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Concluindo...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Concluir
                      </>
                    )}
                  </Button>
                )}
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
