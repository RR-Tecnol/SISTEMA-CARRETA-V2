-- Fix cidadaos: adicionar colunas faltantes
ALTER TABLE cidadaos ADD COLUMN IF NOT EXISTS nome_mae VARCHAR(255);
ALTER TABLE cidadaos ADD COLUMN IF NOT EXISTS cartao_sus VARCHAR(15);

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
SELECT 'funcionarios columns: ' || COUNT(*) FROM information_schema.columns WHERE table_name='funcionarios';
SELECT 'OK - schema fix concluido' as status;
