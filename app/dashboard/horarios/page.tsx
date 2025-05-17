"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface Business {
  id: string
  name: string
}

interface TimeSlot {
  id?: string
  business_id: string
  day_of_week: number
  time: string
}

interface WorkingDay {
  id?: string
  business_id: string
  day_of_week: number
  is_working_day: boolean
}

const daysOfWeek = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
]

export default function BusinessHoursPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string>("")
  const [workingDays, setWorkingDays] = useState<number[]>([])
  const [timeSlots, setTimeSlots] = useState<{ [key: number]: string[] }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newTimeSlots, setNewTimeSlots] = useState<{ [key: number]: string }>({})

  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      fetchWorkingDays()
      fetchTimeSlots()
    } else {
      setWorkingDays([])
      setTimeSlots({})
    }
  }, [selectedBusiness])

  const fetchBusinesses = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData?.user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("owner_id", userData.user.id)
        .order("name")

      if (error) throw error

      setBusinesses(data || [])
    } catch (error) {
      console.error("Erro ao carregar negócios:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus negócios.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWorkingDays = async () => {
    try {
      const { data, error } = await supabase
        .from("working_days")
        .select("*")
        .eq("business_id", selectedBusiness)

      if (error) throw error

      const workingDayNumbers = data
        .filter(day => day.is_working_day)
        .map(day => day.day_of_week)

      setWorkingDays(workingDayNumbers)
    } catch (error) {
      console.error("Erro ao carregar dias de trabalho:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dias de trabalho.",
        variant: "destructive",
      })
    }
  }

  const fetchTimeSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("business_id", selectedBusiness)
        .order("time")

      if (error) throw error

      const slots: { [key: number]: string[] } = {}
      data.forEach(slot => {
        if (!slots[slot.day_of_week]) {
          slots[slot.day_of_week] = []
        }
        // Remover os segundos se existirem
        const time = slot.time.length === 8 ? slot.time.substring(0, 5) : slot.time
        slots[slot.day_of_week].push(time)
      })

      setTimeSlots(slots)
    } catch (error) {
      console.error("Erro ao carregar horários:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os horários.",
        variant: "destructive",
      })
    }
  }

  const toggleWorkingDay = async (dayNumber: number) => {
    if (!selectedBusiness) return

    setIsSaving(true)
    try {
      const isWorking = workingDays.includes(dayNumber)
      
      if (isWorking) {
        // Remover o dia
        setWorkingDays(workingDays.filter(d => d !== dayNumber))
        
        // Remover horários deste dia
        const { error: deleteTimeSlotsError } = await supabase
          .from("time_slots")
          .delete()
          .eq("business_id", selectedBusiness)
          .eq("day_of_week", dayNumber)

        if (deleteTimeSlotsError) throw deleteTimeSlotsError

        // Atualizar working_days
        const { error: updateError } = await supabase
          .from("working_days")
          .update({ is_working_day: false })
          .eq("business_id", selectedBusiness)
          .eq("day_of_week", dayNumber)

        if (updateError) throw updateError
      } else {
        // Adicionar o dia
        setWorkingDays([...workingDays, dayNumber])

        // Verificar se já existe um registro para este dia
        const { data: existingDay, error: checkError } = await supabase
          .from("working_days")
          .select("*")
          .eq("business_id", selectedBusiness)
          .eq("day_of_week", dayNumber)
          .single()

        if (checkError && checkError.code !== "PGRST116") throw checkError

        if (existingDay) {
          // Atualizar registro existente
          const { error: updateError } = await supabase
            .from("working_days")
            .update({ is_working_day: true })
            .eq("business_id", selectedBusiness)
            .eq("day_of_week", dayNumber)

          if (updateError) throw updateError
        } else {
          // Criar novo registro
          const { error: insertError } = await supabase
            .from("working_days")
            .insert({
              business_id: selectedBusiness,
              day_of_week: dayNumber,
              is_working_day: true
            })

          if (insertError) throw insertError
        }
      }

      await fetchTimeSlots()
    } catch (error) {
      console.error("Erro ao atualizar dia de trabalho:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o dia de trabalho.",
        variant: "destructive",
      })
      // Reverter o estado local em caso de erro
      await fetchWorkingDays()
    } finally {
      setIsSaving(false)
    }
  }

  const addTimeSlot = async (dayNumber: number) => {
    if (!selectedBusiness || !newTimeSlots[dayNumber]) return

    setIsSaving(true)
    try {
      // Validar formato do horário (HH:mm)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(newTimeSlots[dayNumber])) {
        toast({
          title: "Formato inválido",
          description: "Use o formato HH:mm (exemplo: 09:00)",
          variant: "destructive",
        })
        return
      }

      // Formatar o horário para garantir o formato HH:mm
      const [hours, minutes] = newTimeSlots[dayNumber].split(":")
      const formattedTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`

      // Verificar se o horário já existe
      if (timeSlots[dayNumber]?.includes(formattedTime)) {
        toast({
          title: "Horário duplicado",
          description: "Este horário já está cadastrado para este dia.",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from("time_slots")
        .insert({
          business_id: selectedBusiness,
          day_of_week: dayNumber,
          time: formattedTime
        })

      if (error) throw error

      await fetchTimeSlots()
      // Limpar apenas o horário do dia específico
      setNewTimeSlots(prev => ({ ...prev, [dayNumber]: "" }))
    } catch (error) {
      console.error("Erro ao adicionar horário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o horário.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const removeTimeSlot = async (dayNumber: number, time: string) => {
    if (!selectedBusiness) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("time_slots")
        .delete()
        .eq("business_id", selectedBusiness)
        .eq("day_of_week", dayNumber)
        .eq("time", time)

      if (error) throw error

      await fetchTimeSlots()
    } catch (error) {
      console.error("Erro ao remover horário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o horário.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[42rem]">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Configuração de Horários</CardTitle>
          <CardDescription>Configure os dias e horários de atendimento do seu negócio.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Negócio</span>
              </div>
              <Select
                value={selectedBusiness}
                onValueChange={setSelectedBusiness}
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

            {selectedBusiness && (
              <div className="space-y-6">
                <div className="grid gap-4">
                  {daysOfWeek.map((day) => (
                    <div key={day.value} className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={workingDays.includes(day.value)}
                          onCheckedChange={() => toggleWorkingDay(day.value)}
                          disabled={isSaving}
                        />
                        <span>{day.label}</span>
                      </div>

                      {workingDays.includes(day.value) && (
                        <div className="pl-6 space-y-4">
                          <div className="flex gap-2">
                            <Input
                              type="time"
                              value={newTimeSlots[day.value] || ""}
                              onChange={(e) => setNewTimeSlots(prev => ({ ...prev, [day.value]: e.target.value }))}
                              placeholder="HH:mm"
                              className="w-32"
                            />
                            <Button
                              onClick={() => addTimeSlot(day.value)}
                              disabled={isSaving || !newTimeSlots[day.value]}
                            >
                              Adicionar
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {timeSlots[day.value]?.sort().map((time) => (
                              <div
                                key={time}
                                className="flex items-center gap-2 bg-secondary p-2 rounded-md"
                              >
                                <span>{time}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeTimeSlot(day.value, time)}
                                  disabled={isSaving}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
