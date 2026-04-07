# 🧰 SKILLS — Guia de Uso das Skills Corporativas
## Sistema Gestão Sobre Rodas — RR Tecnologia

> **Para o Gravity (IA):** Este documento é o seu manual de operações para usar as Skills Corporativas neste projeto. Leia-o integralmente antes de qualquer revisão. Ele define o quê fazer, quando fazer, em que ordem, e principalmente o que **nunca tocar**.
>
> **Para o desenvolvedor:** Quando quiser ativar uma skill, use o comando correspondente descrito em cada seção. O Gravity lerá este documento e saberá exatamente como aplicar.

---

## 📚 ÍNDICE

1. [O que são as Skills Corporativas](#1-o-que-são-as-skills-corporativas)
2. [Onde ficam os arquivos](#2-onde-ficam-os-arquivos)
3. [Como ativar uma skill](#3-como-ativar-uma-skill)
4. [Regras absolutas — o que nunca tocar](#4-regras-absolutas--o-que-nunca-tocar)
5. [Skills aplicáveis a este projeto](#5-skills-aplicáveis-a-este-projeto)
6. [Protocolo de revisão pós-fases](#6-protocolo-de-revisão-pós-fases)
7. [Ordem de execução da revisão completa](#7-ordem-de-execução-da-revisão-completa)
8. [Referência rápida de comandos](#8-referência-rápida-de-comandos)

---

## 1. O que são as Skills Corporativas

As Skills Corporativas são um pacote de **62 módulos de expertise especializados**, selecionados e auditados pela equipe de segurança da RR Tecnologia a partir de um repositório de 1.356 skills. Cada skill é um arquivo `SKILL.md` contendo:

- Filosofia e abordagem do especialista
- Padrões de código recomendados
- Anti-padrões a evitar
- Checklists de qualidade
- Exemplos práticos

**Critérios de curadoria aplicados:**
- ✅ Fail-Closed — a skill nunca toma ação destrutiva por padrão
- ✅ LGPD/GDPR — nenhuma skill envia dados para fora do ambiente
- ✅ HITL (Human-in-the-Loop) — ações irreversíveis sempre pedem confirmação
- ✅ Anti-exfiltração — proibido enviar dados para APIs externas não homologadas
- ❌ Excluídas: skills ofensivas, autônomas sem supervisão, integradas a SaaS externos

---

## 2. Onde ficam os arquivos

```
sistema-carretas-atualizado/
└── Docs/
    └── skills-corporativas/
        ├── README.md          ← Visão geral e política de uso
        ├── MANIFEST.md        ← Auditoria completa das 62 skills
        ├── COMO_INSTALAR.md   ← Como instalar em outros projetos
        ├── install.ps1        ← Script de instalação PowerShell
        └── skills/            ← Os módulos em si
            ├── privacy-by-design/SKILL.md
            ├── gdpr-data-handling/SKILL.md
            ├── security-audit/SKILL.md
            ├── auth-implementation-patterns/SKILL.md
            ├── postgresql-optimization/SKILL.md
            ├── bullmq-specialist/SKILL.md
            ├── pdf-official/SKILL.md
            ├── docx-official/SKILL.md
            ├── xlsx-official/SKILL.md
            ├── clean-code/SKILL.md
            ├── react-best-practices/SKILL.md
            ├── openapi-spec-generation/SKILL.md
            ├── error-handling-patterns/SKILL.md
            ├── docker-expert/SKILL.md
            ├── observability-engineer/SKILL.md
            ├── typescript-pro/SKILL.md
            └── architecture-decision-records/SKILL.md
```

**Para ler uma skill antes de aplicar:**
```
Leia: Docs/skills-corporativas/skills/[nome-da-skill]/SKILL.md
```

---

## 3. Como ativar uma skill

### Sintaxe de ativação (para o desenvolvedor usar no chat)

```
"Ativa a skill [nome-da-skill] e [o que você quer fazer]"
```

**Exemplos reais:**
```
"Ativa a skill privacy-by-design e revisa os logs do backend para garantir que não tem PII vazando"

"Ativa a skill postgresql-optimization e analisa as queries da rota de ações com múltiplos includes"

"Ativa a skill security-audit e faz um pentest das rotas de autenticação"

"Ativa a skill clean-code e me ajuda a quebrar o Estoque.tsx em componentes menores"

"Ativa a skill bullmq-specialist e projeta a arquitetura da fila de atendimento da Fase 4"
```

### O que o Gravity faz ao receber um comando de skill

1. Lê o `SKILL.md` correspondente em `Docs/skills-corporativas/skills/[nome]/`
2. Lê o contexto atual do projeto via MCP (arquivos relevantes)
3. Aplica a expertise da skill ao problema específico do projeto
4. **Nunca** age de forma destrutiva sem confirmar com o desenvolvedor primeiro
5. Documenta as mudanças no `Docs/Diario-de-bordo.md`

---

## 4. Regras absolutas — o que nunca tocar

> ⚠️ **GRAVITY: Estas regras têm prioridade sobre qualquer skill. Leia antes de qualquer ação.**

### 4.1 Arquivos protegidos — NUNCA modificar sem aprovação explícita

| Arquivo | Motivo |
|---------|--------|
| `backend/src/routes/export.ts` | Exportação PDF/CSV/Excel — funcionalidade crítica em uso em produção |
| `backend/src/models/index.ts` | Associações Sequelize — uma mudança aqui quebra todo o banco |
| `docker-compose.yml` | Configuração de produção — mudança pode derrubar o sistema |
| `.env.production` | Variáveis de produção — nunca expor ou modificar |
| `frontend/src/store/slices/authSlice.ts` | Estado de autenticação — impacta login de todos os usuários |
| `backend/src/utils/auth.ts` | JWT e geração de token — mudança aqui invalida sessões |
| Arquivos `*.backup-*` | Backups históricos — não editar, não deletar |
| Arquivos `.sql` na raiz | Backups de banco — nunca modificar |

### 4.2 Comportamentos protegidos — NUNCA alterar sem migração de banco

- Schema de qualquer modelo Sequelize existente (`ADD COLUMN` precisa de migration)
- Nomes de campos no banco (renomear campo = dados perdidos)
- Relacionamentos N:M existentes (tabelas pivot já têm dados)
- Sequência `acoes_numero_acao_seq` do PostgreSQL

### 4.3 Dependências — NUNCA remover sem substituição aprovada

- `bull` (fila de jobs) — em uso para liberação de manutenções
- `jsonwebtoken` — autenticação em produção
- `bcrypt` — hash de senhas de todos os usuários
- `multer` — upload de comprovantes e fotos
- `pdfkit` — geração de relatórios em produção

### 4.4 Lógica de negócio protegida — NUNCA alterar sem consulta à gestão

- Job automático de liberação de manutenções vencidas (roda a cada 1h no `index.ts`)
- Algoritmo de validação matemática de CPF em `src/utils/validators.ts`
- Lógica de numeração automática de ações via sequence PostgreSQL
- Regra de precedência no login: médico → admin_estrada → CPF → cidadão
- Rate limit de 3.000 req/15min (configurado para carga do sistema de saúde)

### 4.5 Fase 5 — BLOQUEADA até chegarem os papéis físicos

**Nunca criar** templates de impressão, telas de impressão ou instalar `react-to-print` antes do desenvolvedor confirmar que recebeu os formulários físicos da equipe de campo. A Fase 5 existe mas está pausada intencionalmente.

---

## 5. Skills aplicáveis a este projeto

### 🔴 NÍVEL 1 — Segurança e Compliance (críticas)

---

#### `privacy-by-design`

**O que é:** Especialista em proteção de dados desde a concepção do sistema, com foco em LGPD e GDPR.

**Por que é crítica aqui:** O Sistema Gestão Sobre Rodas armazena **dados médicos sensíveis** de cidadãos (diagnósticos, laudos de exames, histórico clínico, cartão SUS, CPF). A LGPD Art. 11 classifica dados de saúde como categoria especial — proteção máxima obrigatória por lei. Uma violação pode resultar em multa de até 2% do faturamento ou R$50 milhões.

**Quando aplicar:**
- Ao adicionar qualquer novo campo de dado pessoal ou de saúde ao sistema
- Antes de qualquer deploy em produção
- Ao criar novos endpoints de API que retornam dados de cidadãos
- Ao configurar logs (Winston) para garantir que não vaza PII
- Ao revisar o mecanismo de consentimento LGPD já implementado no modelo `Cidadao`

**Quando NÃO aplicar:**
- Em funcionalidades puramente técnicas sem toque a dados pessoais (ex: configurar Docker, otimizar build)
- Em funcionalidades de gestão de frota (caminhões/manutenção) que não envolvem dados de cidadãos

**Gaps conhecidos neste projeto (prioridade de correção):**

1. **Retenção indefinida** — Dados ficam no banco para sempre por padrão. LGPD exige prazo de retenção definido. Implementar política de anonimização/exclusão por tipo de dado.
2. **Logs com PII** — Winston pode estar logando CPF, nome, e-mail em texto puro. Implementar redação de PII nos logs.
3. **Falta endpoint de exercício de direitos** — LGPD Art. 18 garante ao cidadão direito de acesso, correção, exclusão e portabilidade dos seus dados. O sistema tem edição de perfil mas não tem endpoint de exclusão total de conta + exportação de dados em JSON.
4. **Backups sem criptografia** — Os arquivos `.sql` na raiz do projeto contêm dados reais. Devem ser criptografados e removidos do diretório do projeto.
5. **Consentimento LGPD** — O modelo `Cidadao` tem campos `lgpd_consentimento`, `lgpd_data` e `lgpd_ip`, mas é necessário verificar se o fluxo de coleta de consentimento está funcionando corretamente.

**Arquivos relevantes no projeto:**
```
backend/src/models/Cidadao.ts         ← Campos lgpd_*
backend/src/routes/cidadaos.ts        ← CRUD de cidadãos
backend/src/index.ts                  ← Configuração do Winston (logs)
frontend/src/pages/citizen/MeuPerfil.tsx  ← Perfil do cidadão
```

**Comando de ativação:**
```
"Ativa a skill privacy-by-design e [tarefa específica]"
```

---

#### `gdpr-data-handling`

**O que é:** Implementação prática dos direitos dos titulares de dados (LGPD Art. 18), consentimento e gestão de dados pessoais.

**Por que é crítica aqui:** Complementa a `privacy-by-design` com implementação técnica dos direitos do cidadão: acesso, retificação, exclusão, portabilidade.

**Quando aplicar:**
- Para criar o endpoint `DELETE /api/cidadaos/:id/conta` (exclusão total de dados)
- Para criar o endpoint `GET /api/cidadaos/:id/exportar-dados` (portabilidade — retorna JSON com todos os dados do cidadão)
- Para criar o fluxo de solicitação de exclusão pelo portal do cidadão
- Para revisar os campos de consentimento no cadastro

**Quando NÃO aplicar:**
- Em dados de funcionários (LGPD se aplica, mas com menor urgência que dados de saúde)
- Em dados de instituições (pessoas jurídicas, não físicas)

**Arquivos relevantes no projeto:**
```
backend/src/routes/cidadaos.ts
backend/src/routes/auth.ts           ← Fluxo de cadastro com consentimento
frontend/src/pages/public/Cadastro.tsx
frontend/src/pages/citizen/MeuPerfil.tsx
```

**Comando de ativação:**
```
"Ativa a skill gdpr-data-handling e [tarefa específica]"
```

---

#### `security-audit`

**O que é:** Workflow completo de auditoria de segurança em 7 fases: reconhecimento, varredura, testes de aplicação web, testes de API, pentest, hardening e relatório.

**Por que é crítica aqui:** O sistema está em produção em `gestaosobrerodas.com.br`, exposto à internet, com dados médicos de cidadãos e acesso por múltiplos perfis. Qualquer brecha pode comprometer dados sensíveis de saúde.

**Quando aplicar:**
- Após conclusão de todas as fases do roadmap (ver Protocolo de Revisão)
- Antes de qualquer novo deploy em produção
- Quando adicionar novos endpoints públicos ou novos tipos de upload

**Quando NÃO aplicar:**
- Durante o desenvolvimento ativo (não paralisa o ciclo de features)
- Em ambiente local de desenvolvimento (só em staging/produção)

**Checklist OWASP Top 10 para este projeto:**

| Item | Risco específico no projeto | Arquivo a verificar |
|------|-----------------------------|---------------------|
| Injection | Queries Sequelize com inputs não validados | `routes/*.ts` (verificar `Op.iLike` com escape correto) |
| Broken Auth | JWT no localStorage (vulnerável a XSS) | `frontend/src/services/api.ts` |
| Sensitive Data | Dados médicos em respostas de API | `routes/cidadaos.ts`, `routes/medicoMonitoring.ts` |
| Broken Access Control | IDOR entre perfis (cidadão acessando dado de outro) | `middlewares/auth.ts` |
| Security Misconfig | Rota `/api/debug` em produção | `routes/debug.ts` |
| XSS | Dados de usuário renderizados no React | Componentes com `dangerouslySetInnerHTML` |
| Insecure Upload | Validação de tipo de arquivo nos comprovantes | `config/upload.ts` |

**Comando de ativação:**
```
"Ativa a skill security-audit e [escopo da auditoria]"
```

---

#### `auth-implementation-patterns`

**O que é:** Especialista em JWT, OAuth2, RBAC e gestão segura de sessões.

**Por que é relevante aqui:** O sistema passou por refatoração do JWT para suporte multi-role (`roles[]`). A implementação atual é retrocompatível mas pode ter pontos cegos.

**Quando aplicar:**
- Para revisar a segurança do JWT (rotação de tokens, refresh tokens)
- Para avaliar a migração de `localStorage` para `httpOnly cookies`
- Para fortalecer o RBAC (garantir que admin_estrada não acessa rotas financeiras)
- Ao implementar 2FA (se solicitado pela gestão futuramente)

**Quando NÃO aplicar:**
- Na lógica de negócio já testada e em produção sem mudança de requisito de segurança

**Arquivos relevantes no projeto:**
```
backend/src/utils/auth.ts             ← generateToken, verifyToken
backend/src/middlewares/auth.ts       ← authenticate, authorizeAdmin
backend/src/routes/auth.ts            ← Login, logout, recuperação de senha
frontend/src/services/api.ts          ← Interceptors JWT no Axios
frontend/src/store/slices/authSlice.ts  ← Estado de autenticação
```

**Comando de ativação:**
```
"Ativa a skill auth-implementation-patterns e [tarefa específica]"
```

---

### 🟡 NÍVEL 2 — Alta utilidade (próximas implementações)

---

#### `bullmq-specialist`

**O que é:** Expert em filas de jobs Redis (Bull/BullMQ) para processamento assíncrono e tempo real em Node.js.

**Por que é relevante aqui:** O projeto usa `bull` com Redis para o job de liberação de manutenções. A Fase 4 implementa o **sistema de ficha e chamada em tempo real** — uma fila de atendimento dos cidadãos que precisará de: persistência no banco, Dead Letter Queue para jobs falhos, controle de concorrência e delayed jobs para timeout de chamada.

**Quando aplicar:**
- Na implementação da Fase 4 (sistema de fila de atendimento)
- Para melhorar o job atual de liberação de manutenções (`liberarManutencoesvencidas` em `index.ts`)
- Para implementar filas de envio de e-mail em lote (F3 — aviso em massa)
- Para qualquer nova funcionalidade que precise de processamento assíncrono

**Quando NÃO aplicar:**
- Em operações síncronas simples que retornam em < 500ms
- Para substituir o Redis — o stack já está definido com Bull

**Contexto técnico do projeto:**
```
Stack de filas: Bull (não BullMQ — são compatíveis, mesma filosofia)
Redis: porta 6379, container carretas-redis
Job atual: liberarManutencoesvencidas() em backend/src/index.ts (setInterval 1h)
Novo requisito: FichaAtendimento model + GerenciarFila.tsx + PainelChamada.tsx
```

**Padrões a implementar na Fase 4:**
1. Fila `atendimento-queue` com prioridade por ordem de chegada
2. Delayed job para timeout de chamada (cidadão não comparece após X minutos)
3. DLQ para fichas que falharam ao ser chamadas
4. Persistência no banco (model `FichaAtendimento`) para relatórios posteriores
5. Evento Socket.IO disparado pelo worker quando uma ficha é chamada

**Arquivos relevantes:**
```
backend/src/index.ts                   ← Job atual (liberarManutencoesvencidas)
backend/src/config/redis.ts            ← Conexão Redis
backend/src/models/                    ← Criar FichaAtendimento.ts aqui
frontend/src/pages/admin/              ← Criar GerenciarFila.tsx e PainelChamada.tsx
```

**Comando de ativação:**
```
"Ativa a skill bullmq-specialist e [tarefa específica]"
```

---

#### `postgresql-optimization`

**O que é:** Especialista em tuning de PostgreSQL — EXPLAIN ANALYZE, índices, vacuum, configuração de pool.

**Por que é relevante aqui:** O projeto tem 28 modelos com relacionamentos complexos. As rotas de ações (`routes/acoes.ts`, 29KB) e estoque (`routes/estoque.ts`, 46KB) fazem queries com múltiplos `include` Sequelize. Com o crescimento de dados em produção, isso vai gerar problemas de performance.

**Quando aplicar:**
- Quando o sistema começar a apresentar lentidão nas telas de listagem
- Antes de campanha de saúde que vai gerar volume alto de inscrições
- Para revisar índices nas colunas mais consultadas
- Para otimizar as queries de analytics/BI que fazem GROUP BY em tabelas grandes

**Quando NÃO aplicar:**
- Para mudanças de schema (isso é território da skill `database-architect`)
- Para refatoração de código (isso é território da skill `clean-code`)

**Queries prioritárias para otimização:**
```sql
-- 1. Listagem de inscrições por ação (filtro por nome/CPF)
SELECT ... FROM inscricoes JOIN cidadaos WHERE cidadaos.nome_completo iLIKE '%...%'
-- → Precisa de índice GIN ou pg_trgm no campo nome_completo

-- 2. Analytics de atendimentos por período
SELECT ... FROM atendimentos_medicos WHERE created_at BETWEEN ? AND ?
-- → Índice em created_at (provavelmente faltando)

-- 3. Dashboard — múltiplos COUNT em paralelo
-- → Verificar se queries são executadas em paralelo ou sequencialmente

-- 4. Estoque — movimentações por insumo
SELECT ... FROM movimentacoes_estoque WHERE insumo_id = ?
-- → Índice em insumo_id
```

**Pool de conexões (configuração atual):**
```typescript
// backend/src/config/database.ts
pool: { max: 20, min: 2, acquire: 30000, idle: 10000 }
// Avaliar se max: 20 é adequado para a carga de produção
```

**Comando de ativação:**
```
"Ativa a skill postgresql-optimization e [tarefa específica]"
```

---

#### `pdf-official` + `docx-official` + `xlsx-official`

**O que são:** Especialistas em geração e manipulação de PDFs, documentos Word e planilhas Excel.

**Por que são relevantes aqui:** A Fase 5 (impressão de documentos) está **bloqueada** aguardando os formulários físicos da equipe de campo. Quando os documentos chegarem, essas skills guiarão a implementação dos templates digitais.

**⚠️ GRAVITY: Não implementar nada da Fase 5 sem o desenvolvedor confirmar que recebeu os papéis físicos.**

**Quando aplicar (`pdf-official`):**
- Para criar templates de fichas de atendimento para impressão
- Para melhorar os PDFs de Prestação de Contas gerados pelo PDFKit no servidor
- Para criar o botão de impressão de dados do paciente (#8 do roadmap)
- Para OCR de documentos escaneados (se necessário futuramente)

**Quando aplicar (`docx-official`):**
- Para criar relatórios no formato Word para órgãos contratantes
- Para gerar contratos ou termos de consentimento em formato editável

**Quando aplicar (`xlsx-official`):**
- Para melhorar as exportações Excel do ExcelJS já existente
- Para criar planilhas de prestação de contas mais elaboradas

**Quando NÃO aplicar:**
- Antes de receber os formulários físicos da equipe de campo (Fase 5 bloqueada)
- Para substituir as exportações existentes em `routes/export.ts` (protegido)

**Stack atual de geração de documentos:**
```
Backend: PDFKit (relatórios PDF servidor) + ExcelJS (planilhas) + csv-writer
Frontend: jsPDF + html2canvas (PDFs client-side) + react-to-print (a instalar)
Rota protegida: backend/src/routes/export.ts — NÃO MODIFICAR
```

**Comandos de ativação:**
```
"Ativa a skill pdf-official e [tarefa específica]"
"Ativa a skill docx-official e [tarefa específica]"
"Ativa a skill xlsx-official e [tarefa específica]"
```

---

#### `openapi-spec-generation`

**O que é:** Geração e manutenção de especificações OpenAPI 3.1 para APIs REST.

**Por que é relevante aqui:** O projeto tem 24 grupos de rotas e o `swagger-ui-express` já está instalado no backend — mas a documentação provavelmente está incompleta ou desatualizada. Uma spec OpenAPI completa facilita:
- Testes automatizados de contrato de API
- Integração com sistemas de municípios (B2G)
- Onboarding de novos desenvolvedores
- Geração automática de clients TypeScript para o frontend

**Quando aplicar:**
- Após conclusão de todas as fases do roadmap
- Antes de uma integração com sistema externo (município, secretaria de saúde)
- Para documentar as novas rotas da Fase 3 (inscrição bulk, aviso em massa, resultado por e-mail)

**Quando NÃO aplicar:**
- Durante desenvolvimento ativo de features (gerar spec depois que a API está estável)

**Rotas prioritárias para documentar:**
```
POST /api/inscricoes/bulk              ← Nova — Fase 3
POST /api/acoes/:id/avisar-inscritos   ← Nova — Fase 3
POST /api/medico-monitoring/atendimento/:id/enviar-resultado  ← Nova — Fase 3
GET  /api/analytics/custo-por-pessoa   ← Nova — Fase 2
PATCH /api/cidadaos/:id/redefinir-senha ← Nova — Fase 1
```

**Comando de ativação:**
```
"Ativa a skill openapi-spec-generation e [tarefa específica]"
```

---

### 🟢 NÍVEL 3 — Qualidade de código (refatoração)

---

#### `clean-code`

**O que é:** Aplicação dos princípios do livro "Clean Code" de Robert C. Martin — funções pequenas, nomes expressivos, responsabilidade única.

**Por que é relevante aqui:** Os maiores arquivos do projeto são sintomas de componentes fazendo muitas coisas ao mesmo tempo:

| Arquivo | Tamanho | Problema |
|---------|---------|---------|
| `frontend/src/pages/admin/Estoque.tsx` | ~106KB | Listagem + formulários + movimentações + relatórios tudo junto |
| `frontend/src/pages/admin/GerenciarAcao.tsx` | Grande | 9 arquivos `.backup` — histórico de muita edição instável |
| `frontend/src/pages/admin/Cidadaos.tsx` | ~80KB | CRUD + histórico + foto + campos customizados tudo junto |
| `backend/src/routes/medicoMonitoring.ts` | ~48KB | Ponto, atendimento, exames, relatório — uma rota só |
| `backend/src/routes/estoque.ts` | ~46KB | Insumos, movimentações, ação-insumos — uma rota só |

**Quando aplicar:**
- Ao refatorar qualquer um dos arquivos acima
- Antes de adicionar nova funcionalidade a um arquivo já grande
- Em code review de pull requests

**Quando NÃO aplicar:**
- Em arquivos que estão funcionando em produção sem bugs — "se está funcionando, não mexa" se a refatoração não tiver benefício imediato
- Em arquivos `.backup-*` — nunca editar backups

**Regra de ouro para este projeto:**
> Um componente React ou rota Express com mais de **300 linhas** precisa de avaliação de quebra. Um arquivo com mais de **500 linhas** quase certamente deve ser dividido.

**Comando de ativação:**
```
"Ativa a skill clean-code e [tarefa de refatoração específica]"
```

---

#### `react-best-practices`

**O que é:** Guia completo de performance em React — eliminação de waterfalls, otimização de bundle, re-renders desnecessários.

**Por que é relevante aqui:** Os componentes grandes do projeto provavelmente têm:
- Waterfalls de dados (múltiplos `useEffect` sequenciais em vez de `Promise.all`)
- Re-renders desnecessários em listas grandes (inscrições, insumos)
- Bundle não otimizado (importações barrel files do MUI)
- Componentes pesados carregados sem lazy loading

**Quando aplicar:**
- Ao perceber lentidão no carregamento das telas do admin
- Antes de implementar o sistema de ficha em tempo real (Fase 4) — que vai atualizar a UI frequentemente
- Para otimizar as telas com auto-refresh de 60s implementadas na Fase 2

**Quando NÃO aplicar:**
- Em componentes pequenos e simples (formulários de nova ação, telas de login)
- Se não houver problema de performance reportado — otimização prematura é problema

**Padrões prioritários para este projeto:**

```typescript
// ❌ Waterfall atual (comum em GerenciarAcao.tsx)
useEffect(() => { fetchAcao(); }, []);
useEffect(() => { fetchInscricoes(); }, [acao]);
useEffect(() => { fetchCaminhoes(); }, [acao]);

// ✅ Paralelo com Promise.all
useEffect(() => {
  Promise.all([fetchAcao(), fetchInscricoes(), fetchCaminhoes()])
    .then(([acao, inscricoes, caminhoes]) => { ... });
}, []);
```

**Comando de ativação:**
```
"Ativa a skill react-best-practices e [tarefa específica]"
```

---

#### `error-handling-patterns`

**O que é:** Padrões robustos de tratamento de erros em aplicações Node.js/React.

**Por que é relevante aqui:** O projeto tem `backend-full-error.txt` na raiz, indicando que erros foram coletados manualmente em algum momento. O tratamento de erros parece ad hoc em alguns pontos.

**Quando aplicar:**
- Para padronizar as respostas de erro da API (todos os erros 4xx/5xx no mesmo formato)
- Para melhorar o `errorHandler.ts` existente em `middlewares/`
- Para implementar error boundaries no React (telas que não crasham ao invés de tela branca)
- Para garantir que erros de SMTP nunca crasham o servidor (já parcialmente implementado)

**Quando NÃO aplicar:**
- Para reescrever tratamentos de erro que já funcionam em produção sem quebras frequentes

**Arquivos relevantes:**
```
backend/src/middlewares/errorHandler.ts   ← Handler global de erros
backend/src/utils/email.ts                ← Erros de SMTP (já não-bloqueantes)
frontend/src/services/api.ts              ← Interceptor de erros do Axios
```

**Comando de ativação:**
```
"Ativa a skill error-handling-patterns e [tarefa específica]"
```

---

#### `docker-expert`

**O que é:** Especialista em otimização de containers Docker — multi-stage builds, segurança, compose.

**Por que é relevante aqui:** O projeto usa Docker Compose em produção com 4 containers. Há espaço para:
- Multi-stage builds para reduzir tamanho das imagens
- Health checks nos containers
- Limites de memória/CPU por container
- Logs centralizados

**Quando aplicar:**
- Se houver problemas de memória/performance nos containers em produção
- Para adicionar health checks antes de um escalonamento de usuários
- Ao configurar ambiente de staging separado do de produção

**Quando NÃO aplicar:**
- No `docker-compose.yml` em produção sem staging testado primeiro — **nunca alterar diretamente em produção**

**Comando de ativação:**
```
"Ativa a skill docker-expert e [tarefa específica]"
```

---

#### `observability-engineer`

**O que é:** Implementação de métricas, logs estruturados e tracing em aplicações de produção.

**Por que é relevante aqui:** O projeto usa Winston para logs, mas provavelmente sem estruturação adequada. Com o crescimento do sistema, vai ser necessário:
- Métricas de health da API (tempo de resposta, taxa de erro)
- Alertas de erro crítico
- Rastreamento de erros em produção

**Quando aplicar:**
- Quando o sistema atingir volume significativo de usuários simultâneos
- Para configurar alertas de erro crítico (ex: falha no job de manutenções)
- Para estruturar os logs Winston em JSON (facilita busca e análise)

**Quando NÃO aplicar:**
- No momento atual se o sistema estiver estável — é uma melhoria de maturidade, não urgente
- Para adicionar ferramentas de APM externas que enviem dados para cloud (viola regra anti-exfiltração)

**Comando de ativação:**
```
"Ativa a skill observability-engineer e [tarefa específica]"
```

---

#### `typescript-pro`

**O que é:** TypeScript avançado — types, generics, strictness, utility types.

**Por que é relevante aqui:** O projeto usa TypeScript em backend e frontend, e já tem `npx tsc --noEmit` passando com 0 erros. Mas pode haver `any` implícitos, types genéricos demais ou oportunidades de tipos mais expressivos.

**Quando aplicar:**
- Ao implementar as novas features da Fase 4 (FichaAtendimento, Socket.IO types)
- Para tipar adequadamente os payloads do Socket.IO (eventos de fila)
- Para revisar os types do Redux store

**Quando NÃO aplicar:**
- Para "purificar" código TypeScript que já está funcionando sem erros reais

**Comando de ativação:**
```
"Ativa a skill typescript-pro e [tarefa específica]"
```

---

#### `architecture-decision-records`

**O que é:** Criação e manutenção de ADRs — registros formais de decisões arquiteturais.

**Por que é relevante aqui:** O projeto já tem um `Diario-de-bordo.md` que registra decisões. ADRs formalizam isso com o padrão: contexto → decisão → consequências → alternativas consideradas.

**Quando aplicar:**
- Para formalizar decisões grandes da Fase 4 (Socket.IO vs polling, modelo de fila)
- Para documentar a decisão de localStorage vs httpOnly cookies
- Para registrar a escolha de Bull vs BullMQ

**Quando NÃO aplicar:**
- Para decisões pequenas (já cobertas pelo Diário de Bordo)

**Comando de ativação:**
```
"Ativa a skill architecture-decision-records e documenta a decisão sobre [tema]"
```

---

## 6. Protocolo de revisão pós-fases

> **GRAVITY: Este protocolo é ativado quando o desenvolvedor disser algo como:**
> - "Terminei todas as fases, pode revisar o projeto"
> - "Faz uma revisão completa do sistema"
> - "O roadmap está concluído, quero uma auditoria"

### Pré-condições para iniciar a revisão

Antes de qualquer revisão, verificar no `Docs/prox-passos.md` e `Docs/Diario-de-bordo.md`:

- [ ] Fase 1 completa (10/10 itens)
- [ ] Fase 2 completa (11/11 itens)
- [ ] Fase 3 completa — backend + **frontend** (incluindo as 3 UIs pendentes: inscrição bulk, aviso em massa, botão enviar resultado)
- [ ] Fase 4 completa — Socket.IO + GerenciarFila + PainelChamada + equipamentos
- [ ] Fase 5: confirmar com o desenvolvedor se os papéis físicos chegaram

Se alguma fase não estiver completa, **não iniciar a revisão completa** — informar o status ao desenvolvedor e perguntar se quer revisão parcial.

### O que a revisão NÃO inclui (nunca)

- Reescrever funcionalidades que estão funcionando em produção sem bug ou solicitação
- Alterar esquemas de banco sem migration explícita aprovada pelo desenvolvedor
- Mudar a stack tecnológica
- Tocar nos arquivos protegidos da Seção 4
- Modificar a Fase 5 sem confirmação dos papéis físicos

---

## 7. Ordem de execução da revisão completa

A revisão completa segue **8 etapas em ordem fixa**. Cada etapa deve ser apresentada ao desenvolvedor para aprovação antes de passar para a próxima.

---

### ETAPA 1 — Diagnóstico inicial (somente leitura, sem modificações)

**Objetivo:** Mapear o estado real do projeto antes de qualquer mudança.

**Ações:**
1. Ler `Docs/sobre-projeto.md` — arquitetura atual
2. Ler `Docs/Diario-de-bordo.md` — o que foi feito e as decisões tomadas
3. Ler `Docs/prox-passos.md` — confirmar status de cada item do roadmap
4. Listar estrutura de pastas via MCP: `backend/src/routes/`, `backend/src/models/`, `frontend/src/pages/`
5. Verificar se há arquivos de erro na raiz (`backend-full-error.txt`, etc.)
6. Rodar mentalmente o checklist da Seção 4 (arquivos protegidos)

**Produto entregue ao desenvolvedor:**
- Relatório: o que está completo, o que está pendente, o que foi encontrado de inesperado
- Confirmação de que pode prosseguir com a revisão

**Aprovação necessária:** Sim, antes de continuar.

---

### ETAPA 2 — Auditoria de segurança e LGPD

**Skills ativadas:** `security-audit` + `privacy-by-design` + `gdpr-data-handling` + `auth-implementation-patterns`

**Ordem interna:**

**2a. Revisão de LGPD** (skill: `privacy-by-design`)
- Ler `Docs/skills-corporativas/skills/privacy-by-design/SKILL.md`
- Verificar `backend/src/index.ts` — configuração do Winston (tem PII nos logs?)
- Verificar `backend/src/models/Cidadao.ts` — campos `lgpd_*` estão funcionando?
- Verificar `backend/src/routes/cidadaos.ts` — há endpoint de exclusão de dados?
- Verificar `backend/src/config/upload.ts` — validação de tipo de arquivo nos uploads

**2b. Revisão dos direitos do titular** (skill: `gdpr-data-handling`)
- Ler `Docs/skills-corporativas/skills/gdpr-data-handling/SKILL.md`
- Checar os 4 direitos do Art. 18 LGPD: acesso, retificação, exclusão, portabilidade
- Verificar fluxo de consentimento no cadastro do cidadão

**2c. Revisão de autenticação** (skill: `auth-implementation-patterns`)
- Ler `Docs/skills-corporativas/skills/auth-implementation-patterns/SKILL.md`
- Verificar `backend/src/utils/auth.ts` — JWT bem configurado (expiração, segredo)?
- Verificar `backend/src/middlewares/auth.ts` — RBAC correto para todos os 4 perfis?
- Verificar `frontend/src/services/api.ts` — token no localStorage (risco XSS)?
- Verificar `backend/src/routes/debug.ts` — desabilitado em produção?

**2d. Auditoria de API** (skill: `security-audit`)
- Ler `Docs/skills-corporativas/skills/security-audit/SKILL.md`
- Verificar IDOR: cidadão consegue acessar dados de outro cidadão?
- Verificar se erros retornam stack traces para o cliente
- Verificar validação de input nas rotas com `req.body`

**Produto entregue ao desenvolvedor:**
- Lista priorizada de vulnerabilidades e gaps LGPD, sem nenhuma correção aplicada ainda
- Para cada item: gravidade (crítico/alto/médio/baixo), arquivo afetado, descrição do problema, sugestão de correção

**Aprovação necessária:** Sim — o desenvolvedor decide o que corrigir antes de passar para Etapa 3.

---

### ETAPA 3 — Correções de segurança e LGPD

**Skills ativadas:** As mesmas da Etapa 2, em modo de implementação.

**Ordem de correções (do mais crítico ao menos crítico):**

1. **Redação de PII nos logs** — Modificar configuração Winston para não logar CPF, nome, e-mail em texto puro. Usar hash ou omitir campos sensíveis.
2. **Validação de tipo de arquivo nos uploads** — Garantir que `config/upload.ts` só aceita JPEG/PNG/PDF nos comprovantes e fotos.
3. **Rota de debug desabilitada em produção** — Verificar `routes/debug.ts` e adicionar guarda `if (process.env.NODE_ENV === 'production') return res.status(404)`.
4. **Endpoint de exclusão de conta** — Criar `DELETE /api/cidadaos/:id/conta` que remove todos os dados pessoais do cidadão em cascata, mantendo apenas registros anonimizados para fins de auditoria.
5. **Endpoint de exportação de dados** — Criar `GET /api/cidadaos/:id/exportar-dados` que retorna JSON com todos os dados do cidadão (direito de portabilidade LGPD).
6. **Revisão de IDOR** — Verificar e corrigir se cidadão autenticado consegue acessar dados de outro cidadão via manipulação de IDs.

**O que NÃO fazer nesta etapa:**
- Não migrar JWT de localStorage para httpOnly sem aprovação explícita — é uma mudança grande com impacto em produção
- Não alterar o rate limit sem teste de carga prévio
- Não tocar em `export.ts` (arquivo protegido)
- Não alterar o fluxo de login (lógica de negócio protegida)

**Produto entregue:** Código corrigido + registro das mudanças no `Docs/Diario-de-bordo.md`.

**Aprovação necessária:** Sim, a cada correção que modifique comportamento de API.

---

### ETAPA 4 — Otimização do banco de dados

**Skill ativada:** `postgresql-optimization`

**Ações:**
1. Ler `Docs/skills-corporativas/skills/postgresql-optimization/SKILL.md`
2. Ler `backend/src/models/index.ts` — mapear todos os relacionamentos e identificar as queries mais pesadas
3. Verificar índices faltantes nas colunas mais consultadas:
   - `cidadaos.nome_completo` — busca `iLike` na listagem de inscrições
   - `cidadaos.cpf` — busca frequente em cadastro e login
   - `atendimentos_medicos.created_at` — filtro por período no BI
   - `movimentacoes_estoque.insumo_id` — listagem por insumo no estoque
   - `inscricoes.acao_id` + `inscricoes.cidadao_id` — queries mais frequentes do sistema
   - `contas_pagar.data_vencimento` + `contas_pagar.status` — filtros da tela financeira
4. Verificar a query de analytics de gênero com `COALESCE` (implementada na Fase 2)
5. Verificar se as queries do dashboard fazem requests em paralelo ou sequencial

**O que NÃO fazer:**
- Não alterar schema de tabelas (ADD/DROP COLUMN) — isso é migration, não otimização
- Não alterar relacionamentos existentes
- Não modificar a sequence `acoes_numero_acao_seq`
- Não alterar configuração do Docker Postgres sem aprovação

**Produto entregue:** Script SQL com `CREATE INDEX CONCURRENTLY` para os índices faltantes + recomendações das queries a otimizar (sem aplicar mudanças na aplicação sem aprovação).

**Aprovação necessária:** Sim — o desenvolvedor valida o script SQL antes de rodar em produção.

---

### ETAPA 5 — Qualidade de código

**Skills ativadas:** `clean-code` + `react-best-practices` + `typescript-pro`

**Ordem interna:**

**5a. Backend** (skill: `clean-code`)
- Ler `Docs/skills-corporativas/skills/clean-code/SKILL.md`
- Revisar `backend/src/routes/medicoMonitoring.ts` (48KB) — identificar funções com mais de 30 linhas que podem ser extraídas para `services/`
- Revisar `backend/src/routes/estoque.ts` (46KB) — idem
- Listar funções com mais de 3 parâmetros sem objeto de configuração
- Identificar blocos de código duplicados entre rotas

**5b. Frontend** (skill: `react-best-practices`)
- Ler `Docs/skills-corporativas/skills/react-best-practices/SKILL.md`
- Revisar `frontend/src/pages/admin/Estoque.tsx` (106KB) — identificar sub-componentes para extrair para `components/`
- Revisar `frontend/src/pages/admin/GerenciarAcao.tsx` — verificar waterfalls de `useEffect`
- Revisar `frontend/src/pages/admin/Cidadaos.tsx` (80KB) — idem
- Verificar as telas com auto-refresh de 60s — estão com `clearInterval` no cleanup do `useEffect`?
- Verificar importações do MUI — estão usando importação direta ou barrel imports?

**5c. TypeScript** (skill: `typescript-pro`)
- Ler `Docs/skills-corporativas/skills/typescript-pro/SKILL.md`
- Verificar se há `any` explícito ou implícito nos arquivos novos das Fases 3 e 4
- Verificar types dos payloads do Socket.IO (eventos de fila)
- Verificar types dos retornos de e-mail

**O que NÃO fazer:**
- Não refatorar componentes em produção sem aprovação explícita — propor, não aplicar
- Não remover `.backup-*` — são referência histórica
- Não habilitar `strict: true` no `tsconfig.json` sem verificar impacto completo

**Produto entregue:** Lista de refatorações recomendadas com justificativas e estimativa de esforço. O desenvolvedor decide o que aplicar e quando.

**Aprovação necessária:** Sim — toda refatoração precisa de aprovação antes de aplicação.

---

### ETAPA 6 — Tratamento de erros e observabilidade

**Skills ativadas:** `error-handling-patterns` + `observability-engineer`

**Ações:**
1. Ler os `SKILL.md` das duas skills
2. Revisar `backend/src/middlewares/errorHandler.ts` — o handler global padroniza as respostas de erro?
3. Verificar se todos os erros retornam o mesmo formato JSON: `{ error: string, message: string, statusCode: number }`
4. Verificar se erros críticos (banco down, Redis down) têm tratamento com fallback
5. Analisar `backend-full-error.txt` na raiz — entender o que gerou, se ainda é reproduzível
6. Propor estruturação dos logs Winston em JSON format

**O que NÃO fazer:**
- Não alterar o comportamento não-bloqueante dos e-mails — decisão técnica registrada no Diário de Bordo de 06/04/2026
- Não integrar ferramentas de APM externas (Datadog, New Relic, etc.) — violaria regra anti-exfiltração das skills

**Produto entregue:** Melhorias de error handling + configuração de logs estruturados JSON.

---

### ETAPA 7 — Revisão de infraestrutura Docker

**Skill ativada:** `docker-expert`

**Ações:**
1. Ler `Docs/skills-corporativas/skills/docker-expert/SKILL.md`
2. Revisar `docker-compose.yml` — há health checks? Limites de memória/CPU?
3. Revisar os `Dockerfile` de backend e frontend — são multi-stage build?
4. Revisar `frontend/nginx.conf` — headers de segurança (HSTS, X-Frame-Options, CSP, X-Content-Type-Options)?
5. Verificar se as variáveis de ambiente sensíveis estão sendo passadas com segurança (não hardcoded)

**O que NÃO fazer:**
- Não alterar o `docker-compose.yml` de produção — propor mudanças para teste em staging primeiro
- Não alterar a configuração de rede dos containers (pode quebrar a comunicação interna)

**Produto entregue:** Lista de melhorias para `docker-compose.yml` e `nginx.conf`, para revisão e aprovação do desenvolvedor antes de aplicar.

**Aprovação necessária:** Sim — mudanças de infra sempre precisam de aprovação e teste antes de produção.

---

### ETAPA 8 — Documentação final

**Skills ativadas:** `openapi-spec-generation` + `architecture-decision-records`

**Ações:**
1. Ler os `SKILL.md` das duas skills
2. Gerar ou atualizar a spec OpenAPI 3.1 para as rotas novas das Fases 1, 2, 3 e 4
3. Atualizar `Docs/sobre-projeto.md` com as novas features implementadas (seções 9, 12 e os fluxos novos)
4. Criar ADRs para as principais decisões da Fase 4: arquitetura da fila, escolha do Socket.IO, modelo de persistência de fichas
5. Atualizar `Docs/Diario-de-bordo.md` com resumo da revisão completa e as correções aplicadas
6. Verificar se `README.md` reflete o estado atual do sistema

**Produto entregue:** Documentação atualizada, spec OpenAPI gerada, ADRs criados.

---

## 8. Referência rápida de comandos

### Ativação de skill individual

```
"Ativa a skill privacy-by-design e revisa os logs do backend"
"Ativa a skill gdpr-data-handling e cria o endpoint de exclusão de dados do cidadão"
"Ativa a skill security-audit e audita as rotas de upload"
"Ativa a skill auth-implementation-patterns e revisa a segurança do JWT"
"Ativa a skill postgresql-optimization e analisa as queries de inscrições"
"Ativa a skill bullmq-specialist e projeta a fila de atendimento da Fase 4"
"Ativa a skill clean-code e me ajuda a quebrar o Estoque.tsx em componentes menores"
"Ativa a skill react-best-practices e revisa os waterfalls de dados no GerenciarAcao"
"Ativa a skill typescript-pro e verifica os types do Socket.IO"
"Ativa a skill pdf-official e cria o template da ficha de atendimento"
"Ativa a skill openapi-spec-generation e documenta as novas rotas da Fase 3"
"Ativa a skill docker-expert e adiciona health checks nos containers"
"Ativa a skill architecture-decision-records e documenta a decisão sobre a fila de atendimento"
```

### Revisão completa pós-roadmap

```
"Terminei todas as fases — faz a revisão completa seguindo o protocolo do SKILLS.md"
```

### Revisão por etapa específica

```
"Executa a Etapa 1 da revisão (diagnóstico inicial)"
"Executa a Etapa 2 da revisão (segurança e LGPD)"
"Executa a Etapa 3 da revisão (correções de segurança)"
"Executa a Etapa 4 da revisão (banco de dados)"
"Executa a Etapa 5 da revisão (qualidade de código)"
"Executa a Etapa 6 da revisão (tratamento de erros)"
"Executa a Etapa 7 da revisão (Docker)"
"Executa a Etapa 8 da revisão (documentação final)"
```

---

## Skills fora do escopo deste projeto

As skills abaixo estão no pacote mas **não se aplicam** ao Sistema Gestão Sobre Rodas no estado atual:

| Skill | Por quê não se aplica |
|-------|----------------------|
| `rag-engineer` | O sistema não usa LLM ou RAG |
| `local-llm-expert` | O sistema não usa LLM local |
| `langchain-architecture` | O sistema não usa LangChain |
| `computer-vision-expert` | O sistema não faz OCR ou visão computacional |
| `fastapi-pro` | Stack é Node.js/Express, não Python/FastAPI |
| `kubernetes-*` | Infra é Docker Compose simples, sem orquestração |
| `leiloeiro-*` | Fora do domínio de saúde pública |
| `advogado-especialista` | Relevante para contratos B2G, não para desenvolvimento |
| `vector-database-engineer` | Sem busca semântica no sistema |
| `embedding-strategies` | Sem LLM ou busca semântica |
| `nextjs-*` | Frontend é CRA (Create React App), não Next.js |
| `prisma-expert` | ORM é Sequelize, não Prisma |

---

*Documento criado em 06/04/2026 — Sistema Gestão Sobre Rodas v2.0*
*Mantenha este documento atualizado conforme novas fases são concluídas ou novas skills se tornam relevantes.*
*Próxima revisão sugerida: após conclusão das Fases 3 e 4.*
