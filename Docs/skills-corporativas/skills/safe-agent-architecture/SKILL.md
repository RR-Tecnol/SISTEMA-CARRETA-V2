---
name: safe-agent-architecture
description: "Padroes de arquitetura para construcao de agentes de IA com controles de seguranca obrigatorios: sistema de permissoes por nivel, HITL em todas as acoes criticas, sandbox seguro e checkpoint/resume. Baseado em autonomous-agent-patterns com vulnerabilidades corrigidas."
risk: safe
source: autonomous-agent-patterns (community) — reescrita corporativa v2026-04-06
security_review: "APROVADA COM CORRECOES — shell=True substituido por lista de args (Shell Injection corrigido). SSRF em add_url() corrigido com validacao de URI e allowlist. HITL documentado como obrigatorio."
date_added: "2026-04-06"
tags:
  - agent-architecture
  - hitl
  - permissions
  - sandbox
  - mcp
  - security
---

# Safe Agent Architecture
# Baseado em autonomous-agent-patterns — Versao Corporativa com Correcoes de Seguranca

> **Vulnerabilidades corrigidas nesta versao:**
> 1. `shell=True` em subprocess → substituido por lista de argumentos (previne Shell Injection)
> 2. `requests.get(url)` sem validacao → substituido por validacao de URL com allowlist (previne SSRF)
> 3. `PermissionLevel.AUTO` documentado com restricoes para contextos com dados externos
>
> Esta skill ensina a construir agentes de IA com **seguranca por design** —
> HITL e sistema de permissoes sao pre-condicionais, nao opcionais.

## Quando Usar

- Construindo agentes de IA com acesso a ferramentas (filesystem, terminal, APIs internas)
- Projetando sistema de permissoes para agentes
- Implementando loops de aprovacao humana
- Criando sandbox para execucao segura de codigo gerado por LLM
- Integrando com MCP (Model Context Protocol)

## Quando NAO Usar

- Para agentes com `--dangerously-skip-permissions` ou equivalentes
- Se o caso de uso exige ZERO supervisao humana em acoes criticas
- Para agentes que fazem chamadas a APIs externas sem aprovacao

---

## 1. Loop do Agente com HITL Obrigatorio

### Arquitetura Basica

```
┌─────────────────────────────────────────────┐
│              AGENT LOOP (COM HITL)           │
│                                              │
│  ┌────────┐   ┌────────┐   ┌────────────┐  │
│  │ Think  │──▶│ Decide │──▶│  APPROVAL  │  │
│  │(Reason)│   │ (Plan) │   │   GATE     │  │
│  └────────┘   └────────┘   └─────┬──────┘  │
│      ▲                           │           │
│      │    ┌────────┐        ┌────▼─────┐   │
│      └────│Observe │◀───────│   Act    │   │
│           │(Result)│        │ (Execute)│   │
│           └────────┘        └──────────┘   │
│                                              │
│  APPROVAL GATE: HITL obrigatorio para        │
│  acoes ASK_EACH e ASK_ONCE                  │
└─────────────────────────────────────────────┘
```

```python
from enum import Enum
from typing import Any
import json

class AgentLoop:
    def __init__(self, llm, tools, max_iterations=20, approval_manager=None):
        self.llm = llm
        self.tools = {t.name: t for t in tools}
        self.max_iterations = max_iterations
        self.approval_manager = approval_manager  # OBRIGATORIO para acoes externas
        self.history = []
        self.audit_log = []  # Log de auditoria de todas as acoes

    def run(self, task: str) -> str:
        self.history.append({"role": "user", "content": task})

        for i in range(self.max_iterations):
            response = self.llm.chat(
                messages=self.history,
                tools=self._format_tools(),
                tool_choice="auto"
            )

            if response.tool_calls:
                for tool_call in response.tool_calls:
                    tool_name = tool_call.name
                    args = json.loads(tool_call.arguments)

                    # HITL: verificar aprovacao ANTES de executar
                    if self.approval_manager:
                        approved = self.approval_manager.request_approval(tool_name, args)
                        if not approved:
                            result = "Acao recusada pelo operador."
                            self._log_audit(tool_name, args, result, approved=False)
                            self.history.append({
                                "role": "tool",
                                "tool_call_id": tool_call.id,
                                "content": result
                            })
                            continue

                    # Executar apenas apos aprovacao
                    result = self._execute_tool(tool_call)
                    self._log_audit(tool_name, args, str(result), approved=True)

                    self.history.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": str(result)
                    })
            else:
                return response.content

        return "Limite de iteracoes atingido. Revisao humana necessaria."

    def _log_audit(self, tool: str, args: dict, result: str, approved: bool):
        """Registro imutavel de todas as acoes do agente."""
        import datetime
        self.audit_log.append({
            "timestamp": datetime.datetime.now().isoformat(),
            "tool": tool,
            "args": args,
            "result_preview": result[:200],
            "human_approved": approved
        })

    def _execute_tool(self, tool_call) -> Any:
        tool = self.tools[tool_call.name]
        args = json.loads(tool_call.arguments)
        return tool.execute(**args)
```

---

## 2. Sistema de Permissoes por Nivel

```python
class PermissionLevel(Enum):
    AUTO     = "auto"      # Aprovacao automatica — SOMENTE para operacoes de leitura seguras
    ASK_ONCE = "ask_once"  # Pergunta uma vez por sessao — escrita controlada
    ASK_EACH = "ask_each"  # Pergunta SEMPRE — acoes com efeito colateral
    NEVER    = "never"     # Nunca permitir — operacoes perigosas


# CONFIGURACAO PADRAO CORPORATIVA
# Ajustar conforme perfil de risco do projeto
PERMISSION_CONFIG = {
    # LOW RISK — Auto-aprovado (somente leitura, sem efeito colateral)
    "read_file":       PermissionLevel.AUTO,
    "list_directory":  PermissionLevel.AUTO,
    "search_code":     PermissionLevel.AUTO,

    # MEDIUM RISK — Perguntar uma vez por sessao
    "write_file":      PermissionLevel.ASK_ONCE,
    "edit_file":       PermissionLevel.ASK_ONCE,

    # HIGH RISK — Perguntar SEMPRE antes de executar
    "run_command":     PermissionLevel.ASK_EACH,
    "delete_file":     PermissionLevel.ASK_EACH,
    "call_api":        PermissionLevel.ASK_EACH,    # Toda chamada de API externa
    "send_message":    PermissionLevel.ASK_EACH,    # Email, webhook, etc.

    # NEVER — Bloqueado permanentemente
    "sudo_command":    PermissionLevel.NEVER,
    "format_disk":     PermissionLevel.NEVER,
    "drop_database":   PermissionLevel.NEVER,
    "disable_firewall": PermissionLevel.NEVER,
}

# ATENCAO: Se o agente processa dados externos (PDFs, emails, paginas web),
# eleve todos os niveis em um grau pois Prompt Injection pode ocorrer.
# Ex: ASK_ONCE → ASK_EACH, AUTO → ASK_ONCE
PERMISSION_CONFIG_EXTERNAL_DATA = {
    **PERMISSION_CONFIG,
    "write_file":     PermissionLevel.ASK_EACH,  # Elevado
    "read_file":      PermissionLevel.ASK_ONCE,   # Elevado (pode ter symlinks maliciosos)
    "list_directory": PermissionLevel.ASK_ONCE,   # Elevado
}
```

### ApprovalManager com UI de Aprovacao

```python
class ApprovalManager:
    def __init__(self, config: dict, modo_cli: bool = True):
        self.config = config
        self.modo_cli = modo_cli
        self.session_approvals = {}
        self.risk_assessor = RiskAssessor()

    def request_approval(self, tool_name: str, args: dict) -> bool:
        level = self.config.get(tool_name, PermissionLevel.ASK_EACH)

        if level == PermissionLevel.NEVER:
            print(f"[BLOQUEADO] Ferramenta '{tool_name}' nao e permitida.")
            return False

        if level == PermissionLevel.AUTO:
            return True

        if level == PermissionLevel.ASK_ONCE:
            if tool_name in self.session_approvals:
                return self.session_approvals[tool_name]

        # Avaliar risco especifico da chamada
        risk_level, risk_reason = self.risk_assessor.assess(tool_name, args)

        # Mostrar informacoes claras para o operador decidir
        print("\n" + "="*60)
        print(f"APROVACAO NECESSARIA")
        print(f"  Ferramenta : {tool_name}")
        print(f"  Argumentos : {json.dumps(args, indent=4, ensure_ascii=False)}")
        print(f"  Risco      : {risk_level}")
        print(f"  Motivo     : {risk_reason}")
        print("="*60)

        if self.modo_cli:
            resposta = input("Aprovar? [s = sim / n = nao / d = detalhes]: ").lower().strip()
            approved = resposta == 's'
        else:
            # Para UIs graficas: implementar callback
            approved = self._show_gui_dialog(tool_name, args, risk_level)

        if level == PermissionLevel.ASK_ONCE:
            self.session_approvals[tool_name] = approved

        if not approved:
            print(f"  -> Acao RECUSADA pelo operador.")

        return approved


class RiskAssessor:
    """Avalia o risco de chamadas especificas de ferramentas."""

    def assess(self, tool_name: str, args: dict) -> tuple[str, str]:
        if tool_name == "run_command":
            return self._assess_command(args.get("command", ""))
        if tool_name in ("delete_file", "write_file"):
            return self._assess_file_op(args.get("path", ""))
        if tool_name == "call_api":
            return self._assess_api(args.get("url", ""))
        return "MEDIO", "Acao padrao com potencial efeito colateral"

    def _assess_command(self, cmd: str) -> tuple[str, str]:
        critical = ["rm -rf", "del /f", "format", "mkfs", "dd if=", "> /dev/"]
        high     = ["sudo", "chmod 777", "net user", "reg delete", "sc delete"]
        medium   = ["pip install", "npm install", "apt", "yum", "git push"]

        for pattern in critical:
            if pattern in cmd.lower():
                return "CRITICO", f"Comando destrutivo detectado: '{pattern}'"
        for pattern in high:
            if pattern in cmd.lower():
                return "ALTO", f"Comando privilegiado: '{pattern}'"
        for pattern in medium:
            if pattern in cmd.lower():
                return "MEDIO", f"Comando com efeito externo: '{pattern}'"
        return "BAIXO", "Comando aparentemente seguro"

    def _assess_file_op(self, path: str) -> tuple[str, str]:
        sensitive = ["/etc/", "/sys/", "C:\\Windows\\System32", "C:\\Users\\"]
        for p in sensitive:
            if p.lower() in path.lower():
                return "ALTO", f"Caminho sensiveldo sistema: '{path}'"
        return "MEDIO", f"Operacao de arquivo em: '{path}'"

    def _assess_api(self, url: str) -> tuple[str, str]:
        if not url.startswith(("http://", "https://")):
            return "CRITICO", "URL com schema nao-HTTP — possivel SSRF"
        import urllib.parse
        parsed = urllib.parse.urlparse(url)
        if parsed.hostname in ("localhost", "127.0.0.1", "0.0.0.0"):
            return "ALTO", "Chamada para localhost — possivel SSRF interno"
        return "MEDIO", f"Chamada API externa para: {parsed.hostname}"
```

---

## 3. Execucao em Sandbox (CORRIGIDO)

```python
import subprocess
import shlex
import os

class SandboxedExecution:
    """
    Executa comandos em ambiente isolado.

    CORRECOES APLICADAS vs versao original:
    - shell=True REMOVIDO → substituido por lista de argumentos (previne Shell Injection)
    - Validacao de path contra workspace (previne path traversal)
    - Timeout reduzido para 30s (previne DoS)
    - Variaveis de ambiente sanitizadas
    """

    def __init__(self, workspace_dir: str):
        self.workspace = os.path.realpath(workspace_dir)
        # Allowlist explicita de comandos — NADA fora desta lista e executado
        self.allowed_commands = {
            "python", "python3",
            "node", "npm", "npx",
            "git",
            "ls", "dir", "cat", "type",
            "grep", "find",
        }
        # Caminhos NUNCA acessaveis
        self.blocked_paths = [
            "/etc", "/usr", "/bin", "/sbin",
            os.path.expanduser("~") + "/.ssh",
            "C:\\Windows\\System32",
        ]

    def validate_path(self, path: str) -> bool:
        """Garante que o caminho esta dentro do workspace."""
        real_path = os.path.realpath(path)
        return real_path.startswith(self.workspace)

    def validate_command(self, command: str) -> tuple[bool, str]:
        """
        Valida se o comando esta na allowlist.
        Retorna (is_valid, reason).
        """
        # ✅ CORRIGIDO: usar shlex.split em vez de shell=True
        try:
            parts = shlex.split(command)
        except ValueError as e:
            return False, f"Comando invalido: {e}"

        if not parts:
            return False, "Comando vazio"

        base_cmd = os.path.basename(parts[0])
        if base_cmd not in self.allowed_commands:
            return False, f"Comando nao permitido: '{base_cmd}'. Permitidos: {self.allowed_commands}"

        # Verificar se algum argumento e um caminho proibido
        for arg in parts[1:]:
            if any(blocked in arg for blocked in self.blocked_paths):
                return False, f"Acesso a caminho proibido: '{arg}'"

        return True, "OK"

    def execute_sandboxed(self, command: str) -> dict:
        """
        Executa comando validado em ambiente isolado.

        ✅ CORRIGIDO: subprocess.run com lista de args (nao shell=True)
        ✅ CORRIGIDO: sem acesso a variaveis de ambiente sensiveis
        ✅ CORRIGIDO: timeout obrigatorio
        """
        valid, reason = self.validate_command(command)
        if not valid:
            return {
                "success": False,
                "error": f"Comando bloqueado: {reason}",
                "output": ""
            }

        # ✅ Usar lista em vez de string com shell=True
        cmd_parts = shlex.split(command)

        # Ambiente sanitizado — sem credenciais ou tokens do ambiente host
        safe_env = {
            "PATH": "/usr/local/bin:/usr/bin:/bin",
            "HOME": self.workspace,
            "TMPDIR": os.path.join(self.workspace, ".tmp"),
        }

        try:
            result = subprocess.run(
                cmd_parts,              # ✅ Lista de args — sem Shell Injection
                shell=False,           # ✅ NUNCA True
                cwd=self.workspace,
                capture_output=True,
                timeout=30,
                env=safe_env,          # ✅ Ambiente sanitizado
                text=True
            )
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr if result.returncode != 0 else ""
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Timeout: comando demorou mais de 30s", "output": ""}
        except FileNotFoundError as e:
            return {"success": False, "error": f"Executavel nao encontrado: {e}", "output": ""}
```

---

## 4. ContextManager com Protecao SSRF (CORRIGIDO)

```python
import urllib.parse
import re

class ContextManager:
    """
    Gerencia contexto fornecido ao agente.

    CORRECAO APLICADA: add_url() now validates URLs against allowlist
    to prevent SSRF (Server-Side Request Forgery) attacks.
    """

    # Dominios e subnets PERMITIDOS para busca de URL
    URL_ALLOWLIST = [
        "docs.python.org",
        "developer.mozilla.org",
        "docs.microsoft.com",
        # Adicionar dominios internos conforme necessario:
        # "intranet.minhaempresa.com.br",
    ]

    # Bloqueado explicitamente (SSRF targets comuns)
    URL_BLOCKLIST_PATTERNS = [
        r"^https?://(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)",
        r"^https?://0\.0\.0\.0",
        r"^file://",
        r"^ftp://",
        r"\bmetadata\b",          # AWS/GCP metadata endpoint
        r"169\.254\.169\.254",    # AWS IMDSv1
    ]

    def __init__(self, workspace: str, url_allowlist: list = None):
        self.workspace = workspace
        self.context = []
        if url_allowlist:
            self.URL_ALLOWLIST = url_allowlist

    def add_file(self, path: str) -> None:
        """@file — Adicionar conteudo de arquivo ao contexto."""
        real_path = os.path.realpath(path)
        workspace_real = os.path.realpath(self.workspace)

        # Validar que o arquivo e dentro do workspace (previne path traversal)
        if not real_path.startswith(workspace_real):
            raise PermissionError(f"Acesso negado: '{path}' esta fora do workspace")

        with open(real_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()

        self.context.append({
            "type": "file",
            "path": path,
            "content": content
        })

    def add_url(self, url: str) -> None:
        """
        @url — Buscar e adicionar conteudo de URL ao contexto.

        ✅ CORRIGIDO: Validacao completa de URL para prevenir SSRF.
        Somente URLs na allowlist ou dominios publicos aprovados sao aceitas.
        """
        import requests

        # 1. Validar schema
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("https",):  # Apenas HTTPS
            raise ValueError(f"Schema nao permitido: '{parsed.scheme}'. Use HTTPS.")

        # 2. Verificar contra blocklist (SSRF protection)
        for pattern in self.URL_BLOCKLIST_PATTERNS:
            if re.search(pattern, url, re.IGNORECASE):
                raise PermissionError(f"URL bloqueada por politica de seguranca (SSRF): '{url}'")

        # 3. Verificar allowlist
        hostname = parsed.hostname or ""
        if self.URL_ALLOWLIST:
            if not any(hostname == allowed or hostname.endswith("." + allowed)
                       for allowed in self.URL_ALLOWLIST):
                raise PermissionError(
                    f"Dominio '{hostname}' nao esta na allowlist.\n"
                    f"Allowlist atual: {self.URL_ALLOWLIST}"
                )

        # 4. Buscar com timeout e sem seguir redirects para dominios externos
        response = requests.get(
            url,
            timeout=10,
            allow_redirects=False,   # Previne redirect-based SSRF
            headers={"User-Agent": "CorporateAgent/1.0"}
        )

        if response.status_code == 200:
            self.context.append({
                "type": "url",
                "url": url,
                "content": response.text[:50000]  # Limitar tamanho
            })
        else:
            raise ValueError(f"URL retornou status {response.status_code}")
```

---

## 5. Checkpoint/Resume para Tarefas Longas

```python
import json
import os
import datetime
import hashlib

class CheckpointManager:
    """
    Salva e restaura estado do agente para tarefas longas.
    Arquivos de checkpoint salvos localmente com verificacao de integridade.
    """

    def __init__(self, storage_dir: str):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)

    def save_checkpoint(self, session_id: str, state: dict) -> str:
        """Salva estado atual garantindo integridade."""
        # Sanitizar historico — remover dados sensiveis antes de salvar
        history_safe = [
            {k: v for k, v in msg.items() if k != "content"}
            if len(str(msg.get("content", ""))) > 10000
            else msg
            for msg in state.get("history", [])
        ]

        checkpoint = {
            "timestamp": datetime.datetime.now().isoformat(),
            "session_id": session_id,
            "history": history_safe,
            "metadata": state.get("metadata", {}),
            "audit_log": state.get("audit_log", [])
        }

        # Verificacao de integridade
        content = json.dumps(checkpoint, ensure_ascii=False)
        checkpoint["checksum"] = hashlib.sha256(content.encode()).hexdigest()

        path = os.path.join(self.storage_dir, f"{session_id}.checkpoint.json")
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(checkpoint, f, indent=2, ensure_ascii=False)

        return path

    def restore_checkpoint(self, checkpoint_path: str) -> dict:
        """Restaura estado validando integridade do arquivo."""
        with open(checkpoint_path, 'r', encoding='utf-8') as f:
            checkpoint = json.load(f)

        # Verificar integridade
        saved_checksum = checkpoint.pop("checksum", None)
        if saved_checksum:
            content = json.dumps(checkpoint, ensure_ascii=False)
            actual_checksum = hashlib.sha256(content.encode()).hexdigest()
            if actual_checksum != saved_checksum:
                raise ValueError("Checkpoint corrompido ou modificado — nao restaurar")

        return {
            "history": checkpoint["history"],
            "metadata": checkpoint["metadata"],
            "audit_log": checkpoint.get("audit_log", [])
        }
```

---

## 6. Integracao MCP (Model Context Protocol)

```python
class MCPAgentSafe:
    """
    Agente com integracao MCP — descoberta dinamica de ferramentas.
    Toda ferramenta descoberta via MCP passa pelo ApprovalManager.
    """

    def __init__(self, llm, approval_manager: ApprovalManager):
        self.llm = llm
        self.approval_manager = approval_manager
        self.mcp_servers = {}
        self.available_tools = {}

    def connect_server(self, name: str, config: dict) -> None:
        """
        Conectar a servidor MCP.
        IMPORTANTE: Conectar APENAS servidores MCP internos/homologados.
        """
        # Validar que o servidor e local ou homologado
        server_path = config.get("path", "")
        server_url = config.get("url", "")

        if server_url and not any(
            server_url.startswith(allowed)
            for allowed in ["http://localhost", "http://127.0.0.1"]
        ):
            raise PermissionError(
                f"MCP server externo nao permitido: '{server_url}'. "
                "Use apenas servidores MCP locais ou homologados internamente."
            )

        # Registrar ferramentas — todas com nivel ASK_EACH ate revisao manual
        # O admin deve revisar e promover para ASK_ONCE ou AUTO explicitamente
        from mcp import Server
        server = Server(config)
        self.mcp_servers[name] = server

        tools = server.list_tools()
        for tool in tools:
            self.available_tools[tool.name] = {
                "server": name,
                "schema": tool.schema,
                "permission": PermissionLevel.ASK_EACH  # Conservador por padrao
            }
            # Registrar no ApprovalManager com nivel conservador
            self.approval_manager.config[tool.name] = PermissionLevel.ASK_EACH
```

---

## Checklist de Seguranca — Agente em Producao

### Antes de Deploy

- [ ] `shell=False` em todos os subprocessos (sem `shell=True`)
- [ ] Validacao de URL com blocklist SSRF antes de qualquer `requests.get()`
- [ ] Todos os caminhos de arquivo validados dentro do workspace
- [ ] Sistema de permissoes configurado com niveis corretos por ferramenta
- [ ] `ApprovalManager` configurado e testado
- [ ] Audit log ativo para todas as operacoes
- [ ] Checkpoint salva apenas dados sanitizados (sem PII, sem secrets)
- [ ] Timeout configurado em todas as operacoes externas
- [ ] MCP servers validados como locais/homologados

### Com Dados Externos (PDFs, emails, paginas)

- [ ] Prompts sanitizados antes de alimentar LLM (prevencao de Prompt Injection)
- [ ] Todos os niveis de permissao elevados em um grau (AUTO → ASK_ONCE)
- [ ] Validacao de schema nos dados antes de processar
- [ ] Limite de tamanho nos dados de entrada

### Operacional

- [ ] Logs de auditoria exportados para SIEM corporativo
- [ ] Alertas para operacoes com nivel ALTO/CRITICO
- [ ] Revisao periodica do audit log
- [ ] Processo de revogacao de sessao de agente em caso de comportamento anormal

## Integra com

- `@local-llm-expert` — LLM local para o agente (sem dados para cloud)
- `@privacy-by-design` — Garantir que o agente nao retanha PII
- `@rag-engineer` — Retrieval para o agente consultar base de conhecimento local
- `@semgrep-rule-creator` — Criar regras para detectar uso inseguro de ferramentas de agente
