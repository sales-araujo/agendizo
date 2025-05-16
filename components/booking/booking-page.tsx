"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { format, addDays, isBefore, isAfter, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MapPin, Phone, Mail, ArrowLeft, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

export function BookingPage({ business, services, workingHours, holidays, socialMedia }) {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [availableTimes, setAvailableTimes] = useState([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingReference, setBookingReference] = useState("")
  const [disabledDates, setDisabledDates] = useState([])

  const supabase = createClient()

  useEffect(() => {
    // Configurar datas desabilitadas (passadas e feriados)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const holidayDates = holidays.map((holiday) => new Date(holiday.date))
    setDisabledDates([...holidayDates])
  }, [holidays])

  useEffect(() => {
    if (selectedDate && selectedService) {
      generateAvailableTimes()
    }
  }, [selectedDate, selectedService])

  const generateAvailableTimes = async () => {
    if (!selectedDate || !selectedService) return

    try {
      const dayOfWeek = selectedDate.getDay()
      // Ajustar para o formato que usamos no banco (0 = domingo, 6 = sábado)
      const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1

      // Encontrar o horário de funcionamento para o dia selecionado
      const dayWorkingHours = workingHours.find((wh) => wh.day_of_week === adjustedDayOfWeek)

      if (!dayWorkingHours || !dayWorkingHours.is_open) {
        setAvailableTimes([])
        return
      }

      const openTime = dayWorkingHours.open_time
      const closeTime = dayWorkingHours.close_time
      const lunchStartTime = dayWorkingHours.lunch_start_time
      const lunchEndTime = dayWorkingHours.lunch_end_time

      if (!openTime || !closeTime) {
        setAvailableTimes([])
        return
      }

      // Converter para minutos desde meia-noite para facilitar os cálculos
      const openMinutes = convertTimeToMinutes(openTime)
      const closeMinutes = convertTimeToMinutes(closeTime)
      const lunchStartMinutes = lunchStartTime ? convertTimeToMinutes(lunchStartTime) : null
      const lunchEndMinutes = lunchEndTime ? convertTimeToMinutes(lunchEndTime) : null

      // Duração do serviço em minutos
      const serviceDuration = selectedService.duration || 60
      // Intervalo entre agendamentos
      const bufferTime = 15

      // Gerar horários disponíveis
      const times = []
      let currentMinutes = openMinutes

      while (currentMinutes + serviceDuration <= closeMinutes) {
        // Verificar se o horário está no intervalo de almoço
        const isLunchTime =
          lunchStartMinutes !== null &&
          lunchEndMinutes !== null &&
          currentMinutes >= lunchStartMinutes &&
          currentMinutes < lunchEndMinutes

        if (!isLunchTime) {
          times.push(convertMinutesToTime(currentMinutes))
        }

        // Avançar para o próximo slot
        currentMinutes += bufferTime
      }

      // Verificar agendamentos existentes para o dia selecionado
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const { data: existingAppointments, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("business_id", business.id)
        .eq("date", dateStr)
        .in("status", ["pending", "confirmed"])

      if (error) throw error

      // Filtrar horários que já estão ocupados
      const availableTimes = times.filter((time) => {
        const timeMinutes = convertTimeToMinutes(time)
        const appointmentEndMinutes = timeMinutes + serviceDuration

        // Verificar se há sobreposição com agendamentos existentes
        return !existingAppointments.some((appointment) => {
          const appointmentTimeMinutes = convertTimeToMinutes(appointment.time)
          const appointmentServiceDuration = appointment.duration || 60
          const appointmentEndTimeMinutes = appointmentTimeMinutes + appointmentServiceDuration

          // Verificar sobreposição
          return (
            (timeMinutes >= appointmentTimeMinutes && timeMinutes < appointmentEndTimeMinutes) ||
            (appointmentTimeMinutes >= timeMinutes && appointmentTimeMinutes < appointmentEndMinutes)
          )
        })
      })

      setAvailableTimes(availableTimes)
    } catch (error) {
      console.error("Error generating available times:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários disponíveis. Tente novamente.",
        variant: "destructive",
      })
      setAvailableTimes([])
    }
  }

  const convertTimeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(":").map(Number)
    return hours * 60 + minutes
  }

  const convertMinutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  const handleServiceSelect = (serviceId) => {
    const service = services.find((s) => s.id === serviceId)
    setSelectedService(service)
    setSelectedTime(null)
    setStep(2)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedTime(null)
  }

  const handleTimeSelect = (time) => {
    setSelectedTime(time)
    setStep(3)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validar dados
      if (!formData.name || !formData.email || !formData.phone) {
        throw new Error("Por favor, preencha todos os campos obrigatórios.")
      }

      if (!selectedService || !selectedDate || !selectedTime) {
        throw new Error("Por favor, selecione um serviço, data e horário.")
      }

      // Verificar se o cliente já existe
      const { data: existingClients, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("email", formData.email)
        .eq("business_id", business.id)

      if (clientError) throw clientError

      let clientId

      if (existingClients && existingClients.length > 0) {
        // Atualizar cliente existente
        clientId = existingClients[0].id
        await supabase
          .from("clients")
          .update({
            name: formData.name,
            phone: formData.phone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clientId)
      } else {
        // Criar novo cliente
        const { data: newClient, error: newClientError } = await supabase
          .from("clients")
          .insert({
            business_id: business.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (newClientError) throw newClientError
        clientId = newClient.id
      }

      // Criar agendamento
      const appointmentData = {
        business_id: business.id,
        client_id: clientId,
        service_id: selectedService.id,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        duration: selectedService.duration,
        price: selectedService.price,
        status: "pending",
        notes: formData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert(appointmentData)
        .select()
        .single()

      if (appointmentError) throw appointmentError

      // Gerar referência para o agendamento
      const reference = `AG-${appointment.id.substring(0, 8).toUpperCase()}`
      setBookingReference(reference)
      setBookingComplete(true)
      setStep(4)
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o agendamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetBooking = () => {
    setStep(1)
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setFormData({
      name: "",
      email: "",
      phone: "",
      notes: "",
    })
    setBookingComplete(false)
    setBookingReference("")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-6">
              <h1 className="text-2xl font-bold text-[#eb07a4]">Agendizo</h1>
            </Link>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <h2 className="text-xl font-semibold">{business.name}</h2>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para o início
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Selecione um serviço</CardTitle>
                  <CardDescription>Escolha o serviço que deseja agendar</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.length === 0 ? (
                      <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
                    ) : (
                      services.map((service) => (
                        <div
                          key={service.id}
                          className={`p-4 border rounded-md cursor-pointer hover:border-[#eb07a4] ${
                            selectedService?.id === service.id ? "border-[#eb07a4] bg-[#eb07a4]/5" : ""
                          }`}
                          onClick={() => handleServiceSelect(service.id)}
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(service.price)}
                              </p>
                              <p className="text-sm text-muted-foreground">{service.duration} min</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Selecione a data e horário</CardTitle>
                  <CardDescription>Escolha quando deseja agendar seu serviço</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="mb-2 block">Data</Label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => {
                          // Desabilitar datas passadas
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          if (isBefore(date, today)) return true

                          // Desabilitar datas muito futuras (ex: 3 meses)
                          const maxDate = addDays(today, 90)
                          if (isAfter(date, maxDate)) return true

                          // Desabilitar feriados
                          return disabledDates.some((disabledDate) => isSameDay(date, disabledDate))
                        }}
                        locale={ptBR}
                        className="rounded-md border"
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block">Horário</Label>
                      {!selectedDate ? (
                        <p className="text-muted-foreground">Selecione uma data primeiro</p>
                      ) : availableTimes.length === 0 ? (
                        <p className="text-muted-foreground">Nenhum horário disponível nesta data</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableTimes.map((time) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : "outline"}
                              className={selectedTime === time ? "bg-[#eb07a4] hover:bg-[#d0069a]" : ""}
                              onClick={() => handleTimeSelect(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button
                    className="bg-[#eb07a4] hover:bg-[#d0069a]"
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStep(3)}
                  >
                    Continuar
                  </Button>
                </CardFooter>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Suas informações</CardTitle>
                  <CardDescription>Preencha seus dados para confirmar o agendamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo *</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Alguma informação adicional que devemos saber?"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="rounded-lg bg-muted p-4">
                        <h3 className="font-medium mb-2">Resumo do agendamento</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Serviço:</span>
                            <span className="font-medium">{selectedService?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Data:</span>
                            <span className="font-medium">
                              {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Horário:</span>
                            <span className="font-medium">{selectedTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duração:</span>
                            <span className="font-medium">{selectedService?.duration} minutos</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Preço:</span>
                            <span className="font-medium">
                              {selectedService
                                ? new Intl.NumberFormat("pt-BR", {
                                    style: "currency",
                                    currency: "BRL",
                                  }).format(selectedService.price)
                                : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(2)}>
                        Voltar
                      </Button>
                      <Button type="submit" className="bg-[#eb07a4] hover:bg-[#d0069a]" disabled={isSubmitting}>
                        {isSubmitting ? "Processando..." : "Confirmar agendamento"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Agendamento confirmado!</CardTitle>
                  <CardDescription>Seu agendamento foi realizado com sucesso</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium">Agendamento realizado com sucesso!</h3>
                    <p className="text-center text-muted-foreground">
                      Enviamos um email de confirmação para {formData.email} com os detalhes do seu agendamento.
                    </p>

                    <div className="w-full max-w-md rounded-lg bg-muted p-4 mt-4">
                      <h4 className="font-medium mb-2">Detalhes do agendamento</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Referência:</span>
                          <span className="font-medium">{bookingReference}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Serviço:</span>
                          <span className="font-medium">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Data:</span>
                          <span className="font-medium">
                            {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ""}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Horário:</span>
                          <span className="font-medium">{selectedTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Preço:</span>
                          <span className="font-medium">
                            {selectedService
                              ? new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(selectedService.price)
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button onClick={resetBooking} className="bg-[#eb07a4] hover:bg-[#d0069a]">
                    Fazer novo agendamento
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>{business.name}</CardTitle>
                <CardDescription>{business.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.logo_url && (
                  <div className="flex justify-center mb-4">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden">
                      <Image
                        src={business.logo_url || "/placeholder.svg"}
                        alt={business.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-2 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm">
                        {business.address_street}, {business.address_number}
                        {business.address_complement ? `, ${business.address_complement}` : ""}
                      </p>
                      <p className="text-sm">
                        {business.address_neighborhood}, {business.address_city} - {business.address_state}
                      </p>
                      <p className="text-sm">{business.address_zipcode}</p>
                    </div>
                  </div>

                  {business.phone && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
                      <p className="text-sm">{business.phone}</p>
                    </div>
                  )}

                  {business.email && (
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                      <p className="text-sm">{business.email}</p>
                    </div>
                  )}

                  {business.website && (
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-muted-foreground" />
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Redes sociais */}
                {socialMedia && Object.values(socialMedia).some((value) => value) && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Redes Sociais</h3>
                    <div className="flex space-x-3">
                      {socialMedia.whatsapp && (
                        <a
                          href={`https://wa.me/${socialMedia.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </a>
                      )}
                      {socialMedia.instagram && (
                        <a
                          href={`https://instagram.com/${socialMedia.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-full hover:opacity-90"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                          </svg>
                        </a>
                      )}
                      {socialMedia.facebook && (
                        <a
                          href={`https://facebook.com/${socialMedia.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
