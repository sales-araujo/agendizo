import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/lib/supabase/database.types"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error("Error during login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
