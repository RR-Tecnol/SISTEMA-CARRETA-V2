#!/bin/bash
# ============================================================
# DEPLOY SEGURO — Sistema Carretas → VPS
# Usa expect para SSH com senha (sem GitHub necessário)
# Preserva 100% dos dados do banco PostgreSQL
# ============================================================
set -e

VPS_IP="76.13.170.155"
VPS_USER="root"
VPS_PASS="@Jl2307201201"
REMOTE_DIR="/root/sistema-carretas-atualizado-ajustado/sistema-carretas-atualizado"
PROJETO_LOCAL="$(cd "$(dirname "$0")" && pwd)"

# Wrapper de SSH com expect
ssh_exec() {
    local cmd="$1"
    /usr/bin/expect -c "
        log_user 1
        set timeout 300
        spawn ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} \"${cmd}\"
        expect {
            \"password:\" { send \"${VPS_PASS}\r\"; exp_continue }
            \"Password:\" { send \"${VPS_PASS}\r\"; exp_continue }
            eof
        }
        catch wait result
        exit [lindex \$result 3]
    "
}

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     DEPLOY SEGURO — Sistema Carretas VPS        ║"
echo "║  🔒 Banco de dados será PRESERVADO inteiro      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── ETAPA 1: Verificar TypeScript local ─────────────────────
echo "🔍 [1/8] Verificando TypeScript local..."
cd "${PROJETO_LOCAL}/frontend"
node node_modules/typescript/bin/tsc --noEmit && echo "✅ TypeScript OK"
cd "${PROJETO_LOCAL}"

# ── ETAPA 2: Testar conexão SSH ─────────────────────────────
echo ""
echo "🔌 [2/8] Testando conexão com a VPS..."
ssh_exec "echo CONECTADO_VPS"
echo "✅ Conexão SSH OK"

# ── ETAPA 3: Backup do banco ANTES de qualquer coisa ────────
echo ""
echo "🔒 [3/8] Criando backup do banco de dados na VPS..."
BACKUP_FILE="backup_pre_deploy_$(date +%Y%m%d_%H%M%S).sql"
ssh_exec "docker exec carretas-postgres pg_dump -U postgres sistema_carretas > /root/${BACKUP_FILE} && echo 'BACKUP_OK: ${BACKUP_FILE}'"
echo "✅ Backup criado em /root/${BACKUP_FILE}"

# ── ETAPA 4: Status atual dos containers ─────────────────────
echo ""
echo "📊 [4/8] Containers atuais na VPS:"
ssh_exec "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# ── ETAPA 5: Git pull na VPS ─────────────────────────────────
echo ""
echo "📥 [5/8] Atualizando código na VPS..."
ssh_exec "cd ${REMOTE_DIR} && git fetch origin && git pull origin main && echo 'GIT_PULL_OK'"
echo "✅ Código atualizado"

# ── ETAPA 6: Build backend e frontend ─────────────────────────
echo ""
echo "🔨 [6/8] Building backend e frontend (postgres/redis intocados)..."
echo "    (Aguarde, pode demorar alguns minutos...)"
ssh_exec "cd ${REMOTE_DIR} && docker-compose build --no-cache backend frontend 2>&1 | tail -30 && echo 'BUILD_OK'"
echo "✅ Build concluído"

# ── ETAPA 7: Restart apenas backend e frontend ────────────────
echo ""
echo "🚀 [7/8] Reiniciando backend e frontend..."
ssh_exec "cd ${REMOTE_DIR} && docker-compose up -d --no-deps backend frontend && sleep 8 && docker ps --format 'table {{.Names}}\t{{.Status}}'"
echo "✅ Containers reiniciados"

# ── ETAPA 8: Health check ─────────────────────────────────────
echo ""
echo "🏥 [8/8] Verificando saúde do sistema..."
ssh_exec "
  echo '=== LOGS BACKEND (últimas 20 linhas) ===' &&
  docker logs carretas-backend --tail=20 2>&1 &&
  echo '' &&
  echo '=== TESTE HTTP ===' &&
  curl -s -o /dev/null -w 'Backend: %{http_code}' http://localhost:3001/api/auth/login &&
  echo '' &&
  curl -s -o /dev/null -w 'Frontend: %{http_code}' http://localhost:80 &&
  echo ''
"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOY CONCLUÍDO                            ║"
echo "║  🔒 Dados do banco PRESERVADOS                  ║"
echo "║  🌐 http://gestaosobrerodas.com.br              ║"
echo "╚══════════════════════════════════════════════════╝"
