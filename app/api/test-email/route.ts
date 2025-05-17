import { NextResponse } from 'next/server'
import { 
  sendNewAppointmentEmail, 
  sendAppointmentReminderEmail, 
  sendAppointmentCancelledEmail 
} from '@/lib/email'

export async function GET() {
  try {
    const testData = {
      businessName: "Salão Teste",
      clientName: "Cliente Teste",
      serviceName: "Corte de Cabelo",
      date: "01/01/2024",
      time: "14:00",
      price: 50.00
    }

    // Teste de novo agendamento
    await sendNewAppointmentEmail("seu-email@teste.com", testData)
    
    // Teste de lembrete
    await sendAppointmentReminderEmail("seu-email@teste.com", testData)
    
    // Teste de cancelamento
    await sendAppointmentCancelledEmail("seu-email@teste.com", testData)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro no teste de emails:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 