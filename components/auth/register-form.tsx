"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "O nome deve ter pelo menos 2 caracteres.",
    }),
    email: z.string().email({
      message: "Por favor, insira um e-mail válido.",
    }),
    password: z.string().min(8, {
      message: "A senha deve ter pelo menos 8 caracteres.",
    }),
    confirmPassword: z.string().min(8, {
      message: "A senha deve ter pelo menos 8 caracteres.",
    }),
    businessName: z.string().min(2, {
      message: "O nome da empresa deve ter pelo menos 2 caracteres.",
    }),
    businessSlug: z
      .string()
      .min(3, {
        message: "O slug deve ter pelo menos 3 caracteres.",
      })
      .regex(/^[a-z0-9-]+$/, {
        message: "O slug deve conter apenas letras minúsculas, números e hífens.",
      }),
    businessCategory: z.string({
      required_error: "Por favor, selecione uma categoria.",
    }),
    phone: z.string().min(10, {
      message: "Por favor, insira um telefone válido.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })

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

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState(true)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      businessName: "",
      businessSlug: "",
      businessCategory: "",
      phone: "",
    },
    mode: "onChange",
  })

  // Verificar disponibilidade do slug
  useEffect(() => {
    const slug = form.watch("businessSlug")

    const checkSlugAvailability = async () => {
      if (slug && slug.length >= 3) {
        setIsCheckingSlug(true)
        try {
          const { data, error } = await supabase.from("businesses").select("slug").eq("slug", slug).maybeSingle()

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
  }, [form.watch("businessSlug")])

  // Formatar o slug automaticamente
  useEffect(() => {
    const businessName = form.watch("businessName")
    if (businessName && !form.getValues("businessSlug")) {
      const slug = businessName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()

      form.setValue("businessSlug", slug)
    }
  }, [form.watch("businessName")])

  // Validar senha em tempo real
  const password = form.watch("password")
  const confirmPassword = form.watch("confirmPassword")
  const passwordsMatch = !confirmPassword || password === confirmPassword

  const passwordStrength = {
    hasMinLength: password?.length >= 8,
    hasUpperCase: /[A-Z]/.test(password || ""),
    hasLowerCase: /[a-z]/.test(password || ""),
    hasNumber: /[0-9]/.test(password || ""),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password || ""),
  }

  const passwordStrengthScore = Object.values(passwordStrength).filter(Boolean).length

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Verificar se o slug já existe
      const { data: slugCheck } = await supabase
        .from("businesses")
        .select("slug")
        .eq("slug", values.businessSlug)
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

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          businessName: values.businessName,
          businessSlug: values.businessSlug,
          businessCategory: values.businessCategory,
          phone: values.phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Ocorreu um erro ao registrar.")
      }

      toast({
        title: "Registro realizado com sucesso!",
        description: "Você será redirecionado para a página de login.",
        variant: "success",
      })

      router.push("/login")
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Erro no registro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao registrar. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow-md">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Crie sua conta</h1>
        <p className="text-sm text-muted-foreground mt-2">Preencha os dados abaixo para começar</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="seu.email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} placeholder="********" {...field} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showPassword ? "Esconder senha" : "Mostrar senha"}</span>
                      </Button>
                    </div>
                  </FormControl>
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          passwordStrengthScore === 0
                            ? "w-0"
                            : passwordStrengthScore === 1
                              ? "w-1/5 bg-red-500"
                              : passwordStrengthScore === 2
                                ? "w-2/5 bg-orange-500"
                                : passwordStrengthScore === 3
                                  ? "w-3/5 bg-yellow-500"
                                  : passwordStrengthScore === 4
                                    ? "w-4/5 bg-lime-500"
                                    : "w-full bg-green-500"
                        }`}
                      />
                    </div>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li className={passwordStrength.hasMinLength ? "text-green-500" : ""}>
                        ✓ Mínimo de 8 caracteres
                      </li>
                      <li className={passwordStrength.hasUpperCase ? "text-green-500" : ""}>
                        ✓ Pelo menos uma letra maiúscula
                      </li>
                      <li className={passwordStrength.hasLowerCase ? "text-green-500" : ""}>
                        ✓ Pelo menos uma letra minúscula
                      </li>
                      <li className={passwordStrength.hasNumber ? "text-green-500" : ""}>✓ Pelo menos um número</li>
                      <li className={passwordStrength.hasSpecialChar ? "text-green-500" : ""}>
                        ✓ Pelo menos um caractere especial
                      </li>
                    </ul>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="********" {...field} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showConfirmPassword ? "Esconder senha" : "Mostrar senha"}</span>
                      </Button>
                    </div>
                  </FormControl>
                  {!passwordsMatch && confirmPassword && (
                    <p className="text-sm font-medium text-destructive mt-1">As senhas não coincidem</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Nome da sua empresa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="businessCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {businessCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="businessSlug"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-wrap items-center gap-2">
                  <FormLabel className="whitespace-nowrap">Slug da empresa</FormLabel>
                  <FormDescription className="mt-0 whitespace-nowrap">
                    (relacionado à URL e não pode ser alterado)
                  </FormDescription>
                </div>
                <FormControl>
                  <div className="flex items-center">
                    <span className="rounded-l-md border border-r-0 bg-muted px-3 py-2 text-sm text-muted-foreground">
                      agendizo.com/
                    </span>
                    <Input className="rounded-l-none" placeholder="sua-empresa" {...field} />
                  </div>
                </FormControl>
                {isCheckingSlug ? (
                  <p className="text-sm text-muted-foreground mt-1">Verificando disponibilidade...</p>
                ) : field.value && !slugAvailable ? (
                  <p className="text-sm font-medium text-destructive mt-1">Este slug já está em uso</p>
                ) : field.value && slugAvailable ? (
                  <p className="text-sm font-medium text-green-500 mt-1">Slug disponível</p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-[#eb07a4] hover:bg-[#d0069a]" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar conta
          </Button>
        </form>
      </Form>
    </div>
  )
}
