-- FASE_8B: Multi-Estanque — Asignación zona-cultivo → estanque fuente
-- Permite que cada zona de cultivo indique desde qué estanque se riega.
-- Si es NULL, el comportamiento es el mismo que antes (pool global del terreno).

ALTER TABLE zonas
  ADD COLUMN IF NOT EXISTS estanque_id UUID
    REFERENCES zonas(id) ON DELETE SET NULL;

COMMENT ON COLUMN zonas.estanque_id IS
  'Estanque fuente que riega esta zona (solo zonas tipo cultivo). NULL = pool global del terreno.';
