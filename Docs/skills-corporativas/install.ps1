# Script de Instalacao - Skills Corporativas Auditadas
# Uso: .\install.ps1 [-Destino "caminho"] [-DryRun]
# Exemplo: .\install.ps1 -Destino "C:\Projetos\meu-sistema"
# Exemplo dry-run: .\install.ps1 -DryRun

param(
    [string]$Destino = "",
    [switch]$DryRun = $false
)

# ─────────────────────────────────────────────────────────
# CONFIGURACAO
# ─────────────────────────────────────────────────────────

$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillsOrigin = Join-Path $ScriptDir "skills"

# Lista EXATA das skills aprovadas (somente estas serao copiadas)
$SkillsAprovadas = @(
    # IA e LLM Local
    "rag-engineer", "local-llm-expert", "computer-vision-expert",
    "vector-database-engineer", "embedding-strategies", "llm-evaluation",
    "prompt-engineering-patterns", "llm-app-patterns",
    # Seguranca e Compliance
    "security-audit", "pentest-checklist", "privacy-by-design",
    "gdpr-data-handling", "semgrep-rule-creator", "threat-modeling-expert",
    "pci-compliance", "vulnerability-scanner", "api-security-testing",
    "secrets-management", "k8s-security-policies", "memory-safety-patterns",
    "sast-configuration", "auth-implementation-patterns",
    # Engenharia de Software
    "docker-expert", "clean-code", "tdd-orchestrator", "debugging-strategies",
    "error-handling-patterns", "async-python-patterns", "python-patterns",
    "python-testing-patterns", "fastapi-pro", "api-design-principles",
    "openapi-spec-generation", "code-review-excellence",
    # Banco de Dados e Infra
    "database-architect", "postgresql-optimization",
    "sql-optimization-patterns", "microservices-patterns",
    # Observabilidade e Operacoes
    "observability-engineer", "distributed-tracing",
    "incident-responder", "postmortem-writing",
    # Arquitetura e Padroes
    "architecture-decision-records", "ddd-strategic-design",
    "workflow-orchestration-patterns",
    # Documentos e Automacao Office
    "docx-official", "xlsx-official", "pptx-official", "pdf-official",
    # Juridico e B2G (Brasil)
    "advogado-especialista", "advogado-criminal",
    "leiloeiro-juridico", "leiloeiro-avaliacao", "leiloeiro-ia",
    "leiloeiro-edital", "leiloeiro-risco", "leiloeiro-mercado",
    # Skills Sanitizadas / Reescritas
    "langchain-architecture",          # Modificada: sem SerpAPI, com HITL
    "devsecops-pipeline-auditor",      # Reescrita: aegisops sem Google Cloud
    "blue-team-defense",               # Reescrita: red-team em perspectiva defensiva
    "safe-agent-architecture",         # Reescrita: shell=True e SSRF corrigidos
    "agent-orchestration-patterns"     # Reescrita: loki-mode sem autonomia zero
)

# ─────────────────────────────────────────────────────────
# BANNER
# ─────────────────────────────────────────────────────────

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   INSTALADOR DE SKILLS CORPORATIVAS AUDITADAS              " -ForegroundColor Cyan
Write-Host "   Pacote Seguro | Fail-Closed | LGPD-Compliant             " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "[MODO SIMULACAO - nenhum arquivo sera copiado]" -ForegroundColor Yellow
    Write-Host ""
}

# ─────────────────────────────────────────────────────────
# DESTINO
# ─────────────────────────────────────────────────────────

if ($Destino -eq "") {
    $Destino = (Get-Location).Path
    Write-Host "Destino nao especificado. Usando diretorio atual:" -ForegroundColor Yellow
    Write-Host "  $Destino" -ForegroundColor Yellow
    Write-Host ""
}

# Define o caminho final: <destino>/.agents/skills/
$SkillsDest = Join-Path $Destino ".agents\skills"

Write-Host "Origem das skills  : $SkillsOrigin" -ForegroundColor Gray
Write-Host "Destino de install : $SkillsDest" -ForegroundColor Gray
Write-Host "Skills no pacote   : $($SkillsAprovadas.Count)" -ForegroundColor Gray
Write-Host ""

# ─────────────────────────────────────────────────────────
# VALIDACAO DE ORIGEM
# ─────────────────────────────────────────────────────────

if (-not (Test-Path $SkillsOrigin)) {
    Write-Host "ERRO: Pasta de skills nao encontrada: $SkillsOrigin" -ForegroundColor Red
    Write-Host "  Certifique-se de rodar o script de dentro da pasta 'skills-corporativas'" -ForegroundColor Red
    exit 1
}

# ─────────────────────────────────────────────────────────
# CRIAR DESTINO SE NECESSARIO
# ─────────────────────────────────────────────────────────

if (-not $DryRun) {
    if (-not (Test-Path $SkillsDest)) {
        Write-Host "Criando estrutura .agents/skills/ em destino..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path $SkillsDest -Force | Out-Null
        Write-Host "  Criado: $SkillsDest" -ForegroundColor Green
        Write-Host ""
    }
}

# ─────────────────────────────────────────────────────────
# COPIAR SKILLS
# ─────────────────────────────────────────────────────────

Write-Host "Instalando skills aprovadas..." -ForegroundColor Cyan
Write-Host ""

$Sucesso  = 0
$Falhas   = 0
$Puladas  = 0

foreach ($skill in $SkillsAprovadas) {
    $origemSkill  = Join-Path $SkillsOrigin $skill
    $destinoSkill = Join-Path $SkillsDest $skill

    if (-not (Test-Path $origemSkill)) {
        Write-Host "  [AVISO] $skill - nao encontrada na origem, pulando" -ForegroundColor Yellow
        $Puladas++
        continue
    }

    if ($DryRun) {
        Write-Host "  [SIMULACAO] Copiaria: $skill" -ForegroundColor DarkGray
        $Sucesso++
        continue
    }

    try {
        # Se ja existe, remove antes de copiar (atualizacao limpa)
        if (Test-Path $destinoSkill) {
            Remove-Item -Path $destinoSkill -Recurse -Force
        }

        Copy-Item -Path $origemSkill -Destination $destinoSkill -Recurse -Force
        Write-Host "  [OK] $skill" -ForegroundColor Green
        $Sucesso++
    }
    catch {
        Write-Host "  [FALHA] $skill - ERRO: $_" -ForegroundColor Red
        $Falhas++
    }
}

# ─────────────────────────────────────────────────────────
# RESUMO
# ─────────────────────────────────────────────────────────

Write-Host ""
Write-Host "────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "RESULTADO DA INSTALACAO" -ForegroundColor Cyan
Write-Host "  Instaladas com sucesso : $Sucesso" -ForegroundColor Green

if ($Puladas -gt 0) {
    Write-Host "  Nao encontradas (puladas): $Puladas" -ForegroundColor Yellow
}
if ($Falhas -gt 0) {
    Write-Host "  Falhas: $Falhas" -ForegroundColor Red
}

Write-Host ""

if ($Falhas -eq 0 -and -not $DryRun) {
    Write-Host "Instalacao concluida com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Skills disponiveis em:" -ForegroundColor Gray
    Write-Host "  $SkillsDest" -ForegroundColor White
    Write-Host ""
    Write-Host "Para ativar no Antigravity ou Claude Code, use:" -ForegroundColor Gray
    Write-Host "  @rag-engineer, @local-llm-expert, @pdf-official, etc." -ForegroundColor White
} elseif ($DryRun) {
    Write-Host "Simulacao concluida. Rode sem -DryRun para instalar de verdade." -ForegroundColor Yellow
}

Write-Host ""

# ─────────────────────────────────────────────────────────
# AVISO DE SEGURANCA (sempre exibido)
# ─────────────────────────────────────────────────────────

Write-Host "POLITICA DE USO - LEIA:" -ForegroundColor Yellow
Write-Host "  1. Nenhuma skill deve enviar dados fora do ambiente local sem aprovacao." -ForegroundColor DarkYellow
Write-Host "  2. Skills de seguranca requerem autorizacao formal antes de uso em producao." -ForegroundColor DarkYellow
Write-Host "  3. @advogado-especialista nao substitui consulta advocaticia profissional." -ForegroundColor DarkYellow
Write-Host "  4. Revisar este pacote a cada 90 dias ou apos mudanca legislativa." -ForegroundColor DarkYellow
Write-Host ""
