import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Perfil Empresarial | Agendizo",
  description: "Gerencie as informações do seu negócio.",
}

export default function BusinessProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 