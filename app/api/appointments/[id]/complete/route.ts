import { NextResponse } from "next/server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const authHeader = request.headers.get("Authorization")
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de autenticação não fornecido" },
        { status: 401 }
      )
    }

    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error("Erro de autenticação:", authError)
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    console.log("Usuário autenticado:", user.id)

    // Buscar agendamento
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(`
        *,
        business:businesses(owner_id, name),
        client:clients(email, name)
      `)
      .eq("id", params.id)
      .single()

    if (appointmentError) {
      console.error("Erro ao buscar agendamento:", appointmentError)
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      )
    }

    if (!appointment) {
      console.error("Agendamento não encontrado:", params.id)
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      )
    }

    console.log("Agendamento encontrado:", {
      id: appointment.id,
      businessId: appointment.business_id,
      ownerId: appointment.business?.owner_id,
      userId: user.id
    })

    // Verificar se o usuário é dono do negócio
    if (appointment.business?.owner_id !== user.id) {
      console.error("Usuário não é dono do negócio:", {
        userId: user.id,
        ownerId: appointment.business?.owner_id
      })
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Gerar token de feedback
    const feedbackToken = crypto.randomUUID()

    console.log("Atualizando agendamento:", {
      id: appointment.id,
      feedbackToken,
      status: "completed"
    })

    // Atualizar status do agendamento e adicionar token de feedback
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "completed",
        feedback_token: feedbackToken,
        completed_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()

    if (updateError) {
      console.error("Erro ao atualizar agendamento:", updateError)
      return NextResponse.json(
        { error: "Erro ao atualizar agendamento" },
        { status: 500 }
      )
    }

    // Enviar email de feedback usando a função personalizada
    if (appointment.client?.email) {
      const feedbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${feedbackToken}`

      console.log("Tentando enviar email de feedback:", {
        email: appointment.client.email,
        name: appointment.client.name,
        businessName: appointment.business.name,
        feedbackUrl
      })

      try {
        console.log("Chamando função send_feedback_email com parâmetros:", {
          p_to_email: appointment.client.email,
          p_customer_name: appointment.client.name,
          p_business_name: appointment.business.name,
          p_feedback_url: feedbackUrl
        })

        const { data: emailResult, error: emailError } = await supabase
          .rpc('send_feedback_email', {
            p_to_email: appointment.client.email,
            p_customer_name: appointment.client.name,
            p_business_name: appointment.business.name,
            p_feedback_url: feedbackUrl
          })

        console.log("Resposta da função send_feedback_email:", emailResult)

        if (emailError) {
          console.error("Erro ao enviar email:", {
            code: emailError.code,
            message: emailError.message,
            details: emailError.details,
            hint: emailError.hint
          })
        } else if (emailResult?.status === 'erro') {
          console.error("Erro retornado pela função de email:", emailResult)
        } else if (emailResult?.status === 'sucesso') {
          console.log("Email enviado com sucesso:", emailResult)
        }
      } catch (emailError) {
        console.error("Erro ao chamar função de email:", {
          error: emailError,
          message: emailError instanceof Error ? emailError.message : 'Erro desconhecido',
          stack: emailError instanceof Error ? emailError.stack : undefined
        })
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Agendamento concluído com sucesso"
    })
  } catch (error) {
    console.error("Erro interno ao concluir agendamento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
} 