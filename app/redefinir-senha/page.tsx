import { UpdatePasswordForm } from "@/components/auth/update-password-form"
import { LoadingLogo } from "@/components/ui/loading-logo"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Redefinir Senha | Agendizo",
  description: "Defina uma nova senha para sua conta Agendizo",
}

export default function ResetPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <LoadingLogo />
      <UpdatePasswordForm />
    </div>
  )
}
