-- Script para popular a tabela resultados_exames com dados de teste
-- Baseado nas inscrições atendidas existentes

-- Inserir resultados de exames para cada inscrição atendida
INSERT INTO resultados_exames (id, inscricao_id, exame_id, cidadao_id, acao_id, data_realizacao, resultado, observacoes, created_at, updated_at)
SELECT 
    gen_random_uuid() as id,
    i.id as inscricao_id,
    e.id as exame_id,
    i.cidadao_id,
    i.acao_id,
    COALESCE(a.data_inicio, NOW()) as data_realizacao,
    'Normal' as resultado,
    'Resultado gerado automaticamente para testes' as observacoes,
    NOW() as created_at,
    NOW() as updated_at
FROM inscricoes i
CROSS JOIN exames e
INNER JOIN acoes a ON i.acao_id = a.id
WHERE i.status = 'atendido'
AND NOT EXISTS (
    SELECT 1 FROM resultados_exames re 
    WHERE re.inscricao_id = i.id AND re.exame_id = e.id
)
LIMIT 200;

-- Verificar quantos foram criados
SELECT COUNT(*) as total_resultados FROM resultados_exames;

-- Ver amostra dos dados criados
SELECT 
    re.id,
    c.nome_completo as cidadao,
    e.nome as exame,
    a.nome as acao,
    re.data_realizacao,
    re.resultado
FROM resultados_exames re
INNER JOIN cidadaos c ON re.cidadao_id = c.id
INNER JOIN exames e ON re.exame_id = e.id
INNER JOIN acoes a ON re.acao_id = a.id
ORDER BY re.created_at DESC
LIMIT 10;
