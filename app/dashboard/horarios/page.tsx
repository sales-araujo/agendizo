"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { useSettings } from '@/lib/contexts/settings-context'
import { EmptyPlaceholder } from '@/components/ui/empty-placeholder'

const daysOfWeek = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
]

export default function TimeSlotsPage() {
  const { selectedBusiness } = useSettings()
  const { toast } = useToast()
  const supabase = createClient()

  const [workingDays, setWorkingDays] = useState<number[]>([])
  const [timeSlots, setTimeSlots] = useState<{ [key: number]: string[] }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newTimeSlots, setNewTimeSlots] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    if (selectedBusiness?.id) {
      fetchWorkingDays()
      fetchTimeSlots()
    } else {
      setWorkingDays([])
      setTimeSlots({})
    }
    // eslint-disable-next-line
  }, [selectedBusiness?.id])

  async function fetchWorkingDays() {
    if (!selectedBusiness?.id) return;
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("working_days")
        .select("*")
        .eq("business_id", selectedBusiness.id)
      if (error) throw error
      const workingDayNumbers = (data || [])
        .filter(day => day.is_working_day)
        .map(day => day.day_of_week)
      setWorkingDays(workingDayNumbers)
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os dias de trabalho.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchTimeSlots() {
    if (!selectedBusiness?.id) return;
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("time_slots")
        .select("*")
        .eq("business_id", selectedBusiness.id)
        .order("day_of_week")
        .order("time")
      if (error) throw error
      const slots: { [key: number]: string[] } = {}
      ;(data || []).forEach(slot => {
        if (!slots[slot.day_of_week]) slots[slot.day_of_week] = []
        // Remover os segundos se existirem
        const time = slot.time.length === 8 ? slot.time.substring(0, 5) : slot.time
        slots[slot.day_of_week].push(time)
      })
      setTimeSlots(slots)
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os horários.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  async function toggleWorkingDay(dayNumber: number) {
    if (!selectedBusiness?.id) return
    setIsSaving(true)
    try {
      const isWorking = workingDays.includes(dayNumber)
      if (isWorking) {
        setWorkingDays(workingDays.filter(d => d !== dayNumber))
        // Remover horários deste dia
        await supabase
          .from("time_slots")
          .delete()
          .eq("business_id", selectedBusiness.id)
          .eq("day_of_week", dayNumber)
        // Atualizar working_days
        await supabase
          .from("working_days")
          .update({ is_working_day: false })
          .eq("business_id", selectedBusiness.id)
          .eq("day_of_week", dayNumber)
      } else {
        setWorkingDays([...workingDays, dayNumber])
        // Verificar se já existe um registro para este dia
        const { data: existingDay, error: checkError } = await supabase
          .from("working_days")
          .select("*")
          .eq("business_id", selectedBusiness.id)
          .eq("day_of_week", dayNumber)
          .single()
        if (checkError && checkError.code !== "PGRST116") throw checkError
        if (existingDay) {
          await supabase
            .from("working_days")
            .update({ is_working_day: true })
            .eq("business_id", selectedBusiness.id)
            .eq("day_of_week", dayNumber)
        } else {
          await supabase
            .from("working_days")
            .insert({ business_id: selectedBusiness.id, day_of_week: dayNumber, is_working_day: true })
        }
      }
      await fetchTimeSlots()
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível atualizar o dia de trabalho.", variant: "destructive" })
      await fetchWorkingDays()
    } finally {
      setIsSaving(false)
    }
  }

  async function addTimeSlot(dayNumber: number) {
    if (!selectedBusiness?.id || !newTimeSlots[dayNumber]) return
    setIsSaving(true)
    try {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(newTimeSlots[dayNumber])) {
        toast({ title: "Formato inválido", description: "Use o formato HH:mm (exemplo: 09:00)", variant: "destructive" })
        return
      }
      const [hours, minutes] = newTimeSlots[dayNumber].split(":")
      const formattedTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`
      if (timeSlots[dayNumber]?.includes(formattedTime)) {
        toast({ title: "Horário duplicado", description: "Este horário já está cadastrado para este dia.", variant: "destructive" })
        return
      }
      await supabase
        .from("time_slots")
        .insert({ business_id: selectedBusiness.id, day_of_week: dayNumber, time: formattedTime })
      await fetchTimeSlots()
      setNewTimeSlots(prev => ({ ...prev, [dayNumber]: "" }))
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível adicionar o horário.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  async function removeTimeSlot(dayNumber: number, time: string) {
    if (!selectedBusiness?.id) return
    setIsSaving(true)
    try {
      await supabase
        .from("time_slots")
        .delete()
        .eq("business_id", selectedBusiness.id)
        .eq("day_of_week", dayNumber)
        .eq("time", time)
      await fetchTimeSlots()
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível remover o horário.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (!selectedBusiness) {
    return (
      <EmptyPlaceholder>
        <EmptyPlaceholder.Icon name="calendar" />
        <EmptyPlaceholder.Title>Nenhum negócio selecionado</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          Selecione um negócio para configurar os horários.
        </EmptyPlaceholder.Description>
      </EmptyPlaceholder>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
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
                        {(timeSlots[day.value] || []).sort().map((time) => (
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
        </CardContent>
      </Card>
    </div>
  )
}
