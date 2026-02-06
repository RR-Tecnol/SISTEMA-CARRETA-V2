# Sistema Carretas - System Truck

Sistema de gestão de saúde móvel com carretas equipadas para atendimento médico e realização de exames.

## 🚀 Tecnologias

### Backend
- Node.js + TypeScript
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication

### Frontend
- React + TypeScript
- Material-UI (MUI)
- Axios
- React Router

## 📋 Funcionalidades

### Módulo Administrativo
- ✅ Gestão de Cidadãos (com campo Raça/Cor IBGE)
- ✅ Gestão de Exames de Saúde
- ✅ Gestão de Instituições
- ✅ Gestão de Caminhões (com autonomia km/l)
- ✅ Gestão de Ações de Saúde
- ✅ Gestão de Funcionários
- ✅ Controle de Estoque
- ✅ Relatórios e Analytics

### Portal do Cidadão
- ✅ Cadastro de Cidadãos
- ✅ Consulta de Exames
- ✅ Histórico de Atendimentos

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure as variáveis de ambiente no .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## 🗄️ Banco de Dados

### Configuração

1. Crie um banco de dados PostgreSQL:
```sql
CREATE DATABASE sistema_carretas;
```

2. Configure as credenciais no arquivo `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_carretas
DB_USER=postgres
DB_PASSWORD=sua_senha
```

3. Execute as migrations (se disponível) ou use o script de inicialização

### Estrutura Principal

- `cidadaos` - Cadastro de cidadãos
- `cursos_exames` - Exames de saúde disponíveis
- `instituicoes` - Instituições parceiras
- `caminhoes` - Frota de caminhões
- `acoes` - Ações de saúde realizadas
- `inscricoes` - Inscrições de cidadãos em ações
- `funcionarios` - Equipe médica e administrativa

## 👤 Usuário Admin Padrão

Após configurar o banco, crie um usuário admin para acessar o sistema.

## 🎨 Tema Visual

O sistema utiliza o tema **System Truck** com identidade visual moderna e futurista:
- Cores: Azul tecnológico, gradientes vibrantes
- Componentes: Material-UI customizados
- Navegação: Sidebar futurista com animações

## 📝 Status Atual

### ✅ Implementado
- Autenticação JWT
- CRUD completo de todas entidades
- Dashboard administrativo
- Portal do cidadão
- Sistema de relatórios
- Campo Raça/Cor (padrão IBGE)
- Caminhões com autonomia de combustível

### ⚠️ Pendente
- População automática de dados fictícios (em desenvolvimento)
- Testes automatizados
- Deploy em produção

## 🐛 Problemas Conhecidos

- **População de dados**: Scripts de população de dados fictícios apresentam problemas com constraints de UUID. Recomenda-se popular manualmente via interface administrativa.

## 📄 Licença

Propriedade privada - Todos os direitos reservados

## 👥 Equipe

Desenvolvido para gestão de saúde pública municipal.
