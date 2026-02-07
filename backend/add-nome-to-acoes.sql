-- Execute este script SQL no banco de dados para adicionar o campo "nome" à tabela acoes
-- Você pode executar via pgAdmin, DBeaver, ou qualquer cliente PostgreSQL

ALTER TABLE acoes ADD COLUMN IF NOT EXISTS nome VARCHAR(255) NOT NULL DEFAULT 'Ação sem nome';

-- Opcional: Atualizar ações existentes com nomes baseados no tipo
UPDATE acoes SET nome = CONCAT('Ação de ', CASE WHEN tipo = 'saude' THEN 'Saúde' ELSE 'Curso' END, ' #', numero_acao) WHERE nome = 'Ação sem nome';
