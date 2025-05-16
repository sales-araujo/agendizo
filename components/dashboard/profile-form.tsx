"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Upload, Facebook, Instagram, Phone } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
  phone: z.string().optional(),
  businessName: z
    .string()
    .min(2, {
      message: "O nome da empresa deve ter pelo menos 2 caracteres.",
    })
    .optional(),
  bio: z
    .string()
    .max(500, {
      message: "A bio deve ter no máximo 500 caracteres.",
    })
    .optional(),
  whatsapp: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
})

export function ProfileForm({ user, profile, business }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const supabase = createClient()

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || "",
      email: user?.email || "",
      phone: user?.user_metadata?.phone || "",
      businessName: business?.name || "",
      bio: profile?.bio || "",
      whatsapp: profile?.social_media?.whatsapp || "",
      facebook: profile?.social_media?.facebook || "",
      instagram: profile?.social_media?.instagram || "",
    },
  })

  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url)
    }
  }, [user])

  async function onSubmit(values) {
    setIsLoading(true)
    try {
      // Atualizar perfil do usuário
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          full_name: values.fullName,
          phone: values.phone,
        },
      })

      if (userError) throw userError

      // Atualizar nome da empresa se houver alteração
      if (business && values.businessName && values.businessName !== business.name) {
        const { error: businessError } = await supabase
          .from("businesses")
          .update({ name: values.businessName })
          .eq("id", business.id)

        if (businessError) throw businessError
      }

      // Atualizar ou criar perfil com redes sociais
      const profileData = {
        id: user.id,
        bio: values.bio || null,
        social_media: {
          whatsapp: values.whatsapp || null,
          facebook: values.facebook || null,
          instagram: values.instagram || null,
        },
        updated_at: new Date().toISOString(),
      }

      const { error: profileError } = await supabase.from("profiles").upsert(profileData)

      if (profileError) throw profileError

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })

      // Reload the page to reflect changes
      window.location.reload()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Erro ao atualizar perfil",
        description: "Ocorreu um erro ao atualizar suas informações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function createBucket() {
    try {
      const { data, error } = await supabase.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
        allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
      })

      if (error && !error.message.includes("already exists")) {
        throw error
      }

      return true
    } catch (error) {
      console.error("Error creating bucket:", error)
      return false
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 2MB.",
          variant: "destructive",
        })
        return
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { data, error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        console.error("Upload error:", uploadError)

        // If the error is bucket not found, create the bucket and try again
        if (uploadError.message?.includes("bucket") || uploadError.message?.includes("not found")) {
          const bucketCreated = await createBucket()

          if (bucketCreated) {
            // Try upload again
            const { data: retryData, error: retryError } = await supabase.storage
              .from("avatars")
              .upload(fileName, file, {
                cacheControl: "3600",
                upsert: true,
              })

            if (retryError) {
              throw new Error("Não foi possível fazer upload da imagem após várias tentativas.")
            }
          } else {
            throw new Error("Erro ao fazer upload da imagem. Tente novamente.")
          }
        } else {
          throw new Error("Erro ao fazer upload da imagem. Tente novamente.")
        }
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(fileName)

      const avatarUrl = publicUrlData.publicUrl

      // Update user metadata with avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      })

      if (updateError) throw updateError

      // Update local state
      setAvatarUrl(avatarUrl)

      toast({
        title: "Imagem atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      })
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Erro ao atualizar imagem",
        description: error.message || "Ocorreu um erro ao atualizar sua foto de perfil. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      event.target.value = ""
    }
  }

  // Função para formatar número de telefone brasileiro
  const formatPhoneNumber = (value) => {
    if (!value) return value

    // Remove todos os caracteres não numéricos
    const phoneNumber = value.replace(/\D/g, "")

    // Aplica a formatação
    if (phoneNumber.length <= 2) {
      return `(${phoneNumber}`
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`
    } else if (phoneNumber.length <= 10) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6)}`
    } else {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`
    }
  }

  // Função para obter as iniciais do nome do usuário
  const getUserInitials = () => {
    const fullName = form.getValues("fullName") || user?.user_metadata?.full_name || ""
    if (!fullName) return "U"

    const names = fullName.split(" ")
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">Informações Pessoais</TabsTrigger>
          <TabsTrigger value="business">Empresa e Redes Sociais</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
                <div className="relative h-24 w-24">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || ""} alt="Avatar" />
                    <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col space-y-2">
                  <div className="text-sm text-muted-foreground">JPG, PNG ou WEBP (máx. 2MB)</div>
                  <label htmlFor="avatar-upload">
                    <div className="flex cursor-pointer items-center space-x-2 rounded-md border px-4 py-2 hover:bg-muted">
                      <Upload className="h-4 w-4" />
                      <span>{isUploading ? "Enviando..." : "Alterar foto"}</span>
                      {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormDescription>Este é o nome que será exibido no seu perfil.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu.email@exemplo.com" {...field} disabled />
                        </FormControl>
                        <FormDescription>Seu email não pode ser alterado.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            {...field}
                            onChange={(e) => {
                              const formatted = formatPhoneNumber(e.target.value)
                              e.target.value = formatted
                              onChange(e)
                            }}
                          />
                        </FormControl>
                        <FormDescription>Seu número de telefone para contato.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biografia</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Conte um pouco sobre você..."
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>Uma breve descrição sobre você.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="bg-[#eb07a4] hover:bg-[#d0069a]" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da sua empresa" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormDescription>Este é o nome que será exibido para seus clientes.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Redes Sociais</h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione suas redes sociais para que seus clientes possam encontrá-lo facilmente.
                    </p>

                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field: { onChange, ...field } }) => (
                        <FormItem>
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-5 w-5 text-green-500" />
                              <Input
                                placeholder="(00) 00000-0000"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const formatted = formatPhoneNumber(e.target.value)
                                  e.target.value = formatted
                                  onChange(e)
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>Número do WhatsApp para contato direto.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Facebook className="h-5 w-5 text-blue-600" />
                              <Input
                                placeholder="https://facebook.com/suapagina"
                                {...field}
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>URL completa da sua página no Facebook.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Instagram className="h-5 w-5 text-pink-500" />
                              <Input
                                placeholder="https://instagram.com/seuusuario"
                                {...field}
                                value={field.value || ""}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>URL completa do seu perfil no Instagram.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="bg-[#eb07a4] hover:bg-[#d0069a]" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
