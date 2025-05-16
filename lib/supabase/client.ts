import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "./database.types"

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Erro: Variáveis de ambiente do Supabase não configuradas")
    throw new Error("Configuração do Supabase incompleta")
  }

  return createClientComponentClient<Database>({
    supabaseUrl,
    supabaseKey,
  })
}
