import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getStripeSession } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { priceId, successUrl, cancelUrl } = await req.json()

    if (!priceId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    // Obter o perfil do usuário
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", session.user.id).single()

    // Log para debug
    console.log("Criando sessão do Stripe com:", {
      priceId,
      successUrl,
      cancelUrl,
      clientReferenceId: session.user.id,
      customerEmail: profile?.email || session.user.email,
    })

    const stripeSession = await getStripeSession({
      priceId,
      successUrl,
      cancelUrl,
      clientReferenceId: session.user.id,
      customerEmail: profile?.email || session.user.email,
    })

    // Log para debug
    console.log("Sessão do Stripe criada:", {
      url: stripeSession.url,
      sessionId: stripeSession.id,
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
