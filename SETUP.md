# 🚀 Guia de Instalação Completo - Sistema Carretas

Este guia vai te ajudar a configurar e executar o Sistema Carretas do zero.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- ✅ **Node.js 18+** ([Baixar aqui](https://nodejs.org/))
- ✅ **Docker Desktop** ([Baixar aqui](https://www.docker.com/products/docker-desktop/))
- ✅ **VS Code** (você já tem!)
- ✅ **Git** (opcional, mas recomendado)

### Verificar instalações

Abra o PowerShell e execute:

```powershell
node --version
# Deve mostrar v18.x.x ou superior

npm --version
# Deve mostrar 9.x.x ou superior

docker --version
# Deve mostrar Docker version 20.x.x ou superior
```

Se algum comando não funcionar, instale o software correspondente.

---

## 📂 Passo 1: Adicionar Workspace no VS Code

**Por que isso é necessário?** O VS Code precisa ter acesso ao diretório do projeto para executar comandos.

### Opção A: Via Menu (Recomendado)

1. No VS Code, clique em **File** (Arquivo) no menu superior
2. Selecione **Add Folder to Workspace...** (Adicionar Pasta ao Workspace)
3. Navegue até `C:\Users\joaobaluz\Desktop\sistema-carretas`
4. Clique em **Select Folder** (Selecionar Pasta)

### Opção B: Via Command Palette

1. Pressione `Ctrl + Shift + P`
2. Digite `Add Folder to Workspace`
3. Pressione Enter
4. Selecione a pasta `sistema-carretas`

**✅ Confirmação:** Você deve ver `sistema-carretas` na barra lateral esquerda do VS Code.

---

## 🔧 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Abrir Terminal Integrado

1. No VS Code, pressione **Ctrl + `** (backtick/acento grave)
   - Ou: Menu **View → Terminal**
2. Certifique-se de estar na pasta raiz do projeto:

```powershell
cd C:\Users\joaobaluz\Desktop\sistema-carretas
```

### 2.2 Criar arquivo .env do Backend

```powershell
# Navegar para backend
cd backend

# Copiar arquivo de exemplo
copy .env.example .env
```

**✅ Confirmação:** Você verá a mensagem "1 arquivo(s) copiado(s)."

### 2.3 Gerar Chave de Criptografia

Esta chave será usada para criptografar dados sensíveis (CPF).

```powershell
# Executar comando para gerar chave aleatória
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Saída esperada:** Uma string longa como:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**⚠️ IMPORTANTE:** Copie essa chave inteira! Você vai usar no próximo passo.

### 2.4 Editar arquivo .env do Backend

1. No VS Code, abra o arquivo `backend\.env`
2. Encontre a linha:
   ```
   ENCRYPTION_KEY=your-32-byte-hex-key-here
   ```
3. Cole a chave que você copiou:
   ```
   ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
   ```
4. (Opcional) Altere o `JWT_SECRET`:
   ```
   JWT_SECRET=minha-chave-super-secreta-jwt
   ```
5. Salve o arquivo (`Ctrl + S`)

### 2.5 Criar arquivo .env do Frontend

```powershell
# Voltar para raiz e ir para frontend
cd ..\frontend

# Copiar arquivo de exemplo
copy .env.example .env
```

**✅ Confirmação:** O arquivo `frontend\.env` foi criado.

---

## 📦 Passo 3: Instalar Dependências

### 3.1 Instalar dependências do Backend

```powershell
# Certifique-se de estar em frontend, volte para backend
cd ..\backend

# Instalar pacotes npm
npm install
```

**⏱️ Tempo estimado:** 2-5 minutos dependendo da sua internet.

**O que você verá:**
```
added 523 packages, and audited 524 packages in 2m
```

### 3.2 Instalar dependências do Frontend

```powershell
# Ir para frontend
cd ..\frontend

# Instalar pacotes npm
npm install
```

**⏱️ Tempo estimado:** 2-5 minutos.

**O que você verá:**
```
added 1431 packages, and audited 1432 packages in 3m
```

**✅ Confirmação:** Ambas as pastas `backend\node_modules` e `frontend\node_modules` foram criadas.

---

## 🐳 Passo 4: Iniciar Docker (Banco de Dados)

### 4.1 Verificar se Docker está rodando

1. Abra o **Docker Desktop**
2. Aguarde até ver "Docker Desktop is running" na bandeja do sistema

### 4.2 Iniciar containers

```powershell
# Voltar para raiz do projeto
cd ..

# Iniciar PostgreSQL, Redis e MinIO
docker-compose up -d
```

**O que você verá:**
```
[+] Running 3/3
 ✔ Container carretas-postgres  Started
 ✔ Container carretas-redis     Started
 ✔ Container carretas-minio     Started
```

**⏱️ Primeira vez:** Pode demorar 3-5 minutos baixando as imagens.

### 4.3 Verificar containers rodando

```powershell
docker ps
```

**Você deve ver 3 containers:**
- `carretas-postgres` (porta 5432)
- `carretas-redis` (porta 6379)
- `carretas-minio` (portas 9000, 9001)

---

## 🎯 Passo 5: Executar o Sistema

Você precisará de **2 terminais** rodando ao mesmo tempo.

### 5.1 Terminal 1: Backend

```powershell
# No terminal 1
cd C:\Users\joaobaluz\Desktop\sistema-carretas\backend
npm run dev
```

**O que você verá:**
```
✅ Database connection has been established successfully.
✅ Database synchronized
✅ Redis connected successfully
🚀 Server running on port 3001
📝 Environment: development
🔗 API: http://localhost:3001/api
```

**✅ Backend rodando!** Deixe este terminal aberto.

### 5.2 Terminal 2: Frontend

**Abrir novo terminal:**
- Clique no **+** ao lado do terminal atual
- Ou pressione `Ctrl + Shift + '`

```powershell
# No terminal 2
cd C:\Users\joaobaluz\Desktop\sistema-carretas\frontend
npm start
```

**O que você verá:**
```
Compiled successfully!

You can now view sistema-carretas-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**✅ Frontend rodando!** Um navegador deve abrir automaticamente em `http://localhost:3000`

---

## 🌐 Passo 6: Testar o Sistema

### 6.1 Acessar a Homepage

1. Navegador abre em `http://localhost:3000`
2. Você verá a página inicial com:
   - Header "Sistema Carretas"
   - Botões "Cadastrar" e "Entrar"
   - Seção "Bem-vindo ao Sistema Carretas"

### 6.2 Testar Cadastro com LGPD

1. Clique em **Cadastrar** (botão laranja no canto superior direito)
2. Preencha o formulário:
   - **CPF:** 123.456.789-09 (formato automático)
   - **Nome Completo:** Seu nome
   - **Data de Nascimento:** 01/01/1990
   - **Telefone:** (11) 99999-9999
   - **E-mail:** seuemail@example.com
   - **Município:** São Paulo
   - **Estado:** SP
3. Clique em **Prosseguir**
4. **Modal do Termo LGPD abre!** 🎉
   - Leia os termos (pode rolar a página)
   - Marque: "✅ Li e concordo com os termos acima"
   - (Opcional) Marque comunicações e imagens
5. Clique em **Concordo e Prosseguir**
6. **Sucesso!** Você será redirecionado ao Portal do Cidadão

### 6.3 Testar Login

1. Faça logout (botão **Sair**)
2. Clique em **Entrar**
3. Digite o CPF que você cadastrou
4. Clique em **Entrar**
5. **Sucesso!** Você está logado novamente

---

## 🛠️ Comandos Úteis

### Parar os servidores

**Backend/Frontend:**
- Pressione `Ctrl + C` em cada terminal

### Parar Docker

```powershell
cd C:\Users\joaobaluz\Desktop\sistema-carretas
docker-compose down
```

### Reiniciar tudo

```powershell
# Parar Docker
docker-compose down

# Iniciar Docker
docker-compose up -d

# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

### Ver logs do Docker

```powershell
# Ver logs do PostgreSQL
docker logs carretas-postgres

# Ver logs em tempo real
docker logs -f carretas-postgres
```

---

## ❌ Troubleshooting (Resolução de Problemas)

### Problema: "Error: connect ECONNREFUSED 127.0.0.1:5432"

**Causa:** PostgreSQL não está rodando.

**Solução:**
```powershell
docker-compose up -d
docker ps  # Verificar se carretas-postgres está UP
```

### Problema: "Port 3000 is already in use"

**Causa:** Outra aplicação está usando a porta 3000.

**Solução:**
```powershell
# Encontrar processo usando porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F

# Ou altere a porta no .env do frontend
# Adicione: PORT=3001
```

### Problema: "JWT_SECRET is not defined"

**Causa:** Arquivo `.env` não foi configurado corretamente.

**Solução:**
1. Verifique se `backend\.env` existe
2. Abra o arquivo e confirme que `JWT_SECRET` tem um valor
3. Reinicie o servidor backend

### Problema: "Cannot find module 'express'"

**Causa:** Dependências não foram instaladas.

**Solução:**
```powershell
cd backend
npm install
```

### Problema: Docker não inicia

**Causa:** Docker Desktop não está rodando.

**Solução:**
1. Abra Docker Desktop manualmente
2. Aguarde até o ícone ficar verde
3. Execute `docker-compose up -d` novamente

---

## 📊 Verificar se está tudo funcionando

### Checklist Final

- [ ] Backend rodando em `http://localhost:3001`
- [ ] Frontend rodando em `http://localhost:3000`
- [ ] Docker com 3 containers UP
- [ ] Consegue acessar a homepage
- [ ] Consegue abrir o modal de Termo LGPD
- [ ] Consegue cadastrar um cidadão
- [ ] Consegue fazer login

### Testar API diretamente

Abra o navegador em:
```
http://localhost:3001/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2026-01-15T15:30:00.000Z"
}
```

---

## 🎉 Próximos Passos

Agora que o sistema está rodando:

1. **Explorar o código:**
   - Backend: `backend\src\`
   - Frontend: `frontend\src\`

2. **Testar funcionalidades:**
   - Cadastro de cidadão
   - Login
   - Portal do cidadão

3. **Desenvolver novos recursos:**
   - Ver `task.md` para próximas tarefas
   - Implementar busca de ações
   - Criar painel admin

4. **Estudar o Termo LGPD:**
   - Arquivo: `frontend\src\components\common\TermoLGPD.tsx`
   - 377 linhas focadas em compliance

---

## 📞 Precisa de Ajuda?

Se algo não funcionar:

1. **Verifique os logs:**
   - Terminal do backend
   - Terminal do frontend
   - `docker logs carretas-postgres`

2. **Verifique as portas:**
   ```powershell
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   netstat -ano | findstr :5432
   ```

3. **Reinicie tudo:**
   - Pare backend/frontend (Ctrl+C)
   - `docker-compose down`
   - `docker-compose up -d`
   - Inicie backend e frontend novamente

4. **Apague node_modules e reinstale:**
   ```powershell
   # Backend
   cd backend
   Remove-Item -Recurse -Force node_modules
   npm install
   
   # Frontend
   cd ..\frontend
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

---

**Boa sorte! 🚀 O sistema está pronto para desenvolvimento!**
