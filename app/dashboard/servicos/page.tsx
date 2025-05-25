"use client"

import { useBusinessData } from '@/lib/hooks/use-business-data'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { EmptyPlaceholder } from '@/components/ui/empty-placeholder'
import { useSettings } from '@/lib/contexts/settings-context'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { useState } from 'react'

interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  price: number
  duration: number
  created_at: string
}

interface ServiceDisplay extends Omit<Service, 'price' | 'duration'> {
  price: string
  duration: string
}

export default function ServicesPage() {
  const { selectedBusiness } = useSettings()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const form = useForm({
    defaultValues: {
      name: '',
      price: '',
      duration: '',
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const transformService = useCallback((service: Service): ServiceDisplay => ({
    ...service,
    price: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(service.price),
    duration: `${service.duration} min`
  }), [])

  const { data: services, isLoading, error, refresh } = useBusinessData<ServiceDisplay>({
    table: 'services',
    query: '*',
    transform: transformService,
  })

  const handleCreateService = async (values: any) => {
    if (!selectedBusiness?.id) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('services').insert({
        business_id: selectedBusiness.id,
        name: values.name,
        price: Number(values.price),
        duration: Number(values.duration),
      })
      if (error) throw error
      toast({ title: 'Serviço cadastrado com sucesso!', variant: 'success' })
      setOpen(false)
      form.reset()
      refresh()
    } catch (err: any) {
      toast({ title: 'Erro ao cadastrar serviço', description: err.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedBusiness) {
    return (
      <EmptyPlaceholder>
        <EmptyPlaceholder.Icon name="calendar" />
        <EmptyPlaceholder.Title>Nenhum negócio selecionado</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          Selecione um negócio para ver os serviços.
        </EmptyPlaceholder.Description>
      </EmptyPlaceholder>
    )
  }

  if (error) {
    return (
      <EmptyPlaceholder>
        <EmptyPlaceholder.Icon name="warning" />
        <EmptyPlaceholder.Title>Erro ao carregar serviços</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          {error.message}
        </EmptyPlaceholder.Description>
      </EmptyPlaceholder>
    )
  }

  if (!services?.length) {
    return (
      <EmptyPlaceholder>
        <EmptyPlaceholder.Icon name="calendar" />
        <EmptyPlaceholder.Title>Nenhum serviço encontrado</EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          Não há serviços cadastrados para este negócio.
        </EmptyPlaceholder.Description>
      </EmptyPlaceholder>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gerencie todos os serviços do seu negócio.</p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="gap-2 bg-[#eb07a4] hover:bg-[#d0069a]"
        >
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Serviço</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(handleCreateService)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...form.register('name', { required: true })} />
            </div>
            <div>
              <Label htmlFor="price">Preço (R$)</Label>
              <Input id="price" type="number" step="0.01" {...form.register('price', { required: true })} />
            </div>
            <div>
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input id="duration" type="number" {...form.register('duration', { required: true })} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="bg-[#eb07a4] hover:bg-[#d0069a]">
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <DataTable
        columns={columns as any}
        data={services}
        isLoading={isLoading}
        pageSize={5}
      />
    </div>
  )
}
