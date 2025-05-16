import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Novo Negócio | Agendizo",
  description: "Crie um novo negócio para gerenciar seus agendamentos.",
}

export default function NewBusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 