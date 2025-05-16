"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const themeColors = [
  { name: "Padrão", value: "default", class: "bg-primary" },
  { name: "Vermelho", value: "red", class: "bg-red-500" },
  { name: "Verde", value: "green", class: "bg-green-500" },
  { name: "Azul", value: "blue", class: "bg-blue-500" },
  { name: "Roxo", value: "purple", class: "bg-purple-500" },
  { name: "Rosa", value: "pink", class: "bg-pink-500" },
  { name: "Laranja", value: "orange", class: "bg-orange-500" },
  { name: "Amarelo", value: "yellow", class: "bg-yellow-500" },
]

const formSchema = z.object({
  theme_color: z.string(),
  theme_mode: z.enum(["light", "dark", "system"]),
})

type BusinessAppearance = {
  id: string
  business_id: string
  theme_color: string
  theme_mode: string
  created_at: string
  updated_at: string
}

export default function AppearanceSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      theme_color: "default",
      theme_mode: "system",
    },
  })

  useEffect(() => {
    async function fetchBusinessId() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        return
      }

      const { data: business, error } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (error) {
        console.error("Error fetching business:", error)
        return
      }

      if (business) {
        setBusinessId(business.id)
        fetchAppearanceSettings(business.id)
      }
    }

    fetchBusinessId()
  }, [supabase])

  async function fetchAppearanceSettings(businessId: string) {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("business_appearance")
        .select("*")
        .eq("business_id", businessId)
        .single()

      if (error && error.code !== "PGSQL_ERROR") {
        // If no appearance settings exist yet, we'll create default ones later
        console.log("No appearance settings found, will use defaults")
      }

      if (data) {
        form.reset({
          theme_color: data.theme_color || "default",
          theme_mode: (data.theme_mode as "light" | "dark" | "system") || "system",
        })
      }
    } catch (error) {
      console.error("Error fetching appearance settings:", error)
      toast({
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar as configurações de aparência.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!businessId) return

    setIsSaving(true)
    try {
      // Check if appearance settings already exist
      const { data: existingSettings, error: checkError } = await supabase
        .from("business_appearance")
        .select("id")
        .eq("business_id", businessId)
        .single()

      if (checkError && checkError.code !== "PGSQL_ERROR") {
        console.error("Error checking existing settings:", checkError)
      }

      let error
      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from("business_appearance")
          .update({
            theme_color: values.theme_color,
            theme_mode: values.theme_mode,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSettings.id)

        error = updateError
      } else {
        // Insert new settings
        const { error: insertError } = await supabase.from("business_appearance").insert({
          business_id: businessId,
          theme_color: values.theme_color,
          theme_mode: values.theme_mode,
        })

        error = insertError
      }

      if (error) {
        throw error
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações de aparência foram salvas com sucesso.",
      })
    } catch (error) {
      console.error("Error saving appearance settings:", error)
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as configurações de aparência.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aparência</h1>
        <p className="text-muted-foreground">Personalize a aparência da sua página de agendamentos e do painel.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Cor do tema</CardTitle>
              <CardDescription>Escolha a cor principal que será usada em sua página de agendamentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="theme_color"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-8">
                      {themeColors.map((color) => (
                        <div key={color.value}>
                          <FormLabel htmlFor={`color-${color.value}`} className="cursor-pointer">
                            <div className="flex flex-col items-center space-y-2">
                              <div
                                className={cn(
                                  "relative flex h-10 w-10 items-center justify-center rounded-full",
                                  color.class,
                                )}
                              >
                                {field.value === color.value && <Check className="h-5 w-5 text-white" />}
                                <FormControl>
                                  <RadioGroupItem
                                    value={color.value}
                                    id={`color-${color.value}`}
                                    className="sr-only"
                                    {...field}
                                  />
                                </FormControl>
                              </div>
                              <span className="text-xs">{color.name}</span>
                            </div>
                          </FormLabel>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modo do tema</CardTitle>
              <CardDescription>Escolha o modo de tema padrão para sua página de agendamentos.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="theme_mode"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um modo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="system">Sistema (baseado nas preferências do usuário)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O modo "Sistema" se adapta automaticamente às preferências do usuário.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar alterações
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
}
