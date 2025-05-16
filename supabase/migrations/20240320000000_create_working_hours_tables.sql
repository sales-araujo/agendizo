-- Criar tabela de dias de trabalho
CREATE TABLE IF NOT EXISTS public.working_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_working_day BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, day_of_week)
);

-- Criar tabela de horários
CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar políticas RLS para working_days
ALTER TABLE public.working_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar dias de trabalho" ON public.working_days
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = working_days.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários autenticados podem inserir dias de trabalho" ON public.working_days
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = working_days.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários autenticados podem atualizar dias de trabalho" ON public.working_days
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = working_days.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários autenticados podem excluir dias de trabalho" ON public.working_days
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = working_days.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

-- Adicionar políticas RLS para time_slots
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar horários" ON public.time_slots
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = time_slots.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários autenticados podem inserir horários" ON public.time_slots
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = time_slots.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários autenticados podem atualizar horários" ON public.time_slots
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = time_slots.business_id
      AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY "Usuários autenticados podem excluir horários" ON public.time_slots
  FOR DELETE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = time_slots.business_id
      AND businesses.owner_id = auth.uid()
    )
  ); 