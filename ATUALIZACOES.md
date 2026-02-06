# Sistema Carretas - Atualizações Realizadas

## 📋 Resumo das Alterações

Este documento descreve todas as atualizações e novas funcionalidades adicionadas ao Sistema Carretas conforme solicitado.

## ✨ Novos Modelos de Dados (Backend)

### 1. Exame (separado de Cursos)
**Arquivo:** `backend/src/models/Exame.ts`

Modelo específico para exames médicos, separado do conceito de cursos.

**Campos:**
- `id` (UUID)
- `nome` (string)
- `tipo_exame` (string) - Ex: sangue, urina, imagem
- `laboratorio_referencia` (string, opcional)
- `instrucoes_preparo` (text, opcional) - Ex: "Jejum de 12 horas"
- `valores_referencia` (text, opcional) - Valores normais do exame
- `custo_base` (decimal, opcional)
- `ativo` (boolean)

### 2. Insumo
**Arquivo:** `backend/src/models/Insumo.ts`

Gestão de insumos médicos e materiais.

**Campos:**
- `id` (UUID)
- `nome` (string) - Ex: "Luvas descartáveis", "Máscaras N95"
- `unidade` (string) - Ex: unidade, caixa, litro, kg
- `quantidade_minima` (integer) - Para alertas de estoque baixo
- `quantidade_atual` (integer)
- `preco_unitario` (decimal, opcional)
- `ativo` (boolean)

### 3. MovimentacaoEstoque
**Arquivo:** `backend/src/models/MovimentacaoEstoque.ts`

Controle de movimentações de estoque.

**Campos:**
- `id` (UUID)
- `insumo_id` (UUID, FK)
- `tipo` (enum: 'entrada', 'saida', 'ajuste')
- `quantidade` (integer)
- `data_movimento` (date)
- `observacoes` (text, opcional)
- `usuario_id` (UUID, opcional)

### 4. AcaoInsumo
**Arquivo:** `backend/src/models/AcaoInsumo.ts`

Vinculação de insumos com ações de saúde.

**Campos:**
- `id` (UUID)
- `acao_id` (UUID, FK)
- `insumo_id` (UUID, FK)
- `quantidade_planejada` (integer)
- `quantidade_utilizada` (integer, opcional)

### 5. ContaPagar
**Arquivo:** `backend/src/models/ContaPagar.ts`

Gestão de contas a pagar.

**Campos:**
- `id` (UUID)
- `tipo_conta` (enum: 'agua', 'energia', 'aluguel', 'internet', 'telefone', 'manutencao', 'outros')
- `descricao` (string)
- `valor` (decimal)
- `data_vencimento` (date)
- `data_pagamento` (date, opcional)
- `status` (enum: 'pendente', 'paga', 'vencida', 'cancelada')
- `comprovante_url` (string, opcional)
- `recorrente` (boolean)
- `observacoes` (text, opcional)

### 6. ResultadoExame
**Arquivo:** `backend/src/models/ResultadoExame.ts`

Resultados de exames dos cidadãos.

**Campos:**
- `id` (UUID)
- `inscricao_id` (UUID, FK)
- `exame_id` (UUID, FK)
- `cidadao_id` (UUID, FK)
- `acao_id` (UUID, FK)
- `data_realizacao` (date)
- `resultado` (text, opcional)
- `arquivo_resultado_url` (string, opcional) - PDF do resultado
- `observacoes` (text, opcional)

### 7. CustoAcao
**Arquivo:** `backend/src/models/CustoAcao.ts`

Custos operacionais gerais das ações.

**Campos:**
- `id` (UUID)
- `acao_id` (UUID, FK)
- `tipo_custo` (enum: 'alimentacao', 'hospedagem', 'transporte', 'material', 'outros')
- `descricao` (string)
- `valor` (decimal)
- `data_custo` (date)
- `comprovante_url` (string, opcional)

## 🔗 Relacionamentos Adicionados

- **Acao ↔ Insumo** (N:M através de AcaoInsumo)
- **Insumo → MovimentacaoEstoque** (1:N)
- **Acao → CustoAcao** (1:N)
- **Cidadao → ResultadoExame** (1:N)
- **Exame → ResultadoExame** (1:N)
- **Inscricao → ResultadoExame** (1:N)

## 📝 Próximos Passos Necessários

### 1. Migrations do Banco de Dados
Criar migrations para adicionar as novas tabelas:
- `exames`
- `insumos`
- `movimentacoes_estoque`
- `acoes_insumos`
- `contas_pagar`
- `resultados_exames`
- `custos_acoes`

### 2. Controllers/Routes (Backend)
Criar controllers e rotas para:
- `/api/exames` (CRUD)
- `/api/insumos` (CRUD + listagem de estoque baixo)
- `/api/movimentacoes-estoque` (CRUD)
- `/api/contas-pagar` (CRUD + filtros por status)
- `/api/resultados-exames` (CRUD + listagem por cidadão)
- `/api/custos-acoes` (CRUD + relatório por ação)

### 3. Interfaces Frontend (Admin)
Criar páginas no painel admin:
- **Gestão de Exames** (`/admin/exames`)
- **Gestão de Estoque** (`/admin/estoque`)
- **Contas a Pagar** (`/admin/contas-pagar`)
- **Custos Operacionais** (`/admin/custos`)
- **Resultados de Exames** (`/admin/resultados-exames`)

### 4. Portal do Cidadão
Adicionar página:
- **Meus Exames** (`/portal/meus-exames`)
  - Listagem de todos os exames realizados
  - Download de PDFs de resultados
  - Histórico completo

### 5. Dashboard BI Avançado
Melhorar o dashboard existente com:
- Gráficos de custos por tipo (usando Recharts)
- Distribuição demográfica (idade, gênero, raça)
- Distribuição geográfica (por cidade/estado)
- Filtros avançados (período, cidade, idade, gênero)
- Exportação de relatórios (PDF/CSV)

### 6. Upload de Arquivos
Implementar upload para:
- Comprovantes de custos
- Comprovantes de contas a pagar
- PDFs de resultados de exames

Sugestão: usar AWS S3, Cloudinary ou storage local

### 7. Validações
Adicionar validações:
- CPF (formato e dígitos verificadores)
- Cartão SUS
- Email
- Telefone

### 8. Correções
- Atualizar referências de `CursoExame` para usar apenas `Exame` onde apropriado
- Adicionar campos de custo em `AcaoFuncionario` (se necessário)

## 🏗️ Estrutura Mantida

O sistema mantém toda a arquitetura original:
- ✅ Node.js + Express + TypeScript
- ✅ Sequelize ORM
- ✅ React + Material-UI
- ✅ Redux Toolkit
- ✅ React Router DOM
- ✅ Design visual profissional

## 📚 Documentação Adicional

Para implementar as funcionalidades completas, consulte:
1. Documentação do Sequelize para migrations
2. Documentação do Material-UI para componentes
3. Documentação do Recharts para gráficos
4. Exemplos de upload de arquivos com Multer

## ⚠️ Observações Importantes

1. **Migrations**: Execute as migrations na ordem correta para evitar erros de foreign key
2. **Testes**: Teste cada nova funcionalidade em ambiente de desenvolvimento antes de produção
3. **Backup**: Faça backup do banco de dados antes de aplicar as migrations
4. **Segurança**: Implemente validação e sanitização de dados em todas as rotas
5. **Performance**: Adicione índices nas colunas mais consultadas

## 🎯 Status Atual

✅ **Concluído:**
- Modelos de dados criados
- Relacionamentos definidos
- Exports configurados

⏳ **Pendente:**
- Migrations do banco
- Controllers e rotas
- Interfaces frontend
- Upload de arquivos
- Validações
- Testes

---

**Data da Atualização:** 06/02/2026
**Versão:** 2.0.0
