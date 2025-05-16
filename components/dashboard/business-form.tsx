"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  description: z
    .string()
    .max(500, {
      message: "A descrição deve ter no máximo 500 caracteres.",
    })
    .optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email({
      message: "Por favor, insira um email válido.",
    })
    .optional(),
  website: z
    .string()
    .url({
      message: "Por favor, insira um URL válido.",
    })
    .optional()
    .or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

interface BusinessFormProps {
  onSubmit: (data: FormValues & { logo_url?: string }) => Promise<void>
  isLoading: boolean
  business: {
    id: string
    name: string
    description?: string
    address?: string
    phone?: string
    email?: string
    website?: string
    logo_url?: string
  }
}

export function BusinessForm({ onSubmit, isLoading, business }: BusinessFormProps) {
  const { toast } = useToast()
  const supabase = createClient()
  const [isUploading, setIsUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(business?.logo_url || null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: business?.name || "",
      description: business?.description || "",
      address: business?.address || "",
      phone: business?.phone || "",
      email: business?.email || "",
      website: business?.website || "",
    },
  })

  // Função para obter as iniciais do nome do negócio
  const getBusinessInitials = () => {
    if (!business?.name) return "N"

    const words = business.name.split(" ")

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }

    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 2MB.",
        variant: "destructive",
      })
      return
    }

    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (data: FormValues) => {
    let logoUrl: string | undefined = business?.logo_url

    if (logoFile) {
      setIsUploading(true)
      try {
        const fileExt = logoFile.name.split(".").pop()
        const fileName = `business_${business.id}_logo_${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("businessassets")
          .upload(fileName, logoFile, {
            cacheControl: "3600",
            upsert: true,
          })

        if (uploadError) {
          console.error("Upload error details:", uploadError)
          throw new Error(uploadError.message || "Erro ao fazer upload do arquivo")
        }

        const { data: publicUrlData } = supabase.storage.from("businessassets").getPublicUrl(fileName)
        if (!publicUrlData?.publicUrl) {
          throw new Error("Não foi possível obter a URL pública do arquivo")
        }

        logoUrl = publicUrlData.publicUrl
      } catch (error: any) {
        console.error("Error uploading logo:", error)
        toast({
          title: "Erro ao fazer upload da logo",
          description: error.message || "Não foi possível fazer upload da logo. Tente novamente.",
          variant: "destructive",
        })
        setIsUploading(false)
        return
      } finally {
        setIsUploading(false)
      }
    }

    await onSubmit({ ...data, logo_url: logoUrl })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={logoPreview || "/placeholder.svg"} alt={business?.name || "Negócio"} />
          <AvatarFallback className="text-2xl">{getBusinessInitials()}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-medium">Logo do Negócio</h3>
          <p className="text-sm text-muted-foreground">JPG, PNG ou WEBP (máx. 2MB)</p>
          <label htmlFor="logo-upload">
            <div className="flex cursor-pointer items-center space-x-2 rounded-md border px-3 py-1.5 hover:bg-muted mt-2 w-fit">
              <Upload className="h-4 w-4" />
              <span className="text-sm">{isUploading ? "Enviando..." : "Alterar logo"}</span>
              {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do negócio</Label>
          <Input id="name" {...form.register("name")} disabled={isLoading} />
          {form.formState.errors.name && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            disabled={isLoading}
            placeholder="Descreva seu negócio..."
            rows={4}
          />
          {form.formState.errors.description && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            {...form.register("address")}
            disabled={isLoading}
            placeholder="Rua, número, bairro, cidade, estado, CEP"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" {...form.register("phone")} disabled={isLoading} placeholder="(00) 00000-0000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              disabled={isLoading}
              placeholder="contato@seunegocio.com"
            />
            {form.formState.errors.email && (
              <p className="text-sm font-medium text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            {...form.register("website")}
            disabled={isLoading}
            placeholder="https://www.seunegocio.com"
          />
          {form.formState.errors.website && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.website.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading || isUploading}>
          {isLoading || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploading ? "Enviando logo..." : "Salvando alterações..."}
            </>
          ) : (
            "Salvar alterações"
          )}
        </Button>
      </form>
    </div>
  )
}
