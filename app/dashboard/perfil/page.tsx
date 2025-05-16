import type { Metadata } from "next"
import ProfilePageClient from "./ProfilePageClient"

export const metadata: Metadata = {
  title: "Perfil",
  description: "Gerencie suas informações pessoais",
}

export default function ProfilePage() {
  return <ProfilePageClient />
}
