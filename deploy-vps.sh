#!/bin/bash
# =============================================================
# SCRIPT DE DEPLOY SEGURO — SISTEMA CARRETAS V2
# Execute na VPS: bash deploy-vps.sh
# =============================================================
set -e  # Para em qualquer erro

echo "========================================"
echo " DEPLOY SEGURO — SISTEMA CARRETAS V2"
echo "========================================"

# 1. LOCALIZAR O PROJETO
echo ""
echo "[1/6] Localizando o projeto..."
PROJECT_DIR=$(find /root /opt /home -name "docker-compose.yml" -not -path "*/proc/*" 2>/dev/null | grep -i "carreta\|sistema" | head -1 | xargs dirname 2>/dev/null || echo "")

if [ -z "$PROJECT_DIR" ]; then
  echo "Tentando caminhos comuns..."
  for dir in "/root/SISTEMA-CARRETA-V2" "/root/sistema-carreta" "/opt/sistema-carreta" "/root/app"; do
    if [ -d "$dir" ]; then
      PROJECT_DIR="$dir"
      break
    fi
  done
fi

if [ -z "$PROJECT_DIR" ]; then
  echo "ERRO: Projeto não encontrado. Informe o caminho:"
  read -p "Caminho: " PROJECT_DIR
fi

echo "Projeto encontrado em: $PROJECT_DIR"
cd "$PROJECT_DIR"

# 2. BACKUP DO BANCO (ANTES DE QUALQUER COISA)
echo ""
echo "[2/6] Fazendo backup do banco de dados..."
BACKUP_FILE="/root/backup_carretas_$(date +%Y%m%d_%H%M%S).sql"
POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i postgres | grep -i carreta | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
  POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i postgres | head -1)
fi

echo "Container Postgres: $POSTGRES_CONTAINER"
docker exec "$POSTGRES_CONTAINER" pg_dump -U postgres sistema_carretas > "$BACKUP_FILE"
echo "✅ Backup salvo em: $BACKUP_FILE ($(du -sh $BACKUP_FILE | cut -f1))"

# 3. VER ESTADO ATUAL DO GIT
echo ""
echo "[3/6] Estado atual do repositório..."
git log --oneline -3
git status --short

# 4. PULL DO CÓDIGO (SEM TOCAR NO .ENV)
echo ""
echo "[4/6] Baixando novas versões do código..."
git pull origin main
echo "✅ Código atualizado"
git log --oneline -3

# 5. REBUILD APENAS BACKEND E FRONTEND (SEM DERRUBAR VOLUMES)
echo ""
echo "[5/6] Reconstruindo containers backend e frontend..."
echo "AVISO: NÃO derrubando volumes — dados preservados"

# Determina o comando Docker Compose disponível
if command -v "docker compose" &> /dev/null; then
  DC="docker compose"
else
  DC="docker-compose"
fi

$DC build --no-cache backend frontend
$DC up -d --no-deps backend frontend

echo "✅ Containers reconstruídos"

# 6. VERIFICAÇÃO FINAL
echo ""
echo "[6/6] Verificando status dos containers..."
sleep 5
$DC ps

echo ""
echo "========================================"
echo " Logs do backend (últimas 30 linhas):"
echo "========================================"
$DC logs backend --tail=30

echo ""
echo "========================================"
echo " ✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo " Backup em: $BACKUP_FILE"
echo "========================================"
