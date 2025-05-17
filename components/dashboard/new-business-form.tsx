"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputMask } from "@/components/ui/input-mask"
import { AddressForm, AddressData } from "@/components/ui/address-form"
import { FieldError } from "react-hook-form"

const businessCategories = [
  { value: "salao", label: "Salão de Beleza" },
  { value: "barbearia", label: "Barbearia" },
  { value: "estetica", label: "Estética" },
  { value: "spa", label: "Spa" },
  { value: "clinica", label: "Clínica Médica" },
  { value: "odontologia", label: "Odontologia" },
  { value: "fisioterapia", label: "Fisioterapia" },
  { value: "psicologia", label: "Psicologia" },
  { value: "advocacia", label: "Advocacia" },
  { value: "consultoria", label: "Consultoria" },
  { value: "outros", label: "Outros" },
]

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  phone: z.string().min(14, {
    message: "Por favor, insira um telefone válido.",
  }),
  email: z
    .string()
    .email({
      message: "Por favor, insira um email válido.",
    }),
  website: z
    .string()
    .url({
      message: "Por favor, insira um URL válido.",
    })
    .optional()
    .or(z.literal("")),
  slug: z
    .string()
    .min(3, {
      message: "O slug deve ter pelo menos 3 caracteres.",
    })
    .regex(/^[a-z0-9-]+$/, {
      message: "O slug deve conter apenas letras minúsculas, números e hífens.",
    }),
  category: z.string({
    required_error: "Por favor, selecione uma categoria.",
  }),
  address: z.object({
    cep: z.string().min(8, { message: "CEP é obrigatório" }),
    street: z.string().min(1, { message: "Rua é obrigatória" }),
    number: z.string().min(1, { message: "Número é obrigatório" }),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, { message: "Bairro é obrigatório" }),
    city: z.string().min(1, { message: "Cidade é obrigatória" }),
    state: z.string().min(2, { message: "Estado é obrigatório" }),
  }),
})

type FormValues = z.infer<typeof formSchema>

interface NewBusinessFormProps {
  onSubmit: (data: Omit<FormValues, 'address'> & { logo_url?: string; address: string }) => void
  isLoading: boolean
}

export function NewBusinessForm({ onSubmit, isLoading }: NewBusinessFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [isUploading, setIsUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [slugAvailable, setSlugAvailable] = useState(true)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      website: "",
      slug: "",
      category: "",
      address: {
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
    },
  })

  // Verificar disponibilidade do slug
  useEffect(() => {
    const slug = form.watch("slug")

    const checkSlugAvailability = async () => {
      if (slug && slug.length >= 3) {
        setIsCheckingSlug(true)
        try {
          const { data, error } = await supabase
            .from("businesses")
            .select("slug")
            .eq("slug", slug)
            .maybeSingle()

          if (error) throw error
          setSlugAvailable(!data)
        } catch (error) {
          console.error("Erro ao verificar slug:", error)
        } finally {
          setIsCheckingSlug(false)
        }
      }
    }

    const timer = setTimeout(() => {
      checkSlugAvailability()
    }, 500)

    return () => clearTimeout(timer)
  }, [form.watch("slug")])

  // Formatar o slug automaticamente
  useEffect(() => {
    const businessName = form.watch("name")
    if (businessName && !form.getValues("slug")) {
      const slug = businessName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()

      form.setValue("slug", slug)
    }
  }, [form.watch("name")])

  const getBusinessInitials = (name: string) => {
    if (!name) return "N"
    const words = name.split(" ")
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
    if (!slugAvailable) {
      toast({
        title: "Erro",
        description: "Por favor, escolha outro slug para seu negócio.",
        variant: "destructive"
      })
      return
    }

    try {
      let logo_url: string | undefined

      if (logoFile) {
        setIsUploading(true)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("business-logos")
          .upload(`temp/${Date.now()}_${logoFile.name}`, logoFile)

        if (uploadError) {
          toast({
            title: "Erro",
            description: "Erro ao fazer upload da imagem.",
            variant: "destructive"
          })
          throw uploadError
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("business-logos").getPublicUrl(uploadData.path)

        logo_url = publicUrl
        setIsUploading(false)
      }

      const { address, ...restData } = data
      await onSubmit({
        ...restData,
        logo_url,
        address: JSON.stringify({
          cep: address.cep,
          street: address.street,
          number: address.number,
          complement: address.complement || "",
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
        })
      })

      toast({
        title: "Sucesso",
        description: "Negócio criado com sucesso!",
        className: "bg-green-500 text-white"
      })
    } catch (error) {
      console.error("Erro ao criar negócio:", error)
      toast({
        title: "Erro ao criar negócio",
        description: "Ocorreu um erro ao criar o negócio. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Logo do Negócio</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={logoPreview || undefined} alt="Preview" />
            <AvatarFallback>{getBusinessInitials(form.watch("name"))}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => document.getElementById("logo")?.click()}
              disabled={isLoading || isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
              disabled={isLoading || isUploading}
            />
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG ou GIF (max. 2MB)</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-1">
          Nome do negócio
          <span className="text-destructive">*</span>
        </Label>
        <Input id="name" {...form.register("name")} disabled={isLoading} />
        {form.formState.errors.name && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="flex items-center gap-1">
          Categoria
          <span className="text-destructive">*</span>
        </Label>
        <Select onValueChange={(value) => form.setValue("category", value)} value={form.watch("category")}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {businessCategories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.category && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="mb-4 block">Endereço</Label>
        <AddressForm
          onAddressChange={(address) => form.setValue("address", address)}
          defaultValues={form.getValues("address")}
          disabled={isLoading}
          errors={form.formState.errors.address as Record<keyof AddressData, FieldError>}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-1">
            Telefone
            <span className="text-destructive">*</span>
          </Label>
          <InputMask
            id="phone"
            mask="phone"
            value={form.watch("phone")}
            onChange={(value) => form.setValue("phone", value)}
            placeholder="(00) 00000-0000"
            disabled={isLoading}
          />
          {form.formState.errors.phone && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-1">
            Email
            <span className="text-destructive">*</span>
          </Label>
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

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="slug" className="flex items-center gap-1">
            Slug
            <span className="text-destructive">*</span>
          </Label>
          <span className="text-sm text-muted-foreground">(relacionado à URL e não pode ser alterado)</span>
        </div>
        <div className="flex items-center">
          <span className="rounded-l-md border border-r-0 bg-muted px-3 py-2 text-sm text-muted-foreground">
            agendizo.com/
          </span>
          <Input
            id="slug"
            {...form.register("slug")}
            disabled={isLoading}
            placeholder="seu-negocio"
            className="rounded-l-none"
          />
        </div>
        {isCheckingSlug ? (
          <p className="text-sm text-muted-foreground">Verificando disponibilidade...</p>
        ) : form.watch("slug") && !slugAvailable ? (
          <p className="text-sm font-medium text-destructive">Este slug já está em uso</p>
        ) : form.watch("slug") && slugAvailable ? (
          <p className="text-sm font-medium text-green-500">Slug disponível</p>
        ) : null}
        {form.formState.errors.slug && (
          <p className="text-sm font-medium text-destructive">{form.formState.errors.slug.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/negocios")}
          disabled={isLoading || isUploading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading || isUploading}>
          {isLoading || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </div>
    </form>
  )
}
