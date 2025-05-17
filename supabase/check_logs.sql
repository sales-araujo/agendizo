-- Verificar atividade recente no banco de dados
SELECT 
    pid,
    query_start,
    state,
    query
FROM 
    pg_stat_activity 
WHERE 
    query_start > NOW() - INTERVAL '5 minutes'
    AND query NOT LIKE '%pg_stat_activity%'
ORDER BY 
    query_start DESC;

-- Verificar atividade recente relacionada a emails
SELECT 
    a.id as appointment_id,
    a.status,
    a.completed_at,
    a.feedback_token,
    c.name as client_name,
    c.email as client_email,
    b.name as business_name,
    CASE 
        WHEN a.feedback_submitted THEN 'Sim'
        ELSE 'Não'
    END as feedback_recebido,
    a.updated_at
FROM appointments a
LEFT JOIN clients c ON c.id = a.client_id
LEFT JOIN businesses b ON b.id = a.business_id
WHERE a.completed_at IS NOT NULL
    AND a.completed_at > NOW() - INTERVAL '1 day'
ORDER BY a.completed_at DESC;

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
        ELSE 'Não configurado'
    END as status
FROM app_config 
WHERE key = 'resend_api_key';

-- Verificar template de email
SELECT 
    name,
    subject,
    created_at,
    updated_at,
    CASE 
        WHEN html_content IS NOT NULL THEN 'Configurado'
        ELSE 'Não configurado'
    END as status
FROM email_templates 
WHERE name = 'feedback_request'; 