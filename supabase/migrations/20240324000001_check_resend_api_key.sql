-- Verificar se a chave já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app_config WHERE key = 'resend_api_key') THEN
        -- Inserir a chave se não existir
        INSERT INTO app_config (key, value)
        VALUES ('resend_api_key', 're_hyHHawrp_6aW3bQCL2GmLvJ1gL4jjRVYj');
    ELSE
        -- Atualizar a chave se já existir
        UPDATE app_config
        SET value = 're_hyHHawrp_6aW3bQCL2GmLvJ1gL4jjRVYj'
        WHERE key = 'resend_api_key';
    END IF;
END $$; 