"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, MoreHorizontal, Edit, Trash, User, RefreshCw } from "lucide-react"

interface Business {
  id: string
  name: string
  owner_id: string
  created_at: string
}

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
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
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

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    fetchBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusinessId) {
      fetchClients(selectedBusinessId)
    }
  }, [selectedBusinessId])

  async function fetchBusinesses() {
    setIsLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()

      if (!user?.user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.user.id)
        .order("name", { ascending: true })

      if (error) throw error

      setBusinesses(data || [])

      // Se tiver negócios, seleciona o primeiro
      if (data && data.length > 0) {
        setSelectedBusinessId(data[0].id)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error fetching businesses:", error)
      toast({ title: "Erro", description: "Ocorreu um erro ao buscar os negócios.", variant: "destructive" })
      setIsLoading(false)
    }
  }

  async function fetchClients(businessId: string) {
    if (!businessId) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("business_id", businessId)
        .order("name", { ascending: true })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({ title: "Erro", description: "Ocorreu um erro ao buscar os clientes.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone?.includes(searchTerm),
  )

  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      notes: "",
    })
  }

  const handleAddClient = async () => {
    if (!formData.name) {
      toast({ title: "Erro", description: "Nome obrigatório", variant: "destructive" })
      return
    }

    if (!selectedBusinessId) {
      toast({ title: "Erro", description: "Selecione um negócio antes de adicionar clientes.", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert([
          {
            business_id: selectedBusinessId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            notes: formData.notes,
          },
        ])
        .select()

      if (error) throw error

      toast({ title: "Sucesso", description: "Cliente adicionado com sucesso.", variant: "success" })

      resetForm()
      setIsAddClientOpen(false)
      fetchClients(selectedBusinessId)
    } catch (error) {
      console.error("Error adding client:", error)
      toast({ title: "Erro", description: "Não foi possível adicionar o cliente.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClient = (client: Client) => {
    setCurrentClient(client)
    setFormData({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      notes: client.notes || "",
    })
    setIsEditClientOpen(true)
  }

  const handleUpdateClient = async () => {
    if (!formData.name) {
      toast({ title: "Erro", description: "Nome obrigatório", variant: "destructive" })
      return
    }

    if (!currentClient) {
      toast({ title: "Erro", description: "Cliente não encontrado.", variant: "destructive" })
      return
    }

    setIsLoading(true)
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
      fetchClients(selectedBusinessId)
    } catch (error) {
      console.error("Error updating client:", error)
      toast({ title: "Erro", description: "Não foi possível atualizar as informações do cliente.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id)

      if (error) throw error

      toast({ title: "Sucesso", description: "Cliente excluído com sucesso.", variant: "success" })

      fetchClients(selectedBusinessId)
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({ title: "Erro", description: "Não foi possível excluir o cliente.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (selectedBusinessId) {
      setIsRefreshing(true)
      try {
        await fetchClients(selectedBusinessId)
        toast({ title: "Sucesso", description: "Lista de clientes atualizada com sucesso.", variant: "success" })
      } catch (error) {
        console.error("Error refreshing clients:", error)
        toast({ title: "Erro", description: "Não foi possível atualizar a lista de clientes.", variant: "destructive" })
      } finally {
        setIsRefreshing(false)
      }
    }
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
          <Card>
            <CardHeader>
              <CardTitle>Selecione o negócio</CardTitle>
              <CardDescription>Escolha qual negócio você deseja gerenciar os clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
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
            </CardContent>
          </Card>

          {selectedBusinessId && (
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
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <User className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Nenhum cliente encontrado</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Comece adicionando seu primeiro cliente clicando no botão "Novo cliente".
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedClients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{client.name}</p>
                                {client.notes && (
                                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{client.email || "-"}</TableCell>
                            <TableCell>{client.phone || "-"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Abrir menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditClient(client)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteClient(client.id)}>
                                    <Trash className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
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
