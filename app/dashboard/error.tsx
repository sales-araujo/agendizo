"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Ocorreu um erro ao carregar o dashboard. Por favor, tente novamente ou entre em contato com o suporte se o
        problema persistir.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={() => reset()}>Tentar novamente</Button>
        <Button variant="outline" asChild>
          <Link href="/">Voltar para a página inicial</Link>
        </Button>
      </div>
    </div>
  )
}
