-- Atualizar nomes das colunas da tabela notification_settings
ALTER TABLE notification_settings RENAME COLUMN email_reminder TO email_appointment_reminder;
ALTER TABLE notification_settings RENAME COLUMN email_cancellation TO email_appointment_cancelled;
ALTER TABLE notification_settings RENAME COLUMN sms_reminder TO sms_appointment_reminder;
ALTER TABLE notification_settings RENAME COLUMN sms_cancellation TO sms_appointment_cancelled;
ALTER TABLE notification_settings RENAME COLUMN whatsapp_reminder TO whatsapp_appointment_reminder;
ALTER TABLE notification_settings RENAME COLUMN whatsapp_cancellation TO whatsapp_appointment_cancelled;

-- Verificar se todas as colunas necessárias existem
DO $$
BEGIN
    -- Adicionar colunas que não existem
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        AND column_name = 'email_new_appointment'
    ) THEN
        ALTER TABLE notification_settings
        ADD COLUMN email_new_appointment BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        AND column_name = 'email_appointment_reminder'
    ) THEN
        ALTER TABLE notification_settings
        ADD COLUMN email_appointment_reminder BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        AND column_name = 'email_appointment_cancelled'
    ) THEN
        ALTER TABLE notification_settings
        ADD COLUMN email_appointment_cancelled BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        AND column_name = 'sms_new_appointment'
    ) THEN
        ALTER TABLE notification_settings
        ADD COLUMN sms_new_appointment BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        AND column_name = 'sms_appointment_reminder'
    ) THEN
        ALTER TABLE notification_settings
        ADD COLUMN sms_appointment_reminder BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        AND column_name = 'sms_appointment_cancelled'
    ) THEN
        ALTER TABLE notification_settings
        ADD COLUMN sms_appointment_cancelled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        AND column_name = 'whatsapp_new_appointment'
    ) THEN
        ALTER TABLE notification_settings
        ADD COLUMN whatsapp_new_appointment BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        AND column_name = 'whatsapp_appointment_reminder'
    ) THEN
        ALTER TABLE notification_settings
        ADD COLUMN whatsapp_appointment_reminder BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'notification_settings'
        AND column_name = 'whatsapp_appointment_cancelled'
    ) THEN
        ALTER TABLE notification_settings
        ADD COLUMN whatsapp_appointment_cancelled BOOLEAN DEFAULT false;
    END IF;
END $$; 