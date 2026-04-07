---
name: agent-orchestration-patterns
description: "Padroes avancados de orquestracao de agentes multi-etapa: ciclo RARV (Reason-Act-Review-Validate), memoria hierarquica, decomposicao de tarefas e escalada humana. Versao corporativa e segura do loki-mode — autonomia zero, HITL em todos os pontos de decisao criticos."
risk: safe
source: loki-mode (community) — extraido e reescrito corporativamente v2026-04-06
security_review: "APROVADA — Instrucoes ZERO HITL completamente removidas. --dangerously-skip-permissions removido. Multi-agent sem supervisao removido. Extraidos APENAS: ciclo RARV, memoria hierarquica e decomposicao de tarefas — todos com HITL obrigatorio."
date_added: "2026-04-06"
tags:
  - agent-orchestration
  - rarv-cycle
  - hierarchical-memory
  - task-decomposition
  - hitl
  - multi-step
---

# Agent Orchestration Patterns
# Extraido do loki-mode — Apenas Padroes Arquiteturais Seguros

> **O QUE FOI REMOVIDO do loki-mode original:**
> - Instrucoes de ZERO human intervention
> - `--dangerously-skip-permissions`
> - "NEVER wait for confirmation", "NEVER stop voluntarily"
> - Orquestracao de 10+ agentes paralelos sem supervisao
> - Auto-aprovacao baseada em confianca auto-avaliada pelo LLM
>
> **O QUE FOI MANTIDO E ADAPATADO:**
> - Ciclo RARV (Reason-Act-Review-Validate) com HITL nos gates
> - Memoria hierarquica para contexto de longo prazo
> - Decomposicao de tarefas complexas em subtarefas
> - Criterios de escalada para humano (externos ao LLM, nao auto-avaliados)

## Quando Usar

- Construindo pipelines de agente multi-etapa para tarefas complexas
- Implementando memoria de longo prazo para agentes RAG
- Projetando decomposicao de tarefas com gates de qualidade
- Definindo criterios objetivos de escalada humana

## Quando NAO Usar

- Para agentes com execucao completamente autonoma
- Se o caso nao tolera latencia de aprovacao humana
- Substituto de revisao humana em decisoes de alto impacto

---

## 1. Ciclo RARV com Gates de Seguranca

### O Que e RARV

```
RARV = Reason → Act → Review → Validate

Reason:   LLM planeja a proxima acao
Act:      LLM seleciona ferramenta e parametros
Review:   Sistema verifica resultado contra criterios de qualidade
Validate: HITL gate — humano valida antes de continuar (quando aplicavel)
```

### Implementacao com HITL Gates

```python
from dataclasses import dataclass
from typing import Optional
from enum import Enum

class TaskStatus(Enum):
    IN_PROGRESS    = "in_progress"
    NEEDS_REVIEW   = "needs_review"    # Aguardando HITL
    COMPLETED      = "completed"
    FAILED         = "failed"
    ESCALATED      = "escalated"       # Escalado para humano

@dataclass
class StepResult:
    success: bool
    output: str
    confidence: float       # 0.0 a 1.0
    requires_hitl: bool
    escalation_reason: Optional[str] = None


class RARVAgent:
    """
    Agente com ciclo RARV — HITL em gates objetivos, nao auto-avaliados.
    """

    # Criterios de HITL sao definidos EXTERNAMENTE ao LLM
    # Nao sao baseados em confianca auto-reportada pelo modelo
    HITL_TRIGGERS = {
        "file_write":          True,   # Sempre HITL em escrita
        "run_command":         True,   # Sempre HITL em comandos
        "external_api":        True,   # Sempre HITL em APIs externas
        "data_deletion":       True,   # Sempre HITL em delecao
        "config_change":       True,   # Sempre HITL em configuracao
        "output_affects_users": True,  # Sempre HITL se afeta usuarios
        "read_file":           False,  # Nao precisa HITL para leitura
        "search_code":         False,  # Nao precisa HITL para busca
    }

    def __init__(self, llm, tools, approval_manager, quality_checker):
        self.llm = llm
        self.tools = tools
        self.approval_manager = approval_manager
        self.quality_checker = quality_checker
        self.memory = HierarchicalMemory()
        self.audit_log = []

    def run_rarv(self, task: str, max_steps: int = 10) -> dict:
        """Executa tarefa usando ciclo RARV com gates de seguranca."""

        self.memory.set_goal(task)
        print(f"\n[RARV] Iniciando tarefa: {task}")

        for step in range(max_steps):
            print(f"\n[RARV] Etapa {step + 1}/{max_steps}")

            # REASON: Planejar proxima acao
            plan = self._reason(task)
            print(f"  Planejamento: {plan.get('next_action')}")

            if plan.get("task_complete"):
                print("  Tarefa concluida segundo o agente.")
                break

            # ACT: Executar acao planejada
            tool_name = plan.get("tool")
            tool_args  = plan.get("args", {})

            # Verificar se HITL e necessario (criterio externo, nao do LLM)
            needs_hitl = self.HITL_TRIGGERS.get(tool_name, True)  # Conservador: duvida = HITL
            if needs_hitl:
                approved = self.approval_manager.request_approval(tool_name, tool_args)
                if not approved:
                    self._log(step, "RECUSADO", tool_name, tool_args, "")
                    print(f"  Acao recusada pelo operador. Agente reavaliar.")
                    continue

            result = self._act(tool_name, tool_args)
            self._log(step, "EXECUTADO", tool_name, tool_args, result)

            # REVIEW: Verificar qualidade do resultado
            review = self._review(result, plan.get("expected_outcome"))

            if not review.success:
                print(f"  Review falhou: {review.output}")
                if review.escalation_reason:
                    self._escalate_human(review.escalation_reason)
                    return {"status": TaskStatus.ESCALATED, "reason": review.escalation_reason}

            # VALIDATE: Gate de validacao (quando configurado)
            if self.quality_checker.requires_validation(tool_name, result):
                validated = self.quality_checker.validate(result, plan)
                if not validated:
                    print("  Validacao falhou. Solicitando revisao humana.")
                    self._escalate_human("Resultado nao passou na validacao automatica")
                    return {"status": TaskStatus.ESCALATED}

            # Atualizar memoria com resultado
            self.memory.update_working(step, plan, result)

        return {
            "status": TaskStatus.COMPLETED,
            "summary": self.memory.get_session_summary(),
            "audit_log": self.audit_log
        }

    def _escalate_human(self, reason: str) -> None:
        """Escalada para humano — agente PARA e aguarda instrucao."""
        print(f"\n[ESCALADA] Intervencao humana necessaria: {reason}")
        print("  O agente foi pausado. Aguardando instrucao do operador.")
        # Em producao: criar ticket, notificar via canal configurado
```

---

## 2. Memoria Hierarquica

### Por Que Memoria Hierarquica

```
Problema com buffer simples: tokens esgotam em tarefas longas.

Solucao hierarquica:
  Episodica (detalhes) → Semantica (padroes) → Procedural (como fazer)
  
  Working Memory  → 20 msgs mais recentes (contexto imediato)
  Episode Memory  → Resumos de conversas passadas (comprimido)
  Semantic Memory → Fatos e padroes aprendidos (persistente)
  Procedural      → Sequencias de acao que funcionaram (reutilizavel)
```

```python
import json
import os
from datetime import datetime

class HierarchicalMemory:
    """
    Memoria de tres camadas para agentes de longa duracao.
    Todos os dados salvos LOCALMENTE — sem exfiltracao.
    """

    def __init__(self, storage_dir: str = ".agent_memory"):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)

        # Camada 1: Working Memory — ultimas 20 interacoes (in-memory)
        self.working: list = []
        self.WORKING_MAX = 20

        # Camada 2: Episode Memory — resumos de sessoes (local disk)
        self.episodes_path = os.path.join(storage_dir, "episodes.jsonl")

        # Camada 3: Semantic Memory — fatos persistentes (local disk)
        self.semantic_path = os.path.join(storage_dir, "semantic.json")
        self.semantic: dict = self._load_semantic()

        self.current_goal: str = ""

    def set_goal(self, goal: str) -> None:
        self.current_goal = goal
        self.working = []  # Limpar working ao iniciar nova tarefa

    def update_working(self, step: int, plan: dict, result: str) -> None:
        """Atualizar memoria de trabalho — janela deslizante."""
        entry = {
            "step": step,
            "timestamp": datetime.now().isoformat(),
            "action": plan.get("next_action"),
            "tool": plan.get("tool"),
            "result_preview": result[:500]  # Nao armazenar resultado completo
        }
        self.working.append(entry)

        # Manter apenas as ultimas WORKING_MAX entradas
        if len(self.working) > self.WORKING_MAX:
            # Resumir o excedente antes de descartar
            overflow = self.working[:-self.WORKING_MAX]
            self._summarize_to_episode(overflow)
            self.working = self.working[-self.WORKING_MAX:]

    def _summarize_to_episode(self, entries: list) -> None:
        """Resumir entradas antigas como episodio."""
        episode = {
            "timestamp": datetime.now().isoformat(),
            "goal": self.current_goal,
            "steps_count": len(entries),
            "actions_taken": [e.get("action") for e in entries if e.get("action")],
            "tools_used": list(set(e.get("tool") for e in entries if e.get("tool")))
        }

        with open(self.episodes_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(episode, ensure_ascii=False) + "\n")

    def learn_fact(self, key: str, value: str, confidence: float = 1.0) -> None:
        """Adicionar fato a memoria semantica persistente."""
        self.semantic[key] = {
            "value": value,
            "confidence": confidence,
            "learned_at": datetime.now().isoformat()
        }
        self._save_semantic()

    def recall_fact(self, key: str) -> Optional[str]:
        """Recuperar fato da memoria semantica."""
        entry = self.semantic.get(key)
        return entry["value"] if entry else None

    def get_session_summary(self) -> str:
        """Gerar resumo da sessao atual."""
        return {
            "goal": self.current_goal,
            "total_steps": len(self.working),
            "actions": [e.get("action") for e in self.working],
        }

    def _load_semantic(self) -> dict:
        if os.path.exists(self.semantic_path):
            with open(self.semantic_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}

    def _save_semantic(self) -> None:
        with open(self.semantic_path, 'w', encoding='utf-8') as f:
            json.dump(self.semantic, f, indent=2, ensure_ascii=False)
```

---

## 3. Decomposicao de Tarefas

```python
class TaskDecomposer:
    """
    Decompoe tarefas complexas em subtarefas verificaveis.
    Cada subtarefa tem criterio de sucesso definido ANTES da execucao.
    """

    def decompose(self, llm, task: str) -> list[dict]:
        """
        Decompor tarefa em subtarefas com criterios de sucesso explicitos.
        O LLM propoe, o operador revisa (HITL) se mudancas sao necessarias.
        """
        prompt = f"""Decomponha a seguinte tarefa em subtarefas sequenciais.
Para cada subtarefa, defina:
1. O que fazer (acao especifica)
2. Ferramentas necessarias
3. Criterio VERIFICAVEL de sucesso (nao subjetivo)
4. O que fazer se falhar

Tarefa: {task}

FORMATO JSON:
[
  {{
    "id": 1,
    "acao": "descricao clara da acao",
    "ferramenta": "nome_da_ferramenta",
    "criterio_sucesso": "condicao verificavel objetivamente",
    "plano_fallback": "o que fazer se falhar",
    "requer_hitl": true/false
  }}
]"""

        response = llm.chat([{"role": "user", "content": prompt}])

        try:
            import re
            json_match = re.search(r'\[.*\]', response.content, re.DOTALL)
            return json.loads(json_match.group()) if json_match else []
        except:
            return []

    def validate_subtask(self, subtask: dict, result: str, llm) -> bool:
        """
        Validar se criterio de sucesso foi atingido.
        Validacao OBJETIVA — nao baseada em confianca do LLM.
        """
        criterio = subtask.get("criterio_sucesso", "")

        # Validacoes objetivas (sem LLM):
        if "arquivo existe" in criterio.lower():
            path = self._extract_path(criterio)
            return os.path.exists(path) if path else False

        if "retornou 0" in criterio.lower() or "exit code 0" in criterio.lower():
            return "returncode=0" in result or '"success": true' in result

        # Validacao via LLM como ultimo recurso (pode ser falivel)
        prompt = f"""O criterio de sucesso foi atingido?

Criterio: {criterio}
Resultado obtido: {result[:1000]}

Responda APENAS: SIM ou NAO"""

        response = llm.chat([{"role": "user", "content": prompt}])
        return "SIM" in response.content.upper()
```

---

## 4. Criterios de Escalada Humana (Externos ao LLM)

```python
class EscalationPolicy:
    """
    Define QUANDO escalar para humano.
    IMPORTANTE: Criterios sao definidos pelo time, nao auto-avaliados pelo LLM.
    """

    # Condicoes OBJETIVAS que disparam escalada (sem depender do LLM)
    ESCALATION_CONDITIONS = [
        # Por tipo de acao
        lambda action, result: "dados_sensíveis" in str(result).lower(),
        lambda action, result: "error" in str(result).lower() and "CRITICO" in str(result),
        lambda action, result: len(str(result)) == 0 and action != "read",

        # Por falhas consecutivas
        # Implementado no AgentLoop via contador
    ]

    def __init__(self, max_consecutive_failures: int = 2):
        self.max_consecutive_failures = max_consecutive_failures
        self._consecutive_failures = 0

    def should_escalate(self, action: str, result: str, success: bool) -> tuple[bool, str]:
        """Verificar se deve escalar — logica objetiva, nao auto-avaliada."""
        if not success:
            self._consecutive_failures += 1
        else:
            self._consecutive_failures = 0

        # Criterio 1: Muitas falhas consecutivas
        if self._consecutive_failures >= self.max_consecutive_failures:
            return True, f"{self._consecutive_failures} falhas consecutivas"

        # Criterio 2: Condicoes objetivas de escalada
        for condition in self.ESCALATION_CONDITIONS:
            try:
                if condition(action, result):
                    return True, "Condicao de escalada atingida"
            except:
                pass

        return False, ""
```

---

## 5. Template de Orquestracao Completo

```python
def criar_agente_orquestrado(
    workspace: str,
    allowed_tools: list,
    url_allowlist: list = None
) -> RARVAgent:
    """
    Factory para criar agente orquestrado com todos os controles de seguranca.
    """
    from langchain_community.llms import Ollama

    # LLM local
    llm = Ollama(model="llama3.1:8b", base_url="http://localhost:11434")

    # Sistema de permissoes
    from safe_agent_architecture import PERMISSION_CONFIG, ApprovalManager
    approval_manager = ApprovalManager(config=PERMISSION_CONFIG, modo_cli=True)

    # Sandbox para execucao de comandos
    from safe_agent_architecture import SandboxedExecution
    sandbox = SandboxedExecution(workspace)

    # Ferramentas aprovadas
    tools = [t for t in allowed_tools if t.name in PERMISSION_CONFIG]

    # Quality checker
    quality_checker = QualityChecker(
        escalation_policy=EscalationPolicy(max_consecutive_failures=2)
    )

    agent = RARVAgent(
        llm=llm,
        tools=tools,
        approval_manager=approval_manager,
        quality_checker=quality_checker
    )

    return agent


# USO:
# agent = criar_agente_orquestrado(
#     workspace="./meu_projeto",
#     allowed_tools=[read_file_tool, search_code_tool, edit_file_tool]
# )
# resultado = agent.run_rarv("Analisar e documentar os endpoints de API")
```

---

## Diferenca Entre Esta Skill e o loki-mode Original

| Aspecto | loki-mode (REJEITADO) | agent-orchestration-patterns (SEGURO) |
|---------|----------------------|--------------------------------------|
| Autonomia | ZERO human intervention | HITL em todos os pontos criticos |
| Permissoes | `--dangerously-skip-permissions` | Sistema por nivel (AUTO/ASK/NEVER) |
| Falhas | Retry indefinido automatico | Escalada humana apos N falhas |
| Agents paralelos | 10+ sem supervisao | 1 agente principal + HITL gates |
| Confianca | Auto-avaliada pelo LLM | Criterios externos objetivos |
| Logs | Opcional | Audit log imutavel obrigatorio |

## Integra com

- `@safe-agent-architecture` — Sistema de permissoes e sandbox
- `@local-llm-expert` — LLM local para alimentar o agente
- `@rag-engineer` — Memoria semantica baseada em retrieval
- `@privacy-by-design` — Garantir que memoria nao reteve PII
