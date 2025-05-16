import Link from "next/link"
import { redirect } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import { getSubscriptionPlanById } from "@/lib/data"

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { plan: string; cycle: string }
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const { plan: planId, cycle } = searchParams

  if (!planId || !cycle) {
    redirect("/dashboard")
  }

  const plan = await getSubscriptionPlanById(planId)

  if (!plan) {
    redirect("/dashboard")
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Pagamento confirmado!</CardTitle>
            <CardDescription>Sua assinatura do plano {plan.name} foi ativada com sucesso.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              Agradecemos por escolher o Agendiza. Você agora tem acesso a todos os recursos do plano {plan.name}.
            </p>
            <p className="text-sm text-muted-foreground">
              Um email de confirmação foi enviado para o seu endereço de email cadastrado.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/dashboard">Ir para o Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
