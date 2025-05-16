-- Tabela para armazenar feriados e folgas
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para melhorar a performance das consultas por negócio
CREATE INDEX IF NOT EXISTS idx_holidays_business_id ON public.holidays(business_id);

-- Índice para melhorar a performance das consultas por data
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(date);

-- Adicionar restrição de unicidade para evitar feriados duplicados na mesma data para o mesmo negócio
ALTER TABLE public.holidays ADD CONSTRAINT unique_holiday_date_per_business UNIQUE (business_id, date);

-- Função para verificar se uma data é feriado para um determinado negócio
CREATE OR REPLACE FUNCTION is_holiday(business_id UUID, check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.holidays 
    WHERE public.holidays.business_id = $1 
    AND public.holidays.date = $2
  );
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp de updated_at
CREATE TRIGGER update_holidays_updated_at
BEFORE UPDATE ON public.holidays
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Permissões
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Proprietários podem ver seus feriados" ON public.holidays
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Proprietários podem adicionar feriados" ON public.holidays
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Proprietários podem atualizar seus feriados" ON public.holidays
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Proprietários podem excluir seus feriados" ON public.holidays
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Clientes podem ver feriados dos negócios" ON public.holidays
  FOR SELECT
  USING (true);
