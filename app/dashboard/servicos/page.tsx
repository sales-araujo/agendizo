"use client"

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, MoreHorizontal, Edit, Trash, Scissors, RefreshCw } from "lucide-react"

interface Business {
  id: string
  name: string
  owner_id: string
  created_at: string
}

interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  duration: number
  price: number
  created_at: string
}

interface FormData {
  name: string
  description: string
  duration: number
  price: string
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
  const [isEditServiceOpen, setIsEditServiceOpen] = useState(false)
  const [currentService, setCurrentService] = useState<Service | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    duration: 60,
    price: "",
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const formatPrice = (price: number) => {
    if (!price) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

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

      // Se tiver negócios, busca os serviços do primeiro negócio
      if (data && data.length > 0) {
        fetchServices(data[0].id)
      } else {
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error fetching businesses:", error)
      toast({ title: "Erro", description: "Ocorreu um erro ao buscar os negócios." })
      setIsLoading(false)
    }
  }

  async function fetchServices(businessId: string) {
    if (!businessId) {
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .order("name", { ascending: true })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error("Error fetching services:", error)
      toast({ title: "Erro", description: "Ocorreu um erro ao buscar os serviços." })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredServices = services.filter(
    (service) =>
      service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      duration: 60,
      price: "",
    })
  }

  const formatDuration = (minutes: number) => {
    if (!minutes) return ""
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) {
      return `${mins} min`
    } else if (mins === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${mins}min`
    }
  }

  const handleAddService = async () => {
    if (!formData.name) {
      toast({ title: "Erro", description: "Por favor, informe o nome do serviço." })
      return
    }

    if (businesses.length === 0) {
      toast({ title: "Erro", description: "Você precisa criar um negócio antes de adicionar serviços." })
      router.push("/dashboard/negocios/novo")
      return
    }

    setIsLoading(true)
    try {
      const businessId = businesses[0].id

      const { data, error } = await supabase
        .from("services")
        .insert([
          {
            business_id: businessId,
            name: formData.name,
            description: formData.description,
            duration: formData.duration,
            price: Number.parseFloat(formData.price.replace(",", ".")) || 0,
          },
        ])
        .select()

      if (error) throw error

      toast({ title: "Sucesso", description: "Serviço adicionado com sucesso." })

      resetForm()
      setIsAddServiceOpen(false)
      fetchServices(businessId)
    } catch (error) {
      console.error("Error adding service:", error)
      toast({ title: "Erro", description: "Não foi possível adicionar o serviço." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditService = (service: Service) => {
    setCurrentService(service)
    setFormData({
      name: service.name || "",
      description: service.description || "",
      duration: service.duration || 60,
      price: service.price.toString() || "",
    })
    setIsEditServiceOpen(true)
  }

  const handleUpdateService = async () => {
    if (!formData.name) {
      toast({ title: "Erro", description: "Por favor, informe o nome do serviço." })
      return
    }

    if (!currentService) {
      toast({ title: "Erro", description: "Serviço não encontrado." })
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("services")
        .update({
          name: formData.name,
          description: formData.description,
          duration: formData.duration,
          price: Number.parseFloat(formData.price) || 0,
        })
        .eq("id", currentService.id)

      if (error) throw error

      toast({ title: "Sucesso", description: "As informações do serviço foram atualizadas com sucesso." })

      resetForm()
      setIsEditServiceOpen(false)
      fetchServices(businesses[0]?.id)
    } catch (error) {
      console.error("Error updating service:", error)
      toast({ title: "Erro", description: "Não foi possível atualizar as informações do serviço." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("services").delete().eq("id", id)

      if (error) throw error

      toast({ title: "Sucesso", description: "Serviço excluído com sucesso." })

      fetchServices(businesses[0]?.id)
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({ title: "Erro", description: "Não foi possível excluir o serviço." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (businesses.length > 0) {
      setIsRefreshing(true)
      try {
        await fetchServices(businesses[0].id)
        toast({ 
          title: "Sucesso", 
          description: "A lista de serviços foi atualizada com sucesso.",
          variant: "success"
        })
      } finally {
        setIsRefreshing(false)
      }
    }
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gerencie todos os seus serviços em um só lugar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading || isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-[#eb07a4] hover:bg-[#d0069a]">
                <Plus className="h-4 w-4" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Serviço</DialogTitle>
                <DialogDescription>Preencha as informações do novo serviço.</DialogDescription>
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
                    placeholder="Nome do serviço"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Descrição do serviço"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos)</Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={handleInputChange}
                      placeholder="60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddServiceOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddService} disabled={isLoading} className="bg-[#eb07a4] hover:bg-[#d0069a]">
                  {isLoading ? "Adicionando..." : "Adicionar Serviço"}
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
              <CardTitle>Lista de Serviços</CardTitle>
              <CardDescription>
                Total de {filteredServices.length} {filteredServices.length === 1 ? "serviço" : "serviços"}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços..."
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
              <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Você precisa criar um negócio antes de adicionar serviços.</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/negocios/novo")}>
                Criar Negócio
              </Button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum serviço encontrado com os termos da busca." : "Nenhum serviço cadastrado ainda."}
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
                    <TableHead>Duração</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="hidden md:table-cell">Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{formatDuration(service.duration)}</TableCell>
                      <TableCell>{formatPrice(service.price)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {service.description ? (
                          <span className="line-clamp-1">{service.description}</span>
                        ) : (
                          <span className="text-muted-foreground">Sem descrição</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditService(service)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/agendamentos/novo?service=${service.id}`)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Novo Agendamento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteService(service.id)}>
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
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditServiceOpen} onOpenChange={setIsEditServiceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
            <DialogDescription>Atualize as informações do serviço.</DialogDescription>
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
                placeholder="Nome do serviço"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descrição do serviço"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duração (minutos)</Label>
                <Input
                  id="edit-duration"
                  name="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Preço (R$)</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditServiceOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateService} disabled={isLoading} className="bg-[#eb07a4] hover:bg-[#d0069a]">
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
