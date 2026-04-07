# 🐛 Catálogo de Erros e Soluções — Sistema Gestão Sobre Rodas

> Documento criado em **06/04/2026**.
> Registra de forma centralizada todos os erros encontrados no projeto, sua causa raiz e a solução aplicada.
> Atualizar sempre que um novo erro for identificado e resolvido.

---

## ÍNDICE

1. [Erros de Backend (API/Banco)](#backend)
2. [Erros de Frontend (UI/React)](#frontend)
3. [Erros de Encoding/UTF-8](#encoding)
4. [Erros de Infraestrutura/DevOps](#infra)

---

## 🔴 ERROS DE BACKEND (API/Banco) {#backend}

---

### ERR-B001 — GET /api/acoes retorna 500 "Erro ao buscar ações"

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Rota** | `GET http://localhost:3001/api/acoes` |
| **Sintoma** | API retorna `{ "error": "Erro ao buscar ações" }` com status 500 |
| **Causa Raiz** | Tabela `acao_curso_exame` existia sem as colunas `periodicidade_meses`, `dias_aviso_vencimento` e `permitir_repeticao`. O Sequelize tentava fazer SELECT dessas colunas (definidas no modelo `AcaoCursoExame.ts`), causando erro `column "periodicidade_meses" does not exist` no PostgreSQL. |
| **Status** | ✅ **Resolvido em 06/04/2026** |
| **Arquivo** | `backend/src/models/AcaoCursoExame.ts` — colunas definidas sem migration correspondente |

**Solução aplicada (SQL direto):**
```sql
ALTER TABLE acao_curso_exame
  ADD COLUMN IF NOT EXISTS periodicidade_meses INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dias_aviso_vencimento INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS permitir_repeticao BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE acoes
  ADD COLUMN IF NOT EXISTS permitir_inscricao_previa BOOLEAN NOT NULL DEFAULT TRUE;
```

**Verificação:**
```bash
curl http://localhost:3001/api/acoes
# Deve retornar: 200 OK com array de ações
```

---

### ERR-B002 — POST /api/acoes falha ao criar nova ação

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Rota** | `POST http://localhost:3001/api/acoes` |
| **Sintoma** | Formulário "Nova Ação" retorna erro ao submeter |
| **Causa Raiz Principal** | O hook `beforeCreate` em `Acao.ts` (linha 188) chama `SELECT nextval('acoes_numero_acao_seq')`. Se a sequence PostgreSQL não existir (banco recém-criado ou migração incompleta), o hook lança exceção e a criação falha |
| **Causa Raiz Secundária** | Se `GET /api/acoes` também falha (ERR-B001), o frontend não consegue carregar a lista de ações e pode mostrar tela de "nenhuma ação" |
| **Status** | ✅ **Resolvido** — fallback implementado em `Acao.ts` |
| **Arquivo** | `backend/src/models/Acao.ts` linha 188–196 |

**Correção no código (fallback robusto):**
```typescript
// backend/src/models/Acao.ts — hook beforeCreate com fallback
beforeCreate: async (acao: Acao) => {
    if (!acao.numero_acao) {
        try {
            const [result] = await sequelize.query(
                "SELECT nextval('acoes_numero_acao_seq') as numero"
            );
            acao.numero_acao = (result[0] as any).numero;
        } catch (e) {
            // Fallback: usar MAX(numero_acao) + 1 se a sequence não existir
            const [maxResult] = await sequelize.query(
                "SELECT COALESCE(MAX(numero_acao), 0) + 1 as numero FROM acoes"
            );
            acao.numero_acao = (maxResult[0] as any).numero;
        }
    }
},
```

---

### ERR-B003 — Backend cai (CLOSE_WAIT / porta inativa)

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Sintoma** | `netstat` mostra porta 3001 em `CLOSE_WAIT` ou `FIN_WAIT_2` — backend não responde |
| **Causa Raiz** | O processo nodemon/ts-node terminou inesperadamente (provavelmente erro de inicialização como falha de conexão com DB) |
| **Status** | ✅ Resolvido (reiniciar o backend) |

**Solução:**
```bash
# Parar qualquer processo na porta 3001
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force

# Reiniciar o backend
cd backend
npm run dev
```

---

### ERR-B004 — Include do Cidadao no F3 (avisar-inscritos) com alias incorreto

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Rota** | `POST /api/acoes/:id/avisar-inscritos` |
| **Sintoma** | Potencial erro de "EagerLoadingError" ao usar `Inscricao.findAll` com `include Cidadao` |
| **Causa Raiz** | O alias `as: 'cidadao'` precisa estar definido em `models/index.ts`. Confirmado: linha 82 de `models/index.ts` define `Inscricao.belongsTo(Cidadao, { as: 'cidadao' })` ✅ |
| **Status** | ✅ Verificado — alias correto |

---

### ERR-B005 — Colunas ausentes no banco vs. modelo Sequelize

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Sintoma** | `GET /api/acoes` falha com 500 — Sequelize tenta consultar colunas que não existem na tabela |
| **Causa Raiz** | Modelo `AcaoCursoExame.ts` foi atualizado com novos campos (`periodicidade_meses`, `dias_aviso_vencimento`, `permitir_repeticao`) mas a migration correspondente não foi aplicada ao banco existente |
| **Status** | ✅ **Resolvido em 06/04/2026** — colunas adicionadas via `ALTER TABLE` |
| **Arquivo** | `backend/src/models/AcaoCursoExame.ts` + tabela `acao_curso_exame` no PostgreSQL |

**Lição aprendida:** Sempre que adicionar campos a um modelo Sequelize existente, executar o `ALTER TABLE` correspondente no banco de desenvolvimento. Não depender apenas do `sync({ alter: true })` em produção.

**Prevenção:** Criar arquivo de migration em `backend/src/migrations/` para cada alteração de schema.

---

## 🟡 ERROS DE FRONTEND (UI/React) {#frontend}

---

### ERR-F001 — Exibição de caracteres corrompidos no console do PowerShell

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Sintoma** | Ao ler arquivos `.tsx`/`.ts` via PowerShell (`Get-Content`), os caracteres acentuados aparecem como `Ã§Ã£o`, `Ã©`, etc. |
| **Causa Raiz** | O PowerShell do Windows usa `Windows-1252` por padrão para exibição. Os arquivos estão corretamente salvos em **UTF-8 sem BOM**. O problema é apenas na *exibição* do PowerShell, não no conteúdo real dos arquivos. |
| **Impacto** | ❌ Apenas visual no terminal — **não afeta** a execução do código pelo Node.js/Vite |
| **Status** | ✅ Não é bug real — comportamento esperado do PowerShell |

**Verificação:**
```powershell
# Forçar UTF-8 no PowerShell para leitura correta:
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Get-Content arquivo.tsx
```

---

### ERR-F002 — "Nenhuma instituição cadastrada" ao acessar Nova Ação

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Sintoma** | Ao abrir `Admin > Ações > Nova Ação`, o frontend exibe tela de "nenhuma instituição cadastrada" mesmo havendo instituições cadastradas |
| **Causa Raiz** | O componente `NovaAcao.tsx` chama `GET /api/instituicoes`. Se o backend estiver caído (ERR-B003) ou com erro, a requisição falha silenciosamente e `instituicoes` fica como array vazio |
| **Status** | 🔄 Depende de resolução do ERR-B001/B003 |
| **Arquivo** | `frontend/src/pages/admin/NovaAcao.tsx` linha 83–96 |

---

### ERR-F003 — Campos sem máscara de entrada (CPF, CNS, telefone, CEP)

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Sintoma** | Campos de CPF e CNS não aplicavam formatação automática durante digitação; usuário podia digitar formatos inválidos |
| **Causa Raiz** | Formulário de cadastro (`Cidadaos.tsx`) usava `onChange` simples sem funções de máscara para CNS e CEP |
| **Status** | ✅ **Resolvido em 06/04/2026** |
| **Arquivo** | `frontend/src/utils/formatters.ts` + `frontend/src/pages/admin/Cidadaos.tsx` |

**Solução:**
```typescript
// formatters.ts — novos formatadores adicionados:

// CNS: 000 0000 0000 0000 (15 dígitos)
export const formatCNS = (cns: string): string => { ... }

// Validação CPF com dígito verificador
export const validateCPF = (cpf: string): boolean => { ... }

// Validação CNS
export const validateCNS = (cns: string): boolean => { ... }

// CEP com máscara progressiva
export const formatCEP = (cep: string): string => { ... }
```

**Aplicado em `Cidadaos.tsx`:**
- CPF: `maxLength: 14` + `formatCPF` ao onChange + `validateCPF` para feedback visual (`error` / `helperText` com ✅/⚠️)
- CNS (Cartão SUS): `maxLength: 19` + `formatCNS` ao onChange + contador de dígitos restantes
- CEP: `maxLength: 9` + `formatCEP` ao onChange

---

## 🔵 ERROS DE ENCODING/UTF-8 {#encoding}

---

### ERR-E001 — Arquivos .ts salvos com encoding inconsistente após edições

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Sintoma** | Após edições feitas pela IA (`multi_replace_file_content`), o PowerShell mostra caracteres corrompidos |
| **Causa Raiz** | As ferramentas de edição da IA escrevem em UTF-8, mas o PowerShell exibe em codificação local (CP1252). O arquivo em si está correto. |
| **Impacto** | ❌ Nenhum — Node.js, TypeScript e Vite leem os arquivos em UTF-8 corretamente |
| **Status** | ✅ Não requer correção no código |

---

### ERR-E002 — Dados de instituições e cursos corrompidos no banco (UTF-8 vs Latin-1)

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Sintoma** | Nomes de instituições exibidos como "Servi??o Nacional..." — no dropdown do formulário Nova Ação |
| **Causa Raiz** | Os dados do seed foram inseridos com encoding incorreto (provavelmente o seed rodou com o PowerShell em CP1252, corrompendo os caracteres especiais antes de inseri-los no PostgreSQL UTF-8) |
| **Status** | ✅ **Resolvido em 06/04/2026** — nomes corrigidos via UPDATE direto |

**Solução aplicada:**
```sql
UPDATE instituicoes SET razao_social = 'SENAI - Serviço Nacional de Aprendizagem Industrial' WHERE razao_social LIKE 'SENAI%';
UPDATE instituicoes SET razao_social = 'SENAC - Serviço Nacional de Aprendizagem Comercial' WHERE razao_social LIKE 'SENAC%';
UPDATE instituicoes SET razao_social = 'SESI - Serviço Social da Indústria' WHERE razao_social LIKE 'SESI%';
UPDATE cursos_exames SET nome = 'Exame Médico Admissional' WHERE nome LIKE 'Exame M%';
UPDATE cursos_exames SET nome = 'Mecânico de Automóveis' WHERE nome LIKE 'Mec%nico%';
UPDATE cursos_exames SET nome = 'Informática Básica' WHERE nome LIKE 'Inform%tica%';
```

**Prevenção:** Ao rodar seeds, garantir que o PowerShell está com encoding UTF-8:
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:PGCLIENTENCODING = "UTF8"
```

---

## 🟠 ERROS DE INFRAESTRUTURA {#infra}

---

### ERR-I001 — Banco de dados PostgreSQL inacessível (Docker)

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Porta** | `localhost:5434` (mapeamento Docker) |
| **Sintoma** | Backend inicia mas todas as queries falham; `GET /api/acoes` retorna 500 |
| **Causa Raiz** | Container Docker do PostgreSQL não está rodando ou parou |
| **Status** | 🔄 Verificar conforme necessário |

**Diagnóstico:**
```bash
# Verificar containers Docker rodando:
docker ps

# Ver logs do container de banco:
docker logs sistema-carretas-db

# Reiniciar se necessário:
docker compose up -d
```

**Variáveis de ambiente (`.env`):**
```
DB_HOST=localhost
DB_PORT=5434
DB_NAME=sistema_carretas
DB_USER=postgres
DB_PASSWORD=postgres
```

---

### ERR-I002 — Sequence `acoes_numero_acao_seq` não existe no banco

| Campo | Detalhe |
|---|---|
| **Data** | 06/04/2026 |
| **Sintoma** | `POST /api/acoes` falha com `error: relation "acoes_numero_acao_seq" does not exist` |
| **Causa Raiz** | Migration que cria a sequence não foi executada, ou o banco foi recriado sem ela |
| **Status** | ✅ Resolvido — fallback implementado no código (ERR-B002) |

**Solução alternativa:**
```sql
-- Conectar ao banco e executar:
CREATE SEQUENCE IF NOT EXISTS acoes_numero_acao_seq
    START WITH 1
    INCREMENT BY 1;

-- Sincronizar com o máximo atual:
SELECT setval('acoes_numero_acao_seq',
    COALESCE((SELECT MAX(numero_acao) FROM acoes WHERE numero_acao IS NOT NULL), 0) + 1,
    false);
```

---

## 📋 TEMPLATE PARA NOVOS ERROS

```markdown
### ERR-[B/F/E/I]XXX — [Título curto]

| Campo | Detalhe |
|---|---|
| **Data** | DD/MM/AAAA |
| **Rota/Componente** | ... |
| **Sintoma** | O que aparece para o usuário |
| **Causa Raiz** | Por que acontece |
| **Status** | 🔄 Em investigação / ✅ Resolvido / ❌ Bloqueado |
| **Arquivo** | Caminho completo + linha |

**Como reproduzir:**
[Passos]

**Solução:**
[Código ou instrução]
```

---

*Índice de categorias: B = Backend | F = Frontend | E = Encoding | I = Infraestrutura*
*Última atualização: 06/04/2026 — 9 erros catalogados, 7 resolvidos*
