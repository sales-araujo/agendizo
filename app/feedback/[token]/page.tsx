"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface Business {
  id: string
  name: string
  owner_id: string
  social_links?: {
    facebook?: string
    instagram?: string
    whatsapp?: string
  }
}

interface Appointment {
  id: string
  business_id: string
  client_name: string
  client_email: string
  feedback_token?: string
  feedback_submitted?: boolean
}

export default function FeedbackPage({ params }: { params: { token: string } }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [name, setName] = useState("")
  const [business, setBusiness] = useState<Business | null>(null)
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadAppointment()
  }, [])

  const loadAppointment = async () => {
    try {
      setIsLoading(true)

      // Buscar agendamento pelo token
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select("*")
        .eq("feedback_token", params.token)
        .maybeSingle()

      if (appointmentError) throw appointmentError

      if (!appointmentData) {
        throw new Error("Token de feedback inválido")
      }

      if (appointmentData.feedback_submitted) {
        setSubmitted(true)
        throw new Error("Feedback já enviado")
      }

      setAppointment(appointmentData)
      setName(appointmentData.client_name)

      // Buscar informações do negócio
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*, profiles(social_links)")
        .eq("id", appointmentData.business_id)
        .maybeSingle()

      if (businessError) throw businessError

      if (!businessData) {
        throw new Error("Negócio não encontrado")
      }

      setBusiness(businessData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar dados",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!appointment || !business) return

    if (rating === 0) {
      toast({
        title: "Avaliação necessária",
        description: "Por favor, selecione uma nota para o atendimento",
        variant: "destructive",
      })
      return
    }

    if (!comment.trim()) {
      toast({
        title: "Comentário necessário",
        description: "Por favor, deixe um comentário sobre o atendimento",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Inserir feedback
      const { error: feedbackError } = await supabase.from("feedbacks").insert({
        business_id: business.id,
        client_name: name,
        client_email: appointment.client_email,
        rating,
        comment: comment.trim(),
      })

      if (feedbackError) throw feedbackError

      // Marcar agendamento como avaliado
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ feedback_submitted: true })
        .eq("id", appointment.id)

      if (updateError) throw updateError

      toast({
        title: "Feedback enviado",
        description: "Obrigado por avaliar nosso atendimento!",
        variant: "success",
      })

      setSubmitted(true)
    } catch (error) {
      console.error("Erro ao enviar feedback:", error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar o feedback. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (count: number, interactive = false) => {
    return Array(5)
      .fill(0)
      .map((_, i) => {
        const filled = interactive ? (hoverRating || rating) > i : count > i
        return (
          <Star
            key={i}
            className={`h-8 w-8 ${
              filled ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            } transition-colors ${interactive ? "cursor-pointer" : ""}`}
            onMouseEnter={() => interactive && setHoverRating(i + 1)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && setRating(i + 1)}
          />
        )
      })
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!business || !appointment) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h3 className="text-lg font-medium">Link inválido</h3>
            <p className="text-muted-foreground text-center mt-1">
              Este link de feedback não é válido ou já expirou.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h3 className="text-lg font-medium">Feedback enviado!</h3>
            <p className="text-muted-foreground text-center mt-1">
              Obrigado por avaliar nosso atendimento.
            </p>
            <div className="flex gap-2 mt-6">
              {business.social_links?.facebook && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://facebook.com/${business.social_links?.facebook}`, "_blank")}
                >
                  Seguir no Facebook
                </Button>
              )}
              {business.social_links?.instagram && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://instagram.com/${business.social_links?.instagram}`, "_blank")}
                >
                  Seguir no Instagram
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Avalie seu atendimento</CardTitle>
          <CardDescription>
            Sua opinião é muito importante para melhorarmos nossos serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seu nome</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sua avaliação</label>
              <div className="flex gap-1">
                {renderStars(rating, true)}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Seu comentário</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte-nos como foi sua experiência..."
                required
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#eb07a4] hover:bg-[#d0069a]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enviando..." : "Enviar feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 