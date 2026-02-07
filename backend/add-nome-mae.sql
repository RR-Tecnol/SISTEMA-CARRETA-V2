-- Add nome_mae column to cidadaos table
ALTER TABLE cidadaos ADD COLUMN IF NOT EXISTS nome_mae VARCHAR(255);
COMMENT ON COLUMN cidadaos.nome_mae IS 'Nome da mãe do cidadão';
