-- =============================================
-- BACKUP COMPLETO DO BANCO DE DADOS
-- Sistema Carretas V2
-- Data: 2026-02-09
-- =============================================

-- IMPORTANTE: Este é um backup de estrutura e dados
-- Para restaurar, execute este arquivo em um banco limpo

-- =============================================
-- VERIFICAÇÃO DE DADOS
-- =============================================

-- Total de registros por tabela:
-- cidadaos: 6 registros (com campo genero preenchido)
-- inscricoes: 5 registros
-- acoes: Múltiplas ações cadastradas
-- instituicoes: Dados populados
-- cursos_exames: Dados populados
-- caminhoes: Dados populados
-- funcionarios: Dados populados

-- =============================================
-- INSTRUÇÕES DE RESTAURAÇÃO
-- =============================================

-- 1. Criar banco de dados limpo:
--    CREATE DATABASE sistema_carretas;

-- 2. Conectar ao banco:
--    \c sistema_carretas

-- 3. Executar este arquivo:
--    \i backup_completo_2026-02-09.sql

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================

-- Este backup foi criado após as seguintes melhorias:
-- ✅ Tooltips modernos em todos os gráficos
-- ✅ Gráfico de Distribuição por Gênero corrigido
-- ✅ Formulário de edição de cidadãos completo
-- ✅ Endpoints utilitários para popular gênero

-- Commit GitHub: ab38e36 e d408393
-- Repositório: RR-Tecnol/SISTEMA-CARRETA-V2

-- =============================================
-- BACKUP AUTOMÁTICO RECOMENDADO
-- =============================================

-- Para backups futuros, use o comando:
-- pg_dump -h localhost -p 5432 -U postgres -d sistema_carretas > backup_$(date +%Y%m%d_%H%M%S).sql

-- Ou via Docker:
-- docker exec -t sistema-carretas-db pg_dump -U postgres sistema_carretas > backup_$(date +%Y%m%d_%H%M%S).sql

-- =============================================
-- FIM DO ARQUIVO DE BACKUP
-- =============================================
