"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/lib/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface Profile {
  id: string
  full_name: string
  avatar_url: string
  email: string
  phone: string
  created_at: string
  updated_at: string
}

export default function ProfilePageClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const toast = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    setIsLoading(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Erro ao obter usuário:", userError)
        toast.error("Erro", "Não foi possível obter os dados do usuário.")
        setIsLoading(false)
        return
      }

      if (!userData?.user) {
        console.error("Usuário não encontrado")
        toast.error("Erro", "Usuário não encontrado.")
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single()

      if (error) {
        console.error("Erro ao buscar perfil:", error)
        toast.error("Erro", "Não foi possível buscar o perfil.")
        setIsLoading(false)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      toast.error("Erro", "Ocorreu um erro ao buscar o perfil.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveProfile(profile: Profile) {
    setIsSaving(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error("Erro ao obter usuário:", userError)
        toast.error("Erro", "Não foi possível obter os dados do usuário.")
        return
      }

      if (!userData?.user) {
        console.error("Usuário não encontrado")
        toast.error("Erro", "Usuário não encontrado.")
        return
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({
          ...profile,
          id: userData.user.id,
        })

      if (error) {
        console.error("Erro ao salvar perfil:", error)
        toast.error("Erro", "Não foi possível salvar o perfil.")
        return
      }

      toast.success("Sucesso", "Perfil salvo com sucesso!")
      fetchProfile()
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      toast.error("Erro", "Ocorreu um erro ao salvar o perfil.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdatePassword(currentPassword: string, newPassword: string) {
    setIsSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        console.error("Erro ao atualizar senha:", error)
        toast.error("Erro", "Não foi possível atualizar a senha.")
        return
      }

      toast.success("Sucesso", "Senha atualizada com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar senha:", error)
      toast.error("Erro", "Ocorreu um erro ao atualizar a senha.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais e senha
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={profile?.full_name || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev!,
                      full_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev!,
                      email: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile?.phone || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev!,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>
              <Button
                onClick={() => profile && handleSaveProfile(profile)}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
