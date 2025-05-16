"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import type { SubscriptionPlan } from "@/lib/types"

interface PricingCheckoutProps {
  plan: SubscriptionPlan
  cycle: "monthly" | "yearly"
  userId?: string
}

export function PricingCheckout({ plan, cycle, userId }: PricingCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleCheckout = async () => {
    try {
      setIsLoading(true)

      if (!userId) {
        // Redirecionar para login se não estiver autenticado
        router.push(`/login?callbackUrl=/checkout/${plan.id}/${cycle}`)
        return
      }

      // Obter o ID do preço com base no ciclo
      const priceId = cycle === "monthly" ? plan.stripe_price_id_monthly : plan.stripe_price_id_yearly

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
      }
    } catch (error) {
      console.error("Erro no checkout:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleCheckout} disabled={isLoading} className="w-full">
      {isLoading ? "Processando..." : `Assinar ${plan.name}`}
    </Button>
  )
}
