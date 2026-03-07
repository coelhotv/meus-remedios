-- Migration: Add therapeutic_class column to medicines table
-- Description: Add optional therapeutic_class field for drug interactions feature (F8.2)
-- Created: 2026-03-07
-- Status: Ready for deployment

BEGIN;

-- Add therapeutic_class column
ALTER TABLE medicines
ADD COLUMN IF NOT EXISTS therapeutic_class TEXT;

-- Comment for documentation
COMMENT ON COLUMN medicines.therapeutic_class IS 'Classe terapêutica do medicamento (ex: ANTI-HIPERTENSIVOS). Usado para detectar interações medicamentosas na Fase 8. Preenchido automaticamente via autocomplete ANVISA ou manualmente pelo usuário.';

-- Optional: Create index for drug interaction queries (for F8.2)
-- Commented out for now, uncomment when F8.2 is implemented
-- CREATE INDEX IF NOT EXISTS idx_medicines_therapeutic_class
-- ON medicines(user_id, therapeutic_class)
-- WHERE therapeutic_class IS NOT NULL;

COMMIT;
