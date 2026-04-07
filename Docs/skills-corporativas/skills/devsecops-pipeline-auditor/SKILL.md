---
name: devsecops-pipeline-auditor
description: "Pipeline de auditoria DevSecOps local para analise de patches de kernel, custos de infraestrutura (IaC/Terraform) e hardening de Kubernetes. Versao corporativa do aegisops-ai — sem dependencias de cloud, 100% on-premise."
risk: safe
source: aegisops-ai (community, autor Champbreed) — reescrita corporativa v2026-04-06
security_review: "APROVADA — Gemini Cloud API removida, substituida por LLM local (Ollama). HITL obrigatorio documentado em todas as fases de alto risco."
date_added: "2026-04-06"
tags:
  - devsecops
  - finops
  - kubernetes
  - terraform
  - kernel
  - cicd
  - local-llm
---

# DevSecOps Pipeline Auditor
# Versao Corporativa — Baseada em aegisops-ai (Champbreed)
# Modificacoes: Cloud API removida → LLM local (Ollama) | HITL obrigatorio em merges kernel

> **Auditoria sem exfiltracao de dados.** Toda analise de IA e feita on-premise via Ollama.
> Dados de infraestrutura, patches e manifests NUNCA saem do ambiente local.

## O Que Faz

Pipeline de auditoria inteligente para tres casos de alto risco:

1. **Kernel Patch Reviewer** — Analisa diffs Git em C para vulnerabilidades de memoria (UAF, Stale State)
2. **FinOps & IaC Auditor** — Analisa `terraform plan` para detectar escaladas de custo "silenciosas"
3. **K8s Policy Hardener** — Gera `securityContext` com Least Privilege a partir de linguagem natural

## Quando Usar

- **Antes de merges de kernel patches** — auditoria de seguranca de memoria em C
- **Antes de `terraform apply`** — prevenir bill shock por mudancas acidentais de instancias
- **Ao criar/revisar deployments K8s** — garantir Least Privilege e hardening por padrao
- **CI/CD Quality Gates** — bloquear merges nao-conformes automaticamente

## Quando NAO Usar

- Para vulnerabilidades web (XSS, SQLi) → use `@semgrep-rule-creator` ou scanners SAST
- Para linguagens de alto nivel (Python/JS) → o patch analyzer e otimizado para C
- Para aplicar mudancas (`terraform apply`, `kubectl apply`) → esta skill e AUDITORA, nao executora
- Como substituto de revisao humana em mudancas de producao

---

## REGRAS CORPORATIVAS OBRIGATORIAS

> **HITL (Human-in-the-Loop) e MANDATORIO nos seguintes pontos:**
>
> - `kernel patch` com `RISK: HIGH` → requer aprovacao de ao menos 2 engenheiros antes do merge
> - `terraform plan` com custo estimado > 20% de aumento → requer aprovacao do FinOps/gestor
> - `hardened_deployment.yaml` → sempre testar em staging antes de aplicar em producao
> - **Nenhuma acao de apply/merge e executada automaticamente por esta skill**

---

## Modulo 1 — Kernel Patch Reviewer

### O Que Detecta

| Vulnerabilidade | Descricao | Risco |
|----------------|-----------|-------|
| **Use-After-Free (UAF)** | Ponteiro usado apos `kfree()` | CRITICO |
| **Stale State** | Estado de objeto nao limpo antes de reutilizacao | ALTO |
| **NULL dereference** | Ponteiro nao verificado antes de uso | ALTO |
| **Integer overflow** | Calculo de tamanho sem verificacao de limite | MEDIO |
| **Race condition** | Acesso concorrente sem lock adequado | ALTO |

### Checklist de Revisao de Patch

```
KERNEL PATCH AUDIT CHECKLIST
==============================
Diff recebido: ____________
Modulo afetado: ____________

MEMORIA:
[ ] Verifica ponteiros NULL antes de uso?
[ ] Todo kzalloc/kmalloc tem kfree correspondente?
[ ] Ha uso de ponteiro apos kfree() (UAF)?
[ ] Campos de struct zerados antes de reutilizacao?

CONCORRENCIA:
[ ] Locks adquiridos na ordem correta (evitar deadlock)?
[ ] Variaveis compartilhadas protegidas por spinlock/mutex?
[ ] Paths de erro liberam locks corretamente?

VALIDACAO DE INPUT:
[ ] Tamanhos de buffer validados antes de copy_from_user()?
[ ] Valores inteiros verificados contra overflow?
[ ] Indices de array verificados contra bounds?

RESULTADO:
[ ] APROVADO — sem riscos identificados
[ ] APROVADO com ressalvas — (documentar)
[ ] REJEITADO — risco identificado: ____________

ASSINATURAS OBRIGATORIAS (HITL):
Revisor 1: ____________  Data: ____________
Revisor 2: ____________  Data: ____________
```

### Prompt para LLM Local (Ollama)

```python
import subprocess
import json

def analisar_patch_kernel(diff_conteudo: str, modelo: str = "llama3.1:8b") -> dict:
    """
    Analisa patch de kernel usando LLM local via Ollama.
    NENHUM dado e enviado para servicos externos.
    """
    prompt = f"""Voce e um especialista em seguranca de kernel Linux.
Analise o seguinte diff Git e identifique vulnerabilidades de memoria.

INSTRUCOES:
1. Identifique cada chunk do diff (linhas com + e -)
2. Para cada mudanca, avalie: UAF, Stale State, NULL deref, race condition
3. Classifique cada achado: CRITICO / ALTO / MEDIO / BAIXO / INFO
4. Explique o risco em linguagem tecnica

FORMATO DE SAIDA (JSON):
{{
  "resumo": "string",
  "risco_geral": "CRITICO|ALTO|MEDIO|BAIXO|SEGURO",
  "achados": [
    {{
      "linha": int,
      "tipo": "UAF|STALE_STATE|NULL_DEREF|RACE|OVERFLOW|OUTRO",
      "severidade": "CRITICO|ALTO|MEDIO|BAIXO",
      "descricao": "string",
      "recomendacao": "string"
    }}
  ],
  "recomendacao_geral": "APROVAR|REJEITAR|APROVAR_COM_RESSALVAS"
}}

DIFF PARA ANALISE:
{diff_conteudo[:8000]}  # Limitar a 8KB para evitar context overflow
"""

    # Chamada ao Ollama local — SEM exfiltracao de dados
    resultado = subprocess.run(
        ["ollama", "run", modelo, prompt],
        capture_output=True, text=True, timeout=120
    )

    try:
        # Extrair JSON da resposta
        resposta = resultado.stdout.strip()
        inicio = resposta.find("{")
        fim = resposta.rfind("}") + 1
        return json.loads(resposta[inicio:fim])
    except json.JSONDecodeError:
        return {"resumo": resultado.stdout, "risco_geral": "INDEFINIDO", "achados": []}


def pipeline_patch(arquivo_diff: str) -> None:
    """Pipeline completo de auditoria de patch — HITL obrigatorio no final."""
    with open(arquivo_diff, "r") as f:
        diff = f.read()

    print("Analisando patch localmente (sem envio externo)...")
    resultado = analisar_patch_kernel(diff)

    print(f"\nRisco Geral: {resultado.get('risco_geral')}")
    print(f"Resumo: {resultado.get('resumo')}")

    for achado in resultado.get("achados", []):
        print(f"\n[{achado['severidade']}] Linha {achado.get('linha')}: {achado['tipo']}")
        print(f"  {achado['descricao']}")
        print(f"  Recomendacao: {achado['recomendacao']}")

    rec = resultado.get("recomendacao_geral", "REJEITAR")
    print(f"\nRecomendacao da IA: {rec}")

    # HITL OBRIGATORIO — a IA nao decide sozinha
    if rec == "APROVAR":
        print("\nATENCAO: Aprovacao humana ainda obrigatoria.")
        print("Assinar o checklist de revisao antes de fazer merge.")
    else:
        print("\nPatch REJEITADO ou com ressalvas pela analise de IA.")
        print("Revisao humana obrigatoria antes de qualquer acao.")

    # Salvar resultado (local)
    with open("analise_patch_resultado.json", "w") as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)
    print("\nResultado salvo em: analise_patch_resultado.json")
```

---

## Modulo 2 — FinOps & IaC Auditor

### Padroes de Risco em Terraform Plan

| Padrao de Risco | Exemplo | Impacto Estimado |
|----------------|---------|-----------------|
| Upgrade de instancia nao planejado | `t3.micro` → `p3.8xlarge` | 50x aumento de custo |
| Multiplicacao de recursos | `count = 1` → `count = 50` | N x custo atual |
| Novo recurso de storage grande | S3 sem lifecycle, EBS sem limite | Custo crescente |
| Remocao de reserved instances | De Reserved para On-Demand | +3x custo/hora |
| Multi-region replication inesperada | Replicacao para regiao nova | 2x transferencia + storage |

### Checklist Pre-Apply IaC

```
TERRAFORM PLAN AUDIT CHECKLIST
================================
Plan gerado em: ____________
Ambiente alvo: [ ] DEV  [ ] STAGING  [ ] PRODUCAO

RECURSOS ADICIONADOS (+):
[ ] Todos os recursos novos sao esperados?
[ ] Tamanho/tipo de instancia aprovado pelo gestor?
[ ] Estimativa de custo mensal calculada?

RECURSOS MODIFICADOS (~):
[ ] Mudancas de tipo de instancia justificadas?
[ ] Aumentos de storage revisados?
[ ] Mudancas de rede/seguranca avaliadas?

RECURSOS DESTRUIDOS (-):
[ ] Destruicao intencional e documentada?
[ ] Backup realizado antes?
[ ] Dependencias verificadas?

CUSTO:
Custo atual estimado: R$ ____________/mes
Custo pos-apply estimado: R$ ____________/mes
Variacao: ____________ %

APROVACAO (HITL obrigatorio se variacao > 20%):
Aprovador: ____________  Data: ____________
```

### Prompt para Analise de Terraform Plan

```python
def analisar_terraform_plan(plan_output: str, modelo: str = "llama3.1:8b") -> dict:
    """
    Analisa terraform plan localmente.
    Identifica riscos de custo e seguranca sem enviar dados para cloud.
    """
    prompt = f"""Analise o seguinte output de 'terraform plan' como um especialista em FinOps e seguranca de cloud.

IDENTIFIQUE:
1. Recursos sendo ADICIONADOS (+): ha algum inesperadamente grande ou caro?
2. Recursos sendo MODIFICADOS (~): ha upgrades de instancia nao planejados?
3. Recursos sendo DESTRUIDOS (-): ha destruicao de dados criticos?
4. Riscos de seguranca: security groups abrindo portas publicas? IAM com permissoes excessivas?

FORMATO DE SAIDA (JSON):
{{
  "risco_custo": "ALTO|MEDIO|BAIXO",
  "risco_seguranca": "ALTO|MEDIO|BAIXO",
  "alertas": [
    {{
      "tipo": "CUSTO|SEGURANCA|DESTRUICAO|OUTRO",
      "severidade": "CRITICO|ALTO|MEDIO|BAIXO",
      "recurso": "string",
      "descricao": "string",
      "recomendacao": "string"
    }}
  ],
  "recomendacao": "APROVAR|REJEITAR|REVISAR",
  "justificativa": "string"
}}

TERRAFORM PLAN:
{plan_output[:10000]}
"""

    resultado = subprocess.run(
        ["ollama", "run", modelo, prompt],
        capture_output=True, text=True, timeout=180
    )

    try:
        resposta = resultado.stdout.strip()
        inicio = resposta.find("{")
        return json.loads(resposta[inicio:resposta.rfind("}")+1])
    except:
        return {"risco_custo": "INDEFINIDO", "alertas": [], "recomendacao": "REVISAR"}
```

---

## Modulo 3 — K8s Policy Hardener

### Checklist de Hardening K8s

```yaml
# TEMPLATE: securityContext Hardened (Least Privilege)
securityContext:
  runAsNonRoot: true          # OBRIGATORIO: nunca rodar como root
  runAsUser: 1000             # UID nao-privilegiado
  runAsGroup: 3000
  fsGroup: 2000
  readOnlyRootFilesystem: true  # OBRIGATORIO: FS somente leitura
  allowPrivilegeEscalation: false  # OBRIGATORIO: sem escalada
  capabilities:
    drop:
      - ALL               # Dropar TODAS as capabilities por padrao
    add:
      - NET_BIND_SERVICE  # Adicionar APENAS o necessario (exemplo)
  seccompProfile:
    type: RuntimeDefault    # Usar seccomp profile padrao
```

### Padroes Inseguros a Detectar

| Padrao Inseguro | Risco | Correcao |
|----------------|-------|---------|
| `runAsUser: 0` ou sem `runAsNonRoot` | Container roda como root → comprometimento total | Definir `runAsNonRoot: true` |
| `allowPrivilegeEscalation: true` | Container pode escalar para root | Sempre `false` |
| `readOnlyRootFilesystem: false` | Atacante pode modificar binarios | Sempre `true` + volumes para dirs mutaveis |
| `capabilities: add: [SYS_ADMIN]` | Capability quase equivalente a root | Remover; usar alternativa especifica |
| Sem `seccompProfile` | Sem filtragem de syscalls perigosas | Adicionar `RuntimeDefault` |
| `hostPID: true` ou `hostNetwork: true` | Acesso ao namespace do host | Remover; nunca em producao |

### Prompt para Geracao de Hardened Manifest

```python
def hardener_k8s(deployment_yaml: str, requisitos: str, modelo: str = "llama3.1:8b") -> str:
    """
    Gera versao hardened de um deployment K8s.
    Analise feita localmente — manifests nao saem do ambiente.
    """
    prompt = f"""Voce e um especialista em seguranca Kubernetes.

REQUISITOS DE SEGURANCA: {requisitos}

DEPLOYMENT ORIGINAL:
{deployment_yaml}

TAREFA:
1. Analise o deployment acima
2. Identifique todos os problemas de seguranca
3. Gere uma versao HARDENED com:
   - runAsNonRoot: true
   - readOnlyRootFilesystem: true (adicionar volumes para dirs mutaveis se necessario)
   - allowPrivilegeEscalation: false
   - capabilities drop ALL (adicionar apenas o necessario)
   - seccompProfile: RuntimeDefault
   - Remover hostPID, hostNetwork, hostIPC se presentes
4. Explique cada mudanca feita

FORMATO: YAML valido seguido de explicacao das mudancas."""

    resultado = subprocess.run(
        ["ollama", "run", modelo, prompt],
        capture_output=True, text=True, timeout=120
    )
    return resultado.stdout
```

---

## CI/CD Quality Gate — GitHub Actions (Exemplo Local)

```yaml
# .github/workflows/devsecops-audit.yml
name: DevSecOps Audit Gate

on:
  pull_request:
    paths:
      - '**.tf'           # Triggar em mudancas Terraform
      - 'k8s/**/*.yaml'   # Triggar em mudancas K8s

jobs:
  iac-audit:
    runs-on: self-hosted  # IMPORTANTE: runner self-hosted (on-premise)
    steps:
      - uses: actions/checkout@v4

      - name: Generate Terraform Plan
        run: terraform plan -out=plan.tfplan && terraform show -json plan.tfplan > plan.json

      - name: Run FinOps Audit (local LLM)
        run: python scripts/finops_audit.py --plan plan.json --threshold 20
        # Threshold: bloquear se custo aumentar > 20%

      - name: K8s Security Check
        run: |
          for manifest in $(find k8s/ -name "*.yaml"); do
            python scripts/k8s_hardener.py --check-only $manifest
          done

      # HITL: resultado e postado como comentario no PR para revisao humana
      - name: Post Audit Results
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('audit_results.json'));
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## DevSecOps Audit Results\n\n${results.summary}\n\n**Aprovacao humana obrigatoria antes do merge.**`
            });

      - name: Block on Critical Risk
        run: |
          if [ "$(cat audit_results.json | python -c 'import sys,json; print(json.load(sys.stdin)[\"risco_geral\"])')" = "CRITICO" ]; then
            echo "Merge bloqueado: risco critico detectado. Revisao humana obrigatoria."
            exit 1
          fi
```

---

## Melhores Praticas

| Pratica | Descricao |
|---------|-----------|
| **Contexto e rei** | Fornecer ao menos 5 linhas de contexto em torno de diffs para analise precisa |
| **Gate continuo** | Rodar o auditor FinOps antes de CADA mudanca de infraestrutura |
| **HITL em merges de kernel** | IA e sinal de alta fidelidade, mas humano decide sobre merges kernel |
| **Staging primeiro** | Sempre testar manifests hardened em staging antes de producao |
| **LLM local** | Usar `llama3.1:8b` para analises rapidas, `llama3.1:70b` para patches complexos |

---

## Dependencias (Todas On-Premise)

```bash
# LLM local (obrigatorio)
# Instalar Ollama: https://ollama.com
ollama pull llama3.1:8b

# Python
pip install pyyaml python-json-logger

# Ferramentas de infraestrutura (ja instaladas no runner)
# terraform, kubectl, git
```

## Quando Esta Skill Nao Basta

- Substituicao de code review humano para patches de kernel criticos
- Decisao final sobre merges de seguranca → requer sign-off humano
- Analise de vulnerabilidades de aplicacao web → use `@semgrep-rule-creator`
- Gestao de secrets e credenciais → use Vault ou similar
