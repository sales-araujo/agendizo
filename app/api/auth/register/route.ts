import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/lib/supabase/database.types"

export async function POST(request: Request) {
  try {
    const { email, password, fullName, metadata } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // Registrar usuário
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          slug: metadata?.slug || null,
          category: metadata?.category || null,
          phone: metadata?.phone || null,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Criar perfil do usuário
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        subscription_status: "inactive",
        subscription_tier: "free",
        slug: metadata?.slug || null,
        category: metadata?.category || null,
        bio: null,
        social_links: {},
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("Error creating user profile:", profileError)
      }
    }

    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error("Error during registration:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
