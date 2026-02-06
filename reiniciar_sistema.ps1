# Script para reiniciar o Sistema Carretas (Incluso Banco de Dados)
Write-Host "🛑 Parando processos Node.js..." -ForegroundColor Yellow
taskkill /F /IM node.exe
Write-Host "✅ Processos parados." -ForegroundColor Green

Write-Host "🐳 Iniciando Infraestrutura (Banco de Dados, Redis, MinIO)..." -ForegroundColor Cyan
docker compose -f docker-compose.dev.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao iniciar Docker. Verifique se o Docker Desktop está aberto!" -ForegroundColor Red
    Read-Host "Pressione ENTER para sair..."
    exit
}
Write-Host "✅ Infraestrutura iniciada." -ForegroundColor Green

Write-Host "⏳ Aguardando 10 segundos para o banco iniciar..."
Start-Sleep -Seconds 10

Write-Host "🚀 Iniciando Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "npm run dev" -WorkingDirectory "backend"

Write-Host "🚀 Iniciando Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "npm start" -WorkingDirectory "frontend"

Write-Host "✅ Sistema reiniciado! As janelas dos servidores devem abrir em breve." -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:3000"
Write-Host "⚙️ Backend: http://localhost:3001"
