# 🚀 Instalação Simplificada - Sistema Carretas

**Siga exatamente esta ordem. Copie e cole cada comando.**

---

## ✅ Pré-requisitos

Antes de começar, verifique se tem instalado:

```powershell
node --version
# Precisa mostrar v18 ou superior

docker --version
# Precisa do Docker Desktop rodando
```

Se não tiver, instale:
- Node.js: https://nodejs.org/
- Docker Desktop: https://www.docker.com/products/docker-desktop/

---

## 📋 PASSO A PASSO (Copie e Cole)

### 1️⃣ Adicionar Workspace no VS Code

**IMPORTANTE: Faça isso PRIMEIRO!**

1. No VS Code, clique em **File** → **Add Folder to Workspace**
2. Selecione a pasta: `C:\Users\joaobaluz\Desktop\sistema-carretas`
3. Pronto! Agora pode continuar.

---

### 2️⃣ Abrir Terminal no VS Code

Pressione **Ctrl + `** (control + acento grave)

Ou: Menu **View** → **Terminal**

---

### 3️⃣ Copiar e Colar Estes Comandos

**Copie TUDO de uma vez e cole no terminal:**

```powershell
# Ir para a pasta do projeto
cd C:\Users\joaobaluz\Desktop\sistema-carretas

# Configurar Backend
cd backend
copy .env.example .env
cd ..

# Configurar Frontend
cd frontend
copy .env.example .env
cd ..
```

✅ **Confirmação:** Você verá "1 arquivo(s) copiado(s)." duas vezes.

---

### 4️⃣ Gerar Chave de Criptografia

**Cole este comando:**

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Resultado:** Uma linha longa como:
```
a1b2c3d4e5f6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

**⚠️ COPIE essa linha inteira!** (Ctrl+C)

---

### 5️⃣ Editar arquivo .env

1. No VS Code, abra: `backend\.env`
2. Procure por: `ENCRYPTION_KEY=your-32-byte-hex-key-here`
3. Apague `your-32-byte-hex-key-here` e cole a chave que você copiou
4. **Salve** (Ctrl+S)

Deve ficar assim:
```
ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

---

### 6️⃣ Instalar Dependências do Backend

**Cole este comando:**

```powershell
cd C:\Users\joaobaluz\Desktop\sistema-carretas\backend
npm install
```

⏱️ **Aguarde 2-5 minutos.** Vai aparecer muitas linhas de texto.

✅ **Sucesso quando ver:** `added 523 packages`

---

### 7️⃣ Instalar Dependências do Frontend

**Cole este comando:**

```powershell
cd C:\Users\joaobaluz\Desktop\sistema-carretas\frontend
npm install --legacy-peer-deps
```

> **Nota:** Usamos `--legacy-peer-deps` para evitar conflitos de versão.

⏱️ **Aguarde 2-5 minutos.**

✅ **Sucesso quando ver:** `added 1431 packages`

---

### 8️⃣ Iniciar Banco de Dados (Docker)

**Cole este comando:**

```powershell
cd C:\Users\joaobaluz\Desktop\sistema-carretas
docker-compose up -d
```

⏱️ **Primeira vez pode demorar 3-5 minutos baixando imagens.**

✅ **Sucesso quando ver:**
```
✔ Container carretas-postgres  Started
✔ Container carretas-redis     Started
✔ Container carretas-minio     Started
```

---

### 9️⃣ Iniciar o Backend

**Abrir NOVO terminal** (clique no + ao lado do terminal atual)

**Cole este comando no NOVO terminal:**

```powershell
cd C:\Users\joaobaluz\Desktop\sistema-carretas\backend
npm run dev
```

✅ **Backend funcionando quando ver:**
```
✅ Database connection has been established successfully.
🚀 Server running on port 3001
```

**⚠️ DEIXE ESTE TERMINAL ABERTO!**

---

### 🔟 Iniciar o Frontend

**Abrir OUTRO terminal novo** (clique no + de novo)

**Cole este comando no SEGUNDO terminal novo:**

```powershell
cd C:\Users\joaobaluz\Desktop\sistema-carretas\frontend
npm start
```

⏱️ **Aguarde 30 segundos.**

✅ **Frontend funcionando quando ver:**
```
Compiled successfully!
Local: http://localhost:3000
```

**🎉 O navegador vai abrir automaticamente!**

---

## 🎯 Testar o Sistema

### Homepage
- Página deve carregar em `http://localhost:3000`
- Deve ver "Sistema Carretas" no topo

### Testar Cadastro + LGPD

1. Clique em **Cadastrar** (botão laranja)
2. Preencha qualquer dados de teste:
   - CPF: `123.456.789-09`
   - Nome: `Teste Silva`
   - Data: `01/01/1990`
   - Telefone: `(11) 99999-9999`
   - Email: `teste@teste.com`
   - Município: `São Paulo`
   - Estado: `SP`
3. Clique em **Prosseguir**
4. **MODAL DO TERMO LGPD ABRE!** 🎉
5. Leia o termo (pode rolar)
6. Marque: ✅ "Li e concordo com os termos"
7. Clique em **Concordo e Prosseguir**
8. **Sucesso!** Você será redirecionado

---

## 🛑 Como Parar

**Para parar os servidores:**
- Em cada terminal, pressione `Ctrl + C`

**Para parar o Docker:**
```powershell
cd C:\Users\joaobaluz\Desktop\sistema-carretas
docker-compose down
```

---

## ❌ Problemas Comuns

### Erro: "Port 5432 is already in use"

**Solução:**
```powershell
docker-compose down
docker-compose up -d
```

### Erro: "Cannot find module"

**Solução:**
```powershell
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install --legacy-peer-deps
```

### Docker não inicia

**Solução:**
1. Abra o Docker Desktop manualmente
2. Aguarde ficar verde
3. Tente `docker-compose up -d` novamente

### Frontend não compila

**Solução:**
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps
```

---

## ✅ Checklist Final

- [ ] Backend rodando (terminal 1)
- [ ] Frontend rodando (terminal 2)
- [ ] Docker com 3 containers
- [ ] Navegador abriu automaticamente
- [ ] Consegue ver a homepage
- [ ] Modal LGPD abre ao tentar cadastrar

**Se todos ✅ = Tudo funcionando! 🎉**

---

## 📞 Resumo dos Comandos (Para Copiar)

**Primeira vez (setup):**
```powershell
cd C:\Users\joaobaluz\Desktop\sistema-carretas
cd backend && copy .env.example .env && cd ..
cd frontend && copy .env.example .env && cd ..
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# (Copiar resultado e colar em backend\.env)
cd backend && npm install
cd ..\frontend && npm install --legacy-peer-deps
cd .. && docker-compose up -d
```

**Executar (sempre que ligar o computador):**
```powershell
# Terminal 1 (Backend):
cd C:\Users\joaobaluz\Desktop\sistema-carretas\backend
npm run dev

# Terminal 2 (Frontend):
cd C:\Users\joaobaluz\Desktop\sistema-carretas\frontend
npm start
```

**Parar:**
```powershell
# Ctrl+C em cada terminal
# Depois:
docker-compose down
```

---

**🎉 Pronto! Sistema funcionando!**

**Acesse:** http://localhost:3000
