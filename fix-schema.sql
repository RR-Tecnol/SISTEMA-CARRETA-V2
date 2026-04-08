-- ============================================================
-- Fix cidadaos: adicionar colunas faltantes
-- ============================================================
ALTER TABLE cidadaos ADD COLUMN IF NOT EXISTS nome_mae VARCHAR(255);

-- Fix CNS: aumentar de VARCHAR(15) para VARCHAR(20) para armazenar dígitos sem formatação
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='cidadaos' AND column_name='cartao_sus'
             AND character_maximum_length = 15) THEN
    ALTER TABLE cidadaos ALTER COLUMN cartao_sus TYPE VARCHAR(20);
    RAISE NOTICE 'cartao_sus alterado para VARCHAR(20)';
  ELSE
    ALTER TABLE cidadaos ADD COLUMN IF NOT EXISTS cartao_sus VARCHAR(20);
  END IF;
END $$;

-- Tornar campos opcional que o frontend pode omitir (NOT NULL -> NULL com default)
ALTER TABLE cidadaos ALTER COLUMN data_nascimento DROP NOT NULL;
ALTER TABLE cidadaos ALTER COLUMN telefone DROP NOT NULL;
ALTER TABLE cidadaos ALTER COLUMN telefone SET DEFAULT 'Não informado';
ALTER TABLE cidadaos ALTER COLUMN email DROP NOT NULL;
ALTER TABLE cidadaos ALTER COLUMN municipio DROP NOT NULL;
ALTER TABLE cidadaos ALTER COLUMN municipio SET DEFAULT 'Não informado';
ALTER TABLE cidadaos ALTER COLUMN estado DROP NOT NULL;
ALTER TABLE cidadaos ALTER COLUMN estado SET DEFAULT 'MA';

-- Criar ENUMs se não existirem
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_cidadaos_raca') THEN
    CREATE TYPE enum_cidadaos_raca AS ENUM ('branca','preta','parda','amarela','indigena','nao_declarada');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_cidadaos_genero') THEN
    CREATE TYPE enum_cidadaos_genero AS ENUM ('masculino','feminino','outro','nao_declarado');
  END IF;
END $$;

ALTER TABLE cidadaos ADD COLUMN IF NOT EXISTS raca enum_cidadaos_raca;
ALTER TABLE cidadaos ADD COLUMN IF NOT EXISTS genero enum_cidadaos_genero;

-- Fix acoes: colunas extras que o modelo pode precisar
ALTER TABLE acoes ADD COLUMN IF NOT EXISTS nome VARCHAR(255);

SELECT 'cidadaos columns: ' || COUNT(*) FROM information_schema.columns WHERE table_name='cidadaos';
SELECT 'OK - schema fix concluido com sucesso' as status;

