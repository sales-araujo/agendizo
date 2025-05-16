-- Remover a tabela existente se ela existir
DROP TABLE IF EXISTS notification_settings CASCADE;

-- Criar a tabela notification_settings
CREATE TABLE notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_new_appointment BOOLEAN DEFAULT true,
    email_appointment_reminder BOOLEAN DEFAULT true,
    email_appointment_cancelled BOOLEAN DEFAULT true,
    sms_new_appointment BOOLEAN DEFAULT false,
    sms_appointment_reminder BOOLEAN DEFAULT false,
    sms_appointment_cancelled BOOLEAN DEFAULT false,
    whatsapp_new_appointment BOOLEAN DEFAULT false,
    whatsapp_appointment_reminder BOOLEAN DEFAULT false,
    whatsapp_appointment_cancelled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can view their own notification settings"
    ON notification_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
    ON notification_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
    ON notification_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger
CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Conceder permissões
GRANT ALL ON notification_settings TO authenticated;
GRANT ALL ON notification_settings TO service_role; 