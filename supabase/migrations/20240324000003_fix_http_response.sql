-- Drop existing function
DROP FUNCTION IF EXISTS public.send_feedback_email;

-- Recreate function with proper implementation
CREATE OR REPLACE FUNCTION public.send_feedback_email(
  p_to_email text,
  p_customer_name text,
  p_business_name text,
  p_feedback_url text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template email_templates%ROWTYPE;
  v_subject text;
  v_html_content text;
  v_response jsonb;
  v_api_key text;
  v_request_body jsonb;
  v_debug_info jsonb;
  v_raw_response text;
  v_http_status integer;
BEGIN
  -- Inicializar objeto de debug
  v_debug_info := jsonb_build_object(
    'status', 'iniciando',
    'to_email', p_to_email,
    'customer_name', p_customer_name,
    'business_name', p_business_name
  );

  -- Buscar template
  SELECT * INTO v_template
  FROM email_templates
  WHERE name = 'feedback_request'
  LIMIT 1;

  IF NOT FOUND THEN
    v_debug_info := v_debug_info || jsonb_build_object(
      'status', 'erro',
      'message', 'Template de email não encontrado'
    );
    RETURN v_debug_info;
  END IF;

  v_debug_info := v_debug_info || jsonb_build_object(
    'status', 'template_encontrado',
    'template_name', v_template.name
  );

  -- Substituir variáveis no assunto
  v_subject := REPLACE(v_template.subject, '{{business_name}}', p_business_name);

  -- Substituir variáveis no conteúdo
  v_html_content := v_template.html_content;
  v_html_content := REPLACE(v_html_content, '{{customer_name}}', p_customer_name);
  v_html_content := REPLACE(v_html_content, '{{business_name}}', p_business_name);
  v_html_content := REPLACE(v_html_content, '{{feedback_url}}', p_feedback_url);

  -- Obter API key do Resend
  SELECT value INTO v_api_key FROM app_config WHERE key = 'resend_api_key';
  
  IF v_api_key IS NULL THEN
    v_debug_info := v_debug_info || jsonb_build_object(
      'status', 'erro',
      'message', 'API key do Resend não encontrada'
    );
    RETURN v_debug_info;
  END IF;

  v_debug_info := v_debug_info || jsonb_build_object(
    'status', 'api_key_encontrada'
  );

  -- Preparar o corpo da requisição
  v_request_body := jsonb_build_object(
    'from', 'Agendizo <onboarding@resend.dev>',
    'to', p_to_email,
    'subject', v_subject,
    'html', v_html_content
  );

  v_debug_info := v_debug_info || jsonb_build_object(
    'status', 'requisicao_preparada',
    'request_preview', jsonb_build_object(
      'from', 'Agendizo <onboarding@resend.dev>',
      'to', p_to_email,
      'subject', v_subject
    )
  );

  -- Tentar enviar o email via Resend API
  BEGIN
    SELECT 
      status,
      response_body
    INTO 
      v_http_status,
      v_raw_response
    FROM net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_api_key,
        'Content-Type', 'application/json'
      )::jsonb,
      body := v_request_body
    );

    -- Log da resposta bruta para debug
    v_debug_info := v_debug_info || jsonb_build_object(
      'status', 'resposta_recebida',
      'http_status', v_http_status,
      'raw_response', v_raw_response
    );

    -- Tentar converter a resposta para JSON
    BEGIN
      v_response := v_raw_response::jsonb;
    EXCEPTION WHEN OTHERS THEN
      -- Se falhar ao converter para JSON, criar um objeto JSON com a resposta bruta
      v_response := jsonb_build_object(
        'error', true,
        'raw_response', v_raw_response,
        'parse_error', SQLERRM
      );
    END;

    v_debug_info := v_debug_info || jsonb_build_object(
      'status', 'resposta_processada',
      'response', v_response
    );

    -- Verificar se o email foi enviado com sucesso baseado no status HTTP
    IF v_http_status BETWEEN 200 AND 299 THEN
      v_debug_info := v_debug_info || jsonb_build_object(
        'status', 'sucesso',
        'http_status', v_http_status,
        'response', v_response
      );
    ELSE
      v_debug_info := v_debug_info || jsonb_build_object(
        'status', 'erro',
        'http_status', v_http_status,
        'error_details', v_response
      );
    END IF;

    RETURN v_debug_info;

  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_response = PG_EXCEPTION_DETAIL;
    v_debug_info := v_debug_info || jsonb_build_object(
      'status', 'erro',
      'error_type', 'http_request_failed',
      'error_details', SQLERRM,
      'error_context', v_response
    );
    RETURN v_debug_info;
  END;

EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_response = PG_EXCEPTION_DETAIL;
  v_debug_info := v_debug_info || jsonb_build_object(
    'status', 'erro',
    'error_type', 'unexpected_error',
    'error_details', SQLERRM,
    'error_context', v_response
  );
  RETURN v_debug_info;
END;
$$; 