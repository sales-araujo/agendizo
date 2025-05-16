"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, {
        message: "A senha deve ter pelo menos 8 caracteres.",
      })
      .regex(/[A-Z]/, {
        message: "A senha deve ter pelo menos uma letra maiúscula.",
      })
      .regex(/[0-9]/, {
        message: "A senha deve ter pelo menos um número.",
      })
      .regex(/[^a-zA-Z0-9]/, {
        message: "A senha deve ter pelo menos um caractere especial.",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type FormValues = z.infer<typeof formSchema>

export function UpdatePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidLink, setIsValidLink] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  })

  const password = form.watch("password")

  // Verificações de força da senha
  const hasMinLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(password)

  useEffect(() => {
    // Verificar se o usuário está autenticado e se o link é válido
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        setIsValidLink(false)
      }
    }

    checkSession()
  }, [supabase.auth])

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)

      // Redirecionar para o login após alguns segundos
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error) {
      console.error("Erro ao atualizar senha:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar sua senha. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidLink) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-md">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Link inválido</CardTitle>
          <CardDescription>Este link de redefinição de senha é inválido ou expirou.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Link inválido ou expirado</AlertTitle>
            <AlertDescription>Por favor, solicite um novo link de redefinição de senha.</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push("/esqueci-senha")} className="bg-pink-600 hover:bg-pink-700">
            Solicitar novo link
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
        <CardDescription>Crie uma nova senha para sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/20">
            <AlertTitle className="text-green-500 font-medium">Senha atualizada</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Sua senha foi atualizada com sucesso. Você será redirecionado para a página de login em instantes.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...form.register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showPassword ? "Ocultar senha" : "Mostrar senha"}</span>
                </Button>
              </div>

              {/* Indicadores de força da senha */}
              {password.length > 0 && (
                <div className="space-y-2 text-sm mt-2">
                  <div className="flex items-center text-muted-foreground">
                    {hasMinLength ? (
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    Pelo menos 8 caracteres
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    {hasUpperCase ? (
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    Pelo menos 1 letra maiúscula
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    {hasNumber ? (
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    Pelo menos 1 número
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    {hasSpecialChar ? (
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <X className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    Pelo menos 1 caractere especial
                  </div>
                </div>
              )}

              {form.formState.errors.password && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...form.register("confirmPassword")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="sr-only">{showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}</span>
                </Button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-pink-600 hover:bg-pink-700">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar senha"
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
