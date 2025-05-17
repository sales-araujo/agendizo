-- Criar tabela de templates de email
CREATE TABLE email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir template de feedback
INSERT INTO email_templates (name, subject, html_content)
VALUES (
  'feedback_request',
  'Avalie seu atendimento em {{business_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      max-width: 600px; 
      margin: 0 auto; 
      padding: 20px;
    }
    .button { 
      display: inline-block; 
      padding: 12px 24px; 
      background-color: #0070f3; 
      color: white !important; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <h2>Olá {{customer_name}},</h2>
  
  <p>Esperamos que você tenha tido uma ótima experiência com {{business_name}}!</p>
  
  <p>Gostaríamos muito de saber sua opinião sobre o atendimento. Sua avaliação é muito importante para continuarmos melhorando nossos serviços.</p>
  
  <p>Por favor, clique no botão abaixo para avaliar seu atendimento:</p>
  
  <a href="{{feedback_url}}" class="button">Avaliar Atendimento</a>
  
  <p>Se o botão não funcionar, você também pode copiar e colar este link no seu navegador:</p>
  <p>{{feedback_url}}</p>
  
  <div class="footer">
    <p>Este é um email automático, por favor não responda.</p>
    <p>© 2024 Agendizo. Todos os direitos reservados.</p>
  </div>
</body>
</html>'
); 