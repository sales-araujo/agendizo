import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login | Agendizo",
  description: "Faça login na sua conta Agendizo",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-center">
        <Link href="/" className="mb-6">
          <div className="text-3xl font-bold text-primary">Agendizo</div>
        </Link>
      </div>
      <LoginForm />
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link href="/registro" className="text-primary hover:underline font-medium">
            Registre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
