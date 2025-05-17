"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Building, MapPin, Phone, Mail, Edit, Trash2, AlertCircle, RefreshCw, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { EmptyBusinesses } from "@/components/dashboard/empty-businesses"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { businessCategories } from "@/components/dashboard/business-form"

interface Business {
  id: string
  name: string
  description: string
  address: string
  phone: string
  email: string
  website?: string
  owner_id: string
  created_at: string
  logo_url?: string
  category: string
}

export default function BusinessesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchBusinesses()
  }, [])

  async function fetchBusinesses() {
    setIsLoading(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Erro ao obter usuário:", userError)
        toast({ title: "Erro", description: "Não foi possível obter os dados do usuário." })
        setIsLoading(false)
        return
      }

      if (!userData?.user) {
        console.error("Usuário não encontrado")
        toast({ title: "Erro", description: "Usuário não encontrado." })
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", userData.user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Erro ao buscar negócios:", error)
        toast({ 
          title: "Erro", 
          description: "Não foi possível buscar os negócios.",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      setBusinesses(data || [])
    } catch (error) {
      console.error("Erro ao buscar negócios:", error)
      toast({ title: "Erro", description: "Ocorreu um erro ao buscar os negócios." })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveBusiness(business: Business) {
    setIsSaving(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Erro ao obter usuário:", userError)
        toast({ title: "Erro", description: "Não foi possível obter os dados do usuário." })
        return
      }

      if (!userData?.user) {
        console.error("Usuário não encontrado")
        toast({ title: "Erro", description: "Usuário não encontrado." })
        return
      }

      const { error } = await supabase
        .from("businesses")
        .upsert({
          ...business,
          owner_id: userData.user.id,
        })

      if (error) {
        console.error("Erro ao salvar negócio:", error)
        toast({ 
          title: "Erro", 
          description: "Não foi possível salvar o negócio.", 
          variant: "destructive" 
        })
        return
      }

      toast({ 
        title: "Sucesso", 
        description: "Negócio salvo com sucesso!",
        className: "bg-green-500 text-white"
      })
      fetchBusinesses()
    } catch (error) {
      console.error("Erro ao salvar negócio:", error)
      toast({ title: "Erro", description: "Ocorreu um erro ao salvar o negócio.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteBusiness(businessId: string) {
    try {
      const { error } = await supabase
        .from("businesses")
        .delete()
        .eq("id", businessId)

      if (error) {
        console.error("Erro ao deletar negócio:", error)
        toast({ 
          title: "Erro", 
          description: "Não foi possível deletar o negócio.", 
          variant: "destructive" 
        })
        return
      }

      toast({ 
        title: "Sucesso", 
        description: "Negócio deletado com sucesso!",
        className: "bg-green-500 text-white"
      })
      fetchBusinesses()
    } catch (error) {
      console.error("Erro ao deletar negócio:", error)
      toast({ title: "Erro", description: "Ocorreu um erro ao deletar o negócio.", variant: "destructive" })
    }
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Meus Negócios</h1>
          <p className="text-muted-foreground">Gerencie seus negócios e configurações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchBusinesses} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button
            onClick={() => router.push("/dashboard/negocios/novo")}
            className="gap-2 bg-[#eb07a4] hover:bg-[#d0069a]"
          >
            <Plus className="h-4 w-4" />
            Novo Negócio
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : businesses.length === 0 ? (
        <EmptyBusinesses onCreateBusiness={() => router.push("/dashboard/negocios/novo")} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Card key={business.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={business.logo_url || "/placeholder.svg"} alt={business.name} />
                    <AvatarFallback className="text-lg">
                      {business.name
                        .split(" ")
                        .map((word) => word[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{business.name}</CardTitle>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full">
                      {businessCategories.find(cat => cat.value === business.category)?.label || business.category}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-1 shrink-0" />
                    <div className="flex-1">
                      {(() => {
                        try {
                          const addressData = JSON.parse(business.address)
                          return (
                            <div className="text-sm space-y-1">
                              <p>{addressData.street}, {addressData.number}
                                {addressData.complement ? `, ${addressData.complement}` : ""}</p>
                              <p>{addressData.neighborhood}, {addressData.city} - {addressData.state}</p>
                              <p>CEP {addressData.cep}</p>
                            </div>
                          )
                        } catch (e) {
                          return <span className="text-sm">{business.address}</span>
                        }
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{business.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{business.email}</span>
                  </div>
                  {business.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 shrink-0" />
                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                        {business.website}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between mt-auto pt-6 border-t">
                <Button variant="outline" onClick={() => router.push(`/dashboard/negocios/${business.id}`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteBusiness(business.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
