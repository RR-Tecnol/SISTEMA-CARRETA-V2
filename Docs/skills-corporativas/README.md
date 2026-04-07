# 🛡️ Skills Corporativas — Pacote Auditado

Pacote de skills pré-selecionadas e auditadas para uso corporativo em:
- **Pipelines de IA Local** (RAG, LLM, OCR)
- **DevSecOps e Cibersegurança**
- **Automação Documental B2G**
- **Compliance LGPD**

> Auditado em 2026-04-06 com critérios de segurança fail-closed, conformidade LGPD e utilidade real para stack B2G/Judicial.

---

## 📦 Skills Incluídas

| Skill | Categoria | Status Auditoria |
|-------|-----------|-----------------|
| `rag-engineer` | IA / LLM | ✅ APROVADA |
| `local-llm-expert` | IA / Infraestrutura | ✅ APROVADA |
| `computer-vision-expert` | IA / OCR / Visão | ✅ APROVADA |
| `pdf-official` | Automação Documental | ✅ APROVADA |
| `privacy-by-design` | Compliance | ✅ APROVADA |
| `gdpr-data-handling` | Compliance / LGPD | ✅ APROVADA |
| `security-audit` | Cibersegurança | ✅ APROVADA |
| `pentest-checklist` | Cibersegurança | ✅ APROVADA |
| `semgrep-rule-creator` | DevSecOps / SAST | ✅ APROVADA |
| `threat-modeling-expert` | Arquitetura Segura | ✅ APROVADA |
| `langchain-architecture` | IA / LLM | ⚠️ MODIFICADA (segura) |
| `advogado-especialista` | Jurídico / B2G | ⚠️ MODIFICADA (segura) |

---

## 🚀 Instalação Rápida

### Opção 1 — Script Automático (recomendado)

```powershell
# Instala no projeto atual (cria .agents/skills/ se não existir)
.\install.ps1

# Instala em um projeto específico
.\install.ps1 -Destino "C:\Projetos\meu-projeto"

# Simulação (mostra o que seria feito sem copiar)
.\install.ps1 -DryRun
```

### Opção 2 — Manual

Copie a pasta `skills\` para dentro da pasta `.agents\` do seu projeto:

```
meu-projeto/
└── .agents/
    └── skills/
        ├── rag-engineer/
        ├── local-llm-expert/
        ├── computer-vision-expert/
        └── ... (demais skills)
```

---

## 📁 Estrutura do Pacote

```
skills-corporativas/
├── README.md              ← Este arquivo
├── install.ps1            ← Script de instalação PowerShell
├── MANIFEST.md            ← Lista completa com detalhes de auditoria
└── skills/
    ├── rag-engineer/
    │   └── SKILL.md
    ├── local-llm-expert/
    │   └── SKILL.md
    ├── computer-vision-expert/
    │   └── SKILL.md
    ├── pdf-official/
    │   └── SKILL.md
    ├── privacy-by-design/
    │   └── SKILL.md
    ├── gdpr-data-handling/
    │   └── SKILL.md
    ├── security-audit/
    │   └── SKILL.md
    ├── pentest-checklist/
    │   └── SKILL.md
    ├── semgrep-rule-creator/
    │   └── SKILL.md
    ├── threat-modeling-expert/
    │   └── SKILL.md
    ├── langchain-architecture/
    │   └── SKILL.md       ← Versão modificada (sem SerpAPI, com HITL)
    └── advogado-especialista/
        └── SKILL.md       ← Versão modificada (com disclaimer legal)
```

---

## 🔒 O Que Foi Excluído e Por Quê

| Skill Excluída | Motivo |
|---------------|--------|
| `loki-mode` | `--dangerously-skip-permissions` + ZERO HITL |
| `red-team-tactics` | Playbook ofensivo completo — risco de Prompt Injection |
| `aegisops-ai` | Envia dados de infra para cloud Google (violação LGPD) |
| `autonomous-agent-patterns` | `shell=True` + SSRF em `add_url()` não corrigidos |
| Todas as `*-automation` de SaaS | Enviam dados para APIs externas por design |

---

## ⚙️ Como Ativar uma Skill em um Projeto

Após instalar, referencie a skill no prompt:

```
@rag-engineer         → Ativa expertise em RAG e pipelines de retrieval
@local-llm-expert     → Ativa expertise em LLMs locais (Ollama/llama.cpp)
@pdf-official         → Ativa expertise em processamento de PDFs
@privacy-by-design    → Ativa diretrizes LGPD em todo o desenvolvimento
@security-audit       → Inicia workflow completo de auditoria de segurança
@advogado-especialista → Ativa especialista em Direito Brasileiro
```

---

## 📋 Política de Uso

1. **Nenhuma skill pode ser usada para enviar dados fora do ambiente local** sem aprovação explícita do CISO
2. **Skills de segurança** (`pentest-checklist`, `security-audit`) requerem autorização formal antes de ativação em produção
3. **`advogado-especialista`** é ferramenta de pesquisa — não substitui consulta com advogado habilitado
4. Revisar e atualizar este pacote a cada **90 dias** ou após mudança legislativa relevante
