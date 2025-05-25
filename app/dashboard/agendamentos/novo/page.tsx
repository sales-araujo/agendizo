"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format, isSameDay, isBefore } from "date-fns"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import * as z from "zod"
import { DayProps, DayPicker } from "react-day-picker"
import { useSettings } from '@/lib/contexts/settings-context'

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

interface TimeSlot {
  id: string
  business_id: string
  day_of_week: number
  time: string
}

interface FormData {
  clientId: string
  serviceId: string
  date: Date
  time: string
  notes?: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { selectedBusiness } = useSettings()
  const [workingDays, setWorkingDays] = useState<number[]>([])
  const [disabledDates, setDisabledDates] = useState<Date[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [disabledDays, setDisabledDays] = useState<Date[]>([])
  const [availableTimesByDate, setAvailableTimesByDate] = useState<{ [key: string]: string[] }>({})
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

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
      date: undefined,
      time: "",
      notes: "",
      status: "pending",
    },
  })

  useEffect(() => {
    if (selectedBusiness?.id) {
      Promise.all([
        fetchClients(selectedBusiness.id),
        fetchServices(selectedBusiness.id),
        fetchWorkingDays(selectedBusiness.id),
        fetchHolidays(selectedBusiness.id)
      ]).then(() => {
        findNextAvailableDate()
        setShowDatePicker(true)
      })
    } else {
      setShowDatePicker(false)
      setClients([])
      setServices([])
      setWorkingDays([])
      setDisabledDates([])
      setTimeSlots([])
      setInitialDate(null)
      setAvailableTimes([])
      form.reset({
        clientId: "",
        serviceId: "",
        date: undefined,
        time: "",
        notes: "",
        status: "pending"
      })
    }
    // eslint-disable-next-line
  }, [selectedBusiness?.id])

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

  const updateAvailableDates = async () => {
    const today = new Date()
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 2)
    
    const availableTimes: { [key: string]: string[] } = {}
    const currentDate = new Date(today)

    while (currentDate <= nextMonth) {
      const times = await getAvailableTimesForDate(currentDate)
      const dateKey = format(currentDate, 'yyyy-MM-dd')
      availableTimes[dateKey] = times
      currentDate.setDate(currentDate.getDate() + 1)
    }

    setAvailableTimesByDate(availableTimes)
  }

  const getAvailableTimesForDate = async (date: Date): Promise<string[]> => {
    if (!selectedBusiness?.id) return []

    const dayOfWeek = date.getDay()

    // Verificar se é um dia de trabalho
    if (!workingDays.includes(dayOfWeek)) {
      return []
    }

    // Verificar se é feriado
    if (disabledDates.some((disabledDate) => isSameDay(date, disabledDate))) {
      return []
    }

    // Filtrar os horários para este dia da semana e remover os segundos
    const dayTimeSlots = timeSlots
      .filter(slot => slot.day_of_week === dayOfWeek)
      .map(slot => {
        // Se o horário já estiver no formato HH:mm, retorna como está
        if (/^\d{2}:\d{2}$/.test(slot.time)) {
          return slot.time
        }
        // Se tiver segundos (HH:mm:ss), remove os segundos
        if (/^\d{2}:\d{2}:\d{2}$/.test(slot.time)) {
          return slot.time.substring(0, 5)
        }
        return slot.time
      })
      .sort()

    if (!dayTimeSlots || dayTimeSlots.length === 0) {
      return []
    }

    // Buscar agendamentos existentes para o dia
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: existingAppointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("start_time")
      .eq("business_id", selectedBusiness.id)
      .gte("start_time", startOfDay.toISOString())
      .lt("start_time", endOfDay.toISOString())
      .in("status", ["pending", "confirmed"]) // Apenas agendamentos pendentes ou confirmados

    if (appointmentsError) {
      console.error("Erro ao buscar agendamentos:", appointmentsError)
      return []
    }

    // Obter os horários ocupados (formato HH:mm)
    const occupiedTimes = new Set(
      existingAppointments?.map(app => {
        const date = new Date(app.start_time)
        return format(date, "HH:mm")
      }) || []
    )

    // Filtrar horários disponíveis
    const now = new Date()
    return dayTimeSlots.filter(time => {
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
  }

  const isDateDisabled = (date: Date): boolean => {
    if (!selectedBusiness?.id || !showDatePicker) return true

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

  const generateAvailableTimes = async (date: Date) => {
    if (!selectedBusiness?.id || !date) {
      setAvailableTimes([])
      return
    }

    const times = await getAvailableTimesForDate(date)
    setAvailableTimes(times)
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
      if (!selectedBusiness?.id) return false;
      const { data: conflicts, error } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          end_time,
          client:clients(name),
          service:services(name, duration)
        `)
        .eq("business_id", selectedBusiness.id)
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

  const onSubmit = async (data: FormData) => {
    if (!selectedBusiness?.id) {
      toast({
        title: "Erro",
        description: "Nenhum negócio selecionado.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Verificação dupla de disponibilidade antes de criar o agendamento
      const isAvailable = await checkTimeSlotAvailability(data.date, data.time, data.serviceId)
      
      if (!isAvailable) {
        setIsSubmitting(false)
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
        setIsSubmitting(false)
        return
      }

      const { error } = await supabase.from("appointments").insert([
        {
          business_id: selectedBusiness.id,
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
      setIsSubmitting(false)
    }
  }

  const getDisabledReason = (date: Date): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (isBefore(date, today)) {
      return "Data já passou"
    }

    const dayOfWeek = date.getDay()
    if (!workingDays.includes(dayOfWeek)) {
      return "Não é um dia de atendimento"
    }

    const isHoliday = disabledDates.some((disabledDate) => isSameDay(date, disabledDate))
    if (isHoliday) {
      return "Feriado"
    }

    return ""
  }

  // Função para verificar se é um dia de trabalho
  const isDayOfWeek = (date: Date): boolean => {
    const dayOfWeek = date.getDay()
    return workingDays.includes(dayOfWeek)
  }

  const updateDisabledDays = async () => {
    const today = new Date()
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 2)
    
    const disabledDays: Date[] = []
    const currentDate = new Date(today)

    while (currentDate <= nextMonth) {
      if (await shouldDisableDate(currentDate)) {
        disabledDays.push(new Date(currentDate))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    setDisabledDays(disabledDays)
  }

  const shouldDisableDate = async (date: Date): Promise<boolean> => {
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

    // Verifica se é feriado
    if (disabledDates.some((disabledDate) => isSameDay(date, disabledDate))) {
      return true
    }

    // Verifica se existem horários configurados para este dia
    const dayTimeSlots = timeSlots.filter(slot => slot.day_of_week === dayOfWeek)
    if (!dayTimeSlots || dayTimeSlots.length === 0) {
      return true
    }

    // Buscar agendamentos existentes para verificar disponibilidade
    if (!selectedBusiness?.id) return true

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("start_time")
      .eq("business_id", selectedBusiness.id)
      .gte("start_time", startOfDay.toISOString())
      .lt("start_time", endOfDay.toISOString())
      .in("status", ["pending", "confirmed"])

    // Se todos os horários estiverem ocupados, desabilita a data
    const occupiedTimes = new Set(
      existingAppointments?.map(app => format(new Date(app.start_time), "HH:mm")) || []
    )

    const availableTimeSlots = dayTimeSlots.filter(slot => !occupiedTimes.has(slot.time))
    return availableTimeSlots.length === 0
  }

  const findNextAvailableDate = async () => {
    const today = new Date()
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 2)
    
    let currentDate = new Date(today)

    while (currentDate <= nextMonth) {
      const availableTimes = await getAvailableTimesForDate(currentDate)
      if (availableTimes.length > 0) {
        setInitialDate(currentDate)
        form.setValue('date', currentDate)
        generateAvailableTimes(currentDate)
        break
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }

  return (
    <div className="mx-auto max-w-[42rem]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Novo Agendamento</CardTitle>
          <CardDescription>Preencha as informações para criar um novo agendamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Cliente</span>
                </div>
                <FormField
                  control={form.control}
                  name="clientId"
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

              {showDatePicker && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Serviço</span>
                      </div>
                      <FormField
                        control={form.control}
                        name="serviceId"
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
                                  selected={field.value || initialDate}
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
                            <Select onValueChange={field.onChange} value={field.value}>
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
                </>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/agendamentos')}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Agendando..." : "Agendar"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
