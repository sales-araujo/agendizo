"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const contactSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  subject: z.string().min(3, { message: "O assunto deve ter pelo menos 3 caracteres" }),
  message: z.string().min(10, { message: "A mensagem deve ter pelo menos 10 caracteres" }),
})

type ContactFormValues = z.infer<typeof contactSchema>

export function ContactForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  })

  const onSubmit = async (data: ContactFormValues) => {
    try {
      setIsLoading(true)

      // Simulação de envio de formulário
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Mensagem enviada",
        description: "Agradecemos seu contato. Responderemos em breve!",
        variant: "success",
      })

      reset()
    } catch (error) {
      console.error("Error sending contact form:", error)
      toast({
        title: "Erro ao enviar mensagem",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Entre em contato</CardTitle>
        <CardDescription>Preencha o formulário abaixo e entraremos em contato o mais breve possível.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" placeholder="Seu nome completo" {...register("name")} disabled={isLoading} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" {...register("email")} disabled={isLoading} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input id="subject" placeholder="Assunto da mensagem" {...register("subject")} disabled={isLoading} />
            {errors.subject && <p className="text-sm text-red-500">{errors.subject.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem aqui..."
              rows={5}
              {...register("message")}
              disabled={isLoading}
            />
            {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar mensagem"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
