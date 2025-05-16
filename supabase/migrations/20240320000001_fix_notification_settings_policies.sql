-- Verificar e corrigir políticas de segurança
DO $$
BEGIN
    -- Verificar se as políticas existem
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'notification_settings'
        AND policyname = 'Users can view their own notification settings'
    ) THEN
        CREATE POLICY "Users can view their own notification settings"
        ON notification_settings
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'notification_settings'
        AND policyname = 'Users can update their own notification settings'
    ) THEN
        CREATE POLICY "Users can update their own notification settings"
        ON notification_settings
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE tablename = 'notification_settings'
        AND policyname = 'Users can insert their own notification settings'
    ) THEN
        CREATE POLICY "Users can insert their own notification settings"
        ON notification_settings
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Garantir que RLS está habilitado
    ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

    -- Verificar e corrigir permissões
    GRANT ALL ON notification_settings TO authenticated;
    GRANT ALL ON notification_settings TO service_role;
END $$; 