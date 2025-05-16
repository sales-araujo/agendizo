import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { LoadingLogo } from "@/components/ui/loading-logo"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recuperar Senha | Agendizo",
  description: "Recupere o acesso à sua conta Agendizo",
}

export default function ForgotPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <LoadingLogo />
      <ResetPasswordForm />
    </div>
  )
}
