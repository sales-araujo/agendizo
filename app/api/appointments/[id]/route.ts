import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticação
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return new NextResponse("Não autorizado", { status: 401 })
    }

    // Buscar o agendamento para verificar se pertence ao usuário
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("business_id")
      .eq("id", params.id)
      .single()

    if (fetchError || !appointment) {
      return new NextResponse("Agendamento não encontrado", { status: 404 })
    }

    // Verificar se o usuário tem permissão (é dono do negócio)
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", appointment.business_id)
      .single()

    if (businessError || !business || business.owner_id !== session.user.id) {
      return new NextResponse("Não autorizado", { status: 403 })
    }

    // Excluir o agendamento
    const { error: deleteError } = await supabase
      .from("appointments")
      .delete()
      .eq("id", params.id)

    if (deleteError) {
      console.error("Erro ao excluir agendamento:", deleteError)
      return new NextResponse("Erro ao excluir agendamento", { status: 500 })
    }

    return new NextResponse(null, { status: 204 })

  } catch (error) {
    console.error("Erro ao excluir agendamento:", error)
    return new NextResponse("Erro interno do servidor", { status: 500 })
  }
} 