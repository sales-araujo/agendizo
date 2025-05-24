import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Registro | Agendizo",
  description: "Crie sua conta no Agendizo",
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}