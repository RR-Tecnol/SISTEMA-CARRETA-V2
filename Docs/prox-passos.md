# 📋 PRÓXIMOS PASSOS — Sistema Carretas (Gestão Sobre Rodas)
> Documento atualizado em **06/04/2026** — incorpora feedback original (27/03/2026) + novos itens do feedback da gestão.
> Todas as soluções listadas são **100% gratuitas**, usando bibliotecas open-source ou APIs públicas.

---

## 🗂️ ÍNDICE

1. [Visão Geral das Melhorias](#visao-geral)
2. [FASE 1 — Correções Imediatas (Bugs + Quick Wins)](#fase-1)
3. [FASE 2 — Melhorias de Formulário, UX e Analytics](#fase-2)
4. [FASE 3 — Funcionalidades Novas](#fase-3)
5. [FASE 4 — Sistema de Ficha / Chamada (Real-Time) + Equipamentos](#fase-4)
6. [FASE 5 — Impressão e Documentos ⚠️ AGUARDA PAPÉIS](#fase-5)
7. [Resumo de Dependências Gratuitas](#dependencias)
8. [Mapa de Arquivos por Melhoria](#mapa-arquivos)

---

## 📊 VISÃO GERAL

### Itens Originais (27/03/2026)

| # | Feedback | Complexidade | Fase | Status |
|---|---|---|---|---|
| 1 | Capitalizar automaticamente nome/campos | 🟢 Fácil | 1 | ✅ Implementado |
| 2 | Após cadastro → ir para inscrição de exame | 🟢 Fácil | 1 | ✅ Implementado |
| 3 | Campos opcionais indicados no cadastro | 🟢 Fácil | 1 | ✅ Implementado |
| 4 | Busca por nome (além do CPF) em inscrições | 🟡 Médio | 2 | ✅ Implementado |
| 5 | CEP preenche endereço automaticamente | 🟢 Fácil | 2 | ✅ Implementado |
| 6 | CPF preenche dados do cidadão | 🟡 Médio | 2 | ✅ Implementado |
| 7 | Email sugere @gmail, @hotmail, etc | 🟢 Fácil | 2 | ✅ Implementado |
| 8 | Botão imprimir dados paciente/exame | 🟡 Médio | 5 | ⚠️ Aguarda papéis |
| 9 | Filtrar atendimentos por médico | 🟢 Fácil | 2 | ✅ Implementado |
| 10 | Planilha atendimento mais completa + lógica clínico vs ultrassom | 🔴 Complexo | 3 | ⏳ Pendente |
| 11 | Bug: barra de pesquisa de funcionários recarrega página | 🟢 Fácil | 1 | ✅ Implementado |
| 12 | Bug: login com múltiplos acessos — só 1 funciona | 🔴 Complexo | 1 | ✅ Implementado |
| 13 | Sistema de ficha e chamada de atendimento | 🔴 Complexo | 4 | ⏳ Pendente |
| 14 | Adicionar vários exames de uma vez ao paciente | 🟡 Médio | 3 | ⏳ Pendente |
| 15 | Ver qual exame cada inscrição representa | 🟡 Médio | 3 | ⏳ Pendente |
| 16 | Cadastrar subtipos de ultrassom separados | 🟢 Fácil | 1 | ✅ Implementado |

### Itens Novos — Feedback da Gestão (06/04/2026)

| # | Feedback | Tipo | Complexidade | Fase | Status |
|---|---|---|---|---|---|
| B1 | Cartão SUS não está salvando | 🐛 Bug | 🟢 Fácil | 1 | ✅ Implementado |
| B2 | Gráfico de distribuição por gênero incorreto | 🐛 Bug | 🟡 Médio | 2 | ✅ Implementado |
| B3 | Filtro do BI não funciona | 🐛 Bug | 🟡 Médio | 2 | ✅ Implementado |
| B4 | Sistema de alertas não está funcionando | 🐛 Bug | 🟡 Médio | 2 | ✅ Implementado |
| B5 | Custo médio/pessoa incorreto | 🐛 Bug | 🟡 Médio | 2 | ✅ Implementado |
| F1 | Envio de senha automático após cadastro do cidadão | ✨ Feature | 🟢 Fácil | 1 | ✅ Implementado |
| F2 | Admin poder redefinir senha do cidadão | ✨ Feature | 🟢 Fácil | 1 | ✅ Implementado |
| F3 | Aviso de imprevisto em massa para inscritos | ✨ Feature | 🟡 Médio | 3 | ⏳ Pendente |
| F4 | Campo e-mail opcional (cidadão sem email) | ✨ Feature | 🟡 Médio | 1 | ✅ Implementado |
| F5 | Enviar resultado de exame via e-mail | ✨ Feature | 🟡 Médio | 3 | ⏳ Pendente |
| F6 | Aviso por SMS para fila de espera | ✨ Feature | 🔴 Complexo | 4+ | ⏸️ Aguarda provedor |
| F7 | Médico vê apenas exames do seu tipo/especialidade | ✨ Feature | 🟡 Médio | 2 | ✅ Implementado |
| F8 | Atualização automática das listas sem refresh | ✨ Feature | 🟢 Fácil | 2 | ✅ Implementado |
| F9 | Cadastrar equipamentos eletrônicos por carreta | ✨ Feature | 🔴 Complexo | 4 | ⏳ Pendente |

---

## ✅ FASE 1 — Correções Imediatas (Bugs + Quick Wins) — IMPLEMENTADA

> **Meta:** Resolver o que incomoda no dia a dia. Nenhuma migration de banco (exceto verificação B1).
> **Status:** ✅ **Concluída em 06/04/2026** — TypeScript backend + frontend: 0 erros de compilação.

---

### 1.1 — Capitalizar Automaticamente Campos de Nome [#1]

**Onde mexer:** `frontend/src/pages/admin/Cidadaos.tsx` + criar `frontend/src/utils/formatters.ts`

**Criar `frontend/src/utils/formatters.ts`:**
```ts
export const toTitleCase = (str: string): string =>
  str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
```

**No campo:**
```tsx
onChange={(e) => handleChange('nome_completo', toTitleCase(e.target.value))}
```

**Campos alvo:** `nome_completo`, `nome_mae`, `bairro`, `rua`, `municipio`, `complemento`

**Custo:** R$ 0,00

---

### 1.2 — Bug: Barra de Pesquisa de Funcionários Recarrega a Página [#11]

**Onde mexer:** `frontend/src/pages/admin/Funcionarios.tsx`

```tsx
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  const delayDebounce = setTimeout(() => {
    fetchFuncionarios(searchTerm);
  }, 400);
  return () => clearTimeout(delayDebounce);
}, [searchTerm]);

// Garantir que o campo NÃO está dentro de um <form>
// Se estiver, adicionar: onSubmit={(e) => e.preventDefault()}
```

**Custo:** R$ 0,00

---

### 1.3 — Bug: Login com Múltiplos Acessos — Retrocompatível [#12]

**Onde mexer:** `backend/src/routes/auth.ts` + `backend/src/middlewares/auth.ts` + frontend

**Backend — auth.ts:**
```typescript
// Coletar todos os papéis ativos:
const roles: string[] = [];
if (funcionario.is_medico) roles.push('medico');
if (funcionario.is_admin_estrada) roles.push('admin_estrada');

// Token inclui roles E tipo (retrocompatibilidade — não invalida tokens antigos):
const token = jwt.sign({ id: funcionario.id, roles, tipo: roles[0] }, JWT_SECRET);
return res.json({ token, roles, redirect: `/${roles[0]}` });
```

**Middleware — auth.ts (aceita token antigo E novo):**
```typescript
// Zero impacto para usuários já logados:
const userRoles = payload.roles ?? (payload.tipo ? [payload.tipo] : []);
const allowed = userRoles.some(r => ['admin', 'admin_estrada'].includes(r));
```

**Frontend — sidebar:**
```tsx
const userRoles = useSelector(state => state.auth.user?.roles ?? []);
{userRoles.includes('medico') && <MenuItem>Painel Médico</MenuItem>}
{userRoles.includes('admin_estrada') && <MenuItem>Painel Admin</MenuItem>}
```

**Custo:** R$ 0,00

---

### 1.4 — Cadastrar Subtipos de Ultrassom Separados [#16]

**Onde mexer:** Nenhum arquivo de código — usar a tela que já existe!

Acessar `Admin > Cursos/Exames` e cadastrar:
- Ultrassom Obstétrico
- Ultrassom Abdominal
- Ultrassom Pélvico
- (outros subtipos necessários)

**Nenhuma alteração de código necessária.**

---

### 1.5 — Após Cadastro do Cidadão → Ir para Inscrição [#2]

**Onde mexer:** `frontend/src/pages/admin/Cidadaos.tsx`

```tsx
const response = await api.post('/cidadaos', formData);
enqueueSnackbar('Cidadão cadastrado com sucesso!', {
  variant: 'success',
  action: (
    <Button size="small" color="inherit"
      onClick={() => navigate(`/admin/inscricoes?cidadao_id=${response.data.id}`)}>
      Inscrever em Exame
    </Button>
  ),
  autoHideDuration: 8000,
});
```

**Custo:** R$ 0,00

---

### 1.6 — Campos Opcionais Indicados no Cadastro [#3]

**Onde mexer:** `frontend/src/pages/admin/Cidadaos.tsx`

- **Obrigatórios (manter \*):** `nome_completo`, `cpf`, `telefone`
- **Email:** passa a ser **opcional** (ver F4 abaixo)
- **Opcionais:** todos os outros campos com `label="Campo (opcional)"` + `helperText`

```tsx
<TextField label="Data de Nascimento (opcional)" ... />
<TextField label="Nome da Mãe (opcional)" ... />
<TextField label="CEP (opcional)" helperText="Preenchimento automático do endereço" ... />
<TextField label="Cartão SUS — CNS (opcional)" helperText="Deixe em branco se não souber" ... />
```

**Custo:** R$ 0,00

---

### 1.7 — Bug: Cartão SUS Não Está Salvando [B1] 🆕

**Onde mexer:** `frontend/src/pages/admin/Cidadaos.tsx` + verificar banco de dados

**O que verificar:**
1. Se `cartao_sus` está no `setFormData` e sendo enviado no body do `POST /api/cidadaos`
2. Se a coluna existe no banco (rodar se necessário):
```sql
ALTER TABLE cidadaos ADD COLUMN IF NOT EXISTS cartao_sus VARCHAR(15);
```
3. Se o backend está salvando o campo (verificar se está na whitelist de campos aceitos)

**Custo:** R$ 0,00

---

### 1.8 — Envio de Senha Automático Após Cadastro [F1] 🆕

**Onde mexer:** `backend/src/utils/email.ts` + `frontend/src/pages/admin/Cidadaos.tsx`

**Backend — adicionar função `sendWelcomeEmail`:**
```typescript
export async function sendWelcomeEmail(email: string, nome: string, senha: string) {
  await transporter.sendMail({
    to: email,
    subject: 'Bem-vindo ao Sistema Gestão Sobre Rodas — Suas credenciais',
    html: `
      <h2>Olá, ${nome}!</h2>
      <p>Seu cadastro foi realizado com sucesso.</p>
      <p><strong>Login (CPF):</strong> use seu CPF cadastrado</p>
      <p><strong>Senha:</strong> ${senha}</p>
      <p>Recomendamos que você altere sua senha após o primeiro acesso.</p>
    `
  });
}
```

**Frontend — chamar após cadastro (se cidadão tem email):**
```tsx
if (formData.email) {
  // A senha é passada antes de fazer o hash — só em texto simples aqui
  await api.post('/auth/enviar-boas-vindas', { email: formData.email, nome: formData.nome_completo });
}
```

**Custo:** R$ 0,00 — Nodemailer já está no projeto

---

### 1.9 — Admin Poder Redefinir Senha do Cidadão [F2] 🆕

**Onde mexer:** `backend/src/routes/auth.ts` + `frontend/src/pages/admin/Cidadaos.tsx`

**Backend — nova rota:**
```typescript
// PATCH /api/cidadaos/:id/redefinir-senha
router.patch('/:id/redefinir-senha', authenticate, authorizeAdmin, async (req, res) => {
  // Gera senha temporária aleatória
  const senhaTemp = Math.random().toString(36).slice(-8).toUpperCase();
  const hash = await bcrypt.hash(senhaTemp, 10);

  await Cidadao.update({ senha: hash }, { where: { id: req.params.id } });

  const cidadao = await Cidadao.findByPk(req.params.id);
  if (cidadao?.email) {
    await sendWelcomeEmail(cidadao.email, cidadao.nome_completo, senhaTemp);
  }

  res.json({ senha_temporaria: senhaTemp, email_enviado: !!cidadao?.email });
});
```

**Frontend:** Botão "Redefinir Senha" no CRUD de cidadãos → modal exibindo a senha temporária gerada.

**Custo:** R$ 0,00

---

### 1.10 — Campo E-mail Opcional (Cidadão Sem Email) [F4] 🆕

**Onde mexer:** `frontend/src/pages/admin/Cidadaos.tsx` + `backend/src/routes/auth.ts`

**Frontend:**
```tsx
// Adicionar botão "Paciente sem e-mail" abaixo do campo email:
<Button size="small" onClick={() => setFormData(prev => ({ ...prev, email: '' }))}>
  Paciente não possui e-mail
</Button>

// Validação no submit — remover email como obrigatório:
if (!formData.nome_completo || !formData.cpf || !formData.telefone) {
  enqueueSnackbar('Obrigatório: Nome, CPF e Telefone', { variant: 'warning' });
  return;
}
```

**Regra:** Quando sem email, notificações (F1, F3, F5) são ignoradas silenciosamente. O sistema exibe aviso visual ao operador.

**Custo:** R$ 0,00

---

## 🛠️ FASE 2 — Melhorias de Formulário, UX e Correção de Analytics — ✅ IMPLEMENTADA

> **Meta:** Agilizar cadastro, corrigir dados incorretos nos dashboards.
> **Status:** ✅ **Concluída em 06/04/2026** — TypeScript backend + frontend: 0 erros de compilação.

---

### 2.1 — CEP Preenche Endereço Automaticamente [#5]

**API utilizada:** [ViaCEP](https://viacep.com.br/) — 100% gratuita, sem chave de API.

**Criar arquivo `frontend/src/utils/cep.ts`:**
```tsx
export const buscarCEP = async (cep: string) => {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return null;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await response.json();
    if (data.erro) return null;
    return { rua: data.logradouro, bairro: data.bairro, municipio: data.localidade, estado: data.uf };
  } catch { return null; }
};
```

**No campo CEP — chamar no onBlur:**
```tsx
onBlur={async (e) => {
  const endereco = await buscarCEP(e.target.value);
  if (endereco) {
    setFormData(prev => ({ ...prev, ...endereco }));
    enqueueSnackbar('Endereço preenchido automaticamente!', { variant: 'success' });
  }
}}
```

**Custo:** R$ 0,00

---

### 2.2 — CPF Preenche Dados do Cidadão Automaticamente [#6]

**Backend — adicionar rota:**
```typescript
// GET /api/cidadaos/buscar-cpf/:cpf
router.get('/buscar-cpf/:cpf', authenticate, async (req, res) => {
  const cidadao = await Cidadao.findOne({
    where: { cpf: req.params.cpf },
    attributes: ['id', 'nome_completo', 'data_nascimento', 'telefone', 'email',
                 'cep', 'rua', 'bairro', 'municipio', 'estado', 'nome_mae', 'cartao_sus', 'genero', 'raca']
  });
  if (!cidadao) return res.status(404).json({ message: 'Não encontrado' });
  return res.json(cidadao);
});
```

**Frontend — no campo CPF, após 11 dígitos:**
```tsx
onBlur={async (e) => {
  const cpfLimpo = e.target.value.replace(/\D/g, '');
  if (cpfLimpo.length === 11) {
    try {
      const { data } = await api.get(`/cidadaos/buscar-cpf/${cpfLimpo}`);
      setFormData(prev => ({ ...prev, ...data }));
      enqueueSnackbar('Dados do cidadão carregados!', { variant: 'info' });
    } catch { /* CPF não encontrado — continuar preenchimento normal */ }
  }
}}
```

**Custo:** R$ 0,00

---

### 2.3 — Campo Email Sugere Domínios [#7]

**Onde mexer:** `frontend/src/pages/admin/Cidadaos.tsx`

```tsx
const emailDomains = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com.br', '@icloud.com'];
const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);

const handleEmailChange = (value: string) => {
  handleChange('email', value);
  if (value.includes('@')) { setEmailSuggestions([]); return; }
  if (value.length > 2) setEmailSuggestions(emailDomains.map(d => `${value}${d}`));
};

<Autocomplete freeSolo options={emailSuggestions} value={formData.email}
  onInputChange={(_, val) => handleEmailChange(val)}
  renderInput={(params) => <TextField {...params} fullWidth label="E-mail (opcional)" type="email" />}
/>
```

**Custo:** R$ 0,00 — MUI Autocomplete já está no projeto

---

### 2.4 — Campos Opcionais Indicados no Cadastro [#3]

Ver item 1.6 na Fase 1.

---

### 2.5 — Busca por Nome (além do CPF) em Inscrições [#4]

**Backend:**
```typescript
where: search ? {
  [Op.or]: [
    { nome_completo: { [Op.iLike]: `%${search}%` } },
    { cpf: { [Op.like]: `%${search}%` } },
  ]
} : {}
```

**Front:** substituir campo CPF único no modal de inscrição por campo de busca livre com lista de resultados.

**Custo:** R$ 0,00

---

### 2.6 — Filtrar Atendimentos por Médico [#9]

**Onde mexer:** `frontend/src/pages/admin/MedicoMonitoring.tsx` + backend

```tsx
<TextField select label="Filtrar por médico" value={filtroMedico}
  onChange={(e) => setFiltroMedico(e.target.value)}>
  <MenuItem value="">Todos os médicos</MenuItem>
  {medicos.map(m => <MenuItem key={m.id} value={m.id}>{m.nome}</MenuItem>)}
</TextField>
```

**Custo:** R$ 0,00

---

### 2.7 — Bug: Gráfico de Distribuição por Gênero [B2] 🆕

**Onde mexer:** `backend/src/routes/analytics.ts` + `frontend/src/pages/admin/BI.tsx`

```typescript
// Backend — agrupar por genero corretamente:
SELECT COALESCE(genero, 'nao_declarado') as genero, COUNT(*) as total
FROM cidadaos GROUP BY COALESCE(genero, 'nao_declarado');
```

- Verificar se o frontend mapeia os labels corretamente para o Recharts
- Normalizar valores `null` → `'nao_declarado'` antes de enviar

**Custo:** R$ 0,00

---

### 2.8 — Bug: Filtro do BI Não Funciona [B3] 🆕

**Onde mexer:** `backend/src/routes/analytics.ts` + `frontend/src/pages/admin/BI.tsx`

- Verificar que os filtros `acao_id`, `periodo`, `municipio` chegam ao backend via query params
- Garantir que são aplicados no `where` do Sequelize
- No frontend, confirmar que mudança de filtros dispara nova chamada à API com os params

**Custo:** R$ 0,00

---

### 2.9 — Bug: Sistema de Alertas Não Funciona [B4] 🆕

**Onde mexer:** `backend/src/routes/alertas.ts` + `frontend/src/pages/admin/AlertasExames.tsx`

- Testar `GET /api/alertas` diretamente para ver se retorna dados
- Verificar triggers: estoque abaixo do mínimo, exame com resultado pendente há X dias
- Corrigir format da resposta se o frontend não estiver recebendo no formato esperado

**Custo:** R$ 0,00

---

### 2.10 — Bug: Custo Médio/Pessoa Incorreto [B5] 🆕

**Onde mexer:** `backend/src/routes/analytics.ts`

```typescript
// Evitar divisão por zero:
const custoMedio = totalAtendimentos > 0
  ? totalCustos / totalAtendimentos
  : 0;

// SQL equivalente:
SELECT SUM(valor) / NULLIF(COUNT(atendimentos), 0) as custo_medio FROM ...
```

**Custo:** R$ 0,00

---

### 2.11 — Médico Vê Apenas Exames do Seu Tipo [F7] 🆕

**Onde mexer:** `frontend/src/pages/medico/MedicoPanel.tsx` + `backend/src/routes/medicoMonitoring.ts`

```tsx
// No painel do médico, filtrar inscrições por especialidade:
const inscricoesFiltradas = inscricoes.filter(i =>
  !medicoEspecialidade || i.curso_exame?.tipo === medicoEspecialidade
);
```

**Custo:** R$ 0,00

---

### 2.12 — Atualização Automática Sem Refresh [F8] 🆕

**Onde mexer:** `frontend/src/pages/admin/Dashboard.tsx` + `GerenciarAcao.tsx` + `MedicoPanel.tsx`

```tsx
useEffect(() => {
  fetchData(); // busca inicial
  const interval = setInterval(fetchData, 30000); // re-busca a cada 30s
  return () => clearInterval(interval); // cleanup evita memory leak
}, []);
```

**Custo:** R$ 0,00 — `setInterval` nativo do JavaScript

---

## 🔧 FASE 3 — Funcionalidades Novas — 🔄 EM EXECUÇÃO

> **Meta:** Adicionar features que mudam o fluxo de trabalho operacional.
> **Status:** 🔄 **Iniciada em 06/04/2026.**

---

### 3.1 — Adicionar Vários Exames de Uma Vez ao Paciente [#14]

**Backend — nova rota:**
```typescript
// POST /api/inscricoes/bulk
router.post('/bulk', authenticate, async (req, res) => {
  const { cidadao_id, acao_id, curso_exame_ids } = req.body;
  const inscricoes = await Promise.all(
    curso_exame_ids.map((curso_exame_id: string) =>
      Inscricao.create({ cidadao_id, acao_id, curso_exame_id, status: 'pendente' })
    )
  );
  return res.status(201).json(inscricoes);
});
```

**Frontend:**
```tsx
<Autocomplete multiple options={examesDisponiveis} getOptionLabel={(opt) => opt.nome}
  onChange={(_, selected) => setExamesSelecionados(selected)}
  renderInput={(params) => <TextField {...params} label="Selecionar Exames (um ou mais)" />}
/>
```

**Custo:** R$ 0,00

---

### 3.2 — Ver Qual Exame Cada Inscrição Representa [#15]

**Backend — garantir includes:**
```typescript
const inscricoes = await Inscricao.findAll({
  include: [
    { model: CursoExame, as: 'curso_exame', attributes: ['nome', 'tipo'] },
    { model: Cidadao, as: 'cidadao', attributes: ['nome_completo', 'cpf', 'telefone', 'email'] },
  ]
});
```

**Frontend:**
```tsx
<Typography fontWeight={600}>{inscricao.cidadao?.nome_completo}</Typography>
{inscricao.curso_exame && (
  <Chip label={inscricao.curso_exame.nome} size="small" color="primary" sx={{ ml: 1 }} />
)}
```

**Custo:** R$ 0,00

---

### 3.3 — Fix Lógica Clínico vs Ultrassom + Planilha Completa [#10]

**Fix crítico de lógica:**
```typescript
// ERRADO — não fazer:
await Inscricao.update({ status: 'atendido' }, { where: { cidadao_id } });

// CORRETO — sempre usar o ID único da inscrição:
await Inscricao.update({ status: 'atendido' }, { where: { id: inscricao_id } });
```

**Campos adicionais na planilha de exportação:**
`nome_completo`, `cpf`, `telefone`, `email`, `nome_exame`, `nome_medico`, `hora_inicio`, `hora_fim`, `duracao_minutos`, `numero_prontuario`, `numero_laudo`, `observacoes`, `status`, `data_acao`

**Custo:** R$ 0,00

---

### 3.4 — Aviso de Imprevisto em Massa para Inscritos [F3] 🆕

**Backend — nova rota:**
```typescript
// POST /api/acoes/:id/avisar-inscritos
router.post('/:id/avisar-inscritos', authenticate, authorizeAdmin, async (req, res) => {
  const { assunto, mensagem } = req.body;
  const inscricoes = await Inscricao.findAll({
    where: { acao_id: req.params.id },
    include: [{ model: Cidadao, as: 'cidadao', where: { email: { [Op.ne]: null } } }]
  });

  let enviados = 0;
  for (const ins of inscricoes) {
    if ((ins as any).cidadao?.email) {
      await sendGenericEmail((ins as any).cidadao.email, assunto, mensagem);
      enviados++;
    }
  }

  const semEmail = inscricoes.length - enviados;
  res.json({ enviados, sem_email: semEmail });
});
```

**Frontend:** Botão "Comunicados" na tela de `GerenciarAcao` → modal com assunto + mensagem → exibe `✅ X e-mails enviados, Y cidadãos sem e-mail`.

**Custo:** R$ 0,00 — Nodemailer já está no projeto

---

### 3.5 — Enviar Resultado de Exame Via E-mail [F5] 🆕

**Backend — nova rota:**
```typescript
// POST /api/medico-monitoring/resultado/:id/enviar-email
router.post('/resultado/:id/enviar-email', authenticate, async (req, res) => {
  const resultado = await ResultadoExame.findByPk(req.params.id, {
    include: [
      { model: Cidadao, as: 'cidadao' },
      { model: Exame, as: 'exame' }
    ]
  });
  const cidadao = (resultado as any).cidadao;
  if (!cidadao?.email) {
    return res.json({ sucesso: false, motivo: 'Cidadão sem e-mail cadastrado' });
  }
  await sendExameResultadoEmail(cidadao.email, cidadao.nome_completo, resultado);
  res.json({ sucesso: true });
});
```

**Frontend:** Botão "Enviar por E-mail" ao lado de cada resultado no `MedicoPanel`.

**Custo:** R$ 0,00

---

## 📡 FASE 4 — Sistema de Ficha/Chamada (Real-Time) + Equipamentos

> **Meta:** Digitalizar completamente a fila de atendimento e a gestão de ativos da frota.

---

### 4.1 — Sistema de Ficha e Chamada com Socket.IO [#13]

**Instalação:**
```bash
# Backend:
npm install socket.io

# Frontend:
npm install socket.io-client
```

**Fluxo:**
```
[Recepção — GerenciarFila.tsx]    [TV/Telão — PainelChamada.tsx]    [Médico — MedicoPanel.tsx]
  │                                         │                                  │
  │ Cadastra paciente na fila               │                                  │
  │ → emite 'entrar_fila'                   │                                  │
  │                             Exibe fila em tempo real                       │
  │                                         │            Clica "Chamar próximo"│
  │                             Destaca nome chamado  ←──────────────────────── │
  │                                         │                                  │
  │                                         │              Atende → marca concluído
```

**Backend — modificar `src/index.ts`:**
```typescript
import { Server } from 'socket.io';
import http from 'http';

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.FRONTEND_URL } });

io.on('connection', async (socket) => {
  // Envia fila atual do banco ao conectar
  const filaAtual = await FichaAtendimento.findAll({
    where: { status: 'aguardando', data: today },
    include: [{ model: Cidadao }]
  });
  socket.emit('fila_atualizada', filaAtual);

  socket.on('entrar_fila', async (dados) => {
    const ficha = await FichaAtendimento.create({ ...dados, status: 'aguardando' });
    const filaAtualizada = await getFila();
    io.emit('fila_atualizada', filaAtualizada);
  });

  socket.on('chamar_proximo', async () => {
    const proximo = await FichaAtendimento.findOne({
      where: { status: 'aguardando' }, order: [['hora_entrada', 'ASC']]
    });
    if (proximo) {
      await proximo.update({ status: 'chamado', hora_chamada: new Date() });
      io.emit('paciente_chamado', proximo);
      io.emit('fila_atualizada', await getFila());
    }
  });
});

httpServer.listen(config.port); // substitui app.listen()
```

**Tabela no banco:**
```sql
CREATE TABLE fichas_atendimento (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ficha    INTEGER NOT NULL,
  cidadao_id      UUID REFERENCES cidadaos(id),
  inscricao_id    UUID REFERENCES inscricoes(id),
  acao_id         UUID REFERENCES acoes(id),
  status          VARCHAR(20) DEFAULT 'aguardando',
  hora_entrada    TIMESTAMP DEFAULT NOW(),
  hora_chamada    TIMESTAMP,
  hora_atendimento TIMESTAMP
);
```

**Telas novas:**

| Tela | Arquivo | Usuário |
|---|---|---|
| Painel de Chamada (TV) | `pages/public/PainelChamada.tsx` | TV/telão da recepção (sem auth) |
| Gerenciar Fila | `pages/admin/GerenciarFila.tsx` | Recepcionista |
| Botão Chamar Próximo | integrar no `MedicoPanel.tsx` | Médico |

**Custo:** R$ 0,00

---

### 4.2 — Cadastrar Equipamentos Eletrônicos por Carreta [F9] 🆕

**Onde mexer:** Novo model + nova rota + nova aba na tela `ManutencaoCaminhao.tsx`

**Model `EquipamentoCaminhao`:**
```typescript
// Campos: id (UUID), caminhao_id (FK), nome, tipo, modelo,
//          numero_serie, data_aquisicao, data_ultima_manutencao,
//          status ('ativo'|'em_manutencao'|'inativo'), observacoes
```

**Rotas:**
- `GET /api/caminhoes/:id/equipamentos`
- `POST /api/caminhoes/:id/equipamentos`
- `PUT /api/equipamentos/:id`
- `DELETE /api/equipamentos/:id`

**Frontend:** Nova aba "Equipamentos" em `ManutencaoCaminhao.tsx` com CRUD completo.

**Custo:** R$ 0,00

---

### 4.3 — Aviso por SMS para Fila de Espera [F6] 🆕 ⏸️ AGUARDA PROVEDOR

**Status:** Bloqueado — aguarda decisão sobre qual provedor usar.

**Opções:**
| Provedor | Tipo | Custo |
|---|---|---|
| Z-API | WhatsApp Business | Trial gratuito / ~R$80/mês |
| Twilio | SMS/WhatsApp | Trial US$15 grátis |
| SMSdev | SMS Brasil | Por envio |

**Implementação (quando decidido):**
```typescript
// backend/src/utils/sms.ts
export async function sendSMS(telefone: string, mensagem: string) {
  // Chamar API do provedor escolhido
}

// No Socket.IO, ao chamar próximo:
if (ficha.cidadao?.telefone) {
  await sendSMS(ficha.cidadao.telefone,
    `Olá ${ficha.cidadao.nome_completo}! Você está sendo chamado. Senha: ${ficha.numero_ficha}`);
}
```

---

## 🖨️ FASE 5 — Impressão e Documentos

> ⚠️ **ESTA FASE ESTÁ BLOQUEADA — AGUARDANDO ENVIO DOS DOCUMENTOS/FICHAS FÍSICAS**

### 5.1 — O que JÁ EXISTE no sistema — NÃO MEXER

✅ **Exportação PDF e CSV já funcionam** no backend:
- **Rota:** `GET /api/acoes/:acaoId/export/inscritos?format=pdf|csv`
- **Arquivo:** `backend/src/routes/export.ts`
- **Bibliotecas já instaladas:** `pdfkit`, `csv-writer`, `jspdf`, `html2canvas`

### 5.2 — Pendências — Aguardar Envio da Equipe

- [ ] 📄 Ficha de cadastro do paciente (modelo em papel)
- [ ] 📄 Ficha de inscrição para exame (modelo em papel)
- [ ] 📄 Comprovante de atendimento
- [ ] 📄 Formulário de relatório enviado ao superior

### 5.3 — Tecnologia que Será Usada

```bash
npm install react-to-print
```

**Custo:** R$ 0,00

---

## 📦 RESUMO DE DEPENDÊNCIAS GRATUITAS

| Biblioteca | Uso | Instalação |
|---|---|---|
| `socket.io` (backend) | Fila/chamada em tempo real | `npm install socket.io` |
| `socket.io-client` (frontend) | Conectar ao socket | `npm install socket.io-client` |
| `react-to-print` | Impressão de fichas (Fase 5) | `npm install react-to-print` |
| `jspdf` + `html2canvas` | Gerar PDF (já instalados) | Já no projeto |
| **ViaCEP** (API pública) | CEP automático | Sem instalação — fetch direto |
| **MUI Autocomplete** | Sugestão de emails / multi-exame | Já está no projeto |
| **useEffect + setTimeout** | Debounce de busca | Nativo do React |
| **setInterval** | Auto-refresh sem reload | Nativo do JavaScript |
| **Nodemailer** | E-mails de boas-vindas, resultados, avisos | Já está no projeto |

> ✅ Todas as soluções são **100% gratuitas**.
> ❌ **Nenhum serviço pago necessário** (exceto F6 — SMS — que aguarda decisão).

---

## 🗺️ MAPA DE ARQUIVOS POR MELHORIA

```
frontend/src/
├── pages/
│   ├── admin/
│   │   ├── Cidadaos.tsx         → #1 #2 #3 #5 #6 #7 B1 F1 F2 F4
│   │   ├── Funcionarios.tsx     → #11 bug debounce
│   │   ├── MedicoMonitoring.tsx → #9 F7 filtros
│   │   ├── GerenciarAcao.tsx    → #14 #15 F3 multi-exame + chip + avisar inscritos
│   │   ├── Relatorios.tsx       → #10 planilha completa
│   │   ├── Dashboard.tsx        → F8 auto-refresh
│   │   ├── BI.tsx               → B2 B3 fix gráfico + filtros
│   │   ├── AlertasExames.tsx    → B4 fix alertas
│   │   ├── ManutencaoCaminhao.tsx → F9 aba equipamentos
│   │   └── GerenciarFila.tsx    → NOVO — Fase 4
│   ├── medico/
│   │   └── MedicoPanel.tsx      → F5 F7 F8 + Fase 4 botão chamar
│   └── public/
│       └── PainelChamada.tsx    → NOVO — Fase 4 (TV/telão)
│
└── utils/
    ├── formatters.ts            → NOVO — toTitleCase()
    ├── cep.ts                   → NOVO — buscarCEP() via ViaCEP
    └── socket.ts                → NOVO — socket.io-client

backend/src/
├── index.ts                     → Fase 4: Socket.IO server
├── routes/
│   ├── auth.ts                  → #12 multi-role JWT + F2 redefinir senha
│   ├── cidadaos.ts              → #4 #6 B1 busca nome/CPF + redefinir senha
│   ├── acoes.ts                 → F3 rota avisar-inscritos
│   ├── inscricoes.ts            → #14 bulk + #10 fix lógica status
│   ├── relatorios.ts            → #10 campos extras planilha
│   ├── analytics.ts             → B2 B3 B5 fix gráfico/filtros/custo
│   ├── alertas.ts               → B4 fix alertas
│   ├── medicoMonitoring.ts      → #9 F5 F7 filtros + enviar resultado
│   ├── equipamentos.ts          → NOVO — F9
│   └── fichas.ts                → NOVO — Fase 4
├── models/
│   ├── FichaAtendimento.ts      → NOVO — Fase 4
│   └── EquipamentoCaminhao.ts   → NOVO — F9
├── middlewares/
│   └── auth.ts                  → #12 retrocompatibilidade JWT
└── utils/
    └── email.ts                 → F1 F3 F5 templates de e-mail
```

---

## 🚦 ORDEM DE EXECUÇÃO RECOMENDADA

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SEMANA 1 — FASE 1 (Bugs + Quick Wins + Features Rápidas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ #11  Bug debounce na busca de funcionários
  ✅ #1   Capitalizar campos de nome (formatters.ts)
  ✅ #3   Indicar campos opcionais no cadastro
  ✅ #16  Cadastrar tipos de ultrassom (sem código)
  ✅ #12  Bug login múltiplos acessos (JWT retrocompatível)
  ✅ #2   Redirecionar pós-cadastro para inscrição
  ✅ B1   Fix Cartão SUS não salvando
  ✅ F4   Campo e-mail opcional
  ✅ F1   E-mail de boas-vindas com senha
  ✅ F2   Admin redefinir senha do cidadão

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SEMANA 2 — FASE 2 (UX + Analytics)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ #5   CEP automático (ViaCEP)
  ✅ #7   Sugestão de domínios de email
  ✅ #6   CPF preenche dados do cidadão
  ✅ #4   Busca por nome em inscrições
  ✅ #9   Filtro por médico nos atendimentos
  ✅ B2   Fix gráfico de gênero
  ✅ B3   Fix filtros do BI
  ✅ B4   Fix sistema de alertas
  ✅ B5   Fix custo médio/pessoa
  ✅ F7   Médico vê exames do seu tipo
  ✅ F8   Auto-refresh sem reload

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SEMANA 3 — FASE 3 (Funcionalidades Novas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ #14  Múltiplos exames de uma vez
  ✅ #15  Ver qual exame por inscrição (chip)
  ✅ #10  Fix lógica clínico vs ultrassom
  ✅ #10  Planilha de atendimento mais completa
  ✅ F3   Aviso de imprevisto em massa
  ✅ F5   Enviar resultado de exame por e-mail

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SEMANA 4+ — FASE 4 (Real-Time + Equipamentos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ #13  Instalar Socket.IO (backend + frontend)
  ✅ #13  Criar model FichaAtendimento (banco)
  ✅ #13  Criar tela GerenciarFila.tsx
  ✅ #13  Criar tela PainelChamada.tsx (TV)
  ✅ #13  Botão "Chamar Próximo" no MedicoPanel
  ✅ F9   Model + API + UI de equipamentos por carreta
  ⏸️ F6  SMS fila espera — aguarda provedor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FASE 5 — ⚠️ AGUARDA DOCUMENTOS FÍSICOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⏸️ #8  Botão imprimir — aguardando modelos
  ⏸️     Criar templates de fichas digitais
  ⏸️     Instalar react-to-print
```

---

## 📝 NOTAS IMPORTANTES

1. **Banco de dados** — Fases 1, 2 e 3 **não exigem migration** (apenas verificação de B1 para `cartao_sus`). Fase 4 adiciona 2 tabelas novas (`fichas_atendimento` e `equipamentos_caminhao`).

2. **JWT retrocompatível** — A mudança do #12 não invalida sessões existentes. Tokens antigos (com `tipo`) continuam funcionando. A migração ocorre naturalmente.

3. **E-mail opcional (F4)** — Quando o cidadão não tem e-mail, as features F1, F3 e F5 são silenciosamente ignoradas. O operador vê um aviso visual.

4. **SMS (F6)** — Bloqueado até decisão do provedor (Z-API, Twilio ou SMSdev).

5. **Fase 5** — Não criar templates de impressão antes de receber os documentos físicos.

6. **Testes** — Após cada fase, testar com 5–10 pacientes fictícios antes de ir para produção.

7. **Backup** — Sempre fazer backup antes de qualquer deploy:
```powershell
.\criar-backup.bat
# ou
node backend/create-backup.js
```

---

*Documento atualizado em 06/04/2026 — v2.0 com 30 melhorias planejadas (16 originais + 14 novas)*
