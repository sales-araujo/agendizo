"use client"

import { DialogFooter } from "@/components/ui/dialog"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import { useBusinessData } from '@/lib/hooks/use-business-data'
import { useSettings } from '@/lib/contexts/settings-context'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table'
import { createColumns } from './columns'

interface Client {
  id: string
  business_id: string
  name: string
  email?: string
  phone?: string
  notes?: string
  created_at: string
}

export default function ClientsPage() {
  const { selectedBusiness } = useSettings()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const { data: clients, isLoading, error, refresh } = useBusinessData<Client>({
    table: 'clients',
    query: '*',
  })
  const handleEdit = (client: Client) => {
    // Implemente a lógica de edição se necessário
    toast({ title: 'Funcionalidade de edição não implementada', variant: 'destructive' })
  }
  const handleDelete = (id: string) => {
    // Implemente a lógica de exclusão se necessário
    toast({ title: 'Funcionalidade de exclusão não implementada', variant: 'destructive' })
  }
  const columns = createColumns({ onEdit: handleEdit, onDelete: handleDelete })

  const handleCreateClient = async () => {
    if (!selectedBusiness?.id || !name || !email) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }
    setIsSubmitting(true)
    try {
      const { error } = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: selectedBusiness.id,
          name,
          email,
          phone,
        }),
      }).then(res => res.json())
      if (error) throw error
      toast({ title: 'Cliente cadastrado com sucesso!', variant: 'success' })
      setOpen(false)
      setName("")
      setEmail("")
      setPhone("")
      refresh()
    } catch (err: any) {
      toast({ title: 'Erro ao cadastrar cliente', description: err.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedBusiness) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <h3 className="text-lg font-medium mb-2">Nenhum negócio selecionado</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Selecione um negócio para visualizar os clientes.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie os clientes do seu negócio.
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className="bg-[#eb07a4] hover:bg-[#d0069a] mt-4 sm:mt-0">
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : (
        <DataTable columns={columns} data={clients || []} isLoading={isLoading} pageSize={5} />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateClient} disabled={isSubmitting} className="bg-[#eb07a4] hover:bg-[#d0069a] w-full">
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
