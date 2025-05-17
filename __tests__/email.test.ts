import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  sendNewAppointmentEmail,
  sendAppointmentReminderEmail,
  sendAppointmentCancelledEmail 
} from '@/lib/email'
import { createClient } from '@/lib/supabase/server'

// Mock das funções do Supabase
const mockInvoke = vi.fn()
const mockSupabase = {
  functions: {
    invoke: mockInvoke
  }
}

// Mock do cliente Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase
}))

describe('Sistema de Notificações por Email', () => {
  const testData = {
    businessName: "Salão Teste",
    clientName: "Cliente Teste",
    serviceName: "Corte de Cabelo",
    date: "01/01/2024",
    time: "14:00",
    price: 50.00
  }

  const testEmail = "test@example.com"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Novo Agendamento', () => {
    it('deve enviar email de novo agendamento com sucesso', async () => {
      mockInvoke.mockResolvedValueOnce({ data: {}, error: null })

      const result = await sendNewAppointmentEmail(testEmail, testData)
      
      expect(result).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith('send-email', {
        body: {
          to: testEmail,
          subject: `Novo agendamento confirmado - ${testData.businessName}`,
          template: 'new-appointment',
          data: {
            ...testData,
            price: testData.price.toFixed(2)
          }
        }
      })
    })

    it('deve lançar erro quando o envio falha', async () => {
      const errorMessage = 'Erro ao enviar email'
      mockInvoke.mockResolvedValueOnce({ 
        data: null, 
        error: new Error(errorMessage)
      })

      await expect(sendNewAppointmentEmail(testEmail, testData))
        .rejects
        .toThrow()
    })
  })

  describe('Lembrete de Agendamento', () => {
    it('deve enviar email de lembrete com sucesso', async () => {
      mockInvoke.mockResolvedValueOnce({ data: {}, error: null })

      const result = await sendAppointmentReminderEmail(testEmail, testData)
      
      expect(result).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith('send-email', {
        body: {
          to: testEmail,
          subject: `Lembrete de agendamento - ${testData.businessName}`,
          template: 'appointment-reminder',
          data: {
            businessName: testData.businessName,
            clientName: testData.clientName,
            serviceName: testData.serviceName,
            date: testData.date,
            time: testData.time
          }
        }
      })
    })
  })

  describe('Cancelamento de Agendamento', () => {
    it('deve enviar email de cancelamento com sucesso', async () => {
      mockInvoke.mockResolvedValueOnce({ data: {}, error: null })

      const result = await sendAppointmentCancelledEmail(testEmail, testData)
      
      expect(result).toBe(true)
      expect(mockInvoke).toHaveBeenCalledWith('send-email', {
        body: {
          to: testEmail,
          subject: `Agendamento cancelado - ${testData.businessName}`,
          template: 'appointment-cancelled',
          data: {
            businessName: testData.businessName,
            clientName: testData.clientName,
            serviceName: testData.serviceName,
            date: testData.date,
            time: testData.time
          }
        }
      })
    })
  })
}) 