-- Performance Optimization: Add indexes to improve query speed
-- Created: 2026-02-04
-- Safe to run: These indexes only improve read performance, no data changes

-- Indexes for foreign keys (improve JOIN performance)
CREATE INDEX IF NOT EXISTS idx_acoes_instituicao_id ON acoes(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_cidadao_id ON inscricoes(cidadao_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_acao_id ON inscricoes(acao_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_curso_exame_id ON inscricoes(curso_exame_id);
CREATE INDEX IF NOT EXISTS idx_acao_cursos_exames_acao_id ON acao_cursos_exames(acao_id);
CREATE INDEX IF NOT EXISTS idx_acao_cursos_exames_curso_exame_id ON acao_cursos_exames(curso_exame_id);
CREATE INDEX IF NOT EXISTS idx_acao_caminhoes_acao_id ON acao_caminhoes(acao_id);
CREATE INDEX IF NOT EXISTS idx_acao_caminhoes_caminhao_id ON acao_caminhoes(caminhao_id);
CREATE INDEX IF NOT EXISTS idx_acao_funcionarios_acao_id ON acao_funcionarios(acao_id);
CREATE INDEX IF NOT EXISTS idx_acao_funcionarios_funcionario_id ON acao_funcionarios(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_abastecimentos_caminhao_id ON abastecimentos(caminhao_id);

-- Indexes for frequently queried fields (improve WHERE and ORDER BY performance)
CREATE INDEX IF NOT EXISTS idx_acoes_data_inicio ON acoes(data_inicio);
CREATE INDEX IF NOT EXISTS idx_acoes_municipio ON acoes(municipio);
CREATE INDEX IF NOT EXISTS idx_acoes_estado ON acoes(estado);
CREATE INDEX IF NOT EXISTS idx_acoes_status ON acoes(status);
CREATE INDEX IF NOT EXISTS idx_acoes_tipo ON acoes(tipo);
CREATE INDEX IF NOT EXISTS idx_inscricoes_status ON inscricoes(status);
CREATE INDEX IF NOT EXISTS idx_inscricoes_created_at ON inscricoes(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_inscricoes_acao_status ON inscricoes(acao_id, status);
CREATE INDEX IF NOT EXISTS idx_acoes_data_status ON acoes(data_inicio, status);

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
