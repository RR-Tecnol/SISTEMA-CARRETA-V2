# Script de Commit para Deploy
# Execute este arquivo no PowerShell

Write-Host "🔍 Verificando status do Git..." -ForegroundColor Cyan
cd C:\Users\joaobaluz\Desktop\sistema-carretas

git status

Write-Host "`n📝 Adicionando arquivos ao Git..." -ForegroundColor Cyan

# Adicionar novos Dockerfiles e configurações
git add backend/Dockerfile
git add backend/.dockerignore
git add frontend/Dockerfile
git add frontend/.dockerignore
git add frontend/nginx.conf

# Adicionar docker-compose atualizado
git add docker-compose.yml

# Adicionar arquivo de exemplo de env de produção
git add .env.production.example

Write-Host "`n✅ Arquivos adicionados:" -ForegroundColor Green
git status --short

Write-Host "`n💾 Fazendo commit..." -ForegroundColor Cyan
git commit -m "feat: adicionar configuração de deploy com Docker

- Adicionar Dockerfile otimizado para backend (multi-stage build)
- Adicionar Dockerfile otimizado para frontend (React + Nginx)
- Configurar nginx para servir SPA do React
- Atualizar docker-compose.yml com serviços backend e frontend
- Adicionar arquivo .env.production.example com variáveis necessárias
- Configurar networking e healthchecks entre serviços
- Preparar estrutura para deploy na Hostinger"

Write-Host "`n🚀 Fazendo push para GitHub..." -ForegroundColor Cyan
git push origin main

Write-Host "`n✨ Commit concluído com sucesso!" -ForegroundColor Green
Write-Host "📋 Próximo passo: Gerar chaves de segurança (Passo 2)" -ForegroundColor Yellow
