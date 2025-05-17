-- Criar função para enviar email de feedback
CREATE OR REPLACE FUNCTION send_feedback_email(
  p_to_email TEXT,
  p_customer_name TEXT,
  p_business_name TEXT,
  p_feedback_url TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_template TEXT;
BEGIN
  -- Template HTML do email
  v_template := '
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333; margin-bottom: 20px;">Olá ' || p_customer_name || ',</h2>

    <p style="color: #666; line-height: 1.5;">Gostaríamos muito de saber como foi sua experiência em ' || p_business_name || '.</p>

    <p style="color: #666; line-height: 1.5;">Sua opinião é muito importante para continuarmos melhorando nosso atendimento.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="' || p_feedback_url || '" style="display: inline-block; background-color: #eb07a4; color: white; font-size: 16px; font-weight: bold; padding: 15px 30px; text-decoration: none; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        Avaliar Atendimento
      </a>
    </div>

    <p style="color: #666; line-height: 1.5;">
      Caso o botão não funcione, você pode acessar diretamente pelo link:<br>
      <a href="' || p_feedback_url || '" style="color: #eb07a4; text-decoration: none;">' || p_feedback_url || '</a>
    </p>

    <p style="color: #666; line-height: 1.5; margin-top: 30px;">
      Atenciosamente,<br>
      Equipe ' || p_business_name || '
    </p>
  </div>';

  -- Enviar email usando a função nativa do Supabase
  PERFORM net.http_post(
    url := 'https://api.supabase.com/v1/email/send',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.jwt.claim.role')
    ),
    body := jsonb_build_object(
      'to', p_to_email,
      'subject', 'Como foi seu atendimento em ' || p_business_name || '?',
      'html', v_template
    )
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 