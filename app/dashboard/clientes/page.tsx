"use client"

import { DialogFooter } from "@/components/ui/dialog"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, User, RefreshCw } from "lucide-react"
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

interface FormData {
  name: string
  email: string
  phone: string
  notes: string
}

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const { selectedBusiness, businesses } = useSettings()

  // Memoize the transform function
  const transformClient = useCallback((data: any) => ({
    ...data,
    created_at: new Date(data.created_at).toLocaleDateString()
  }), [])

  const { data: clientes, isLoading: clientesLoading, error: clientesError, refresh: refreshClientes } = useBusinessData<Client>({
    table: 'clients',
    query: 'id, name, email, phone, notes, created_at',
    transform: transformClient
  })

  // Memoize filtered clients
  const filteredClients = useMemo(() => 
    clientes.filter(
      (client) =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm),
    ),
    [clientes, searchTerm]
  )

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      notes: "",
    })
  }, [])

  const handleAddClient = useCallback(async () => {
    if (!formData.name) {
      toast({ title: "Erro", description: "Nome obrigatório", variant: "destructive" })
      return
    }

    if (!selectedBusiness?.id) {
      toast({ title: "Erro", description: "Selecione um negócio antes de adicionar clientes.", variant: "destructive" })
      return
    }

    try {
      const { error } = await supabase
        .from("clients")
        .insert([
          {
            business_id: selectedBusiness.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            notes: formData.notes,
          },
        ])

      if (error) throw error

      toast({ title: "Sucesso", description: "Cliente adicionado com sucesso.", variant: "success" })

      resetForm()
      setIsAddClientOpen(false)
      refreshClientes()
    } catch (error) {
      console.error("Error adding client:", error)
      toast({ title: "Erro", description: "Não foi possível adicionar o cliente.", variant: "destructive" })
    }
  }, [formData, selectedBusiness?.id, resetForm, refreshClientes, toast])

  const handleEditClient = useCallback((client: Client) => {
    setCurrentClient(client)
    setFormData({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      notes: client.notes || "",
    })
    setIsEditClientOpen(true)
  }, [])

  const handleUpdateClient = useCallback(async () => {
    if (!formData.name) {
      toast({ title: "Erro", description: "Nome obrigatório", variant: "destructive" })
      return
    }

    if (!currentClient) {
      toast({ title: "Erro", description: "Cliente não encontrado.", variant: "destructive" })
      return
    }

    try {
      const { error } = await supabase
        .from("clients")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
        })
        .eq("id", currentClient.id)

      if (error) throw error

      toast({ title: "Sucesso", description: "As informações do cliente foram atualizadas com sucesso.", variant: "success" })

      resetForm()
      setIsEditClientOpen(false)
      refreshClientes()
    } catch (error) {
      console.error("Error updating client:", error)
      toast({ title: "Erro", description: "Não foi possível atualizar as informações do cliente.", variant: "destructive" })
    }
  }, [formData, currentClient, resetForm, refreshClientes, toast])

  const handleDeleteClient = useCallback(async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return

    try {
      const { error } = await supabase.from("clients").delete().eq("id", id)

      if (error) throw error

      toast({ title: "Sucesso", description: "Cliente excluído com sucesso.", variant: "success" })
      refreshClientes()
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({ title: "Erro", description: "Não foi possível excluir o cliente.", variant: "destructive" })
    }
  }, [refreshClientes, toast])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshClientes()
      toast({ title: "Sucesso", description: "Lista de clientes atualizada com sucesso.", variant: "success" })
    } catch (error) {
      console.error("Error refreshing clients:", error)
      toast({ title: "Erro", description: "Não foi possível atualizar a lista de clientes.", variant: "destructive" })
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshClientes, toast])

  // Memoize columns
  const columns = useMemo(() => 
    createColumns({
      onEdit: handleEditClient,
      onDelete: handleDeleteClient
    }),
    [handleEditClient, handleDeleteClient]
  )

  if (clientesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (clientesError) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-destructive">Erro ao carregar clientes: {clientesError.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {businesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum negócio encontrado</h3>
            <p className="text-muted-foreground text-center mt-1">
              Você precisa criar um negócio antes de gerenciar clientes.
            </p>
            <Button className="mt-4 bg-[#eb07a4] hover:bg-[#d0069a]" asChild>
              <a href="/dashboard/negocios/novo">Criar negócio</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {selectedBusiness ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[300px]"
                  />
                  <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#eb07a4] hover:bg-[#d0069a]">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar cliente</DialogTitle>
                      <DialogDescription>Preencha as informações do cliente abaixo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do cliente</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Ex: João Silva"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Ex: joao@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="Ex: (11) 99999-9999"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          placeholder="Adicione observações sobre o cliente"
                          value={formData.notes}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddClient} className="bg-[#eb07a4] hover:bg-[#d0069a]">
                        Adicionar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Clientes</CardTitle>
                  <CardDescription>Gerencie os clientes do seu negócio.</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <User className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Comece adicionando seu primeiro cliente clicando no botão "Novo cliente".
                      </p>
                    </div>
                  ) : (
                    <DataTable columns={columns} data={filteredClients} />
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum negócio selecionado</h3>
                <p className="text-muted-foreground text-center mt-1">
                  Por favor, selecione um negócio para gerenciar os clientes.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>Atualize as informações do cliente abaixo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do cliente</Label>
              <Input
                id="edit-name"
                name="name"
                placeholder="Ex: João Silva"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                placeholder="Ex: joao@email.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                name="phone"
                placeholder="Ex: (11) 99999-9999"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                name="notes"
                placeholder="Adicione observações sobre o cliente"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditClientOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateClient} className="bg-[#eb07a4] hover:bg-[#d0069a]">
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
