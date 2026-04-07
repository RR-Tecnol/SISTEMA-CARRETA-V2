# Como Instalar as Skills Corporativas em Qualquer Projeto

## Estrutura do Pacote

```
skills-corporativas/
├── README.md          ← Documentação
├── MANIFEST.md        ← Auditoria completa de segurança
├── install.ps1        ← Script de instalação automática
└── skills/            ← 319 skills validadas (7.5 MB)
    ├── rag-engineer/
    ├── docker-expert/
    ├── ... (317 outras)
```

---

## OPÇÃO 1 — Instalar no Projeto Atual (diretório corrente)

```powershell
# Navegue até a pasta skills-corporativas
cd "c:\Users\Geral\OneDrive\Área de Trabalho\skill gravity\skills-corporativas"

# Instale no projeto atual
.\install.ps1

# O script cria automaticamente: <projeto>/.agents/skills/
```

## OPÇÃO 2 — Instalar em um Projeto Específico

```powershell
cd "c:\Users\Geral\OneDrive\Área de Trabalho\skill gravity\skills-corporativas"

# Especificar destino
.\install.ps1 -Destino "C:\Projetos\meu-sistema"

# Também funciona com caminho relativo
.\install.ps1 -Destino "..\meu-outro-projeto"
```

## OPÇÃO 3 — Simular Antes de Instalar (Dry Run)

```powershell
.\install.ps1 -DryRun
.\install.ps1 -Destino "C:\Projetos\meu-sistema" -DryRun
```

## OPÇÃO 4 — Instalar no Antigravity Global (skill gravity)

```powershell
# Instalar direto na pasta do skill gravity
.\install.ps1 -Destino "c:\Users\Geral\OneDrive\Área de Trabalho\skill gravity"
```

---

## O Que o Script Faz

1. Verifica se as skills de origem existem
2. Cria `.agents/skills/` no projeto de destino se não existir
3. Copia apenas as skills da lista auditada (garante fail-closed)
4. Exibe relatório de: OK / PULADAS / ERROS
5. Exibe aviso de política de uso no final

## Resultado no Projeto

```
meu-projeto/
├── src/
├── package.json
└── .agents/
    └── skills/          ← criado automaticamente
        ├── rag-engineer/
        ├── docker-expert/
        ├── ... (319 skills)
```

## Como Usar as Skills no Antigravity

Após instalação, use com `@nome-da-skill` nos seus prompts:

```
@rag-engineer        → Pipeline RAG completo
@docker-expert       → Dockerfiles e Compose  
@safe-agent-architecture → Agentes com HITL
@blue-team-defense   → Detecção SIEM e IR
@postgresql-optimization → Tuning de banco
@fastapi-pro         → Backend FastAPI
@semgrep-rule-creator → Regras SAST
```

---

## Executar sem Prompt de Execução (Policy)

Se o Windows bloquear execução de scripts:

```powershell
# Somente para esta sessão (não persiste)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Depois executar normalmente
.\install.ps1 -Destino "C:\Projetos\meu-sistema"
```

## Atualizar Skills em um Projeto Existente

Basta rodar novamente — o script sobrescreve as skills existentes com a versão mais recente:

```powershell
.\install.ps1 -Destino "C:\Projetos\meu-sistema"
# Skills atualizadas automaticamente (cópia limpa)
```
