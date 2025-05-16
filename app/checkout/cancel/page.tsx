import Link from "next/link"
import { redirect } from "next/navigation"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"

export default async function CheckoutCancelPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container max-w-5xl py-10">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Pagamento cancelado</CardTitle>
            <CardDescription>O processo de pagamento foi cancelado.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              Você cancelou o processo de pagamento. Se encontrou algum problema ou tem dúvidas, entre em contato com
              nosso suporte.
            </p>
            <p className="text-sm text-muted-foreground">Nenhum valor foi cobrado do seu cartão.</p>
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Button variant="outline" asChild>
              <Link href="/precos">Ver planos</Link>
            </Button>
            <Button asChild>
              <Link href="/contato">Falar com suporte</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
