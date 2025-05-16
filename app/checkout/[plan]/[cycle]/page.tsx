import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getSubscriptionPlanById } from "@/lib/data"
import { CheckoutForm } from "@/components/checkout/checkout-form"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon as InfoCircle, LockIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default async function CheckoutPage({ params }: { params: { plan: string; cycle: string } }) {
  const supabase = createClient()
  const { plan, cycle } = params

  // Verificar se os parâmetros são válidos
  if (!plan || !cycle || !["monthly", "yearly"].includes(cycle)) {
    redirect("/precos")
  }

  try {
    // Buscar informações do plano
    const planData = await getSubscriptionPlanById(plan)

    if (!planData) {
      console.log("Plano não encontrado:", plan)
      redirect("/precos")
    }

    // Autenticação
    const { data: session } = await supabase.auth.getSession()

    if (!session?.session) {
      // Redirecionar para login com retorno para checkout após login
      redirect(`/login?returnTo=/checkout/${plan}/${cycle}`)
    }

    // Verificar se o usuário já tem uma assinatura ativa
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, plan_id")
        .eq("user_id", userData.user.id)
        .eq("status", "active")
        .maybeSingle()

      if (subscription && subscription.status === "active") {
        if (subscription.plan_id === plan) {
          // Já possui este plano
          redirect("/dashboard/assinatura?message=already-subscribed")
        } else {
          // Possui outro plano ativo
          redirect("/dashboard/assinatura?message=has-active-plan")
        }
      }
    }

    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <div className="container max-w-7xl mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center mb-8">
            <Link href="/" className="mb-8">
              <Image src="/logo.png" alt="Agendizo" width={180} height={60} />
            </Link>
            <h1 className="text-3xl font-bold text-center">Finalizar Assinatura</h1>
            <p className="text-muted-foreground text-center max-w-xl mt-2">
              Você está assinando o plano{" "}
              {planData.name === "basic" ? "Básico" : planData.name === "pro" ? "Profissional" : "Enterprise"} com
              pagamento {cycle === "monthly" ? "mensal" : "anual"}.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <CheckoutForm plan={planData} cycle={cycle} userId={userData?.user?.id || ""} />
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Plano</span>
                    <span className="font-medium">
                      {planData.name === "basic" ? "Básico" : planData.name === "pro" ? "Profissional" : "Enterprise"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ciclo</span>
                    <span className="font-medium">{cycle === "monthly" ? "Mensal" : "Anual"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Período de teste</span>
                    <span className="font-medium">7 dias grátis</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(cycle === "monthly" ? planData.price_monthly : planData.price_yearly)}
                      /{cycle === "monthly" ? "mês" : "ano"}
                    </span>
                  </div>
                  <Alert>
                    <InfoCircle className="h-4 w-4" />
                    <AlertTitle>Período de teste gratuito</AlertTitle>
                    <AlertDescription>
                      Você não será cobrado pelos primeiros 7 dias. Cancele a qualquer momento antes do final do período
                      de teste.
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  <div className="flex items-center justify-center w-full space-x-2">
                    <LockIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Pagamento seguro via Stripe</span>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <Image src="/visa.svg" alt="Visa" width={40} height={30} />
                    <Image src="/mastercard.svg" alt="Mastercard" width={40} height={30} />
                    <Image src="/amex.svg" alt="American Express" width={40} height={30} />
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Erro na página de checkout:", error)
    redirect("/precos?error=checkout-error")
  }
}
