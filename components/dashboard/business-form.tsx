"use client"

import { useState, useEffect } from "react"
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
import { useRouter } from "next/navigation"
import { FieldError } from "react-hook-form"

export const businessCategories = [
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

interface BusinessFormProps {
  onSubmit: (data: Omit<FormValues, 'address'> & { logo_url?: string; address: string }) => Promise<void>
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
    category: string
    slug?: string
  }
}

export function BusinessForm({ onSubmit, isLoading, business }: BusinessFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [isUploading, setIsUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(business?.logo_url || null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const parseAddress = (addressStr?: string) => {
    if (!addressStr) return {
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    }
    
    try {
      const parsed = JSON.parse(addressStr)
      return {
        cep: parsed.cep || "",
        street: parsed.street || "",
        number: parsed.number || "",
        complement: parsed.complement || "",
        neighborhood: parsed.neighborhood || "",
        city: parsed.city || "",
        state: parsed.state || "",
      }
    } catch (e) {
      console.error("Erro ao fazer parse do endereço:", e)
      return {
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      }
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: business?.name || "",
      phone: business?.phone || "",
      email: business?.email || "",
      website: business?.website || "",
      category: business?.category || "",
      address: parseAddress(business?.address),
    },
  })

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
        title: "Erro",
        description: "O tamanho máximo permitido é 2MB.",
        variant: "destructive"
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
    try {
      let logo_url = business?.logo_url

      if (logoFile) {
        setIsUploading(true)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("business-logos")
          .upload(`${business.id}/${logoFile.name}`, logoFile)

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
      const addressString = JSON.stringify({
        cep: address.cep,
        street: address.street,
        number: address.number,
        complement: address.complement || "",
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      })

      await onSubmit({
        ...restData,
        logo_url,
        address: addressString
      })
    } catch (error) {
      console.error("Erro ao atualizar negócio:", error)
      toast({
        title: "Erro ao atualizar negócio",
        description: "Ocorreu um erro ao atualizar o negócio. Tente novamente.",
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
