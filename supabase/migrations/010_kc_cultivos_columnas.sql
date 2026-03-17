-- Migración 010: Kc (coeficiente de cultivo) por etapa en catalogo_cultivos y catalogo_base
-- Objetivo: mover los Kc desde constantes hardcodeadas en código a la BD,
--           permitiendo que nuevos cultivos definan sus propios Kc.
-- Flujo: catalogo_base (seed global) → trigger → catalogo_cultivos (por proyecto)

-- 1. Columnas en catalogo_base (tabla global que alimenta el seed)
ALTER TABLE catalogo_base
  ADD COLUMN IF NOT EXISTS kc_plantula NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS kc_joven    NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS kc_adulta   NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS kc_madura   NUMERIC(4,2);

-- 2. Columnas en catalogo_cultivos (tabla por proyecto, copiada desde catalogo_base via trigger)
ALTER TABLE catalogo_cultivos
  ADD COLUMN IF NOT EXISTS kc_plantula NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS kc_joven    NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS kc_adulta   NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS kc_madura   NUMERIC(4,2);

-- 3. Poblar Kc en catalogo_base (para nuevos proyectos que se creen después)
UPDATE catalogo_base SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.15, kc_madura = 0.85 WHERE lower(nombre) LIKE '%tomate%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.80, kc_adulta = 1.10, kc_madura = 0.90 WHERE lower(nombre) LIKE '%mango%';
UPDATE catalogo_base SET kc_plantula = 0.40, kc_joven = 0.70, kc_adulta = 1.00, kc_madura = 0.80 WHERE lower(nombre) LIKE '%zanahoria%';
UPDATE catalogo_base SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.10, kc_madura = 0.75 WHERE lower(nombre) LIKE '%papa%';
UPDATE catalogo_base SET kc_plantula = 0.45, kc_joven = 0.70, kc_adulta = 1.05, kc_madura = 0.80 WHERE lower(nombre) LIKE '%cebolla%';
UPDATE catalogo_base SET kc_plantula = 0.40, kc_joven = 0.70, kc_adulta = 1.00, kc_madura = 0.70 WHERE lower(nombre) LIKE '%ajo%';
UPDATE catalogo_base SET kc_plantula = 0.45, kc_joven = 0.80, kc_adulta = 1.00, kc_madura = 0.90 WHERE lower(nombre) LIKE '%lechuga%';
UPDATE catalogo_base SET kc_plantula = 0.40, kc_joven = 0.75, kc_adulta = 1.00, kc_madura = 0.85 WHERE lower(nombre) LIKE '%acelga%';
UPDATE catalogo_base SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.10, kc_madura = 0.85 WHERE lower(nombre) LIKE '%pimiento%';
UPDATE catalogo_base SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.10, kc_madura = 0.85 WHERE lower(nombre) LIKE '%aj_' OR lower(nombre) = 'ají';
UPDATE catalogo_base SET kc_plantula = 0.40, kc_joven = 0.70, kc_adulta = 1.00, kc_madura = 0.80 WHERE lower(nombre) LIKE '%zapallo%';
UPDATE catalogo_base SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.05, kc_madura = 0.75 WHERE lower(nombre) LIKE '%mel_n%' OR lower(nombre) = 'melón';
UPDATE catalogo_base SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.05, kc_madura = 0.70 WHERE lower(nombre) LIKE '%sand%a%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.65, kc_adulta = 0.75, kc_madura = 0.65 WHERE lower(nombre) LIKE '%olivo%' OR lower(nombre) LIKE '%oliva%';
UPDATE catalogo_base SET kc_plantula = 0.40, kc_joven = 0.60, kc_adulta = 0.80, kc_madura = 0.50 WHERE lower(nombre) LIKE '%vid%' OR lower(nombre) LIKE '%uva%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.80 WHERE lower(nombre) LIKE '%lim_n%' OR lower(nombre) LIKE '%limon%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.80 WHERE lower(nombre) LIKE '%naranj%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.75, kc_adulta = 0.95, kc_madura = 0.85 WHERE lower(nombre) LIKE '%palto%' OR lower(nombre) LIKE '%aguacate%' OR lower(nombre) LIKE '%palta%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.80, kc_adulta = 1.00, kc_madura = 0.85 WHERE lower(nombre) LIKE '%guayab%';
UPDATE catalogo_base SET kc_plantula = 0.40, kc_joven = 0.80, kc_adulta = 1.15, kc_madura = 0.70 WHERE lower(nombre) LIKE '%ma_z%' OR lower(nombre) = 'maíz';
UPDATE catalogo_base SET kc_plantula = 0.35, kc_joven = 0.70, kc_adulta = 1.10, kc_madura = 0.35 WHERE lower(nombre) LIKE '%poroto%' OR lower(nombre) LIKE '%frijol%';
UPDATE catalogo_base SET kc_plantula = 0.40, kc_joven = 0.70, kc_adulta = 1.00, kc_madura = 0.40 WHERE lower(nombre) LIKE '%quinoa%' OR lower(nombre) LIKE '%quínoa%';
UPDATE catalogo_base SET kc_plantula = 0.40, kc_joven = 0.80, kc_adulta = 1.20, kc_madura = 1.15 WHERE lower(nombre) LIKE '%alfalfa%';
UPDATE catalogo_base SET kc_plantula = 0.35, kc_joven = 0.60, kc_adulta = 0.90, kc_madura = 0.80 WHERE lower(nombre) LIKE '%or_gano%' OR lower(nombre) LIKE '%oregano%';
UPDATE catalogo_base SET kc_plantula = 0.40, kc_joven = 0.60, kc_adulta = 0.75, kc_madura = 0.65 WHERE lower(nombre) LIKE '%tuna%' OR lower(nombre) LIKE '%nopal%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.75 WHERE lower(nombre) LIKE '%higuera%' OR lower(nombre) LIKE '%higo%';
UPDATE catalogo_base SET kc_plantula = 0.45, kc_joven = 0.65, kc_adulta = 0.90, kc_madura = 0.70 WHERE lower(nombre) LIKE '%pitahaya%' OR lower(nombre) LIKE '%pitaya%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.75, kc_adulta = 1.00, kc_madura = 0.90 WHERE lower(nombre) LIKE '%d_til%' OR lower(nombre) LIKE '%datil%';
UPDATE catalogo_base SET kc_plantula = 0.45, kc_joven = 0.70, kc_adulta = 0.95, kc_madura = 0.80 WHERE lower(nombre) LIKE '%maracuy%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.80 WHERE lower(nombre) LIKE '%mandarin%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.75, kc_adulta = 0.95, kc_madura = 0.85 WHERE lower(nombre) LIKE '%ar_ndano%' OR lower(nombre) LIKE '%arandano%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.75 WHERE lower(nombre) LIKE '%l_cuma%' OR lower(nombre) LIKE '%lucuma%';
UPDATE catalogo_base SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.75 WHERE lower(nombre) LIKE '%zapote%';

-- 4. Poblar Kc para proyectos ya existentes en catalogo_cultivos
-- Poblar Kc para cultivos existentes (match por nombre, case-insensitive)
UPDATE catalogo_cultivos SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.15, kc_madura = 0.85 WHERE lower(nombre) LIKE '%tomate%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.80, kc_adulta = 1.10, kc_madura = 0.90 WHERE lower(nombre) LIKE '%mango%';
UPDATE catalogo_cultivos SET kc_plantula = 0.40, kc_joven = 0.70, kc_adulta = 1.00, kc_madura = 0.80 WHERE lower(nombre) LIKE '%zanahoria%';
UPDATE catalogo_cultivos SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.10, kc_madura = 0.75 WHERE lower(nombre) LIKE '%papa%';
UPDATE catalogo_cultivos SET kc_plantula = 0.45, kc_joven = 0.70, kc_adulta = 1.05, kc_madura = 0.80 WHERE lower(nombre) LIKE '%cebolla%';
UPDATE catalogo_cultivos SET kc_plantula = 0.40, kc_joven = 0.70, kc_adulta = 1.00, kc_madura = 0.70 WHERE lower(nombre) LIKE '%ajo%';
UPDATE catalogo_cultivos SET kc_plantula = 0.45, kc_joven = 0.80, kc_adulta = 1.00, kc_madura = 0.90 WHERE lower(nombre) LIKE '%lechuga%';
UPDATE catalogo_cultivos SET kc_plantula = 0.40, kc_joven = 0.75, kc_adulta = 1.00, kc_madura = 0.85 WHERE lower(nombre) LIKE '%acelga%';
UPDATE catalogo_cultivos SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.10, kc_madura = 0.85 WHERE lower(nombre) LIKE '%pimiento%';
UPDATE catalogo_cultivos SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.10, kc_madura = 0.85 WHERE lower(nombre) LIKE '%aj_' OR lower(nombre) = 'ají';
UPDATE catalogo_cultivos SET kc_plantula = 0.40, kc_joven = 0.70, kc_adulta = 1.00, kc_madura = 0.80 WHERE lower(nombre) LIKE '%zapallo%';
UPDATE catalogo_cultivos SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.05, kc_madura = 0.75 WHERE lower(nombre) LIKE '%mel_n%' OR lower(nombre) = 'melón';
UPDATE catalogo_cultivos SET kc_plantula = 0.45, kc_joven = 0.75, kc_adulta = 1.05, kc_madura = 0.70 WHERE lower(nombre) LIKE '%sand%a%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.65, kc_adulta = 0.75, kc_madura = 0.65 WHERE lower(nombre) LIKE '%olivo%' OR lower(nombre) LIKE '%oliva%';
UPDATE catalogo_cultivos SET kc_plantula = 0.40, kc_joven = 0.60, kc_adulta = 0.80, kc_madura = 0.50 WHERE lower(nombre) LIKE '%vid%' OR lower(nombre) LIKE '%uva%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.80 WHERE lower(nombre) LIKE '%lim_n%' OR lower(nombre) LIKE '%limon%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.80 WHERE lower(nombre) LIKE '%naranj%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.75, kc_adulta = 0.95, kc_madura = 0.85 WHERE lower(nombre) LIKE '%palto%' OR lower(nombre) LIKE '%aguacate%' OR lower(nombre) LIKE '%palta%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.80, kc_adulta = 1.00, kc_madura = 0.85 WHERE lower(nombre) LIKE '%guayab%';
UPDATE catalogo_cultivos SET kc_plantula = 0.40, kc_joven = 0.80, kc_adulta = 1.15, kc_madura = 0.70 WHERE lower(nombre) LIKE '%ma_z%' OR lower(nombre) = 'maíz';
UPDATE catalogo_cultivos SET kc_plantula = 0.35, kc_joven = 0.70, kc_adulta = 1.10, kc_madura = 0.35 WHERE lower(nombre) LIKE '%poroto%' OR lower(nombre) LIKE '%frijol%';
UPDATE catalogo_cultivos SET kc_plantula = 0.40, kc_joven = 0.70, kc_adulta = 1.00, kc_madura = 0.40 WHERE lower(nombre) LIKE '%quinoa%' OR lower(nombre) LIKE '%quínoa%';
UPDATE catalogo_cultivos SET kc_plantula = 0.40, kc_joven = 0.80, kc_adulta = 1.20, kc_madura = 1.15 WHERE lower(nombre) LIKE '%alfalfa%';
UPDATE catalogo_cultivos SET kc_plantula = 0.35, kc_joven = 0.60, kc_adulta = 0.90, kc_madura = 0.80 WHERE lower(nombre) LIKE '%or_gano%' OR lower(nombre) LIKE '%oregano%';
UPDATE catalogo_cultivos SET kc_plantula = 0.40, kc_joven = 0.60, kc_adulta = 0.75, kc_madura = 0.65 WHERE lower(nombre) LIKE '%tuna%' OR lower(nombre) LIKE '%nopal%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.75 WHERE lower(nombre) LIKE '%higuera%' OR lower(nombre) LIKE '%higo%';
UPDATE catalogo_cultivos SET kc_plantula = 0.45, kc_joven = 0.65, kc_adulta = 0.90, kc_madura = 0.70 WHERE lower(nombre) LIKE '%pitahaya%' OR lower(nombre) LIKE '%pitaya%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.75, kc_adulta = 1.00, kc_madura = 0.90 WHERE lower(nombre) LIKE '%d_til%' OR lower(nombre) LIKE '%datil%';
UPDATE catalogo_cultivos SET kc_plantula = 0.45, kc_joven = 0.70, kc_adulta = 0.95, kc_madura = 0.80 WHERE lower(nombre) LIKE '%maracuy%' OR lower(nombre) LIKE '%maracujá%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.80 WHERE lower(nombre) LIKE '%mandarin%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.75, kc_adulta = 0.95, kc_madura = 0.85 WHERE lower(nombre) LIKE '%ar_ndano%' OR lower(nombre) LIKE '%arandano%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.75 WHERE lower(nombre) LIKE '%l_cuma%' OR lower(nombre) LIKE '%lucuma%';
UPDATE catalogo_cultivos SET kc_plantula = 0.50, kc_joven = 0.70, kc_adulta = 0.85, kc_madura = 0.75 WHERE lower(nombre) LIKE '%zapote%';

-- 5. Actualizar trigger para incluir kc_* al copiar catalogo_base → catalogo_cultivos
CREATE OR REPLACE FUNCTION copiar_catalogo_base_a_proyecto()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO catalogo_cultivos (proyecto_id, nombre, tier, kc_plantula, kc_joven, kc_adulta, kc_madura, datos)
  SELECT NEW.id, nombre, tier, kc_plantula, kc_joven, kc_adulta, kc_madura, datos FROM catalogo_base;

  INSERT INTO enmiendas_proyecto (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM enmiendas_base;

  INSERT INTO tecnicas_proyecto (proyecto_id, nombre, categoria, datos)
  SELECT NEW.id, nombre, categoria, datos FROM tecnicas_base;

  INSERT INTO fuentes_agua_proyecto (proyecto_id, nombre, tipo, datos)
  SELECT NEW.id, nombre, tipo, datos FROM fuentes_agua_base;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
