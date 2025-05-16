"use client"

import { useState, useEffect } from "react"
import { Loader2, Save, Plus, X } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/supabase/database.types"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { PageShell } from "@/components/dashboard/page-shell"
import { id } from "date-fns/locale"

const daysOfWeek = [
  { id: 0, name: "Domingo" },
  { id: 1, name: "Segunda-feira" },
  { id: 2, name: "Terça-feira" },
  { id: 3, name: "Quarta-feira" },
  { id: 4, name: "Quinta-feira" },
  { id: 5, name: "Sexta-feira" },
  { id: 6, name: "Sábado" },
]

interface WorkingDay {
  business_id: string
  day_of_week: number
  is_working_day: boolean
}

interface TimeSlot {
  id: string
  business_id: string
  day_of_week: number
  time: string
}

interface DaySchedule {
  enabled: boolean
  timeSlots: Array<{
    id: string
    time: string
  }>
}

interface WorkingHours {
  [key: number]: DaySchedule
}

export default function WorkingHoursPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    0: { enabled: false, timeSlots: [] },
    1: { enabled: true, timeSlots: [] },
    2: { enabled: true, timeSlots: [] },
    3: { enabled: true, timeSlots: [] },
    4: { enabled: true, timeSlots: [] },
    5: { enabled: true, timeSlots: [] },
    6: { enabled: false, timeSlots: [] },
  })
  const [businessId, setBusinessId] = useState<string | null>(null)
  const { toast } = useToast()

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    fetchBusinesses()
  }, [])

  async function fetchBusinesses() {
    setIsLoading(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Erro ao obter usuário:", userError)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível obter os dados do usuário.",
        })
        setIsLoading(false)
        return
      }

      if (!userData?.user) {
        console.error("Usuário não encontrado")
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Usuário não encontrado.",
        })
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", userData.user.id)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Erro ao buscar negócios:", error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível buscar os negócios.",
        })
        setIsLoading(false)
        return
      }

      if (data && data.length > 0) {
        setBusinessId(data[0].id)
        fetchWorkingHours(data[0].id)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Erro ao buscar negócios:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao buscar os negócios.",
      })
      setIsLoading(false)
    }
  }

  async function fetchWorkingHours(businessId: string) {
    setIsLoading(true)
    try {
      const { data: workingDaysData, error: workingDaysError } = await supabase
        .from("working_days")
        .select("*")
        .eq("business_id", businessId)
        .order("day_of_week")

      if (workingDaysError) {
        if (workingDaysError.message.includes("does not exist")) {
          await createTimeSlotTable(businessId)
          return
        }
        console.error("Erro ao buscar dias de trabalho:", workingDaysError)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível buscar os dias de trabalho.",
        })
        setIsLoading(false)
        return
      }

      const { data: timeSlotsData, error: timeSlotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("business_id", businessId)
        .order("day_of_week")
        .order("time")

      if (timeSlotsError) {
        console.error("Erro ao buscar horários:", timeSlotsError)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível buscar os horários.",
        })
        setIsLoading(false)
        return
      }

      const newWorkingHours: WorkingHours = {
        0: { enabled: false, timeSlots: [] },
        1: { enabled: true, timeSlots: [] },
        2: { enabled: true, timeSlots: [] },
        3: { enabled: true, timeSlots: [] },
        4: { enabled: true, timeSlots: [] },
        5: { enabled: true, timeSlots: [] },
        6: { enabled: false, timeSlots: [] },
      }

      if (workingDaysData && workingDaysData.length > 0) {
        (workingDaysData as WorkingDay[]).forEach((day) => {
          if (day.day_of_week in newWorkingHours) {
            newWorkingHours[day.day_of_week].enabled = day.is_working_day
          }
        })
      }

      if (timeSlotsData && timeSlotsData.length > 0) {
        (timeSlotsData as TimeSlot[]).forEach((slot) => {
          const day = slot.day_of_week
          if (day in newWorkingHours) {
            newWorkingHours[day].timeSlots.push({
              id: `${day}-${slot.id}`,
              time: slot.time,
            })
          }
        })
      }

      setWorkingHours(newWorkingHours)
    } catch (error) {
      console.error("Erro ao buscar horários:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os horários de funcionamento.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function createTimeSlotTable(businessId: string) {
    try {
      const { error: createTableError } = await supabase.rpc('create_time_slots_table');
      
      if (createTableError) {
        console.error("Erro ao criar tabela time_slots:", createTableError);
        throw createTableError;
      }

      const { error: deleteError } = await supabase
        .from('time_slots')
        .delete()
        .eq('business_id', businessId);

      if (deleteError) {
        console.error("Erro ao limpar horários existentes:", deleteError);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível limpar os horários existentes.",
        })
        throw deleteError;
      }

      const workingDaysPromises = daysOfWeek.map(day => 
        supabase
          .from('working_days')
          .upsert({
            business_id: businessId,
            day_of_week: day.id,
            is_working_day: day.id !== 0 && day.id !== 6 // Segunda a Sexta como dias úteis por padrão
          }, {
            onConflict: 'business_id,day_of_week'
          })
      );

      await Promise.all(workingDaysPromises);

      const initialWorkingHours: WorkingHours = {
        0: { enabled: false, timeSlots: [] },
        1: { enabled: true, timeSlots: [] },
        2: { enabled: true, timeSlots: [] },
        3: { enabled: true, timeSlots: [] },
        4: { enabled: true, timeSlots: [] },
        5: { enabled: true, timeSlots: [] },
        6: { enabled: false, timeSlots: [] },
      };
      
      setWorkingHours(initialWorkingHours);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao criar tabela de horários:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar a tabela de horários.",
      })
      setIsLoading(false);
    }
  }

  async function saveWorkingHours(hours: WorkingHours, businessId: string | null) {
    if (!businessId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhum negócio selecionado.",
      })
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from("time_slots")
        .delete()
        .eq("business_id", businessId)

      if (deleteError) {
        console.error("Erro ao limpar horários existentes:", deleteError)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível limpar os horários existentes.",
        })
        throw deleteError
      }

      for (const [dayKey, dayData] of Object.entries(hours)) {
        const day = Number.parseInt(dayKey)

        const { error: workingDayError } = await supabase.from("working_days").upsert(
          {
            business_id: businessId,
            day_of_week: day,
            is_working_day: dayData.enabled,
          },
          { onConflict: "business_id,day_of_week" },
        )

        if (workingDayError) {
          console.error(`Erro ao salvar dia de trabalho ${day}:`, workingDayError)
          continue
        }

        if (dayData.enabled && dayData.timeSlots.length > 0) {
          const timeSlotPromises = dayData.timeSlots.map((slot: { id: string; time: string }) =>
            supabase.from("time_slots").insert({
              business_id: businessId,
              day_of_week: day,
              time: slot.time,
            })
          )

          await Promise.all(timeSlotPromises)
        }
      }

      toast({
        title: "Sucesso",
        description: "Horários salvos com sucesso!",
        variant: "success",
      })
    } catch (error) {
      console.error("Erro ao salvar horários:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar os horários.",
      })
    }
  }

  function handleToggleDay(dayId: number) {
    setWorkingHours((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        enabled: !prev[dayId].enabled,
      },
    }))
  }

  function handleAddTimeSlot(dayId: number) {
    setWorkingHours((prev) => {
      const newTimeSlots = [...prev[dayId].timeSlots]
      const newId = `${dayId}-${Date.now()}`
      newTimeSlots.push({ id: newId, time: "09:00" })

      return {
        ...prev,
        [dayId]: {
          ...prev[dayId],
          timeSlots: newTimeSlots,
        },
      }
    })
  }

  function handleRemoveTimeSlot(dayId: number, slotId: string) {
    setWorkingHours((prev) => {
      const newTimeSlots = prev[dayId].timeSlots.filter((slot) => slot.id !== slotId)

      return {
        ...prev,
        [dayId]: {
          ...prev[dayId],
          timeSlots: newTimeSlots,
        },
      }
    })
  }

  function handleTimeChange(dayId: number, slotId: string, value: string) {
    setWorkingHours((prev) => {
      const newTimeSlots = prev[dayId].timeSlots.map((slot) => {
        if (slot.id === slotId) {
          return { ...slot, time: value }
        }
        return slot
      })

      return {
        ...prev,
        [dayId]: {
          ...prev[dayId],
          timeSlots: newTimeSlots,
        },
      }
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSaving(true)
    try {
      await saveWorkingHours(workingHours, businessId)
    } catch (error) {
      console.error("Erro ao salvar horários:", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar os horários de funcionamento.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <PageShell>
        <PageShell.Header>
          <PageShell.Title>Horários de Funcionamento</PageShell.Title>
          <PageShell.Description>
            Configure os dias e horários de funcionamento do seu negócio
          </PageShell.Description>
        </PageShell.Header>
        <PageShell.Content>
          <div className="flex h-[50vh] w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </PageShell.Content>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageShell.Header>
        <PageShell.Title>Horários de Funcionamento</PageShell.Title>
        <PageShell.Description>
          Configure os dias e horários disponíveis para agendamento
        </PageShell.Description>
      </PageShell.Header>
      <PageShell.Content>
        <Card>
          <CardHeader>
            <CardTitle>Configure seus horários de atendimento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {daysOfWeek.map((day) => (
                  <div key={day.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`day-${day.id}`}
                          checked={workingHours[day.id]?.enabled}
                          onCheckedChange={() => handleToggleDay(day.id)}
                        />
                        <Label htmlFor={`day-${day.id}`} className="font-medium">
                          {day.name}
                        </Label>
                      </div>

                      {workingHours[day.id]?.enabled && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTimeSlot(day.id)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar Horário
                        </Button>
                      )}
                    </div>

                    {workingHours[day.id]?.enabled && (
                      <div className="space-y-2">
                        {workingHours[day.id]?.timeSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhum horário configurado. Adicione horários para este dia.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {workingHours[day.id]?.timeSlots.map((slot) => (
                              <div key={slot.id} className="flex items-center space-x-2">
                                <Input
                                  type="time"
                                  value={slot.time}
                                  onChange={(e) => handleTimeChange(day.id, slot.id, e.target.value)}
                                  className="w-32"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveTimeSlot(day.id, slot.id)}
                                  className="h-8 w-8"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button type="submit" disabled={isSaving} className="bg-[#eb07a4] hover:bg-[#d0069a]">
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Horários
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </PageShell.Content>
    </PageShell>
  )
}
