-- Corrige meses_descanso en catalogo_base y en todas las copias de usuario (catalogo_cultivos)
-- para cultivo-granada y cultivo-olivo.
--
-- Granada: meses de descanso = [6, 7, 8]   (julio–agosto, poda post-cosecha)
-- Olivo:   meses de descanso = [5, 6, 7, 8] (mayo–agosto, reposo vegetativo)
--
-- Idempotente: jsonb_set sobreescribe el valor; correr múltiples veces es seguro.

-- ─── catalogo_base ────────────────────────────────────────────────────────────

UPDATE catalogo_base
SET datos = jsonb_set(
  datos,
  '{calendario,meses_descanso}',
  '[6, 7, 8]'::jsonb,
  true
)
WHERE id = 'cultivo-granada';

UPDATE catalogo_base
SET datos = jsonb_set(
  datos,
  '{calendario,meses_descanso}',
  '[5, 6, 7, 8]'::jsonb,
  true
)
WHERE id = 'cultivo-olivo';

-- ─── catalogo_cultivos (copias por proyecto) ──────────────────────────────────

UPDATE catalogo_cultivos
SET datos = jsonb_set(
  datos,
  '{calendario,meses_descanso}',
  '[6, 7, 8]'::jsonb,
  true
)
WHERE cultivo_base_id = 'cultivo-granada';

UPDATE catalogo_cultivos
SET datos = jsonb_set(
  datos,
  '{calendario,meses_descanso}',
  '[5, 6, 7, 8]'::jsonb,
  true
)
WHERE cultivo_base_id = 'cultivo-olivo';
