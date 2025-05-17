import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "./database.types"

export const createClient = (cookieStore = cookies()) => {
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}

// Mantendo a função original para compatibilidade com código existente
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}
