"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import type { SubscriptionPlan } from "@/lib/types"

interface CheckoutFormProps {
  plan: SubscriptionPlan
  cycle: "monthly" | "yearly"
  userId: string
}

export function CheckoutForm({ plan, cycle, userId }: CheckoutFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Obter o preço correto com base no ciclo
  const price = cycle === "monthly" ? plan.price_monthly : plan.price_yearly
  const priceId = cycle === "monthly" ? plan.stripe_price_id_monthly : plan.stripe_price_id_yearly

  // Formatar o preço para exibição
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price)

  const handleCheckout = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Criar sessão de checkout
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/checkout/success?plan=${plan.id}&cycle=${cycle}`,
          cancelUrl: `${window.location.origin}/checkout/cancel?plan=${plan.id}&cycle=${cycle}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar o pagamento")
      }

      // Redirecionar para o checkout do Stripe
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error("URL de checkout não recebida")
      }
    } catch (error) {
      console.error("Erro no checkout:", error)
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao processar o pagamento"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo da assinatura</CardTitle>
        <CardDescription>Revise os detalhes da sua assinatura antes de finalizar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h3 className="font-medium text-lg">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">Plano {cycle === "monthly" ? "mensal" : "anual"}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl">{formattedPrice}</p>
              <p className="text-sm text-muted-foreground">{cycle === "monthly" ? "por mês" : "por ano"}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">O que está incluído:</h4>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              Ao prosseguir, você concorda com os nossos{" "}
              <a href="/termos" className="text-primary hover:underline" target="_blank" rel="noreferrer">
                Termos de Serviço
              </a>{" "}
              e{" "}
              <a href="/privacidade" className="text-primary hover:underline" target="_blank" rel="noreferrer">
                Política de Privacidade
              </a>
              .
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full space-y-4">
          <Button onClick={handleCheckout} disabled={isLoading} className="w-full h-12" size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" /> Pagar com cartão
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => router.push("/precos")} className="w-full" disabled={isLoading}>
            Voltar
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
