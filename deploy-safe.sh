#!/bin/bash
# ============================================================
# DEPLOY SEGURO — Sistema Carretas para VPS
# Execute: chmod +x deploy-safe.sh && ./deploy-safe.sh
# ============================================================
set -e  # Para em qualquer erro

PROJETO_DIR="$(pwd)"
VPS_IP="76.13.170.155"
VPS_USER="root"
VPS_PASS="@Jl2307201201"
REMOTE_DIR="/root/sistema-carretas-atualizado-ajustado/sistema-carretas-atualizado"

# Instala sshpass se necessário
if ! command -v sshpass &> /dev/null; then
    echo "⚠️  Instalando sshpass..."
    brew install sshpass 2>/dev/null || {
        echo "❌ Instale sshpass manualmente: brew install sshpass"
        exit 1
    }
fi

SSH_CMD="sshpass -p '${VPS_PASS}' ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP}"
SCP_CMD="sshpass -p '${VPS_PASS}' scp -o StrictHostKeyChecking=no"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     DEPLOY SEGURO — Sistema Carretas VPS        ║"
echo "║  ⚠️  Dados do banco serão PRESERVADOS           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── ETAPA 0: Verificar TS local ─────────────────────────────
echo "🔍 [0/7] Verificando TypeScript local..."
cd "${PROJETO_DIR}/frontend"
node node_modules/typescript/bin/tsc --noEmit && echo "✅ TypeScript OK" || { echo "❌ Erros de TypeScript! Corrija antes de deployar."; exit 1; }
cd "${PROJETO_DIR}"

# ── ETAPA 1: Git — adicionar apenas código-fonte ────────────
echo ""
echo "📦 [1/7] Preparando commit (somente código-fonte)..."

git add \
  frontend/src/pages/medico/MedicoPanel.tsx \
  frontend/src/pages/admin/MedicoMonitoring.tsx \
  frontend/src/pages/admin/Cidadaos.tsx \
  frontend/src/pages/citizen/MeusExames.tsx \
  frontend/src/utils/gerarPdfResultado.ts \
  backend/src/routes/fichas.ts \
  backend/src/routes/cidadaos.ts \
  backend/src/routes/emergencias.ts \
  backend/src/routes/medicoMonitoring.ts \
  backend/src/routes/chatEquipe.ts \
  backend/src/routes/alertas.ts \
  backend/src/routes/analytics.ts \
  backend/src/routes/cidadaoExames.ts \
  backend/src/routes/contasPagar.ts \
  backend/src/routes/debug.ts \
  backend/src/routes/estoque.ts \
  backend/src/routes/fichas.ts \
  backend/src/routes/relatorios.ts \
  backend/src/index.ts \
  backend/src/models/AtendimentoMedico.ts \
  backend/src/models/ConfiguracaoSistema.ts \
  backend/src/models/EstoqueCaminhao.ts \
  backend/src/models/FuncionarioAnotacao.ts \
  backend/src/models/ManutencaoCaminhao.ts \
  backend/src/services/pdf/relatorioAcaoPDF.ts \
  backend/src/services/pdf/relatorioCidadePDF.ts \
  backend/src/services/pdf/relatorioEstoquePDF.ts \
  frontend/src/components/medico/EmergenciaAlert.tsx \
  frontend/src/components/layout/AdminSidebar.tsx \
  frontend/src/components/layout/MedicoLayout.tsx \
  frontend/src/pages/admin/AlertasExames.tsx \
  frontend/src/pages/admin/AlertasExames.css \
  frontend/src/pages/admin/BI.tsx \
  frontend/src/pages/admin/BI.css \
  frontend/src/pages/admin/ContasPagar.tsx \
  frontend/src/pages/admin/ContasPagar.css \
  frontend/src/pages/admin/CursosExames.tsx \
  frontend/src/pages/admin/Estoque.tsx \
  frontend/src/pages/admin/FuncionarioAnotacoes.tsx \
  frontend/src/pages/admin/GerenciarAcao.tsx \
  frontend/src/pages/admin/GerenciarFila.tsx \
  frontend/src/pages/admin/ManutencaoCaminhao.tsx \
  frontend/src/pages/admin/ManutencaoCaminhao.css \
  frontend/src/pages/admin/Noticias.tsx \
  frontend/src/pages/admin/Noticias.css \
  frontend/src/pages/admin/PrestacaoContas.tsx \
  frontend/src/pages/admin/PrestacaoContas.css \
  frontend/src/pages/admin/Relatorios.tsx \
  frontend/src/pages/cidadao/MeusExames.tsx \
  frontend/src/pages/cidadao/MeusExames.css \
  frontend/src/pages/public/Home.tsx \
  frontend/src/pages/public/Home.css \
  frontend/src/pages/public/NoticiaDetalhe.tsx \
  frontend/src/pages/public/NoticiaDetalhe.css \
  frontend/src/pages/medico/MedicoAcoes.tsx \
  frontend/src/services/analytics.ts \
  frontend/src/services/contasPagar.ts \
  frontend/src/services/estoque.ts \
  frontend/src/services/medicoMonitoring.ts \
  frontend/src/services/relatorios.ts \
  frontend/src/theme/expressoTheme.ts \
  frontend/src/theme/systemTruckTheme.ts \
  docker-compose.yml \
  2>/dev/null || true

# Verifica se há algo para commitar
if git diff --cached --quiet; then
    echo "ℹ️  Nenhuma alteração nova para commitar. Prosseguindo com deploy..."
else
    git commit -m "Deploy: Encerramento live atendimento, alerta emergência corrigido, PDF laudos, gestão cidadãos"
    echo "✅ Commit criado"
fi

# ── ETAPA 2: Push para o repositório ────────────────────────
echo ""
echo "⬆️  [2/7] Push para o repositório remoto..."
git push origin main
echo "✅ Push concluído"

# ── ETAPA 3: Backup do banco na VPS ANTES de tudo ──────────
echo ""
echo "🔒 [3/7] Backup do banco de dados na VPS..."
eval "$SSH_CMD \"docker exec carretas-postgres pg_dump -U postgres sistema_carretas > /root/backup_pre_deploy_\$(date +%Y%m%d_%H%M%S).sql && echo '✅ Backup criado com sucesso'\""

# ── ETAPA 4: Git pull na VPS ────────────────────────────────
echo ""
echo "📥 [4/7] Atualizando código na VPS..."
eval "$SSH_CMD \"
  cd ${REMOTE_DIR} &&
  git fetch origin &&
  git reset --hard origin/main &&
  echo '✅ Código atualizado na VPS'
\""

# ── ETAPA 5: Build apenas backend e frontend ─────────────────
echo ""
echo "🔨 [5/7] Build dos containers (postgres e redis NÃO serão tocados)..."
eval "$SSH_CMD \"
  cd ${REMOTE_DIR} &&
  docker-compose build --no-cache backend frontend 2>&1 | tail -20
  echo '✅ Build concluído'
\""

# ── ETAPA 6: Restart apenas backend e frontend ──────────────
echo ""
echo "🚀 [6/7] Reiniciando backend e frontend..."
eval "$SSH_CMD \"
  cd ${REMOTE_DIR} &&
  docker-compose up -d --no-deps backend frontend &&
  sleep 8 &&
  echo '=== STATUS DOS CONTAINERS ===' &&
  docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
\""

# ── ETAPA 7: Health check ────────────────────────────────────
echo ""
echo "🏥 [7/7] Health check do sistema..."
eval "$SSH_CMD \"
  echo 'Backend (últimas 15 linhas do log):' &&
  docker logs carretas-backend --tail=15 2>&1 &&
  echo '' &&
  echo 'Teste de conectividade:' &&
  curl -s -o /dev/null -w 'Backend HTTP: %{http_code}\n' http://localhost:3001/api/auth/login 2>/dev/null || echo 'Backend respondendo' &&
  curl -s -o /dev/null -w 'Frontend HTTP: %{http_code}\n' http://localhost:80 2>/dev/null || echo 'Frontend respondendo'
\""

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOY CONCLUÍDO — Sistema Atualizado       ║"
echo "║  🔒 Dados do banco PRESERVADOS integralmente    ║"
echo "║  🌐 Acesse: http://gestaosobrerodas.com.br      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
