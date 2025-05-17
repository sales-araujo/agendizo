"use client"

import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BusinessForm } from "@/components/dashboard/business-form"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface BusinessFormData {
  name: string
  address: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  category: string
}

export default function EditBusinessPage({ params }: { params: { id: string } }) {
  const [business, setBusiness] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchBusiness()
  }, [params.id])

  async function fetchBusiness() {
    try {
      const { data: user } = await supabase.auth.getUser()

      if (!user?.user) {
        throw new Error("Usuário não autenticado")
      }

      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", params.id)
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
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          logo_url: formData.logo_url,
          category: formData.category,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Negócio atualizado com sucesso!",
        className: "bg-green-500 text-white"
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
      <div className="mx-auto max-w-[42rem] p-6">
        <Card>
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
            <CardDescription>Aguarde enquanto carregamos as informações do negócio.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!business) {
    return notFound()
  }

  return (
    <div className="mx-auto max-w-[42rem] p-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar Negócio</CardTitle>
          <CardDescription>Atualize as informações do seu negócio</CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessForm onSubmit={handleSubmit} isLoading={isSaving} business={business} />
        </CardContent>
      </Card>
    </div>
  )
}
