"use client"

import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BusinessForm } from "@/components/dashboard/business-form"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useState, useEffect, use } from "react"
import { createClient } from "@/lib/supabase/client"

interface BusinessFormData {
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
}

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const [business, setBusiness] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const resolvedParams = use(params)

  useEffect(() => {
    fetchBusiness()
  }, [resolvedParams.id])

  async function fetchBusiness() {
    try {
      const { data: user } = await supabase.auth.getUser()

      if (!user?.user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", resolvedParams.id)
        .eq("owner_id", user.user.id)
        .single()

      if (error) throw error

      if (!data) {
        notFound()
      }

      setBusiness(data)
    } catch (error) {
      console.error("Error fetching business:", error)
      toast({
        title: "Erro ao carregar negócio",
        description: "Não foi possível carregar as informações do negócio.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (formData: BusinessFormData) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          logo_url: formData.logo_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedParams.id)

      if (error) throw error

      toast({
        title: "Negócio atualizado",
        description: "As informações do negócio foram atualizadas com sucesso.",
      })

      router.push("/dashboard/negocios")
    } catch (error: any) {
      console.error("Error updating business:", error)
      toast({
        title: "Erro ao atualizar negócio",
        description: error.message || "Não foi possível atualizar o negócio.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Carregando...</h1>
            <p className="text-muted-foreground">Aguarde enquanto carregamos as informações do negócio.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!business) {
    return notFound()
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Editar Negócio</h1>
          <p className="text-muted-foreground">Atualize as informações do seu negócio.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Negócio</CardTitle>
          <CardDescription>Atualize as informações do seu negócio.</CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessForm onSubmit={handleSubmit} isLoading={isSaving} business={business} />
        </CardContent>
      </Card>
    </div>
  )
}
