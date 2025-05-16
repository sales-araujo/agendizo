"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

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
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [appointment, setAppointment] = useState<Appointment | null>(null)

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

      // Parse date and time
      const appointmentDate = new Date(appointmentData.start_time)
      const formattedTime = format(appointmentDate, "HH:mm")

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

  const checkTimeSlotAvailability = async (date: Date, time: string, serviceId: string) => {
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

      // Check for conflicts
      const { data: conflicts, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("business_id", appointment?.business_id)
        .neq("status", "cancelled")
        .neq("id", id) // Exclude current appointment
        .or(`and(start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()})`)

      if (error) throw error

      return { isAvailable: conflicts.length === 0, conflicts }
    } catch (error) {
      console.error("Error checking time slot availability:", error)
      return { isAvailable: false, conflicts: [] }
    }
  }

  async function onSubmit(values: FormData) {
    setIsSaving(true)
    try {
      // Check if the time slot is available
      const { isAvailable, conflicts } = await checkTimeSlotAvailability(values.date, values.time, values.service_id)
      
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
        setIsSaving(false)
        return
      }

      // Combine date and time
      const dateTime = new Date(values.date)
      const [hours, minutes] = values.time.split(":")
      dateTime.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10))

      // Calculate end time based on service duration
      const selectedService = services.find((s) => s.id === values.service_id)
      const duration = selectedService?.duration || 60 // Default duration: 60 minutes
      const endTime = new Date(dateTime)
      endTime.setMinutes(endTime.getMinutes() + duration)

      // Update appointment
      const { error } = await supabase
        .from("appointments")
        .update({
          client_id: values.client_id,
          service_id: values.service_id,
          start_time: dateTime.toISOString(),
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
        title: "Erro",
        description: "Não foi possível atualizar o agendamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Editar Agendamento</h1>
          <p className="text-muted-foreground">Atualize as informações do agendamento conforme necessário.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Detalhes do Agendamento</CardTitle>
          <CardDescription>Atualize as informações do agendamento conforme necessário.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
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

                <FormField
                  control={form.control}
                  name="service_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
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
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
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
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="confirmado">Confirmado</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                          <SelectItem value="reagendado">Reagendado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
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

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
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
