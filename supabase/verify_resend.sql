-- Verificar configuração do Resend
SELECT 
    key,
    CASE 
        WHEN key = 'resend_api_key' 
        THEN 're_***' || right(value, 4)
        ELSE value 
    END as value,
    CASE 
        WHEN key = 'resend_api_key' AND value IS NOT NULL THEN 'Configurado'
        WHEN key = 'resend_api_key' AND value IS NULL THEN 'Chave não configurada'
        ELSE 'Configuração não encontrada'
    END as status,
    CASE
        WHEN value = 're_hyHHawrp_6aW3bQCL2GmLvJ1gL4jjRVYj' THEN 'Chave correta'
        ELSE 'Chave diferente da esperada'
    END as validacao
FROM app_config 
WHERE key = 'resend_api_key'; 