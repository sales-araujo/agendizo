"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/components/ui/use-toast"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/dashboard/page-shell"

// Definir interfaces para os tipos
interface Business {
  id: string
  name: string
  [key: string]: any
}

interface Holiday {
  id: string
  business_id: string
  date: string
  description: string
  [key: string]: any
}

interface DayContentProps {
  date: Date
  displayMonth: Date
  [key: string]: any
}

export default function FeriadosPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | undefined>(undefined)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("businesses").select("id, name").eq("owner_id", user.id).order("name")

        if (error) {
          console.error("Erro ao buscar negócios:", error)
          toast({
            title: "Erro",
            description: "Não foi possível carregar seus negócios.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        setBusinesses((data as Business[]) || [])
        if (data && data.length > 0) {
          setSelectedBusinessId(data[0].id)
          fetchHolidays(data[0].id)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Erro ao buscar negócios:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus negócios.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [user, supabase])

  const fetchHolidays = async (businessId: string) => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("holidays")
        .select("*")
        .eq("business_id", businessId)
        .order("date", { ascending: true })

      if (error) {
        console.error("Erro ao buscar feriados:", error.message, error.details, error.hint)
        toast({
          title: "Erro",
          description: `Não foi possível carregar os feriados: ${error.message}`,
          variant: "destructive",
        })
      } else {
        setHolidays((data as Holiday[]) || [])
      }
    } catch (error) {
      console.error("Erro ao buscar feriados:", error instanceof Error ? error.message : error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os feriados. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBusinessChange = (value: string) => {
    setSelectedBusinessId(value)
    fetchHolidays(value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!date) {
      toast({
        title: "Atenção",
        description: "Selecione uma data para o feriado.",
        variant: "warning",
      })
      return
    }

    if (!description.trim()) {
      toast({
        title: "Atenção",
        description: "Adicione uma descrição para o feriado.",
        variant: "warning",
      })
      return
    }

    if (!selectedBusinessId) {
      toast({
        title: "Atenção",
        description: "Selecione um negócio.",
        variant: "warning",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formattedDate = format(date, "yyyy-MM-dd")

      // Verificar se já existe um feriado nesta data
      const { data: existingHoliday, error: checkError } = await supabase
        .from("holidays")
        .select("id")
        .eq("business_id", selectedBusinessId)
        .eq("date", formattedDate)
        .maybeSingle()

      if (checkError) {
        console.error("Erro ao verificar feriado existente:", checkError.message, checkError.details, checkError.hint)
        throw checkError
      }

      if (existingHoliday) {
        toast({
          title: "Atenção",
          description: "Já existe um feriado cadastrado nesta data.",
          variant: "warning",
        })
        setIsSubmitting(false)
        return
      }

      const { error } = await supabase.from("holidays").insert({
        business_id: selectedBusinessId,
        date: formattedDate,
        description: description.trim(),
      })

      if (error) {
        console.error("Erro ao adicionar feriado:", error.message, error.details, error.hint)
        throw error
      }

      toast({
        title: "Sucesso",
        description: "Feriado adicionado com sucesso.",
        variant: "success",
      })
      setDate(undefined)
      setDescription("")
      setOpen(false)
      fetchHolidays(selectedBusinessId)
    } catch (error) {
      console.error("Erro ao adicionar feriado:", error instanceof Error ? error.message : error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o feriado. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este feriado?")) {
      return
    }

    try {
      const { error } = await supabase.from("holidays").delete().eq("id", id)

      if (error) {
        console.error("Erro ao excluir feriado:", error.message, error.details, error.hint)
        throw error
      }

      toast({
        title: "Sucesso",
        description: "Feriado excluído com sucesso.",
        variant: "success",
      })
      if (selectedBusinessId) {
        fetchHolidays(selectedBusinessId)
      }
    } catch (error) {
      console.error("Erro ao excluir feriado:", error instanceof Error ? error.message : error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o feriado. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleRefresh = async () => {
    if (businesses.length > 0) {
      setIsRefreshing(true)
      try {
        await fetchHolidays(businesses[0].id)
        toast({
          title: "Sucesso",
          description: "A lista de feriados foi atualizada com sucesso.",
          variant: "success",
        })
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a lista de feriados.",
          variant: "destructive",
        })
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  // Função para renderizar os dias com feriados no calendário
  const holidayDates = holidays.map((holiday) => new Date(holiday.date))

  const holidayRenderer = (date: Date) => {
    const isHoliday = holidayDates.some(
      (holidayDate) =>
        holidayDate.getDate() === date.getDate() &&
        holidayDate.getMonth() === date.getMonth() &&
        holidayDate.getFullYear() === date.getFullYear(),
    )

    return isHoliday ? (
      <div className="h-full w-full absolute flex items-center justify-center">
        <div className="h-7 w-7 bg-red-100 dark:bg-red-900/20 rounded-full absolute" />
      </div>
    ) : null
  }

  return (
    <PageShell>
      <PageShell.Header>
        <PageShell.Title>Feriados e Folgas</PageShell.Title>
        <PageShell.Description>
          Gerencie os dias em que seu negócio não estará disponível para agendamentos
        </PageShell.Description>
      </PageShell.Header>
      <PageShell.Content>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {businesses.length > 0 && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Feriado
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Feriado ou Folga</DialogTitle>
                  <DialogDescription>
                    Adicione um feriado ou dia de folga para bloquear agendamentos nesta data.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="business">Negócio</Label>
                      <Select
                        value={selectedBusinessId || ""}
                        onValueChange={handleBusinessChange}
                        disabled={businesses.length <= 1}
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
                    <div className="grid gap-2">
                      <Label htmlFor="date">Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !date && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(day) => setDate(day || undefined)}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Input
                        id="description"
                        placeholder="Ex: Feriado Nacional, Folga, etc."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {businesses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <p className="text-center text-muted-foreground">
                Você precisa cadastrar um negócio antes de gerenciar feriados.
              </p>
              <Button className="mt-4" asChild>
                <a href="/dashboard/negocios/novo">Cadastrar Negócio</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {businesses.length > 1 && (
              <div className="mb-6">
                <Label htmlFor="business-select">Selecione o negócio</Label>
                <div className="mt-1">
                  <Select
                    value={selectedBusinessId || ""}
                    onValueChange={handleBusinessChange}
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
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Calendário de Feriados</CardTitle>
                  <CardDescription>Visualize todos os feriados e folgas cadastrados.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 w-full">
                    <Calendar
                      mode="single"
                      selected={date}
                      className={cn("rounded-md border w-full h-full")}
                      classNames={{
                        months: "flex flex-col w-full",
                        month: "space-y-4 w-full",
                        caption: "flex justify-center pt-1 relative items-center w-full",
                        caption_label: "text-sm font-medium",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full",
                        head_cell: "text-muted-foreground rounded-md w-full h-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-full text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-full p-0 font-normal aria-selected:opacity-100",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                        day_today: "bg-accent text-accent-foreground",
                        day_outside: "text-muted-foreground opacity-50",
                        day_disabled: "text-muted-foreground opacity-50",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                      components={{
                        DayContent: (props: DayContentProps) => (
                          <div className="relative h-9 w-full p-0 flex items-center justify-center">
                            {holidayRenderer(props.date)}
                            <span className="relative z-10">{format(props.date, "d")}</span>
                          </div>
                        ),
                      }}
                      locale={ptBR}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lista de Feriados</CardTitle>
                  <CardDescription>Gerencie seus feriados e folgas.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : holidays.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhum feriado cadastrado.</p>
                  ) : (
                    <div className="space-y-4">
                      {holidays.map((holiday) => (
                        <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex flex-col">
                            <div className="font-medium">{holiday.description}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(holiday.date), "PPP", { locale: ptBR })}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(holiday.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </PageShell.Content>
    </PageShell>
  )
}
