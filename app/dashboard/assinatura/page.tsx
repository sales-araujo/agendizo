"use client"

import { useState, useEffect } from "react"
import { CreditCard, Check, X, AlertCircle, ArrowRight } from "lucide-react"
import { PageShell } from "@/components/dashboard/page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { getUserSubscription } from "@/lib/data"
import type { Subscription } from "@/lib/types"
import Link from "next/link"

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const data = await getUserSubscription()
        setSubscription(data)
        setIsLoading(false)
      } catch (error) {
        console.error("Erro ao carregar dados da assinatura:", error)
        setError("Não foi possível carregar os dados da sua assinatura. Por favor, tente novamente mais tarde.")
        setIsLoading(false)
      }
    }

    loadSubscription()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Data indisponível"
      }
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    } catch (error) {
      console.error("Erro ao formatar data:", error)
      return "Data indisponível"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Ativa</Badge>
      case "trialing":
        return <Badge className="bg-blue-500">Período de teste</Badge>
      case "past_due":
        return <Badge className="bg-yellow-500">Pagamento pendente</Badge>
      case "canceled":
        return <Badge className="bg-red-500">Cancelada</Badge>
      default:
        return <Badge className="bg-gray-500">{status}</Badge>
    }
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getPlanFeatures = (planName: string) => {
    switch (planName) {
      case "basic":
        return [
          { name: "1 negócio", included: true },
          { name: "Até 50 agendamentos por mês", included: true },
          { name: "Lembretes por email", included: true },
          { name: "Lembretes por WhatsApp", included: false },
          { name: "Página de agendamento personalizada", included: false },
          { name: "Integrações com calendários", included: false },
        ]
      case "pro":
        return [
          { name: "Até 3 negócios", included: true },
          { name: "Até 300 agendamentos por mês", included: true },
          { name: "Lembretes por email", included: true },
          { name: "Lembretes por WhatsApp", included: true },
          { name: "Página de agendamento personalizada", included: true },
          { name: "Integrações com calendários", included: false },
        ]
      case "enterprise":
        return [
          { name: "Negócios ilimitados", included: true },
          { name: "Agendamentos ilimitados", included: true },
          { name: "Lembretes por email", included: true },
          { name: "Lembretes por WhatsApp", included: true },
          { name: "Página de agendamento personalizada", included: true },
          { name: "Integrações com calendários", included: true },
        ]
      default:
        return []
    }
  }

  const handleCancelSubscription = () => {
    // Implementação do cancelamento de assinatura
    toast({
      title: "Assinatura cancelada",
      description: "Sua assinatura foi cancelada com sucesso. Você ainda terá acesso até o final do período atual.",
    })
  }

  return (
    <PageShell>
      <PageShell.Header>
        <PageShell.Title>Assinatura</PageShell.Title>
        <PageShell.Description>
          Gerencie sua assinatura e plano atual
        </PageShell.Description>
      </PageShell.Header>
      <PageShell.Content>
        {isLoading ? (
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-28" />
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : subscription ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Plano{" "}
                      {subscription.plan.name === "basic"
                        ? "Básico"
                        : subscription.plan.name === "pro"
                          ? "Profissional"
                          : "Empresarial"}
                    </CardTitle>
                    <CardDescription>
                      {subscription.cycle === "monthly" ? "Cobrança mensal" : "Cobrança anual"}
                    </CardDescription>
                  </div>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status:</span>
                    <span className="text-sm">
                      {subscription.status === "active"
                        ? "Ativa"
                        : subscription.status === "trialing"
                          ? "Período de teste"
                          : subscription.status === "past_due"
                            ? "Pagamento pendente"
                            : subscription.status === "canceled"
                              ? "Cancelada"
                              : subscription.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Valor:</span>
                    <span className="text-sm">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(subscription.amount / 100)}
                      /{subscription.cycle === "monthly" ? "mês" : "ano"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Próxima cobrança:</span>
                    <span className="text-sm">{formatDate(subscription.currentPeriodEnd)}</span>
                  </div>

                  {subscription.status === "trialing" && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Dias restantes no período de teste:</span>
                      <span className="text-sm">{getDaysRemaining(subscription.currentPeriodEnd)} dias</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Método de pagamento:</span>
                    <span className="text-sm flex items-center">
                      <CreditCard className="h-4 w-4 mr-1" />
                      •••• {subscription.lastFour || "4242"}
                    </span>
                  </div>
                </div>

                {subscription.status === "past_due" && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Pagamento pendente</AlertTitle>
                    <AlertDescription>
                      Seu último pagamento não foi processado. Por favor, atualize suas informações de pagamento para
                      evitar a suspensão do serviço.
                    </AlertDescription>
                  </Alert>
                )}

                {subscription.status === "trialing" && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Período de teste</AlertTitle>
                    <AlertDescription>
                      Você está no período de teste gratuito de 7 dias. Após esse período, você será cobrado
                      automaticamente.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Atualizar pagamento</Button>
                {subscription.status !== "canceled" && (
                  <Button variant="destructive" onClick={handleCancelSubscription}>
                    Cancelar assinatura
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes do plano</CardTitle>
                <CardDescription>Recursos incluídos no seu plano atual</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {getPlanFeatures(subscription.plan.name).map((feature, index) => (
                    <li key={index} className="flex items-center">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className={feature.included ? "" : "text-muted-foreground"}>{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="bg-pink-600 hover:bg-pink-700">
                  <Link href="/precos">
                    Ver todos os planos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de faturas</CardTitle>
                <CardDescription>Visualize e baixe suas faturas anteriores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 p-4 font-medium">
                    <div>Data</div>
                    <div>Valor</div>
                    <div>Status</div>
                    <div className="text-right">Fatura</div>
                  </div>
                  <div className="divide-y">
                    {subscription.invoices && subscription.invoices.length > 0 ? (
                      subscription.invoices.map((invoice, index) => (
                        <div key={index} className="grid grid-cols-4 p-4 text-sm">
                          <div>{formatDate(invoice.date)}</div>
                          <div>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(invoice.amount / 100)}
                          </div>
                          <div>
                            {invoice.status === "paid" ? (
                              <Badge className="bg-green-500">Pago</Badge>
                            ) : invoice.status === "pending" ? (
                              <Badge className="bg-yellow-500">Pendente</Badge>
                            ) : (
                              <Badge className="bg-red-500">Falhou</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <a href={invoice.url} target="_blank" rel="noopener noreferrer">
                                Download
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma fatura disponível</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sem assinatura ativa</CardTitle>
                <CardDescription>Você não possui uma assinatura ativa no momento</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Escolha um plano para começar a usar todos os recursos do sistema de agendamento.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="bg-pink-600 hover:bg-pink-700">
                  <Link href="/precos">
                    Ver planos disponíveis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </PageShell.Content>
    </PageShell>
  )
}
