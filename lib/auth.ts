import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@/lib/types"

export async function getSession() {
  const cookieStore = cookies()
  const supabase = createClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function getUserDetails() {
  const supabase = createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Buscar detalhes adicionais do perfil
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    return {
      ...user,
      ...profile,
    } as User
  } catch (error) {
    console.error("Error getting user details:", error)
    return null
  }
}
