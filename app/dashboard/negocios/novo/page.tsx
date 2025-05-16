"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { NewBusinessForm } from "@/components/dashboard/new-business-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

export default function NewBusinessPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (formData: any) => {
    setIsLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()

      if (!user?.user) {
        throw new Error("Usuário não autenticado")
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
            type: formData.type,
            slug: formData.slug,
            logo_url: formData.logo_url,
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
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Novo Negócio</h1>
          <p className="text-muted-foreground">Crie um novo negócio para gerenciar seus agendamentos.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Negócio</CardTitle>
          <CardDescription>Preencha as informações do seu negócio.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewBusinessForm onSubmit={handleSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
