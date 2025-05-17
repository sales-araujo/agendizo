"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { NewBusinessForm } from "@/components/dashboard/new-business-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface FormData {
  name: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  slug: string
  category: string
  logo_url?: string
}

export default function NewBusinessPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState(true)

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()

      if (!user?.user) {
        throw new Error("Usuário não autenticado")
      }

      // Verificar disponibilidade do slug novamente antes de criar
      const { data: slugCheck } = await supabase
        .from("businesses")
        .select("slug")
        .eq("slug", formData.slug)
        .maybeSingle()

      if (slugCheck) {
        toast({
          title: "Slug indisponível",
          description: "Este slug já está em uso. Por favor, escolha outro.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("businesses")
        .insert([
          {
            owner_id: user.user.id,
            name: formData.name,
            description: formData.description,
            address: formData.address,
            phone: formData.phone,
            email: formData.email,
            website: formData.website,
            slug: formData.slug,
            logo_url: formData.logo_url,
            category: formData.category,
          },
        ])
        .select()

      if (error) throw error

      toast({
        title: "Negócio criado",
        description: "O negócio foi criado com sucesso.",
        variant: "success",
      })

      router.push("/dashboard/negocios")
    } catch (error: any) {
      console.error("Error creating business:", error)
      toast({
        title: "Erro ao criar negócio",
        description: error.message || "Não foi possível criar o negócio.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[42rem] p-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Negócio</CardTitle>
          <CardDescription>Preencha os dados do seu novo negócio</CardDescription>
        </CardHeader>
        <CardContent>
          <NewBusinessForm onSubmit={handleSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
