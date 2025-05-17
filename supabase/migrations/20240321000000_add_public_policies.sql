-- Adicionar políticas para permitir que clientes visualizem horários disponíveis
DROP POLICY IF EXISTS "Clientes podem visualizar horários" ON public.time_slots;
CREATE POLICY "Clientes podem visualizar horários"
  ON public.time_slots
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Clientes podem visualizar dias de trabalho" ON public.working_days;
CREATE POLICY "Clientes podem visualizar dias de trabalho"
  ON public.working_days
  FOR SELECT
  USING (true);

-- Atualizar políticas existentes para manter a segurança das operações de escrita
DROP POLICY IF EXISTS "Usuários autenticados podem inserir horários" ON public.time_slots;
CREATE POLICY "Usuários autenticados podem inserir horários"
  ON public.time_slots
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar horários" ON public.time_slots;
CREATE POLICY "Usuários autenticados podem atualizar horários"
  ON public.time_slots
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários autenticados podem excluir horários" ON public.time_slots;
CREATE POLICY "Usuários autenticados podem excluir horários"
  ON public.time_slots
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários autenticados podem inserir dias de trabalho" ON public.working_days;
CREATE POLICY "Usuários autenticados podem inserir dias de trabalho"
  ON public.working_days
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários autenticados podem atualizar dias de trabalho" ON public.working_days;
CREATE POLICY "Usuários autenticados podem atualizar dias de trabalho"
  ON public.working_days
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários autenticados podem excluir dias de trabalho" ON public.working_days;
CREATE POLICY "Usuários autenticados podem excluir dias de trabalho"
  ON public.working_days
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM businesses
      WHERE owner_id = auth.uid()
    )
  ); 