-- Adicionar campos para feedback
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS feedback_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS feedback_submitted BOOLEAN DEFAULT FALSE;

-- Criar índice para feedback_token
CREATE INDEX IF NOT EXISTS idx_appointments_feedback_token ON public.appointments(feedback_token);

-- Criar função para gerar token de feedback
CREATE OR REPLACE FUNCTION public.generate_feedback_token()
RETURNS TRIGGER AS $$
BEGIN
    NEW.feedback_token = gen_random_uuid();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para gerar token de feedback em novos agendamentos
CREATE TRIGGER generate_feedback_token_trigger
    BEFORE INSERT ON public.appointments
    FOR EACH ROW
    EXECUTE PROCEDURE public.generate_feedback_token(); 