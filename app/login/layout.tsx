import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Login | Agendizo",
  description: "Faça login na sua conta Agendizo",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}