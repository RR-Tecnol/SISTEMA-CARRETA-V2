---
name: langchain-architecture
description: "Master the LangChain framework for building sophisticated LLM applications with agents, chains, memory, and tool integration."
risk: safe
source: community (modificada para uso corporativo — v2026-04-06)
date_added: "2026-02-27"
security_review: "APROVADA COM MODIFICAÇÕES — SerpAPI removido, HITL obrigatório documentado, TTL de memória LGPD"
---

# LangChain Architecture
# ⚠️ VERSÃO CORPORATIVA MODIFICADA
# Modificações aplicadas em 2026-04-06 para conformidade com política de segurança fail-closed e LGPD:
# 1. Exemplos com SerpAPI (API externa) substituídos por busca local/intranet
# 2. Nota HITL obrigatória adicionada para ferramentas de ação externa
# 3. Nota LGPD adicionada: memória conversacional deve ter TTL e não persistir PII

Master the LangChain framework for building sophisticated LLM applications with agents, chains, memory, and tool integration.

## Do not use this skill when

- The task is unrelated to langchain architecture
- You need a different domain or tool outside this scope

## Instructions

- Clarify goals, constraints, and required inputs.
- Apply relevant best practices and validate outcomes.
- Provide actionable steps and verification.
- If detailed examples are required, open `resources/implementation-playbook.md`.

## ⚠️ REGRAS CORPORATIVAS OBRIGATÓRIAS

1. **Sem APIs externas:** Nunca usar `serpapi`, `openai`, `anthropic` ou qualquer API cloudexterna diretamente. Usar modelos locais via Ollama ou llama.cpp. Para busca, usar índice interno local.
2. **HITL em ferramentas de ação:** Qualquer tool que execute ações externas (e-mail, webhook, escrita em BD) DEVE ter aprovação humana explícita antes da execução.
3. **Memória LGPD-compliant:** `ConversationBufferMemory` não pode persistir PII entre sessões. Configurar TTL (máx. 24h) e limpar dados pessoais antes de encerrar sessão.

## Use this skill when

- Building autonomous AI agents with tool access (local tools only)
- Implementing complex multi-step LLM workflows
- Managing conversation memory and state (with LGPD TTL compliance)
- Integrating LLMs with internal data sources and local APIs
- Creating modular, reusable LLM application components
- Implementing document processing pipelines (on-premise)
- Building production-grade LLM applications

## Core Concepts

### 1. Agents
Autonomous systems that use LLMs to decide which actions to take.

**Agent Types:**
- **ReAct**: Reasoning + Acting in interleaved manner
- **OpenAI Functions**: Leverages function calling API
- **Structured Chat**: Handles multi-input tools
- **Conversational**: Optimized for chat interfaces
- **Self-Ask with Search**: Decomposes complex queries

### 2. Chains
Sequences of calls to LLMs or other utilities.

**Chain Types:**
- **LLMChain**: Basic prompt + LLM combination
- **SequentialChain**: Multiple chains in sequence
- **RouterChain**: Routes inputs to specialized chains
- **TransformChain**: Data transformations between steps
- **MapReduceChain**: Parallel processing with aggregation

### 3. Memory (LGPD-Compliant)
Systems for maintaining context across interactions.

**Memory Types:**
- **ConversationBufferMemory**: Stores all messages — ⚠️ configurar TTL máx 24h, não persistir PII
- **ConversationSummaryMemory**: Summarizes older messages — preferido por reduzir retenção de dados brutos
- **ConversationBufferWindowMemory**: Keeps last N messages — use N=5 para dados sensíveis
- **VectorStoreMemory**: Semantic similarity retrieval — garantir que o vector store seja local

### 4. Document Processing
Loading, transforming, and storing documents for retrieval.

**Components:**
- **Document Loaders**: Load from local sources (PDF, TXT, banco interno)
- **Text Splitters**: Chunk documents intelligently
- **Vector Stores**: Chroma local, Qdrant local, PgVector (on-premise)
- **Retrievers**: Fetch relevant documents
- **Indexes**: Organize documents for efficient access

### 5. Callbacks
Hooks for logging, monitoring, and debugging.

**Use Cases:**
- Request/response logging (sem PII — ver privacy-by-design)
- Token usage tracking
- Latency monitoring
- Error handling
- Custom metrics collection

## Quick Start (Versão Corporativa — Modelo Local)

```python
from langchain.agents import AgentType, initialize_agent
from langchain.memory import ConversationBufferWindowMemory

# ✅ CORRETO: Usar Ollama local em vez de OpenAI
from langchain_community.llms import Ollama
llm = Ollama(model="llama3.1:8b", base_url="http://localhost:11434")

# ✅ CORRETO: Memória com janela limitada (não acumula PII)
memory = ConversationBufferWindowMemory(k=5, memory_key="chat_history")

# ✅ CORRETO: Ferramentas locais com HITL explícito
from langchain.tools import tool

@tool
def buscar_processo_interno(numero_processo: str) -> str:
    """Busca informações de processo no banco de dados interno."""
    # Acessa APENAS banco local — sem chamada externa
    return buscar_no_bd_local(numero_processo)

@tool
def REQUER_APROVACAO_HUMANA_enviar_notificacao(destinatario: str, conteudo: str) -> str:
    """
    ⚠️ AÇÃO EXTERNA — REQUER APROVAÇÃO HUMANA antes de executar.
    Envia notificação. Jamais chamar sem confirmação explícita do operador.
    """
    confirmacao = input(f"CONFIRME: Enviar notificação para {destinatario}? (s/N): ")
    if confirmacao.lower() != 's':
        return "Envio cancelado pelo operador."
    return enviar_notificacao_interna(destinatario, conteudo)

tools = [buscar_processo_interno, REQUER_APROVACAO_HUMANA_enviar_notificacao]

agent = initialize_agent(
    tools, llm,
    agent=AgentType.CONVERSATIONAL_REACT_DESCRIPTION,
    memory=memory,
    verbose=True
)
```

## Architecture Patterns

### Pattern 1: RAG com Modelo Local (Corporativo)
```python
from langchain.chains import RetrievalQA
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.llms import Ollama

# ✅ Embeddings locais via Ollama
embeddings = OllamaEmbeddings(model="nomic-embed-text", base_url="http://localhost:11434")

# ✅ Vector store local
vectorstore = Chroma(
    persist_directory="./dados/chroma_db",  # Local on-premise
    embedding_function=embeddings
)

# ✅ LLM local
llm = Ollama(model="llama3.1:8b")

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    return_source_documents=True
)
```

### Pattern 2: LGPD-Compliant Memory
```python
from langchain.memory import ConversationSummaryMemory
from langchain_community.llms import Ollama

llm = Ollama(model="llama3.1:8b")

# ✅ Preferido: Summary memory reduz dados brutos armazenados
memory = ConversationSummaryMemory(
    llm=llm,
    max_token_limit=500,  # Limita acumulação
)

# ✅ Limpeza explícita ao encerrar sessão
def encerrar_sessao(memory):
    memory.clear()
    # Deletar arquivo de persistência se houver
```

## Memory Management Best Practices

```python
# Para conversas curtas com dados sensíveis — janela de 5 mensagens
from langchain.memory import ConversationBufferWindowMemory
memory = ConversationBufferWindowMemory(k=5)

# Para conversas longas — sumariza, não retém texto bruto
from langchain.memory import ConversationSummaryMemory
memory = ConversationSummaryMemory(llm=llm)

# ❌ EVITAR em dados sensíveis — acumula tudo sem limite
# from langchain.memory import ConversationBufferMemory
# memory = ConversationBufferMemory()  # Não use com PII
```

## Common Pitfalls

1. **❌ Usar APIs cloud (OpenAI, SerpAPI)** → ✅ Usar Ollama ou llama.cpp local
2. **❌ Memória sem TTL com PII** → ✅ `ConversationBufferWindowMemory(k=5)` ou Summary
3. **❌ Ferramentas de ação sem HITL** → ✅ Confirmação explícita antes de ações externas
4. **❌ Vector store em nuvem** → ✅ Chroma local ou Qdrant on-premise
5. **❌ Logs com PII** → ✅ Ver @privacy-by-design para logging seguro

## Production Checklist

- [ ] LLM rodando localmente (Ollama/llama.cpp/vLLM)
- [ ] Embeddings locais (nomic-embed-text ou similar)
- [ ] Vector store on-premise (Chroma/Qdrant/PgVector)
- [ ] Memory com TTL configurado
- [ ] HITL implementado em todas as ferramentas de ação externa
- [ ] Logs sem PII (ver @privacy-by-design)
- [ ] Sem chamadas a APIs de terceiros

## When to Use
Esta skill é aplicável para construção de aplicações LLM com LangChain em ambiente on-premise.
