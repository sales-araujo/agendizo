-- Adicionar coluna feedback_token na tabela appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS feedback_token UUID,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE; 