"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Star, Search, Trash2 } from "lucide-react"
import { PageShell } from "@/components/dashboard/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
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

interface Business {
  id: string
  name: string
  owner_id: string
}

interface Feedback {
  id: string
  business_id: string
  client_name: string
  rating: number
  comment: string
  created_at: string
}

export default function FeedbacksPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRating, setFilterRating] = useState("0")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const supabase = createClient()
  const itemsPerPage = 6
  const { toast } = useToast()

  useEffect(() => {
    loadBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      loadFeedbacks()
    }
  }, [selectedBusiness, page, searchTerm, filterRating])

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

      if (data && data.length > 0) {
        setSelectedBusiness(data[0].id)
      }
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
      setSelectedBusiness(null)
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
        .eq("business_id", selectedBusiness)
        .order("created_at", { ascending: false })

      if (searchTerm) {
        query = query.or(`client_name.ilike.%${searchTerm}%,comment.ilike.%${searchTerm}%`)
      }

      if (filterRating) {
        query = query.eq("rating", Number.parseInt(filterRating))
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

  return (
    <PageShell>
      <PageShell.Header>
        <PageShell.Title>Feedbacks de Clientes</PageShell.Title>
        <PageShell.Description>Visualize os feedbacks dos seus clientes</PageShell.Description>
      </PageShell.Header>
      <PageShell.Content>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select
                value={selectedBusiness || undefined}
                onValueChange={(value) => {
                  setSelectedBusiness(value)
                  setPage(1)
                }}
                disabled={isLoading || businesses.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um negócio" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id.toString()}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar feedbacks..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={filterRating}
                onValueChange={(value) => {
                  setFilterRating(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por nota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todas as notas</SelectItem>
                  <SelectItem value="5">5 estrelas</SelectItem>
                  <SelectItem value="4">4 estrelas</SelectItem>
                  <SelectItem value="3">3 estrelas</SelectItem>
                  <SelectItem value="2">2 estrelas</SelectItem>
                  <SelectItem value="1">1 estrela</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                  {searchTerm || filterRating
                    ? "Nenhum feedback corresponde aos filtros aplicados."
                    : "Você ainda não recebeu nenhum feedback dos seus clientes."}
                </p>
                {searchTerm || filterRating ? (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm("")
                      setFilterRating("")
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {feedbacks.map((feedback) => (
                  <Card key={feedback.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar>
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${feedback.client_name}`}
                            />
                            <AvatarFallback>{getInitials(feedback.client_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-sm font-medium">{feedback.client_name}</h4>
                            <p className="text-xs text-muted-foreground">{formatDate(feedback.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex">{renderStars(feedback.rating)}</div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{feedback.comment}</p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedFeedback(feedback)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

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
