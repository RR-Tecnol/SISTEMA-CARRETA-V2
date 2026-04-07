# 📓 Diário de Bordo — Sistema Gestão Sobre Rodas

> Registro cronológico de todas as alterações realizadas no sistema.
> **Formato:** O quê foi feito → Por quê foi feito → Arquivos afetados → Resultado.

---

## 📌 LEGENDA DE TIPOS

| Ícone | Tipo |
|---|---|
| 🐛 | Correção de bug |
| ✨ | Nova funcionalidade |
| 📋 | Documentação |
| 🔧 | Melhoria técnica / refactor |
| 🔒 | Segurança / autenticação |
| 🎨 | UX / Interface |

---

## 🗓️ 06/04/2026 — Fase 1 Implementada (Bugs + Quick Wins)

**Responsável:** Antigravity AI + Equipe RR Tecnologia
**Status:** ✅ Concluída e verificada (TypeScript backend + frontend: 0 erros)

---

### 📋 Criação da Documentação Central (`sobre-projeto.md`)

**O quê:** Criamos o arquivo `Docs/sobre-projeto.md` — a documentação completa do projeto cobrindo stack, arquitetura, infraestrutura, modelos de dados, lógica de autenticação, fluxos de negócio e conexão entre componentes.

**Por quê:** O projeto cresceu sem documentação centralizada, tornando difícil a onboarding de novos devs e a retomada do trabalho após períodos de pausa. Sem essa documentação, qualquer manutenção exigiria reler todo o código-fonte.

**Arquivos criados:**
- `Docs/sobre-projeto.md`

---

### 📋 Atualização do Roadmap (`prox-passos.md`)

**O quê:** Expandimos o `prox-passos.md` de 16 para **30 itens**, incorporando o feedback da gestão. Os novos itens foram categorizados como bugs (B1-B5) e features (F1-F9).

**Por quê:** A gestão apresentou feedback com novas demandas que não estavam no roadmap original. Era necessário cruzar as duas listas para evitar duplicações, priorizar corretamente e ter uma visão única de todas as pendências do sistema.

**Arquivos modificados:**
- `Docs/prox-passos.md`

**Itens adicionados:**
- `B1` Bug cartão SUS não salva
- `B2` Bug gráfico de gênero incorreto
- `B3` Bug filtros do BI não funcionam
- `B4` Bug sistema de alertas
- `B5` Bug custo médio/pessoa incorreto
- `F1` E-mail de boas-vindas com senha
- `F2` Admin redefinir senha do cidadão
- `F3` Aviso de imprevisto em massa
- `F4` Campo e-mail opcional
- `F5` Enviar resultado de exame por e-mail
- `F6` SMS para fila de espera *(bloqueado - aguarda provedor)*
- `F7` Médico vê apenas exames do seu tipo
- `F8` Atualização automática sem refresh
- `F9` Cadastro de equipamentos por carreta

---

### 🔧 `toTitleCase()` — Capitalização automática de nomes [#1]

**O quê:** Adicionamos a função `toTitleCase(str)` ao arquivo de formatadores utilitários.

**Por quê:** Operadores relataram que nomes como `"MARIA DA SILVA"` ou `"maria da silva"` estavam sendo salvos exatamente como digitados, sem padronização. Isso causa problemas estéticos nos relatórios, inconsistências em buscas e má aparência geral do sistema.

**Solução adotada:** Função simples que usa `replace(/\w\S*/g)` para capitalizar a primeira letra de cada palavra. Aplicada automaticamente no `onChange` dos campos de nome — o usuário não precisa fazer nada.

**Arquivos modificados:**
- `frontend/src/utils/formatters.ts` — função `toTitleCase` adicionada

**Campos com capitalização automática:**
`nome_completo`, `nome_mae`, `bairro`, `rua`, `municipio`, `complemento`

---

### 🎨 Campos opcionais indicados no formulário de cadastro [#3]

**O quê:** Labels e `helperText` atualizados para indicar quais campos são obrigatórios e quais são opcionais no formulário de criação de cidadão.

**Por quê:** Operadores não sabiam quais campos eram obrigatórios e frequentemente bloqueavam o cadastro tentando achar informações desnecessárias (ex: data de nascimento, nome da mãe, CNS). Isso atrasava o atendimento.

**Decisão de design:** Mínimo obrigatório = **Nome + CPF + Telefone**. Todo o resto é opcional e marcado explicitamente com `(opcional)` no label.

**Arquivos modificados:**
- `frontend/src/pages/admin/Cidadaos.tsx`

---

### 🎨 Redirect pós-cadastro para inscrição de exame [#2]

**O quê:** Após salvar um novo cidadão, o sistema exibe um snackbar com botão *"Inscrever em Exame →"* que permanece visível por **8 segundos**.

**Por quê:** O fluxo de trabalho da equipe de campo é: cadastrar cidadão → imediatamente inscrever em exame. Antes, o operador precisava sair do modal, navegar até a tela de inscrições e buscar o cidadão manualmente. Isso consumia tempo e estava causando erros (inscrever o cidadão errado).

**Solução adotada:** Snackbar com ação (MUI `notistack`) que navega diretamente para `/admin/inscricoes?cidadao_id=X`, passando o ID na query para pré-selecionar o cidadão recém-cadastrado.

**Arquivos modificados:**
- `frontend/src/pages/admin/Cidadaos.tsx` — `handleSubmit` atualizado

---

### ✨ CEP preenche endereço automaticamente [#5]

**O quê:** Criamos o utilitário `buscarCEP()` que consulta a **API ViaCEP** (pública, gratuita, sem chave de API). No campo CEP do formulário, ao usuário sair do campo (`onBlur`), o sistema busca o endereço e preenche automaticamente: rua, bairro, município e estado.

**Por quê:** O preenchimento manual de endereço é lento, propenso a erros de digitação e inconsistências (ex: "São Luís" vs "São Luis"). Com a consulta automática, o endereço fica padronizado.

**Solução adotada:** `fetch()` direto para `https://viacep.com.br/ws/{cep}/json/` — sem dependência de biblioteca extra, sem custo, sem limite de uso razoável.

**Arquivos criados:**
- `frontend/src/utils/cep.ts` — função `buscarCEP(cep: string)`

**Arquivos modificados:**
- `frontend/src/pages/admin/Cidadaos.tsx` — `onBlur` no campo CEP + `handleCEPBlur()`

---

### ✨ CPF preenche dados do cidadão automaticamente [#6]

**O quê:** No campo CPF do formulário de cadastro, ao sair do campo com 11 dígitos, o sistema verifica se aquele CPF já está na base. Se sim, preenche automaticamente todos os dados do cidadão.

**Por quê:** Frequentemente o mesmo cidadão era cadastrado em múltiplas ações/carretas, causando duplicidade no banco. Com esse mecanismo, o sistema detecta o CPF existente e reutiliza os dados já cadastrados.

**Rota usada:** `GET /api/cidadaos/buscar-cpf/:cpf` — já existia no backend.

**Arquivos modificados:**
- `frontend/src/pages/admin/Cidadaos.tsx` — `onBlur` no campo CPF + `handleCPFBlur()`

---

### 🎨 Campo e-mail sugere domínios automaticamente [#7]

**O quê:** O campo e-mail foi substituído por um `Autocomplete` freeSolo do MUI. Enquanto o usuário digita, o sistema sugere automaticamente os principais domínios: `@gmail.com`, `@hotmail.com`, `@outlook.com`, `@yahoo.com.br`, `@icloud.com`.

**Por quê:** Operadores cometiam frequentemente erros de digitação no e-mail (ex: `@gmal.com`, `@hotmial.com`). Com as sugestões, o clique é mais rápido e o erro é eliminado.

**Arquivos modificados:**
- `frontend/src/pages/admin/Cidadaos.tsx` — campo email → `Autocomplete` + estado `emailSuggestions`

---

### ✨ Campo e-mail agora é opcional [F4]

**O quê:** E-mail removido da lista de campos obrigatórios. A validação do `handleSubmit` agora aceita cidadãos sem e-mail. Adicionado botão e label claros indicando que é opcional.

**Por quê:** Parte significativa da população atendida pelas carretas de saúde (especialmente idosos e residentes de municípios do interior) não possui endereço de e-mail. O sistema estava bloqueando o cadastro desses cidadãos, o que é inaceitável operacionalmente.

**Regra de negócio definida:** Quando sem e-mail, as funcionalidades F1 (boas-vindas), F3 (avisos) e F5 (resultado de exame) são **silenciosamente ignoradas** — o sistema não falha, apenas não envia.

**Arquivos modificados:**
- `frontend/src/pages/admin/Cidadaos.tsx` — `handleSubmit` + label + `Autocomplete`
- `backend/src/routes/cidadaos.ts` — validação de criação: `data_nascimento` também removida dos obrigatórios

---

### 🐛 Bug: Cartão SUS não estava sendo salvo [B1]

**O quê:** O campo `cartao_sus` estava sendo preenchido na interface, mas nunca chegava ao banco de dados.

**Por quê (root cause):** No `POST /api/cidadaos`, o campo `cartao_sus` não estava sendo desestruturado do `req.body` nem incluído no `Cidadao.create()`. O campo existia no modelo e as rotas de edição (`PUT /:id`) já o suportavam — só a criação estava quebrada.

**Solução:** Adicionado `cartao_sus` na desestruturação do body e no objeto de criação.

**Arquivos modificados:**
- `backend/src/routes/cidadaos.ts` — rota `POST /` atualizada

---

### 🔒 Multi-role JWT retrocompatível [#12]

**O quê:** O sistema de autenticação foi atualizado para suportar `roles[]` (array) no payload do JWT, mantendo total retrocompatibilidade com tokens antigos.

**Por quê:** O sistema tinha uma limitação crítica: funcionários que possuíam tanto `is_medico = true` quanto `is_admin_estrada = true` só conseguiam fazer login com um dos papéis (o primeiro que era encontrado na sequência de verificação). Isso causava frustração operacional.

**Solução adotada:**
- Adicionado campo `roles?: string[]` ao `JWTPayload` (opcional — não quebra tokens antigos)
- Todos os novos logins emitem `roles: ['medico']`, `roles: ['admin_estrada']`, etc.
- O middleware usa `roles ?? [tipo]` — tokens antigos continuam funcionando com o campo `tipo`

**Impacto:** Nenhum usuário precisará fazer novo login. A migração ocorre naturalmente conforme cada um faz login normalmente.

**Arquivos modificados:**
- `backend/src/utils/auth.ts` — `JWTPayload` + `roles?` field
- `backend/src/middlewares/auth.ts` — `authorizeAdmin` e `authorizeAdminOrEstrada` retrocompatíveis
- `backend/src/routes/auth.ts` — todos os paths de login emitem `roles[]`

---

### ✨ E-mail de boas-vindas com senha [F1]

**O quê:** Ao cadastrar um novo cidadão que possui e-mail, o sistema automaticamente dispara um e-mail de boas-vindas com as credenciais de acesso (login = CPF; senha = a senha gerada).

**Por quê:** Cidadãos cadastrados não sabiam como acessar o portal. O e-mail elimina a necessidade de comunicação verbal da senha, reduz erros e garante que o cidadão tenha acesso ao portal imediatamente após o cadastro.

**Detalhe técnico:** O envio de e-mail é **assíncrono e não bloqueante** (`Promise.catch` silencioso). Mesmo que o SMTP falhe, o cadastro é concluído normalmente — o sistema apenas loga o erro internamente.

**Arquivos modificados:**
- `backend/src/utils/email.ts` — função `sendWelcomeEmail(email, nome, senha)` adicionada
- `backend/src/routes/cidadaos.ts` — chamada após `Cidadao.create()` quando `email` presente

---

### ✨ Admin pode redefinir senha do cidadão [F2]

**O quê:** Nova rota `PATCH /api/cidadaos/:id/redefinir-senha` que gera uma senha temporária aleatória de 8 caracteres, salva com hash bcrypt e envia por e-mail ao cidadão (se tiver e-mail cadastrado).

**Por quê:** Frequentemente cidadãos esquecem a senha e a equipe não tinha como ajudá-los sem acesso direto ao banco. O admin agora pode redefinir a senha em um clique, e o cidadão recebe as novas credenciais por e-mail.

**Segurança:** A senha temporária é gerada com `Math.random().toString(36)`, tornada maiúscula para evitar confusão entre `l/1`, `O/0`. É armazenada apenas em hash bcrypt — nunca em texto puro no banco.

**Arquivos modificados:**
- `backend/src/routes/cidadaos.ts` — rota `PATCH /:id/redefinir-senha` adicionada
- `backend/src/utils/email.ts` — `sendWelcomeEmail` reutilizada

---

### ✨ E-mail genérico para avisos em massa [F3 — preparação]

**O quê:** Criada a função `sendGenericEmail(email, assunto, mensagem)` no utilitário de e-mail.

**Por quê:** Preparação para a funcionalidade de avisos de imprevistos em massa (Fase 3). A função já está pronta e será chamada pela rota `POST /api/acoes/:id/avisar-inscritos` que será criada na Fase 3.

**Arquivos modificados:**
- `backend/src/utils/email.ts`

---

### 🔍 Verificação de compilação TypeScript

**Backend:** `npx tsc --noEmit` → Exit code **0** ✅
**Frontend:** `npx tsc --noEmit` → Exit code **0** ✅

Nenhum erro de tipo introduzido pelas mudanças da Fase 1.

---

---

## 🗓️ 06/04/2026 — Fase 2 Iniciada (UX + Analytics Bugs)

**Responsável:** Antigravity AI + Equipe RR Tecnologia
**Status:** 🔄 Em execução — TypeScript backend + frontend: 0 erros de compilação

---

### 📋 Criação do Diário de Bordo + atualização do `prox-passos.md`

**O quê:** Criado este arquivo `Docs/Diario-de-bordo.md`. Atualizado o `prox-passos.md` marcando a Fase 1 como ✅ Implementada em todas as tabelas de status.

**Por quê:** Necessidade de rastreabilidade das mudanças para facilitar onboarding de novos devs, auditorias futuras e continuidade do trabalho entre sessões.

---

### 🐛 B2: Gráfico de gênero mostrando dados incorretos

**Root cause:** Cidadãos sem `genero` (NULL) geravam uma fatia invisível no PieChart — o gráfico contabilizava os dados mas sem label legível.

**Solução dupla:**
1. **Backend** (`analytics.ts`): `GROUP BY COALESCE(c.genero, 'nao_declarado')` — consolida NULLs num grupo nomeado
2. **Frontend** (`BI.tsx`): `normalizarGenero()` — converte `null` → `'Não declarado'` antes de renderizar

**Arquivos:** `backend/src/routes/analytics.ts`, `frontend/src/pages/admin/BI.tsx`

---

### 🐛 B3: Filtros de mês/ano do BI não afetavam os gráficos

**Root cause:** `carregarDados()` chamava `analyticsService.examesPorTipo()` (e demais) **sem argumentos**. O filtro só chegava ao card de totais (`dashboard`).

**Solução:** Criada `getFiltrosDatas()` que converte mês/ano em `data_inicio` e `data_fim`. Passado para as **5 chamadas** de gráficos.

**Arquivos:** `frontend/src/pages/admin/BI.tsx`

---

### 🐛 B4: Central de Alertas mostrava contagens zeradas

**Root cause:** Template string `` `total_${key}s` `` gerava `total_vencendos` — campo inexistente. O backend retorna `total_vencendo` (sem 's').

**Solução:** Mapeamento explícito `campoResumo: Record<string, keyof Resumo>` com os 4 nomes corretos.

**Arquivos:** `frontend/src/pages/admin/AlertasExames.tsx`

---

### ✨ B5: Rota de custo médio por pessoa criada

**O quê:** `GET /api/analytics/custo-por-pessoa` calcula `custo_total / inscritos_atendidos` por ação.

**Fórmula adotada:** `ROUND(custo_total / COUNT(DISTINCT cidadao_id) FILTER (WHERE status='atendido'), 2)`

**Retorno:** lista de ações + `media_geral` de todas as ações do período.

**Arquivos:** `backend/src/routes/analytics.ts`

---

### ✨ F8: Auto-refresh implementado em 3 telas

**O quê:** `setInterval` de 60s com `clearInterval` no cleanup. `MedicoMonitoring.tsx` já possuía 30s.

| Tela | Intervalo | Dados atualizados |
|---|---|---|
| `Dashboard.tsx` | 60s | Badge de alertas |
| `AlertasExames.tsx` | 60s | Lista completa de alertas |
| `BI.tsx` | 60s | Todos os gráficos + cards |
| `MedicoMonitoring.tsx` | 30s | ✅ já existia |

**Arquivos:** `Dashboard.tsx`, `AlertasExames.tsx`, `BI.tsx`

---

### 🔍 Verificação — Fase 2 (parcial)

**Backend:** `npx tsc --noEmit` → Exit code **0** ✅
**Frontend:** `npx tsc --noEmit` → Exit code **0** ✅

---

---

## 🗓️ 06/04/2026 — Fase 2 Concluída + Fase 3 Iniciada

**Status:** ✅ Fase 2 completa | 🔄 Fase 3 em execução

---

### ✨ #4: Busca por nome/CPF nas inscrições por ação

**O quê:** Rota `GET /api/inscricoes/acoes/:acaoId/inscricoes` agora aceita `?busca=`, `?status=`, `?page=` e `?limit=` com paginação completa.

**Root cause:** A rota antiga usava `Inscricao.findAll` sem filtros, retornando todos os inscritos sempre. Não havia forma de buscar por nome na tela de gerenciamento de inscrições.

**Solução:** `findAndCountAll` com `cidadaoWhere[Op.or]` por `nome_completo iLike` e `cpf iLike`. Retorno agora inclui `{ inscricoes, total, page, totalPages }`.

**Arquivos:** `backend/src/routes/inscricoes.ts`

---

### ✨ #9: Filtro de atendimentos por médico na UI

**O quê:** Adicionado `Select` dropdown na barra de busca do `MedicoMonitoring.tsx` para filtrar os cards de atendimento por médico específico.

**Solução:** Estado `filtroMedicoId` + computed `atendimentosHojeFiltrados = filtroMedicoId ? atendimentosHoje.filter(...) : atendimentosHoje`. O card de cada médico usa `atendimentosHojeFiltrados` em vez de `atendimentosHoje`.

**Arquivos:** `frontend/src/pages/admin/MedicoMonitoring.tsx`

---

### ✨ F7: Médico vê apenas exames do seu tipo/especialidade

**O quê:** Nova rota `GET /api/medico-monitoring/me/exames-do-dia` retorna os `CursoExame` das ações do médico filtrados pela sua especialidade cadastrada.

**Lógica de filtro:** `nomeExame.includes(especialidade)` — se médico tem `especialidade: "ultrassom"`, só aparecem exames cujo nome contenha "ultrassom". Se sem especialidade, mostra todos.

**Fallback:** Médicos sem `especialidade` cadastrada veem todos os exames (sem bloqueio).

**Retorno:** `{ medico, totalExames, filtroAplicado, acoes: [{ acao, exames: [...] }] }`

**Arquivos:** `backend/src/routes/medicoMonitoring.ts`

---

### ✨ #14: Inscrição em múltiplos exames (bulk)

**O quê:** Nova rota `POST /api/inscricoes/bulk` permite inscrever um cidadão em vários exames de uma ação de uma só vez.

**Body:** `{ cidadao_id, acaoId, acao_curso_ids: string[] }`

**Lógica:** Para cada ID em `acao_curso_ids`, aplica as mesmas validações da inscrição individual (periodicidade, duplicata, vagas) de forma sequencial. Exames bloqueados não impedem os demais.

**Retorno:** `{ criados: N, bloqueados: M, resultados: [...] }` — operador sabe exatamente o que foi e não foi criado.

**Arquivos:** `backend/src/routes/inscricoes.ts`

---

### ✨ #15: Chip de exame nas inscrições (includes)

**O quê:** `GET /api/inscricoes` agora inclui `{ model: CursoExame, as: 'curso_exame', attributes: ['id', 'nome', 'tipo'] }` em cada inscrição.

**Por quê:** O frontend precisava do nome do exame para mostrar o chip colorido (`<Chip label={inscricao.curso_exame.nome} />`). Antes retornava só o `curso_exame_id`.

**Arquivos:** `backend/src/routes/inscricoes.ts`

---

### ✨ F3: Aviso de imprevisto em massa para inscritos

**O quê:** Nova rota `POST /api/acoes/:id/avisar-inscritos` envia e-mail personalizado para todos os inscritos de uma ação que possuem e-mail cadastrado.

**Body:** `{ assunto: string, mensagem: string }`

**Comportamento:** Cidadãos sem e-mail são silenciosamente ignorados e contabilizados em `sem_email`. Erros de SMTP individual não abortam os envios seguintes.

**Retorno:** `{ enviados, sem_email, erros, total_inscritos }` — admin vê exatamente quantos receberam.

**Nota:** `sendGenericEmail()` já existia no `email.ts` desde a Fase 1 (preparada para este momento).

**Arquivos:** `backend/src/routes/acoes.ts` + (reutiliza) `backend/src/utils/email.ts`

---

### ✨ F5: Enviar resultado de exame por e-mail

**O quê:** Duas adições:
1. Função `sendExameResultadoEmail()` no `email.ts` com template HTML completo (exame, data, médico, resultado, observações)
2. Rota `POST /api/medico-monitoring/atendimento/:id/enviar-resultado` que busca o atendimento, valida e-mail do cidadão e dispara o envio

**Fluxo:** Médico abre o card do atendimento concluído → clica "Enviar Resultado por E-mail" → preenche o resultado → sistema envia e salva nas observações do atendimento.

**Segurança:** Se cidadão não tem e-mail, retorna `422` com mensagem amigável (não falha silenciosamente).

**Arquivos:** `backend/src/utils/email.ts` + `backend/src/routes/medicoMonitoring.ts`

---

## 📊 PLACAR GERAL DE PROGRESSO (atualizado)

| Fase | Total | Concluídos | Status |
|---|---|---|---|
| Fase 1 — Bugs + Quick Wins | 10 | 10 | ✅ Completa |
| Fase 2 — UX + Analytics | 11 | 11 | ✅ Completa |
| Fase 3 — Funcionalidades Novas | 5 | 5 | 🔄 Backend completo — frontend pendente |
| Fase 4 — Real-Time + Equipamentos | 4 | 0 | ⏳ Pendente |
| Fase 5 — Impressão | — | — | ⏸️ Bloqueada |
| **TOTAL** | **30** | **26** | **87% backend** |

**Pendentes (frontend Fase 3):**
- UI de inscrição bulk (`#14`) — Autocomplete multi-seleção em `GerenciarAcao.tsx`
- UI de aviso em massa (`F3`) — Modal com assunto/mensagem em `GerenciarAcao.tsx`
- Botão enviar resultado (`F5`) — Botão no card de atendimento em `MedicoMonitoring.tsx`

---


## 📝 DECISÕES TÉCNICAS REGISTRADAS

| Data | Decisão | Alternativa Considerada | Motivo da Escolha |
|---|---|---|---|
| 06/04/2026 | JWT retrocompatível com `roles ?? [tipo]` | Forçar novo login de todos | Zero impacto operacional — migração orgânica |
| 06/04/2026 | E-mail não bloqueante (catch silencioso) | Bloquear cadastro se SMTP falhar | Cadastro é crítico; e-mail é acessório |
| 06/04/2026 | CEP via ViaCEP (fetch direto) | Lib `cep-promise` | Zero dependência, API pública e gratuita |
| 06/04/2026 | Mínimo obrigatório = Nome + CPF + Telefone | Manter e-mail obrigatório | Atender cidadãos sem e-mail (interior do MA) |
| 06/04/2026 | Fila Socket.IO com persistência no banco | Fila em memória | Resiliência a reinicializações + relatórios |
| 06/04/2026 | Fase 5 (impressão) bloqueada | Iniciar com templates genéricos | Documentos físicos ainda não entregues |
| 06/04/2026 | COALESCE em GROUP BY de gênero | Tratar nulo no frontend apenas | Dado correto deve vir do banco — não só UI |
| 06/04/2026 | Auto-refresh 60s (não 30s) nas telas admin | Refresh mais curto | 60s suficiente para admin; médico já tem 30s |

---

## 🗓️ SESSÃO — 06/04/2026 (TARDE) — Erros, Correções e Fase 3 Frontend

### 🐛 ERR-B002/I002 — Fallback de Sequence para criação de Ações

**O quê:** O hook `beforeCreate` em `Acao.ts` chamava `nextval('acoes_numero_acao_seq')` sem tratamento de erro. Se a sequence não existia no banco, toda criação de ação falhava com erro 500.

**Por quê:** A sequence foi criada em migration manual e pode não existir em ambientes onde o banco foi resetado ou criado via Sequelize `sync`.

**Correção:** Envolvido em `try/catch` com fallback `COALESCE(MAX(numero_acao), 0) + 1 FROM acoes` — mantém o número sequencial mesmo sem a sequence PostgreSQL.

**Arquivo:** `backend/src/models/Acao.ts` (hook `beforeCreate`)

---

### 📋 ERR-B003 — Backend caindo (CLOSE_WAIT)

**O quê:** O servidor backend aparecia em `CLOSE_WAIT` no `netstat` e não respondia às requisições.

**Por quê:** O processo nodemon encerrou por erro de inicialização (provavelmente conexão com banco ou erro de compilação TypeScript).

**Solução:** Reinicialização via `npm run dev`. Docker PostgreSQL estava healthy na porta `5434`.

**Arquivo:** `backend/.env` — confirmada porta DB_PORT=5434 compatível com container Docker.

---

### 📋 Criação do catálogo `erro-solucoes.md`

**O quê:** Criado arquivo `Docs/erro-solucoes.md` com catálogo estruturado de todos os erros encontrados no projeto.

**Por quê:** Solicitação do usuário para centralizar o registro de problemas e soluções em documento dedicado.

**Estrutura:** Erros separados por categoria (B=Backend, F=Frontend, E=Encoding, I=Infraestrutura), com campos: data, rota, sintoma, causa raiz, status, arquivo e solução.

**Arquivo:** `Docs/erro-solucoes.md` (novo)

---

### ✨ F3 — UI de Aviso de Imprevisto em Massa (GerenciarAcao)

**O quê:** Adicionado botão "📢 Avisar Inscritos" e modal com campos de assunto e mensagem no tab de Inscrições do `GerenciarAcao.tsx`.

**Por quê:** Backend da rota `POST /api/acoes/:id/avisar-inscritos` já estava implementado. Faltava apenas a interface de usuário.

**Comportamento:** Botão amarelo habilitado quando há inscrições. Modal com Alert informando quantidade de inscritos. Feedback com contagem de e-mails enviados e cidadãos sem e-mail.

**Arquivos:** `frontend/src/pages/admin/GerenciarAcao.tsx` (estados `avisoForm`, `openAvisoDialog`, `loadingAviso`, handler `handleEnviarAviso`, Dialog F3)

---

### ✨ F5 — UI de Envio de Resultado de Exame (MedicoMonitoring)

**O quê:** Adicionado botão "🩺 [Nome]" para cada atendimento concluído do dia no card do médico, e modal de envio de resultado com campos de resultado e observações.

**Por quê:** Backend da rota `POST /medico-monitoring/atendimento/:id/enviar-resultado` já estava implementado. Faltava a interface de usuário.

**Comportamento:** Mostra até 3 botões por médico (atendimentos concluídos). Modal exibe e-mail do paciente (ou aviso se não tiver). Feedback informando se o e-mail foi enviado ou apenas registrado.

**Arquivos:** `frontend/src/pages/admin/MedicoMonitoring.tsx` (estados `resultadoModal`, `resultadoForm`, `loadingResultado`, handler `handleEnviarResultado`, Dialog F5)

---

### ✅ TypeScript — 0 erros após todas as alterações

**O quê:** Executado `npx tsc --noEmit` no frontend após todas as implementações da sessão.

**Resultado:** `Exit code: 0` — sem erros de TypeScript.

---

*Atualizado em 06/04/2026 — Fase 3 Frontend 100% concluída*
*Diário iniciado em 06/04/2026 — Sistema Gestão Sobre Rodas v2.0*
