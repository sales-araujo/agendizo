"use client"

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
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
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

  useEffect(() => {
    if (selectedBusinessId) {
      fetchServices(selectedBusinessId)
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

    if (!selectedBusinessId) {
      toast({ title: "Erro", description: "Selecione um negócio antes de adicionar serviços." })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("services")
        .insert([
          {
            business_id: selectedBusinessId,
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
      fetchServices(selectedBusinessId)
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
      fetchServices(selectedBusinessId)
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

      fetchServices(selectedBusinessId)
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({ title: "Erro", description: "Não foi possível excluir o serviço." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (selectedBusinessId) {
      setIsRefreshing(true)
      try {
        await fetchServices(selectedBusinessId)
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
    <div className="space-y-6">
      {businesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum negócio encontrado</h3>
            <p className="text-muted-foreground text-center mt-1">
              Você precisa criar um negócio antes de gerenciar serviços.
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
              <CardDescription>Escolha qual negócio você deseja gerenciar os serviços</CardDescription>
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
                    placeholder="Buscar serviços..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-[300px]"
                  />
                  <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <Dialog open={isAddServiceOpen} onOpenChange={setIsAddServiceOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#eb07a4] hover:bg-[#d0069a]">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo serviço
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar serviço</DialogTitle>
                      <DialogDescription>Preencha as informações do serviço abaixo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do serviço</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Ex: Corte de cabelo"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição (opcional)</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Descreva os detalhes do serviço"
                          value={formData.description}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duração (minutos)</Label>
                        <Input
                          id="duration"
                          name="duration"
                          type="number"
                          min="1"
                          value={formData.duration}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Preço</Label>
                        <Input
                          id="price"
                          name="price"
                          type="text"
                          placeholder="0,00"
                          value={formData.price}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddServiceOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddService} className="bg-[#eb07a4] hover:bg-[#d0069a]">
                        Adicionar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Serviços</CardTitle>
                  <CardDescription>Gerencie os serviços oferecidos pelo seu negócio.</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Nenhum serviço encontrado</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Comece adicionando seu primeiro serviço clicando no botão "Novo serviço".
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Duração</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{service.name}</p>
                                {service.description && (
                                  <p className="text-sm text-muted-foreground">{service.description}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatDuration(service.duration)}</TableCell>
                            <TableCell>{formatPrice(service.price)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Abrir menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditService(service)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteService(service.id)}>
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

      <Dialog open={isEditServiceOpen} onOpenChange={setIsEditServiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar serviço</DialogTitle>
            <DialogDescription>Atualize as informações do serviço abaixo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do serviço</Label>
              <Input
                id="edit-name"
                name="name"
                placeholder="Ex: Corte de cabelo"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição (opcional)</Label>
              <Textarea
                id="edit-description"
                name="description"
                placeholder="Descreva os detalhes do serviço"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duração (minutos)</Label>
              <Input
                id="edit-duration"
                name="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Preço</Label>
              <Input
                id="edit-price"
                name="price"
                type="text"
                placeholder="0,00"
                value={formData.price}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditServiceOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateService} className="bg-[#eb07a4] hover:bg-[#d0069a]">
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
