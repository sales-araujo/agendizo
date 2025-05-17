-- Verificar configuração do Resend
SELECT * FROM app_config WHERE key = 'resend_api_key';

-- Verificar template de email
SELECT * FROM email_templates WHERE name = 'feedback_request';

-- Verificar extensões ativas
SELECT * FROM pg_extension; 