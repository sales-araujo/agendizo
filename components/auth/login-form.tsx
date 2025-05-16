"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Eye, EyeOff, Loader2, Mail, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
  password: z.string().min(1, {
    message: "Por favor, insira sua senha.",
  }),
})

type FormValues = z.infer<typeof formSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { signIn } = useAuth()

  // Verificar se o usuário acabou de se registrar
  const registered = searchParams.get("registered")

  useEffect(() => {
    if (registered === "true") {
      toast({
        title: "Registro concluído!",
        description: "Por favor, verifique seu email para confirmar sua conta antes de fazer login.",
        duration: 5000,
      })
    }
  }, [registered, toast])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    try {
      const { error } = await signIn(data.email, data.password)

      if (error) {
        toast({
          title: "Erro ao fazer login",
          description:
            error.message === "Email not confirmed"
              ? "Por favor, confirme seu email antes de fazer login."
              : "Credenciais inválidas. Verifique seu email e senha.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao Agendizo.",
        variant: "success",
      })

      // Redirecionar para o dashboard após login bem-sucedido
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Algo deu errado",
        description: "Houve um erro ao fazer login. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Entrar na sua conta</h1>
        <p className="text-muted-foreground mt-2">Digite suas credenciais para acessar</p>
      </div>

      {registered === "true" && (
        <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500 font-medium">Verificação necessária</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Enviamos um email de confirmação para o seu endereço. Por favor, verifique sua caixa de entrada e confirme
            seu cadastro antes de fazer login.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="nome@exemplo.com"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...form.register("email")}
              className="pl-10"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          {form.formState.errors.email && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <a href="/esqueci-senha" className="text-sm text-primary hover:underline">
              Esqueceu a senha?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoCapitalize="none"
              autoComplete="current-password"
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
          {form.formState.errors.password && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isLoading} className="w-full mt-6">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>
      <div className="text-center text-sm mt-6">
        Não tem uma conta?{" "}
        <a href="/registro" className="font-medium text-primary hover:underline">
          Registre-se
        </a>
      </div>
    </div>
  )
}
