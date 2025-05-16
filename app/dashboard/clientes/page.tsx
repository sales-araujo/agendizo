"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
        .order("created_at", { ascending: false })

      if (error) throw error

      setBusinesses(data || [])

      // Se tiver negócios, busca os clientes do primeiro negócio
      if (data && data.length > 0) {
        fetchClients(data[0].id)
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

    if (businesses.length === 0) {
      toast({ title: "Erro", description: "Você precisa criar um negócio antes de adicionar clientes.", variant: "destructive" })
      router.push("/dashboard/negocios/novo")
      return
    }

    setIsLoading(true)
    try {
      const businessId = businesses[0].id

      const { data, error } = await supabase
        .from("clients")
        .insert([
          {
            business_id: businessId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            notes: formData.notes,
          },
        ])
        .select()

      if (error) throw error

      toast({ title: "Sucesso", description: "Cliente adicionado com sucesso." })

      resetForm()
      setIsAddClientOpen(false)
      fetchClients(businessId)
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

      toast({ title: "Sucesso", description: "As informações do cliente foram atualizadas com sucesso." })

      resetForm()
      setIsEditClientOpen(false)
      if (businesses[0]?.id) {
        fetchClients(businesses[0].id)
      }
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

      toast({ title: "Sucesso", description: "O cliente foi excluído com sucesso." })

      fetchClients(businesses[0]?.id)
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({ title: "Erro", description: "Não foi possível excluir o cliente.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (businesses.length > 0) {
      setIsRefreshing(true)
      try {
        await fetchClients(businesses[0].id)
        toast({ title: "Sucesso", description: "A lista de clientes foi atualizada com sucesso." })
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie todos os seus clientes em um só lugar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading || isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#eb07a4] hover:bg-[#d0069a]">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Cliente</DialogTitle>
                <DialogDescription>Preencha as informações do novo cliente.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nome <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Informações adicionais sobre o cliente"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddClient} disabled={isLoading} className="bg-[#eb07a4] hover:bg-[#d0069a]">
                  {isLoading ? "Adicionando..." : "Adicionar Cliente"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>
                Total de {filteredClients.length} {filteredClients.length === 1 ? "cliente" : "clientes"}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-[#eb07a4]" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Você precisa criar um negócio antes de adicionar clientes.</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/negocios/novo")}>
                Criar Negócio
              </Button>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum cliente encontrado com os termos da busca." : "Nenhum cliente cadastrado ainda."}
              </p>
              {searchTerm && (
                <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email || "-"}</TableCell>
                      <TableCell>{client.phone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClient(client)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/agendamentos/novo?client=${client.id}`)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Novo Agendamento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClient(client.id)}>
                              <Trash className="h-4 w-4 mr-2 text-red-500" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-center">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center mx-2">
                    Página {currentPage} de {Math.max(1, Math.ceil(filteredClients.length / itemsPerPage))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= Math.ceil(filteredClients.length / itemsPerPage)}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize as informações do cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Observações</Label>
              <Textarea
                id="edit-notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Informações adicionais sobre o cliente"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditClientOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateClient} disabled={isLoading} className="bg-[#eb07a4] hover:bg-[#d0069a]">
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
