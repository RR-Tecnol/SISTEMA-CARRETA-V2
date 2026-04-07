# MANIFEST DE AUDITORIA DE SEGURANÇA — v2 (Expandido)

**Repositório de origem:** `https://github.com/sickn33/antigravity-awesome-skills`  
**Data da auditoria inicial:** 2026-04-06  
**Data da expansão:** 2026-04-06  
**Auditor:** Antigravity AI — Análise Estática de Prompts  
**Critérios:** Fail-Closed | LGPD | HITL | Anti-Exfiltração | Anti-Prompt-Injection  
**Total auditado:** 1.356 skills | **Selecionadas:** 62

---

## CATEGORIAS DO PACOTE

| Categoria | Skills | Status |
|-----------|--------|--------|
| IA e LLM Local | 7 | ✅ Aprovadas direto / ⚠️ Modificadas |
| Segurança e Compliance | 13 | ✅ / ⚠️ Sanitizadas |
| Engenharia de Software | 15 | ✅ Aprovadas direto |
| Banco de Dados e Infraestrutura | 8 | ✅ Aprovadas direto |
| Observabilidade e Operações | 4 | ✅ Aprovadas direto |
| Documentos e Automação | 3 | ✅ Aprovadas direto |
| Jurídico e B2G (Brasil) | 8 | ✅ / ⚠️ Modificadas |
| Arquitetura e Padrões | 4 | ✅ Aprovadas direto |

---

## ✅ GRUPO 1 — APROVADAS DIRETO (Sem Modificação)

### IA e LLM Local
| Skill | Utilidade | Notas |
|-------|-----------|-------|
| `rag-engineer` | Pipeline RAG completo — chunking, retrieval, reranking | ✅ Sem risco |
| `local-llm-expert` | Deploy de LLMs locais — Ollama, llama.cpp, quantização | ✅ Sem risco |
| `computer-vision-expert` | OCR, YOLO, SAM, VLMs para documentos | ✅ Sem risco |
| `vector-database-engineer` | Chroma, Qdrant, PgVector — configuração e tuning | ✅ Sem risco |
| `embedding-strategies` | Estratégias de embedding para RAG e busca semântica | ✅ Sem risco |
| `llm-evaluation` | Avaliação de qualidade de LLMs e outputs | ✅ Sem risco |
| `prompt-engineering-patterns` | Padrões avançados de engenharia de prompts | ✅ Sem risco |
| `llm-app-patterns` | Padrões arquiteturais para aplicações LLM | ✅ Sem risco |

### Segurança e Compliance
| Skill | Utilidade | Notas |
|-------|-----------|-------|
| `security-audit` | Auditoria completa — 7 fases, OWASP Top 10 | ✅ Sem risco |
| `pentest-checklist` | Framework estruturado de pentest com HITL | ✅ Requer autorização |
| `privacy-by-design` | Compliance LGPD desde a concepção | ✅ Sem risco |
| `gdpr-data-handling` | Implementação dos direitos Art. 18 LGPD | ✅ Sem risco |
| `semgrep-rule-creator` | Regras SAST customizadas para o domínio | ✅ Baixo risco |
| `threat-modeling-expert` | STRIDE/PASTA para revisão arquitetural | ✅ Sem risco |
| `pci-compliance` | PCI DSS para sistemas com processamento de pagamentos | ✅ Sem risco |
| `vulnerability-scanner` | Configuração de scanners de vulnerabilidade | ✅ Sem risco |
| `api-security-testing` | Testes de segurança em APIs REST/GraphQL | ✅ Sem risco |
| `secrets-management` | HashiCorp Vault, AWS SM, rotação automática | ✅ Sem risco |
| `k8s-security-policies` | Network policies e RBAC para Kubernetes | ✅ Sem risco |
| `memory-safety-patterns` | Padrões de segurança de memória em C/Rust | ✅ Sem risco |
| `sast-configuration` | Configuração de ferramentas SAST no pipeline | ✅ Sem risco |
| `auth-implementation-patterns` | JWT, OAuth2, mTLS, MFA — implementação segura | ✅ Sem risco |

### Engenharia de Software
| Skill | Utilidade |
|-------|-----------|
| `docker-expert` | Dockerfiles otimizados, multi-stage, compose |
| `clean-code` | Padrões de código limpo e refatoração |
| `tdd-orchestrator` | TDD completo: red-green-refactor |
| `debugging-strategies` | Estratégias sistemáticas de debugging |
| `error-handling-patterns` | Padrões robustos de tratamento de erro |
| `async-python-patterns` | asyncio, aiohttp, Celery em Python |
| `python-patterns` | Padrões Pythônico — decorators, context managers |
| `python-testing-patterns` | pytest, fixtures, mocking em Python |
| `fastapi-pro` | FastAPI avançado — performance, segurança, async |
| `api-design-principles` | REST/gRPC/GraphQL — princípios de design |
| `openapi-spec-generation` | Geração de especificações OpenAPI 3.x |
| `code-review-excellence` | Framework de code review de alta qualidade |

### Banco de Dados e Infraestrutura
| Skill | Utilidade |
|-------|-----------|
| `database-architect` | Design de schemas, normalização, particionamento |
| `postgresql-optimization` | EXPLAIN ANALYZE, índices, vacuum, queries |
| `sql-optimization-patterns` | Padrões de otimização SQL cross-database |
| `microservices-patterns` | Saga, Circuit Breaker, API Gateway |

### Observabilidade e Operações
| Skill | Utilidade |
|-------|-----------|
| `observability-engineer` | Métricas, logs, traces — stack completa |
| `distributed-tracing` | OpenTelemetry, Jaeger, Zipkin |
| `incident-responder` | Resposta estruturada a incidentes |
| `postmortem-writing` | Postmortems blameless e lições aprendidas |

### Arquitetura e Padrões
| Skill | Utilidade |
|-------|-----------|
| `architecture-decision-records` | ADRs para decisões arquiteturais documentadas |
| `ddd-strategic-design` | Domain-Driven Design — bounded contexts, eventos |
| `workflow-orchestration-patterns` | Padrões de orquestração de workflows |

### Documentos e Automação
| Skill | Utilidade |
|-------|-----------|
| `docx-official` | Geração e manipulação de documentos Word |
| `xlsx-official` | Automação de planilhas Excel |
| `pptx-official` | Geração de apresentações PowerPoint |
| `pdf-official` | Pipeline completo de processamento PDF |

---

## ⚠️ GRUPO 2 — APROVADAS COM MODIFICAÇÕES

### Modificações aplicadas internamente

| Skill Original | Nome no Pacote | Modificações |
|---------------|----------------|-------------|
| `advogado-especialista` | `advogado-especialista` | Disclaimer legal obrigatório adicionado |
| `langchain-architecture` | `langchain-architecture` | SerpAPI removido; HITL obrigatório; TTL LGPD |
| `aegisops-ai` | `devsecops-pipeline-auditor` | Cloud API → Ollama local; HITL documentado |
| `autonomous-agent-patterns` | `safe-agent-architecture` | shell=True corrigido; SSRF corrigido |

### Reescritas completas (conteúdo extraído e sanitizado)

| Skill Original | Nome no Pacote | Transformação |
|---------------|----------------|--------------|
| `loki-mode` | `agent-orchestration-patterns` | ZERO HITL removido → RARV com HITL gates |
| `red-team-tactics` | `blue-team-defense` | Ofensivo → Regras SIEM + playbooks de resposta |

### Jurídico e B2G (Brasil) — com disclaimer padrão

| Skill | Disclaimer Aplicado |
|-------|---------------------|
| `advogado-especialista` | Não substitui advogado OAB; uso corporativo definido |
| `advogado-criminal` | Idem — análise de documentos, não orientação direta |
| `leiloeiro-juridico` | Ferramenta de pesquisa jurídica de leilões |
| `leiloeiro-avaliacao` | Referência de avaliação — não substitui laudo oficial |
| `leiloeiro-ia` | Automação de análise de oportunidades em leilão |
| `leiloeiro-edital` | Análise de editais — conferir com advogado |
| `leiloeiro-risco` | Framework de risco — não substitui due diligence |
| `leiloeiro-mercado` | Análise de mercado de leilões |

---

## ❌ EXCLUÍDAS — Motivos

### Exfiltração / APIs Externas Não Homologadas
- Todas as `*-automation` (Slack, HubSpot, Salesforce, etc.) — enviam dados para SaaS por design
- `aegisops-ai` (original) — Google GenAI Cloud API
- `gemini-api-*` — Toda comunicação com Google Cloud
- `apify-*` — Web scraping enviando dados para Apify Cloud
- `firecrawl-scraper` — API externa de scraping

### HITL Zero / Alta Autonomia Sem Supervisão
- `loki-mode` (original) — `--dangerously-skip-permissions`, ZERO HITL
- Skills `autonomous-agents` com execução não supervisionada

### Conteúdo Ofensivo
- `red-team-tactics` (original) — Playbooks ofensivos completos
- `active-directory-attacks` — Técnicas de ataque a AD
- `linux-privilege-escalation` — Escalada de privilégios
- `windows-privilege-escalation` — Idem para Windows
- `anti-reversing-techniques` — Técnicas de anti-análise forense
- `privilege-escalation-methods` — Consolidado de técnicas
- `metasploit-framework` — Framework ofensivo
- `sqlmap-database-pentesting` — Exploração automática de SQL Injection

### Escopo Fora do Stack Corporativo
- Skills de frameworks específicos de terceiros não usados no stack
- Skills de personas (elon-musk, bill-gates, etc.) — sem valor corporativo

---

## 📅 Calendário de Revisão

| Data | Ação |
|------|------|
| 2026-07-06 | Revisão trimestral — atualizar skills jurídicas |
| 2026-10-06 | Revisão semestral — avaliar novas skills do repositório |
| A qualquer momento | Após incidente de segurança ou mudança legislativa LGPD |

---

## 🔄 Como Adicionar Novas Skills ao Pacote

1. Identificar a skill no repositório fonte
2. Auditar SKILL.md contra os 5 critérios de segurança
3. Se aprovada: copiar diretamente para `skills/`
4. Se precisar modificação: aplicar as correções e documentar aqui
5. Atualizar este MANIFEST com a nova entry
6. Atualizar o `install.ps1` adicionando o nome ao array `$SkillsAprovadas`
