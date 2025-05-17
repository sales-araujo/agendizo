-- Criar tabela de emails
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  template TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'error'))
);

-- Criar índice para melhorar performance de consultas por status
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);

-- Criar função para processar emails
CREATE OR REPLACE FUNCTION process_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Aqui você pode adicionar a lógica para enviar o email usando o serviço de email do Supabase
  -- Por enquanto, apenas marca como enviado
  NEW.status := 'sent';
  NEW.sent_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para processar emails automaticamente
CREATE TRIGGER process_email_trigger
  BEFORE INSERT ON emails
  FOR EACH ROW
  EXECUTE FUNCTION process_email(); 