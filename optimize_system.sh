#!/bin/bash
echo "🚀 Otimizando Sistema Carretas..."

# 1. Aplicar indexes no banco
echo "📊 Aplicando indexes..."
docker exec -i carretas-postgres psql -U postgres -d sistema_carretas << 'SQL'
CREATE INDEX IF NOT EXISTS idx_acoes_numero_acao ON acoes(numero_acao);
CREATE INDEX IF NOT EXISTS idx_acao_cursos_exames_acao_id ON acao_cursos_exames(acao_id);
CREATE INDEX IF NOT EXISTS idx_acoes_instituicao_id ON acoes(instituicao_id);
ANALYZE acoes;
ANALYZE acao_cursos_exames;
SELECT 'Indexes criados!' as status;
SQL

# 2. Limpar cache
docker exec -it carretas-redis redis-cli FLUSHALL

# 3. Reiniciar backend
docker-compose restart backend
sleep 10

# 4. Testar performance
echo "⚡ Testando..."
time curl -s http://localhost/api/acoes > /dev/null
echo "✅ Otimização completa!"
