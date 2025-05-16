"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"

const formSchema = z.object({
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
})

type FormValues = z.infer<typeof formSchema>

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })

      if (error) {
        throw error
      }

      setIsSubmitted(true)
    } catch (error) {
      console.error("Erro ao solicitar redefinição de senha:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-2xl font-bold">Recuperar senha</CardTitle>
        <CardDescription>Digite seu email para receber um link de recuperação de senha</CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/20">
            <AlertTitle className="text-green-500 font-medium">Email enviado</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              Enviamos um link de recuperação de senha para o seu email. Por favor, verifique sua caixa de entrada e
              siga as instruções para redefinir sua senha.
            </AlertDescription>
          </Alert>
        ) : (
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
            <Button type="submit" disabled={isLoading} className="w-full bg-[#eb07a4] hover:bg-[#d0069a]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar link de recuperação"
              )}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => router.push("/login")} className="text-sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o login
        </Button>
      </CardFooter>
    </Card>
  )
}
