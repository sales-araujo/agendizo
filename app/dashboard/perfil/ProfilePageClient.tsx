"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Instagram, Facebook, Twitter, Phone } from "lucide-react"
import { cn, formatPhoneNumber } from "@/lib/utils"

interface Profile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  subscription_status: string | null
  subscription_tier: string | null
  subscription_end_date: string | null
  created_at: string
  updated_at: string | null
  company_name: string | null
  category: string | null
  bio: string | null
  social_links: {
    whatsapp: string | null
    facebook: string | null
    instagram: string | null
  }
  phone: string | null
}

export default function ProfilePageClient() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const { toast } = useToast()
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
        toast({
          title: "Erro",
          description: "Não foi possível obter os dados do usuário.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!userData?.user) {
        console.error("Usuário não encontrado")
        toast({
          title: "Erro",
          description: "Usuário não encontrado.",
          variant: "destructive",
        })
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
        toast({
          title: "Erro",
          description: "Não foi possível buscar o perfil.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Garantir que social_links existe e tem a estrutura correta
      const profile = {
        ...data,
        social_links: data.social_links || {},
        phone: data.phone || null
      }

      setProfile(profile)
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar o perfil.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setProfile(prev => prev ? {
        ...prev,
        avatar_url: reader.result as string
      } : null)
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveProfile(profile: Profile) {
    if (!profile) return

    setIsSaving(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) throw userError

      if (!userData?.user) {
        throw new Error("Usuário não encontrado")
      }

      let avatarUrl = profile.avatar_url

      // Se houver um arquivo de avatar para upload
      if (avatarFile) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(`${userData.user.id}-${Date.now()}`, avatarFile)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(uploadData.path)
        avatarUrl = urlData.publicUrl
      }

      // Atualizar perfil com redes sociais
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userData.user.id,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: avatarUrl,
          bio: profile.bio,
          social_links: profile.social_links || {},
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      // Atualizar o usuário no Supabase Auth
      await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          avatar_url: avatarUrl
        }
      })

      toast({
        title: "Sucesso",
        description: "Perfil salvo com sucesso!",
        variant: "success",
      })
      
      await fetchProfile()
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o perfil.",
        variant: "destructive",
      })
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
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a senha.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sucesso",
        description: "Senha atualizada com sucesso!",
        variant: "default",
      })
    } catch (error) {
      console.error("Erro ao atualizar senha:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a senha.",
        variant: "destructive",
      })
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
            Gerencie suas informações pessoais e redes sociais
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
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer hover:bg-primary/90"
                  >
                    <Camera className="h-4 w-4 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-medium">{profile?.full_name || "Sem nome"}</h3>
                  <p className="text-sm text-muted-foreground">{profile?.email || "Sem email"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={profile?.full_name || ""}
                    onChange={(e) =>
                      setProfile((prev) => prev ? ({
                        ...prev,
                        full_name: e.target.value,
                      }) : null)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ""}
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Para alterar seu email, entre em contato com o suporte.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile?.phone || ""}
                    onChange={(e) => {
                      const formattedPhone = formatPhoneNumber(e.target.value);
                      setProfile((prev) => prev ? ({
                        ...prev,
                        phone: formattedPhone,
                      }) : null)
                    }}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium">Redes Sociais</h3>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      WhatsApp
                    </Label>
                    <Input
                      value={profile?.social_links?.whatsapp || ""}
                      onChange={(e) => {
                        const formattedPhone = formatPhoneNumber(e.target.value);
                        setProfile((prev) => prev ? ({
                          ...prev,
                          social_links: {
                            ...(prev.social_links || {}),
                            whatsapp: formattedPhone,
                          }
                        }) : null)
                      }}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </Label>
                    <Input
                      value={profile?.social_links?.instagram || ""}
                      onChange={(e) =>
                        setProfile((prev) => prev ? ({
                          ...prev,
                          social_links: {
                            ...(prev.social_links || {}),
                            instagram: e.target.value,
                          }
                        }) : null)
                      }
                      placeholder="https://instagram.com/seu-perfil"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </Label>
                    <Input
                      value={profile?.social_links?.facebook || ""}
                      onChange={(e) =>
                        setProfile((prev) => prev ? ({
                          ...prev,
                          social_links: {
                            ...(prev.social_links || {}),
                            facebook: e.target.value,
                          }
                        }) : null)
                      }
                      placeholder="https://facebook.com/seu-perfil"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => profile && handleSaveProfile(profile)}
                disabled={isSaving}
                className="w-full"
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
