"use client"

import type React from "react"
import { useState } from "react"
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useSettings } from '@/lib/contexts/settings-context'
import { useBusinessData } from '@/lib/hooks/use-business-data'

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
import { cn } from "@/lib/utils"

interface Holiday {
  id: string
  business_id: string
  name: string
  date: string
  created_at: string
}

export default function HolidaysPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)
  const [date, setDate] = useState<Date>()
  const [name, setName] = useState("")
  const { selectedBusiness } = useSettings()
  const { toast } = useToast()
  const supabase = createClient()

  const { data: holidays, isLoading, error, refresh } = useBusinessData<Holiday>({
    table: 'holidays',
    query: '*',
  })

  const handleCreateHoliday = async () => {
    if (!selectedBusiness?.id || !date || !name) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("holidays").insert({
        business_id: selectedBusiness.id,
        name,
        date: date.toISOString(),
      })

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Feriado adicionado com sucesso.",
        variant: "success",
      })

      setDate(undefined)
      setName("")
      refresh()
    } catch (error) {
      console.error("Error creating holiday:", error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o feriado.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteHoliday = async () => {
    if (!selectedHoliday) return

    try {
      const { error } = await supabase
        .from("holidays")
        .delete()
        .eq("id", selectedHoliday.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Feriado excluído com sucesso.",
        variant: "success",
      })

      setSelectedHoliday(null)
      setIsDeleteDialogOpen(false)
      refresh()
    } catch (error) {
      console.error("Error deleting holiday:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o feriado.",
        variant: "destructive",
      })
    }
  }

  if (!selectedBusiness) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum negócio selecionado</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Selecione um negócio para gerenciar os feriados.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro ao carregar feriados</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            {error.message}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Feriados</h1>
          <p className="text-muted-foreground">
            Gerencie os feriados do seu negócio.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Feriado</CardTitle>
            <CardDescription>
              Adicione um novo feriado para o seu negócio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Feriado</Label>
                <Input
                  id="name"
                  placeholder="Ex: Natal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
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
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                onClick={handleCreateHoliday}
                disabled={isSubmitting || !date || !name}
                className="bg-[#eb07a4] hover:bg-[#d0069a]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Feriado
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feriados Cadastrados</CardTitle>
            <CardDescription>
              Lista de feriados cadastrados para o seu negócio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : holidays?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum feriado cadastrado.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {holidays?.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{holiday.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(holiday.date), "PPP", { locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        setSelectedHoliday(holiday)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Feriado</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este feriado? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteHoliday}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
