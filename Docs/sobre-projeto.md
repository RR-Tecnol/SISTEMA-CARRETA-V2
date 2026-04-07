# 📚 Documentação Completa — Sistema Gestão Sobre Rodas

> **Versão:** 2.0 — atualizada em **06/04/2026**
> **Repositório:** RR-Tecnol/SISTEMA-CARRETA-V2
> **URL de Produção:** https://gestaosobrerodas.com.br

---

## Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Infraestrutura e Deploy (Docker)](#4-infraestrutura-e-deploy-docker)
5. [Backend — Estrutura Detalhada](#5-backend--estrutura-detalhada)
6. [Frontend — Estrutura Detalhada](#6-frontend--estrutura-detalhada)
7. [Banco de Dados — Modelos e Relacionamentos](#7-banco-de-dados--modelos-e-relacionamentos)
8. [Sistema de Autenticação](#8-sistema-de-autenticação)
9. [Módulos do Sistema](#9-módulos-do-sistema)
10. [Lógica de Programação — Principais Fluxos](#10-lógica-de-programação--principais-fluxos)
11. [Principais Códigos e Como se Conectam](#11-principais-códigos-e-como-se-conectam)
12. [APIs Disponíveis](#12-apis-disponíveis)
13. [Variáveis de Ambiente](#13-variáveis-de-ambiente)
14. [Como Rodar Localmente](#14-como-rodar-localmente)
15. [Scripts Utilitários](#15-scripts-utilitários)

---

## 1. Visão Geral do Projeto

O **Sistema Gestão Sobre Rodas** é uma plataforma web completa para gerenciamento de **ações móveis de saúde e cursos itinerantes** realizados por carretas/caminhões-unidades. Foi desenvolvido para atender organizações que levam serviços de saúde, exames e cursos a municípios do interior.

### Propósito Principal

- Cadastrar e gerenciar **Ações** (missões de saúde ou cursos) com localização, datas, caminhões e equipes
- Permitir que **Cidadãos** se inscrevam nessas ações via portal público
- Fornecer ao **Médico** um painel exclusivo para registrar atendimentos e laudos
- Controlar **Estoque** de insumos médicos e EPIs
- Gerenciar **Contas a Pagar** (gastos de campo, combustível, funcionários)
- Gerar **Relatórios** e **Prestação de Contas** para órgãos contratantes
- Monitorar **frota de caminhões** (manutenção, abastecimento, status)

### Perfis de Usuário

| Perfil | Descrição | Acesso |
|---|---|---|
| `admin` | Administrador completo do sistema | `/admin` — todos os módulos |
| `admin_estrada` | Operador de campo (gestor de ação) | `/admin` — módulos operacionais |
| `medico` | Médico / profissional de saúde | `/medico` — painel clínico |
| `cidadao` | Beneficiário / usuário público | `/portal` — inscrições e perfil |

---

## 2. Stack Tecnológico

### Backend

| Tecnologia | Versão | Função |
|---|---|---|
| **Node.js** | ≥ 20 | Runtime JavaScript |
| **TypeScript** | ^5.3.3 | Tipagem estática |
| **Express.js** | ^4.18.2 | Framework HTTP |
| **Sequelize ORM** | ^6.35.2 | Mapeamento objeto-relacional |
| **PostgreSQL** | 15 (Alpine) | Banco de dados relacional principal |
| **Redis** | 7 (Alpine) | Cache e sessões |
| **bcrypt** | ^6.0.0 | Hash de senhas |
| **jsonwebtoken** | ^9.0.2 | Autenticação via JWT |
| **Helmet** | ^7.1.0 | Headers de segurança HTTP |
| **cors** | ^2.8.5 | Cross-Origin Resource Sharing |
| **express-rate-limit** | ^7.1.5 | Limitação de requisições por IP |
| **Joi** | ^17.11.0 | Validação de entrada de dados |
| **Multer** | ^1.4.5 | Upload de arquivos |
| **PDFKit** | ^0.13.0 | Geração de PDFs |
| **ExcelJS + xlsx** | ^4.4.0 | Exportação para Excel |
| **csv-writer** | ^1.6.0 | Exportação para CSV |
| **Nodemailer** | ^7.0.13 | Envio de e-mails (reset de senha) |
| **Winston** | ^3.11.0 | Logger de aplicação |
| **Bull** | ^4.12.0 | Filas de jobs assíncronos |
| **compression** | ^1.8.1 | Compressão GZIP das respostas |
| **swagger-ui-express** | ^5.0.0 | Documentação interativa da API |

### Frontend

| Tecnologia | Versão | Função |
|---|---|---|
| **React** | ^18.2.0 | Biblioteca de UI |
| **TypeScript** | ^4.9.5 | Tipagem estática |
| **React Scripts (CRA)** | 5.0.1 | Build toolchain |
| **React Router DOM** | ^6.21.0 | Roteamento SPA |
| **Redux Toolkit** | ^2.0.1 | Gerenciamento de estado global |
| **React Redux** | ^9.0.4 | Binding Redux com React |
| **MUI (Material UI)** | ^5.15.0 | Componentes de UI |
| **Emotion** | ^11.11.1 | CSS-in-JS (dependência MUI) |
| **Axios** | ^1.6.2 | Cliente HTTP |
| **React Hook Form** | ^7.49.2 | Gerenciamento de formulários |
| **Recharts** | ^2.15.4 | Gráficos e analytics |
| **Framer Motion** | ^12.34.0 | Animações |
| **Lucide React** | ^0.563.0 | Ícones |
| **React Icons** | ^5.5.0 | Ícones adicionais |
| **notistack** | ^3.0.1 | Notificações (Snackbars) |
| **jsPDF + autotable** | ^4.2.0 | Geração de PDFs no cliente |
| **html2canvas** | ^1.4.1 | Captura de tela para PDF |
| **date-fns** | ^3.0.6 | Manipulação de datas |
| **Swiper** | ^12.1.0 | Carrossel de conteúdo |

### Infraestrutura

| Tecnologia | Função |
|---|---|
| **Docker + Docker Compose** | Containerização de todos os serviços |
| **Nginx** | Proxy reverso + servir frontend em produção |
| **MinIO** (removido) | Armazenamento de objetos (substituído por disco local) |
| **Brevo (SMTP)** | Envio de e-mails transacionais |

---

## 3. Arquitetura do Sistema

```
┌──────────────────────────────────────────────────────┐
│                  CLIENTE (Browser)                   │
│            React SPA (Create React App)              │
│    Porta 80 (produção via Nginx) / 3000 (dev)        │
└────────────────────────┬─────────────────────────────┘
                         │ HTTP/HTTPS (Axios)
                         │ Bearer JWT Token
                         ▼
┌──────────────────────────────────────────────────────┐
│              NGINX (produção)                        │
│        Proxy Reverso / Servir Build React           │
│  /api/* → backend:3001  |  /* → frontend build      │
└────────────────────────┬─────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│              BACKEND (Express + TypeScript)          │
│                    Porta 3001                        │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  Middlewares │  │   Routes     │  │  Services  │  │
│  │  - Helmet   │  │  24 grupos   │  │  - PDF     │  │
│  │  - CORS     │  │  de rotas    │  │  - Email   │  │
│  │  - JWT Auth │  │              │  │  - Reports │  │
│  │  - Rate Lim │  │              │  │            │  │
│  │  - Compress │  │              │  │            │  │
│  └─────────────┘  └──────────────┘  └────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │            Sequelize ORM                      │   │
│  │   28 Models | Hooks | Associations            │   │
│  └──────────────┬───────────────────────────────┘   │
└─────────────────┼────────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        ▼                    ▼
┌───────────────┐    ┌───────────────┐
│  PostgreSQL   │    │    Redis      │
│  (porta 5432) │    │  (porta 6379) │
│  DB Principal │    │  Cache/Filas  │
└───────────────┘    └───────────────┘
```

### Fluxo de Requisição Típico

```
1. Usuário faz ação no React (ex: criar nova ação)
2. React Hook Form valida os dados no frontend
3. Axios envia POST /api/acoes com Bearer token no header
4. Nginx (produção) faz proxy para o backend
5. Middleware authenticate() verifica e decodifica o JWT
6. authorizeAdmin() verifica a tipagem do usuário
7. Joi valida o schema do body
8. O controller cria o registro via Sequelize
9. Hook beforeCreate gera o numero_acao via sequence PostgreSQL
10. Resposta JSON retorna ao frontend
11. Redux atualiza o estado global
12. React re-renderiza com notistack mostrando o sucesso
```

---

## 4. Infraestrutura e Deploy (Docker)

O arquivo `docker-compose.yml` na raiz do projeto define **4 serviços**:

### Serviços

```yaml
# 1. Banco de dados PostgreSQL 15
postgres:
  image: postgres:15-alpine
  container_name: carretas-postgres
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./backend/init-database.sql:/docker-entrypoint-initdb.d/   # SQL inicial

# 2. Cache Redis 7
redis:
  image: redis:7-alpine
  container_name: carretas-redis

# 3. Backend Node.js
backend:
  build: ./backend/Dockerfile
  container_name: carretas-backend
  # NÃO expõe porta externamente — só visível internamente
  # Backend só é acessível via Nginx

# 4. Frontend React (build + Nginx)
frontend:
  build: ./frontend/Dockerfile
  container_name: carretas-frontend
  ports:
    - "80:80"   # Único serviço exposto externamente
```

### Redes

Todos os serviços usam a rede interna `carretas-network` (bridge), garantindo que o backend **nunca seja diretamente acessível** da internet.

### Volumes Persistentes

- `postgres_data` — dados do banco
- `redis_data` — dados de cache
- `uploads_data` — arquivos enviados (comprovantes, fotos)

### Nginx (frontend)

O arquivo `frontend/nginx.conf` configura:
- Servir o build React estático
- Fazer proxy de `/api/*` para `http://backend:3001`
- Suporte a rotas SPA (fallback para `index.html`)

---

## 5. Backend — Estrutura Detalhada

```
backend/
├── src/
│   ├── index.ts              ← Ponto de entrada, middlewares, rotas
│   ├── config/
│   │   ├── index.ts          ← Configurações globais (porta, DB, JWT)
│   │   ├── database.ts       ← Instância Sequelize + pool de conexões
│   │   ├── redis.ts          ← Conexão Redis
│   │   └── upload.ts         ← Configuração Multer (uploads)
│   ├── models/               ← 28 modelos Sequelize (ver Seção 7)
│   ├── routes/               ← 24 grupos de rotas (ver Seção 12)
│   ├── middlewares/
│   │   ├── auth.ts           ← JWT authenticate, authorizeAdmin, authorizeAdminOrEstrada
│   │   ├── cache.ts          ← Middleware Redis cache
│   │   ├── errorHandler.ts   ← Handler global de erros
│   │   └── validation.ts     ← Wrapper Joi validation
│   ├── services/
│   │   ├── pdf/              ← Geração de relatórios PDF
│   │   └── relatorios/       ← Lógica de relatórios
│   └── utils/
│       ├── auth.ts           ← generateToken, verifyToken (JWT)
│       ├── email.ts          ← sendPasswordResetEmail
│       └── validators.ts     ← validarCPF, etc.
```

### Ponto de Entrada — `src/index.ts`

O arquivo `index.ts` é o coração do backend. Ele:

1. **Registra middlewares** na ordem correta:
   ```typescript
   app.use(helmet(...));          // Headers de segurança
   app.use(compression());        // GZIP
   app.use('/uploads', static()); // Arquivos estáticos (antes do CORS)
   app.use(cors({ origin: config.frontend.url, credentials: true }));
   app.use(rateLimit({ max: 3000, windowMs: 15min })); // Rate limiting
   app.use(express.json());
   ```

2. **Registra todas as rotas** sob o prefixo `/api/`:
   ```typescript
   app.use('/api/auth', authRoutes);
   app.use('/api/acoes', acoesRoutes);
   // ... 22 outros grupos de rotas
   ```

3. **Roda um job automático** a cada hora que verifica manutenções de caminhão vencidas e libera o veículo automaticamente:
   ```typescript
   async function liberarManutencoesvencidas() {
       // Busca manutenções com data_conclusao < hoje e status ativo
       // Marca como 'concluida'
       // Se não há outras manutenções ativas e o caminhão não está em ação,
       // muda status do caminhão para 'disponivel'
   }
   setInterval(liberarManutencoesvencidas, 60 * 60 * 1000); // 1 hora
   ```

4. **Roda migrações inline** ao iniciar (ADD COLUMN IF NOT EXISTS), garantindo compatibilidade sem reiniciar o banco.

### Configuração do Banco — `src/config/database.ts`

```typescript
export const sequelize = new Sequelize({
    dialect: 'postgres',
    pool: { max: 20, min: 2, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true }, // snake_case automático
});
```

O pool de conexões com **máximo de 20 conexões simultâneas** suporta carga de produção sem saturar o PostgreSQL.

---

## 6. Frontend — Estrutura Detalhada

```
frontend/src/
├── index.tsx             ← Ponto de entrada, Provider Redux, BrowserRouter
├── App.tsx               ← Definição de todas as rotas
├── theme.ts              ← Tema MUI customizado
├── components/
│   ├── common/           ← Componentes reutilizáveis
│   └── layout/
│       ├── PublicLayout.tsx   ← Layout com header público
│       ├── CitizenLayout.tsx  ← Layout do portal do cidadão
│       ├── AdminLayout.tsx    ← Layout com sidebar do admin
│       └── MedicoLayout.tsx   ← Layout do painel médico
├── pages/
│   ├── public/           ← Home, Acoes, Cadastro, Login, EsqueciSenha...
│   ├── citizen/          ← Portal, MeuPerfil, MinhasInscricoes, AcoesDisponiveis
│   ├── admin/            ← Todos os módulos administrativos (ver abaixo)
│   └── medico/           ← MedicoPanel, MedicoAcoes
├── services/
│   ├── api.ts            ← Instância Axios configurada (interceptors JWT)
│   ├── analytics.ts      ← Chamadas de analytics
│   ├── contasPagar.ts    ← Serviço de contas a pagar
│   ├── estoque.ts        ← Serviço de estoque
│   ├── medicoMonitoring.ts ← Serviço do painel médico
│   └── relatorios.ts     ← Serviço de relatórios
└── store/
    ├── index.ts          ← Configuração Redux store
    └── slices/
        └── authSlice.ts  ← Estado de autenticação global
```

### Roteamento — `App.tsx`

O React Router v6 organiza as rotas em **4 grupos de layout**:

```typescript
// Rotas públicas (sem autenticação)
<Route path="/" element={<PublicLayout />}>
    <Route index element={<Home />} />
    <Route path="acoes" element={<Acoes />} />
    <Route path="cadastro" element={<Cadastro />} />
    <Route path="login" element={<Login />} />
    <Route path="recuperar-senha" element={<EsqueciSenha />} />
    <Route path="noticias/:id" element={<NoticiaDetalhe />} />
</Route>

// Portal do Cidadão
<Route path="/portal" element={<CitizenLayout />}>
    <Route index element={<Portal />} />
    <Route path="acoes" element={<AcoesDisponiveis />} />
    <Route path="perfil" element={<MeuPerfil />} />
    <Route path="inscricoes" element={<MinhasInscricoes />} />
</Route>

// Painel Administrativo
<Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="acoes" element={<AdminAcoes />} />
    <Route path="acoes/nova" element={<NovaAcao />} />
    <Route path="acoes/:id" element={<GerenciarAcao />} />
    <Route path="caminhoes" element={<Caminhoes />} />
    <Route path="caminhoes/:id/manutencao" element={<ManutencaoCaminhao />} />
    <Route path="funcionarios" element={<Funcionarios />} />
    <Route path="funcionarios/:id/anotacoes" element={<FuncionarioAnotacoes />} />
    <Route path="contas-pagar" element={<ContasPagar />} />
    <Route path="estoque" element={<Estoque />} />
    <Route path="alertas" element={<AlertasExames />} />
    <Route path="medicos" element={<MedicoMonitoring />} />
    <Route path="prestacao-contas" element={<PrestacaoContas />} />
    <Route path="relatorios" element={<Relatorios />} />
    // ... outros
</Route>

// Painel Médico
<Route path="/medico" element={<MedicoLayout />}>
    <Route index element={<MedicoAcoes />} />
    <Route path="acao/:acaoId" element={<MedicoPanel />} />
</Route>
```

### Cliente HTTP — `services/api.ts`

```typescript
// Detecta automaticamente se está em localhost ou em produção
const isLocal = window.location.hostname === 'localhost';
export const API_URL = process.env.REACT_APP_API_URL 
    || (isLocal ? 'http://localhost:3001/api' : '/api');

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// Interceptor: adiciona Bearer token em toda requisição
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Interceptor: redireciona para /login em caso de 401
api.interceptors.response.use(null, (error) => {
    if (error.response?.status === 401 && !isLoginPage) {
        localStorage.removeItem('token');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
```

### Estado Global — Redux

O sistema usa Redux Toolkit com um único slice de autenticação:

```typescript
// authSlice.ts
interface AuthState {
    user: { id, nome, email, tipo: 'cidadao' | 'admin' | 'medico' | 'admin_estrada' } | null;
    token: string | null;
    isAuthenticated: boolean;
}

// Estado inicial é restaurado do localStorage (sessão persistente)
const initialState: AuthState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
};

// Actions: loginSuccess (salva no localStorage) | logout (limpa localStorage)
```

---

## 7. Banco de Dados — Modelos e Relacionamentos

O banco é **PostgreSQL 15** gerenciado pelo **Sequelize ORM** com 28 modelos.

### Mapa de Modelos

| Modelo | Tabela | Descrição |
|---|---|---|
| `Cidadao` | `cidadaos` | Usuários públicos / beneficiários |
| `Funcionario` | `funcionarios` | Equipe interna (motoristas, médicos, etc.) |
| `Instituicao` | `instituicoes` | Entidades contratantes / parceiras |
| `Acao` | `acoes` | Missão de saúde ou curso itinerante |
| `CursoExame` | `cursos_exames` | Tipos de serviços/exames disponíveis |
| `Inscricao` | `inscricoes` | Inscrição de cidadão em uma ação |
| `Caminhao` | `caminhoes` | Frota de veículos |
| `Insumo` | `insumos` | Itens de estoque (EPIs, medicamentos) |
| `MovimentacaoEstoque` | `movimentacoes_estoque` | Entradas e saídas de estoque |
| `ContaPagar` | `contas_pagar` | Contas e despesas operacionais |
| `Abastecimento` | `abastecimentos` | Registros de abastecimento de caminhão |
| `ManutencaoCaminhao` | `manutencoes_caminhao` | Manutenções agendadas/realizadas |
| `AtendimentoMedico` | `atendimentos_medicos` | Consulta/atendimento registrado pelo médico |
| `PontoMedico` | `pontos_medicos` | Ponto de trabalho diário do médico |
| `ResultadoExame` | `resultados_exames` | Resultado de exame do cidadão |
| `Exame` | `exames` | Catálogo de exames disponíveis |
| `Noticia` | `noticias` | Notícias/comunicados do sistema |
| `Notificacao` | `notificacoes` | Alertas e notificações do sistema |
| `ConfiguracaoCampo` | `configuracoes_campo` | Campos customizáveis de formulários |
| `ConfiguracaoSistema` | `configuracoes_sistema` | Parâmetros globais do sistema |
| `FuncionarioAnotacao` | `funcionario_anotacoes` | Anotações sobre funcionários |
| `AcaoCaminhao` | `acao_caminhoes` | **Pivot** Ação ↔ Caminhão (N:M) |
| `AcaoFuncionario` | `acao_funcionarios` | **Pivot** Ação ↔ Funcionário (N:M) |
| `AcaoCursoExame` | `acao_cursos_exames` | **Pivot** Ação ↔ Serviços (N:M) |
| `AcaoInsumo` | `acao_insumos` | **Pivot** Ação ↔ Insumos (N:M) |
| `CustoAcao` | `custo_acoes` | Custos calculados por ação |
| `EstoqueCaminhao` | `estoque_caminhao` | Estoque embarcado no caminhão |

### Diagrama de Relacionamentos

```
Instituicao ──1:N──► Acao ──1:N──► Inscricao ◄──N:1── Cidadao
                       │                                    │
                       ├──N:M──► Caminhao                  └──1:N──► ResultadoExame
                       │  (via AcaoCaminhao)                              │
                       │                                             N:1──┤
                       ├──N:M──► Funcionario                         Exame
                       │  (via AcaoFuncionario)
                       │
                       ├──N:M──► CursoExame
                       │  (via AcaoCursoExame)
                       │
                       ├──N:M──► Insumo
                       │  (via AcaoInsumo)
                       │
                       ├──1:N──► ContaPagar
                       ├──1:N──► Abastecimento
                       ├──1:N──► Notificacao
                       ├──1:N──► Noticia
                       ├──1:N──► PontoMedico ──1:N──► AtendimentoMedico
                       └──1:N──► AtendimentoMedico ◄──N:1── Funcionario

Caminhao ──1:N──► ManutencaoCaminhao
         ──1:N──► Abastecimento
         ──1:N──► ContaPagar

Funcionario ──1:N──► PontoMedico
            ──1:N──► AtendimentoMedico
            ──1:N──► FuncionarioAnotacao
```

### Modelo Central — `Acao`

A Ação é o objeto mais importante do sistema. Seus campos:

```typescript
// src/models/Acao.ts
interface AcaoAttributes {
    id: string;               // UUID primary key
    numero_acao?: number;     // Auto-gerado via sequence PostgreSQL
    nome: string;
    instituicao_id: string;   // FK → Instituicao
    tipo: 'curso' | 'saude'; // Tipo da ação
    municipio: string;
    estado: string;           // UF (2 chars)
    data_inicio: Date;
    data_fim: Date;
    status: 'planejada' | 'ativa' | 'concluida';
    local_execucao: string;
    vagas_disponiveis: number;
    distancia_km?: number;    // Distância de São Luís
    preco_combustivel_referencia?: number;
    campos_customizados?: Record<string, any>; // JSONB flexível
    permitir_inscricao_previa?: boolean;
    // Campos para Prestação de Contas
    numero_processo?: string;
    lote_regiao?: string;
    numero_cnes?: string;      // CNES da unidade móvel
    responsavel_tecnico_id?: string; // FK → Funcionario
    meta_mensal_total?: number;
    intercorrencias?: string;
}
```

**Hook automático:** Antes de criar uma ação, o Sequelize executa:
```typescript
beforeCreate: async (acao) => {
    if (!acao.numero_acao) {
        const [result] = await sequelize.query(
            "SELECT nextval('acoes_numero_acao_seq') as numero"
        );
        acao.numero_acao = result[0].numero;
    }
}
```
Isso garante numeração sequencial única (tipo "N° 001", "N° 002"...) via sequence nativa do PostgreSQL.

---

## 8. Sistema de Autenticação

### Arquitetura JWT

```
Login Request (CPF + Senha)
         │
         ▼
┌─────────────────────────────────────────────────┐
│           POST /api/auth/login                  │
│                                                 │
│  1. Busca como MÉDICO (is_medico = true)        │
│     → verifica bcrypt(senha, medico.senha)      │
│     → gera token com tipo: 'medico'             │
│     → redirect: '/medico'                       │
│                                                 │
│  2. Busca como ADMIN ESTRADA (is_admin_estrada) │
│     → verifica bcrypt(senha, admin.senha)       │
│     → gera token com tipo: 'admin_estrada'      │
│     → redirect: '/admin'                        │
│                                                 │
│  3. Valida CPF matematicamente (algoritmo)      │
│     → busca como CIDADÃO                        │
│     → verifica bcrypt(senha, cidadao.senha)     │
│     → se tipo = 'admin' → redirect '/admin'     │
│     → se tipo = 'cidadao' → redirect '/portal' │
└─────────────────────────────────────────────────┘
         │
         ▼
    JWT com payload:
    { id, tipo, email, iat, exp }
```

> **Detalhe importante:** Médico e Admin Estrada são verificados **antes** da validação matemática do CPF, pois seus logins podem ser strings arbitrárias (não necessariamente CPFs válidos).

### Middlewares de Autorização

```typescript
// Qualquer usuário autenticado
authenticate(req, res, next)

// Apenas admin (operações financeiras sensíveis)
authorizeAdmin(req, res, next)
// → req.user.tipo === 'admin'

// Admin ou Admin Estrada (maioria das rotas do painel)
authorizeAdminOrEstrada(req, res, next)
// → req.user.tipo === 'admin' || 'admin_estrada'
```

### Token no Frontend

O token JWT é:
1. Salvo no `localStorage` ao fazer login
2. Injetado automaticamente em **todas as requisições** via interceptor Axios
3. Verificado: se 401, limpa localStorage e redireciona para `/login`
4. O estado Redux é re-hidratado do localStorage ao recarregar a página

### Recuperação de Senha

```
POST /api/auth/forgot-password
  → Gera token aleatório (crypto.randomBytes)
  → Salva reset_password_token + reset_password_expires (1h) no banco
  → Envia e-mail com link via Nodemailer + Brevo SMTP

POST /api/auth/reset-password
  → Valida token e expiração
  → Atualiza senha com bcrypt.hash(senha, 10)
  → Limpa token do banco
```

---

## 9. Módulos do Sistema

### 9.1 Módulo de Ações (`/admin/acoes`)

**Responsabilidade:** Criar, editar e gerenciar Ações (missões de saúde/cursos).

**Páginas envolvidas:**
- `NovaAcao.tsx` — Formulário de criação (tipo, local, datas, vagas, etc.)
- `Acoes.tsx` — Listagem com filtros e paginação
- `GerenciarAcao.tsx` — Painel completo da ação com abas:
  - Informações gerais
  - Inscrições de cidadãos
  - Caminhões vinculados
  - Equipe (funcionários)
  - Cursos/Exames da ação
  - Abastecimentos
  - Custos da ação

**API:** `POST/GET/PUT/DELETE /api/acoes/*`

### 9.2 Módulo de Cidadãos (`/admin/cidadaos`)

**Responsabilidade:** CRUD de cidadãos, visualização de histórico médico.

- Busca por nome, CPF, município
- Campos customizáveis por ação (JSONB)
- Histórico de inscrições
- Foto de perfil (upload via Multer)
- Dados LGPD: consentimento, data, IP

**Arquivo:** `Cidadaos.tsx` (80KB — o maior componente do admin)

### 9.3 Módulo de Estoque (`/admin/estoque`)

**Responsabilidade:** Controle completo de insumos médicos e EPIs.

- Cadastro de insumos com categorias: `EPI | MEDICAMENTO | MATERIAL_DESCARTAVEL | EQUIPAMENTO | OUTROS`
- Movimentações de entrada/saída com rastreabilidade
- Alerta de estoque mínimo
- Vinculação de insumos a Ações
- Controle de lote, validade, fornecedor, nota fiscal

**Arquivo:** `Estoque.tsx` (106KB — maior arquivo do frontend)

### 9.4 Módulo de Contas a Pagar (`/admin/contas-pagar`)

**Responsabilidade:** Gestão financeira de despesas operacionais.

Tipos de conta suportados:
```
Habituais:  agua | energia | aluguel | internet | telefone
Estrada:    pneu_furado | troca_oleo | abastecimento | manutencao_mecanica
            reboque | lavagem | pedagio
Pessoal:    funcionario
Outros:     manutencao | espontaneo | outros
```

Status: `pendente | paga | vencida | cancelada`

Funcionalidades:
- Upload de comprovante de pagamento
- Contas recorrentes (mensais)
- Vinculação a Ação e/ou Caminhão
- Vencimento automático (job)

### 9.5 Módulo de Caminhões (`/admin/caminhoes`)

**Responsabilidade:** Gestão da frota de veículos.

Status possíveis: `disponivel | em_manutencao | em_acao`

Funcionalidades:
- Cadastro (placa, modelo, ano, autonomia, capacidade)
- Histórico de abastecimentos
- Agendamento e acompanhamento de manutenções
- **Job automático** que libera caminhões com manutenção vencida (roda a cada 1h)
- Vinculação a Ações ativas

### 9.6 Módulo de Funcionários (`/admin/funcionarios`)

**Responsabilidade:** Gestão da equipe operacional.

Funcionalidades:
- Cadastro com cargo, CPF, especialidade, custo diária
- Flag `is_medico` — ativa login no painel médico
- Flag `is_admin_estrada` — ativa login como gestor de campo
- CRM do médico (para Prestação de Contas)
- Anotações por funcionário
- Vinculação a Ações (N:M via AcaoFuncionario)

### 9.7 Módulo Médico (`/medico`)

**Responsabilidade:** Painel exclusivo do profissional de saúde.

**Páginas:**
- `MedicoAcoes.tsx` — Lista de ações nas quais o médico está vinculado
- `MedicoPanel.tsx` — Painel da ação:
  - Registro de Ponto (entrada/saída/intervalo)
  - Lista de cidadãos inscritos
  - Registro de Atendimento Médico por cidadão
  - Resultados de exames
  - Histórico clínico do cidadão

**API:** `GET/POST /api/medico-monitoring/*`

### 9.8 Módulo de Prestação de Contas (`/admin/prestacao-contas`)

**Responsabilidade:** Geração de relatórios para órgãos contratantes.

Campos extras da Ação usados:
- `numero_processo` — Número do contrato/processo
- `lote_regiao` — Lote/região de atuação
- `numero_cnes` — CNES da unidade móvel
- `responsavel_tecnico_id` — FK para o RT (médico)
- `meta_mensal_total` — Meta de atendimentos contratual
- `intercorrencias` — Ocorrências do período

Exporta relatórios em PDF e Excel.

### 9.9 Módulo de Relatórios (`/admin/relatorios`)

**Responsabilidade:** Analytics e exportação de dados.

Formatos de exportação: PDF, Excel (.xlsx), CSV

Relatórios disponíveis:
- Atendimentos por período
- Atendimentos por ação
- Custos por ação/cidade
- Inscrições por ação
- Estoque atual
- Contas a pagar por status

### 9.10 Módulo de Alertas de Exames (`/admin/alertas`)

**Responsabilidade:** Monitorar exames com resultados críticos ou pendentes.

- Lista exames com resultados não comunicados
- Filtra por tipo, data, status
- Permite registrar ação tomada

### 9.11 Módulo de Notícias (`/admin/noticias`)

**Responsabilidade:** CMS simples para comunicados e notícias.

- Criação/edição de notícias
- Vinculação a Ação específica
- Cards exibidos no portal público

### 9.12 Portal do Cidadão (`/portal`)

**Responsabilidade:** Interface pública para beneficiários.

- Ver ações disponíveis na sua região
- Inscrever-se em ações/cursos
- Acompanhar inscrições
- Editar perfil (foto, endereço, etc.)

---

## 10. Lógica de Programação — Principais Fluxos

### Fluxo 1: Criar uma Nova Ação

```
Admin abre /admin/acoes/nova
    │
    ├─ Preenche formulário: nome, tipo, município, datas, vagas
    ├─ Seleciona Instituição (GET /api/instituicoes)
    ├─ Define campos customizados opcionais (JSONB)
    │
    ▼
POST /api/acoes
    │
    ├─ authenticate() → verifica JWT
    ├─ authorizeAdmin() → garante que é admin
    ├─ Joi valida o body
    │
    ▼
Sequelize cria Acao no banco
    │
    ├─ Hook beforeCreate: gera numero_acao via sequence PostgreSQL
    │      SELECT nextval('acoes_numero_acao_seq')
    │
    ▼
Resposta: { id, numero_acao, nome, ... }
    │
    ▼
Frontend: notistack.success("Ação criada com sucesso!")
          Redireciona para /admin/acoes/:id (GerenciarAcao)
```

### Fluxo 2: Inscrição de Cidadão em uma Ação

```
Cidadão autenticado abre /portal/acoes
    │
    ├─ Lista ações disponíveis (GET /api/acoes?status=ativa)
    ├─ Seleciona uma ação
    │
    ▼
POST /api/inscricoes
    { acao_id, curso_exame_id?, campos_customizados: {} }
    │
    ├─ authenticate() → verifica JWT tipo='cidadao'
    ├─ Verifica vagas disponíveis
    ├─ Verifica se já está inscrito (unicidade cidadao+acao)
    │
    ▼
Sequelize cria Inscricao
    │
    ├─ Status inicial: 'inscrito'
    │
    ▼
Admin vê inscrição em /admin/acoes/:id (aba Inscrições)
    ├─ Pode confirmar, cancelar, marcar presença
    │
    ▼
Médico registra atendimento em /medico/acao/:acaoId
```

### Fluxo 3: Atendimento Médico

```
Médico faz login com login_cpf + senha
    │
    ▼
Redireciona para /medico
    │
    ├─ Lista ações vinculadas (GET /api/medico-monitoring/acoes)
    │
    ▼
Médico seleciona ação → /medico/acao/:acaoId
    │
    ├─ Registra Ponto (POST /api/medico-monitoring/ponto)
    │      tipo: 'entrada' | 'saida' | 'intervalo_inicio' | 'intervalo_fim'
    │
    ├─ Lista cidadãos inscritos
    │
    ├─ Seleciona cidadão → abre ficha clínica
    │
    ├─ Registra Atendimento (POST /api/medico-monitoring/atendimento)
    │      { cidadao_id, acao_id, ponto_id, tipo_atendimento,
    │        queixas, diagnostico, procedimentos, medicamentos,
    │        encaminhamento, observacoes }
    │
    ├─ Registra Resultado de Exame (POST /api/cidadaos/:id/exames)
    │
    ▼
Admin visualiza em /admin/medicos (MedicoMonitoring)
    ├─ Pontos de todos os médicos
    ├─ Quantidade de atendimentos
    ├─ Indicadores por ação
```

### Fluxo 4: Movimentação de Estoque

```
Admin abre /admin/estoque
    │
    ├─ Lista insumos (GET /api/estoque/insumos)
    │      Indicador visual: verde (normal) / amarelo (baixo) / vermelho (crítico)
    │
    ├─ Registra ENTRADA de insumo:
    │      POST /api/estoque/movimentacoes
    │      { tipo: 'entrada', insumo_id, quantidade, motivo, nota_fiscal }
    │      → atualiza quantidade_atual += quantidade
    │
    ├─ Registra SAÍDA de insumo:
    │      POST /api/estoque/movimentacoes
    │      { tipo: 'saida', insumo_id, quantidade, motivo, acao_id? }
    │      → verifica estoque suficiente
    │      → atualiza quantidade_atual -= quantidade
    │      → se quantidade_atual < quantidade_minima → alerta!
    │
    └─ Vincula insumo a Ação (POST /api/estoque/acao-insumos)
```

### Fluxo 5: Gestão de Manutenção de Caminhão

```
Admin agenda manutenção:
    POST /api/caminhoes/:id/manutencoes
    { titulo, tipo, data_conclusao, descricao, custo_estimado }
    │
    ├─ Caminhão muda status → 'em_manutencao'
    │
    ▼
Job automático (a cada 1 hora):
    liberarManutencoesvencidas()
    │
    ├─ Busca: status IN ('agendada','em_andamento') AND data_conclusao < hoje
    │
    ├─ Para cada manutenção vencida:
    │      m.update({ status: 'concluida' })
    │
    │      Verifica se há outras manutenções ativas do mesmo caminhão
    │      Verifica se o caminhão está em alguma Ação ativa
    │
    │      Se livre: caminhao.status = 'disponivel'
    │      Se em ação ativa: caminhao.status = 'em_acao'
    │
    └─ Log: "🔧→✅ Manutenção X vencida: caminhão Y → disponivel"
```

### Fluxo 6: Geração de Relatório / Prestação de Contas

```
Admin abre /admin/prestacao-contas
    │
    ├─ Seleciona Ação
    │
    ├─ Sistema carrega:
    │      GET /api/acoes/:id (com todos os includes)
    │      GET /api/medico-monitoring/relatorio?acao_id=...
    │      GET /api/contas-pagar?acao_id=...
    │
    ├─ Renderiza relatório com:
    │      Dados da Ação (CNES, processo, lote, RT)
    │      Total de atendimentos
    │      Meta vs. Realizado
    │      Custos do período
    │      Intercorrências
    │
    ├─ Exportar PDF:
    │      jsPDF + html2canvas (geração client-side)
    │      OU PDFKit server-side via GET /api/export/prestacao-contas/:id
    │
    └─ Exportar Excel:
           ExcelJS server-side via GET /api/export/relatorio-excel
```

---

## 11. Principais Códigos e Como se Conectam

### Conexão Frontend ↔ Backend

```
frontend/src/services/api.ts
    └─ Instância Axios com baseURL e interceptors JWT
    │
    ├─ Usado diretamente nas páginas (ex: GerenciarAcao.tsx)
    │      const resp = await api.get(`/acoes/${id}`);
    │
    └─ Também encapsulado em services específicos:
           analytics.ts → GET /api/analytics/*
           estoque.ts   → GET/POST /api/estoque/*
           contasPagar.ts → GET/POST /api/contas-pagar/*
```

### Conexão Backend: Route → Model

```
backend/src/routes/acoes.ts
    ├─ authenticate() ← src/middlewares/auth.ts
    ├─ authorizeAdmin() ← src/middlewares/auth.ts
    │
    ├─ Importa models de src/models/
    │      Acao, Instituicao, Funcionario, AcaoCaminhao, etc.
    │
    └─ Usa sequelize.include para carregar relacionamentos:
           Acao.findAll({
               include: [
                   { model: Instituicao, as: 'instituicao' },
                   { model: Caminhao, as: 'caminhoes' },
                   { model: Funcionario, as: 'funcionarios' },
               ]
           })
```

### Conexão Models ↔ Banco

```
src/models/Acao.ts
    ├─ Acao.init({ ... }, { sequelize, tableName: 'acoes' })
    │      sequelize ← src/config/database.ts
    │                ← new Sequelize(config.database)
    │                ← src/config/index.ts
    │                ← process.env (DATABASE_URL ou host/port/name/user/pass)
    │
    └─ Associações definidas em src/models/index.ts
           setupAssociations() ← chamado em src/index.ts na inicialização
```

### Arquivo de Associações — `models/index.ts`

Este é o arquivo mais crítico para entender como os dados se relacionam. Ele define **todas as chaves estrangeiras e aliases** usados nas queries Sequelize:

```typescript
// Exemplos de associações críticas:

// Ação pertence a uma Instituição
Acao.belongsTo(Instituicao, { foreignKey: 'instituicao_id', as: 'instituicao' });

// Ação tem muitos Caminhões (N:M)
Acao.belongsToMany(Caminhao, {
    through: AcaoCaminhao,
    foreignKey: 'acao_id',
    otherKey: 'caminhao_id',
    as: 'caminhoes'
});

// Ação tem muitos Atendimentos Médicos
Acao.hasMany(AtendimentoMedico, { foreignKey: 'acao_id', as: 'atendimentos_medicos' });

// Funcionário tem muitas Anotações (com cascade delete)
Funcionario.hasMany(FuncionarioAnotacao, {
    foreignKey: 'funcionario_id',
    as: 'anotacoes',
    onDelete: 'CASCADE'
});
```

---

## 12. APIs Disponíveis

Todas as APIs seguem o padrão REST JSON sob o prefixo `/api/`.

| Prefixo | Arquivo | Descrição |
|---|---|---|
| `/api/auth` | `routes/auth.ts` | Login, cadastro, recuperação de senha |
| `/api/acoes` | `routes/acoes.ts` | CRUD de ações (29KB de lógica) |
| `/api/cidadaos` | `routes/cidadaos.ts` | CRUD de cidadãos |
| `/api/cidadaos/:id/exames` | `routes/cidadaoExames.ts` | Exames por cidadão |
| `/api/inscricoes` | `routes/inscricoes.ts` | Inscrições de cidadãos |
| `/api/funcionarios` | `routes/funcionarios.ts` | CRUD de funcionários |
| `/api/instituicoes` | `routes/instituicoes.ts` | CRUD de instituições |
| `/api/caminhoes` | `routes/caminhoes.ts` | Gestão de frota |
| `/api/estoque` | `routes/estoque.ts` | Insumos e movimentações (46KB) |
| `/api/contas-pagar` | `routes/contasPagar.ts` | Gestão financeira |
| `/api/abastecimentos` | `routes/abastecimentos.ts` | Abastecimentos da frota |
| `/api/cursos-exames` | `routes/cursosExames.ts` | Catálogo de serviços |
| `/api/alertas` | `routes/alertas.ts` | Alertas de exames |
| `/api/medico-monitoring` | `routes/medicoMonitoring.ts` | Painel médico (48KB) |
| `/api/notificacoes` | `routes/notificacoes.ts` | Notificações do sistema |
| `/api/noticias` | `routes/noticias.ts` | CMS de notícias |
| `/api/relatorios` | `routes/relatorios.ts` | Relatórios e exportações |
| `/api/analytics` | `routes/analytics.ts` | Dados para gráficos do dashboard |
| `/api/configuracoes` | `routes/configuracoes.ts` | Configurações do sistema |
| `/api/admins` | `routes/admins.ts` | Gerenciamento de admins |
| `/api/export` | `routes/export.ts` | Exportação PDF/Excel/CSV |
| `/api/utils` | `routes/utils.ts` | Utilitários (validação CPF, etc.) |
| `/api/debug` | `routes/debug.ts` | Endpoints de diagnóstico (protegidos) |

---

## 13. Variáveis de Ambiente

### Backend (`.env` em `/backend/`)

```env
# Servidor
NODE_ENV=development
PORT=3001

# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_carretas
DB_USER=postgres
DB_PASSWORD=sua_senha

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Autenticação
JWT_SECRET=chave_secreta_muito_longa_e_aleatoria

# CORS
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Email (Brevo SMTP)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=usuario@brevo.com
SMTP_PASS=senha_brevo
SMTP_FROM=contato@gestaosobrerodas.com.br
```

### Frontend (`.env.local` em `/frontend/`)

```env
REACT_APP_API_URL=http://localhost:3001/api
```

> Em produção, `REACT_APP_API_URL` não é definido — o frontend usa automaticamente o caminho relativo `/api` (servido pelo Nginx que faz proxy para o backend).

---

## 14. Como Rodar Localmente

### Pré-requisitos

- Docker Desktop instalado e rodando
- Node.js >= 20 (para desenvolvimento sem Docker)

### Opção 1: Docker Compose (Recomendado)

```powershell
# Na raiz do projeto
docker-compose up -d

# Verificar logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Parar
docker-compose down
```

Acesso: http://localhost

### Opção 2: Desenvolvimento Local (sem Docker)

```powershell
# 1. Iniciar banco e Redis via Docker
docker-compose -f docker-compose.dev.yml up -d

# 2. Backend
cd backend
npm install
npm run dev      # nodemon + ts-node, porta 3001

# 3. Frontend (novo terminal)
cd frontend
npm install
npm start        # react-scripts, porta 3000
```

### Criar Admin Inicial

```powershell
cd backend
node criar-admin.js
# ou
node create-admin-simple.js
```

### Scripts npm do Backend

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com hot reload |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Inicia servidor compilado (produção) |
| `npm run migrate` | Executa migrações Sequelize CLI |
| `npm run seed:admin` | Cria usuário admin inicial |
| `npm run reset:db` | Reseta o banco (cuidado!) |

---

## 15. Scripts Utilitários

Na raiz do projeto existem scripts de manutenção:

| Script | Descrição |
|---|---|
| `criar-backup.bat` | Cria backup do banco PostgreSQL |
| `commit-deploy.ps1` | Script de commit + deploy para produção |
| `reiniciar_sistema.ps1` | Reinicia todos os serviços Docker |
| `clean-console-logs.js` | Remove console.log do código para produção |
| `fix-all-issues.js` | Script de correções diversas |
| `remove-duplicate-employees.js` | Remove funcionários duplicados do banco |

No backend existem scripts de diagnóstico/manutenção:

| Script | Descrição |
|---|---|
| `check-data.js` | Verifica integridade dos dados |
| `create-admin-simple.js` | Cria admin necessário |
| `fix-admin-conflict.js` | Resolve conflitos de admin duplicado |
| `fix-password.js` | Redefine senha de usuário |
| `backup-database.js` | Backup programático do banco |

---

## Considerações de Segurança

1. **JWT** com expiração configurável via `JWT_SECRET`
2. **bcrypt** (salt rounds: 10) para hash de senhas
3. **Helmet** aplica headers de segurança (CSP, HSTS, X-Frame-Options, etc.)
4. **Rate Limiting:** 3.000 req / 15 min em produção, 1.000 em dev
5. **CORS** restrito ao `FRONTEND_URL` configurado
6. **Backend** não exposto diretamente — só via Nginx interno
7. **Validação Joi** em todas as rotas de entrada de dados
8. **Validação matemática de CPF** (algoritmo dos dígitos verificadores)
9. **LGPD:** Registro de consentimento com data e IP do usuário

---

*Documentação gerada em 06/04/2026 — Sistema Gestão Sobre Rodas v2.0*
