"use client"

import { useState, useEffect, useMemo } from "react"
import { MessageSquare, Star, Search, Trash2 } from "lucide-react"
import { PageShell } from "@/components/dashboard/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { PostgrestError } from "@supabase/supabase-js"
import { useSettings } from '@/lib/contexts/settings-context'
import { useBusinessData } from '@/lib/hooks/use-business-data'
import { DataTable } from '@/components/ui/data-table'

interface Business {
  id: string
  name: string
  owner_id: string
}

interface Feedback {
  id: string
  business_id: string
  client_id: string
  service_id: string
  rating: number
  comment: string
  created_at: string
  clients?: { id: string; name: string }
  services?: { id: string; name: string }
}

interface Service {
  id: string
  name: string
}

export default function FeedbacksPage() {
  const { selectedBusiness } = useSettings()
  const [selectedRating, setSelectedRating] = useState<string>("")
  const [selectedServiceId, setSelectedServiceId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const supabase = createClient()
  const itemsPerPage = 6
  const { toast } = useToast()

  // Buscar feedbacks com join de cliente e serviço
  const { data: feedbacksData, isLoading: feedbacksLoading } = useBusinessData<Feedback>({
    table: 'feedbacks',
    query: `*, clients(*), services(*)`,
  })
  // Buscar serviços para o filtro
  const { data: services } = useBusinessData<Service>({
    table: 'services',
    query: '*',
  })

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      loadFeedbacks()
    }
  }, [selectedBusiness, page, searchTerm, selectedRating, selectedServiceId])

  const loadBusinesses = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error("Erro de autenticação:", authError)
        throw new Error("Erro ao verificar autenticação")
      }

      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user.id)
        .order("name")

      if (businessError) {
        console.error("Erro do Supabase:", businessError)
        throw new Error(businessError.message || "Erro ao buscar negócios")
      }

      setBusinesses(data || [])
    } catch (error) {
      console.error("Erro ao carregar negócios:", error)
      
      let errorMessage = "Não foi possível carregar seus negócios"
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
      
      setBusinesses([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadFeedbacks = async () => {
    if (!selectedBusiness) {
      setFeedbacks([])
      setTotalPages(1)
      return
    }

    setIsLoading(true)
    try {
      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) {
        throw new Error("Usuário não autenticado")
      }

      let query = supabase
        .from("feedbacks")
        .select("*", { count: "exact" })
        .eq("business_id", selectedBusiness.id)
        .order("created_at", { ascending: false })

      if (searchTerm) {
        query = query.or(`clients.name.ilike.%${searchTerm}%,services.name.ilike.%${searchTerm}%`)
      }

      if (selectedRating) {
        query = query.eq("rating", Number.parseInt(selectedRating))
      }

      if (selectedServiceId) {
        query = query.eq("service_id", selectedServiceId)
      }

      // Paginação
      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, count, error: feedbacksError } = await query.range(from, to)

      if (feedbacksError) {
        console.error("Erro do Supabase:", feedbacksError)
        throw new Error(feedbacksError.message || "Erro ao buscar feedbacks")
      }

      setFeedbacks(data || [])
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error("Erro ao carregar feedbacks:", error)
      let errorMessage = "Não foi possível carregar os feedbacks"
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
      setFeedbacks([])
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteFeedback = async () => {
    if (!selectedFeedback) return

    try {
      const { error } = await supabase.from("feedbacks").delete().eq("id", selectedFeedback.id)

      if (error) throw error

      toast({
        title: "Feedback excluído",
        description: "O feedback foi excluído com sucesso",
      })

      setIsDeleteDialogOpen(false)
      setSelectedFeedback(null)

      loadFeedbacks()
    } catch (error) {
      console.error("Erro ao excluir feedback:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o feedback",
        variant: "destructive",
      })
    }
  }

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
      ))
  }

  const getInitials = (name: string) => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Filtragem
  const filteredFeedbacks = useMemo(() => {
    return (feedbacksData || [])
      .filter(fb =>
        (!selectedRating || String(fb.rating) === selectedRating) &&
        (!selectedServiceId || fb.service_id === selectedServiceId) &&
        (
          !searchTerm ||
          (fb.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           fb.services?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      )
  }, [feedbacksData, selectedRating, selectedServiceId, searchTerm])

  // Colunas da tabela
  const columns = [
    {
      accessorKey: "clients.name",
      header: "Cliente",
      cell: ({ row }: any) => row.original.clients?.name || "-"
    },
    {
      accessorKey: "services.name",
      header: "Serviço",
      cell: ({ row }: any) => row.original.services?.name || "-"
    },
    {
      accessorKey: "rating",
      header: "Nota",
      cell: ({ row }: any) => (
        <span className="flex items-center gap-1">
          {row.original.rating}
          <Star className="h-4 w-4 text-yellow-500" fill="#facc15" />
        </span>
      )
    },
    {
      accessorKey: "comment",
      header: "Comentário",
      cell: ({ row }: any) => row.original.comment || "-"
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }: any) => new Date(row.original.created_at).toLocaleDateString()
    },
  ]

  return (
    <PageShell>
      <PageShell.Header>
        <PageShell.Title>Feedbacks de Clientes</PageShell.Title>
        <PageShell.Description>Visualize os feedbacks dos seus clientes</PageShell.Description>
      </PageShell.Header>
      <PageShell.Content>
        <div className="space-y-4">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Input
                placeholder="Buscar feedbacks por cliente ou serviço..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="sm:w-96"
              />
              <Select value={selectedRating} onValueChange={setSelectedRating}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Filtrar por nota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as notas</SelectItem>
                  {[5,4,3,2,1].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} estrelas</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Filtrar por serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os serviços</SelectItem>
                  {services?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedBusiness ? (
            <>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16 mt-1" />
                              </div>
                            </div>
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full mt-2" />
                          <Skeleton className="h-4 w-2/3 mt-2" />
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : feedbacks.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum feedback encontrado</h3>
                    <p className="text-muted-foreground text-center mt-1">
                      {searchTerm || selectedRating || selectedServiceId
                        ? "Nenhum feedback corresponde aos filtros aplicados."
                        : "Você ainda não recebeu nenhum feedback dos seus clientes."}
                    </p>
                    {searchTerm || selectedRating || selectedServiceId ? (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSearchTerm("")
                          setSelectedRating("")
                          setSelectedServiceId("")
                        }}
                      >
                        Limpar filtros
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-4">
                        Os feedbacks são enviados pelos clientes após o atendimento.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  <DataTable columns={columns} data={filteredFeedbacks} isLoading={isLoading} pageSize={5} />

                  {totalPages > 1 && (
                    <Pagination className="mt-6">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault()
                              setPage(Math.max(1, page - 1))
                            }} 
                            className={page === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink 
                              href="#" 
                              isActive={pageNum === page} 
                              onClick={(e) => {
                                e.preventDefault()
                                setPage(pageNum)
                              }}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault()
                              setPage(Math.min(totalPages, page + 1))
                            }}
                            className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum negócio selecionado</h3>
                <p className="text-muted-foreground text-center mt-1">
                  Por favor, selecione um negócio para visualizar os feedbacks.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </PageShell.Content>

      {/* Dialog para confirmar exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este feedback? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteFeedback}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
