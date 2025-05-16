import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Registro | Agendizo",
  description: "Crie sua conta no Agendizo",
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col items-center">
        <Link href="/" className="mb-6">
          <Image src="/logo.png" alt="Agendizo" width={180} height={60} priority />
        </Link>
      </div>
      <RegisterForm />
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Já possui uma conta?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  )
}
