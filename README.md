# 🚀 MotorMind - Tutorial Completo para Rodar o Projeto

Este guia explica **do zero** como configurar e rodar o sistema no seu computador.

---

# 📌 O QUE É ESSE PROJETO?

Sistema de gestão para oficinas mecânicas.

Atualmente possui:

* Cadastro de clientes
* Listagem
* Edição
* Exclusão

---

# 🧱 TECNOLOGIAS

* Backend: Node.js + Express
* Banco: PostgreSQL
* ORM: Prisma
* Frontend: React + Vite

---

# ⚙️ PASSO 1 — INSTALAR PROGRAMAS NECESSÁRIOS

Você precisa instalar:

### 1. Node.js

Baixe e instale a versão LTS:
👉 https://nodejs.org/

---

### 2. PostgreSQL

Baixe:
👉 https://www.postgresql.org/download/

Durante a instalação:

* Defina uma senha (GUARDE ESSA SENHA)
* Porta padrão: `5432`
* Instale também o **pgAdmin**

---

### 3. Git

👉 https://git-scm.com/downloads

---

# 🗄️ PASSO 2 — CONFIGURAR O BANCO

1. Abra o **pgAdmin**
2. Vá em:

```
Servers → PostgreSQL → Databases
```

3. Clique com botão direito em **Databases**
4. Clique em **Create → Database**
5. Nome:

```
motormind
```

---

# 📥 PASSO 3 — CLONAR O PROJETO

```bash
git clone URL_DO_REPOSITORIO
```

```bash
cd motormind
```

---

# 🔧 PASSO 4 — CONFIGURAR O BACKEND

## 📁 Entrar na pasta

```bash
cd backend
```

---

## 📦 Instalar dependências

```bash
npm install
```

---

## 🔐 Criar arquivo `.env`

Crie um arquivo chamado `.env` dentro da pasta backend:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/motormind"
```

⚠️ Troque `SUA_SENHA` pela senha do PostgreSQL

---

## 🧱 Rodar migrations

```bash
npx prisma migrate dev
```

Isso vai:

* Criar as tabelas no banco
* Configurar o Prisma

---

## ▶️ Rodar backend

```bash
npm run dev
```

Se deu certo, vai aparecer algo como:

```
Servidor rodando na porta 3000
```

---

# 💻 PASSO 5 — CONFIGURAR O FRONTEND

Abra outro terminal.

## 📁 Entrar na pasta

```bash
cd frontend
```

---

## 📦 Instalar dependências

```bash
npm install
```

---

## ▶️ Rodar frontend

```bash
npm run dev
```

---

## 🌐 Abrir no navegador

```text
http://localhost:5173
```

---

# 🔥 PRONTO

Se tudo deu certo:

* Você consegue cadastrar clientes
* Editar
* Deletar
* Ver na tela

---

# 🧪 ONDE OS DADOS FICAM?

No PostgreSQL.

Para ver:

1. Abra o pgAdmin
2. Vá em:

```
Databases → motormind → Schemas → public → Tables → cliente
```

3. Clique com botão direito → **View/Edit Data**

---

# ⚠️ PROBLEMAS COMUNS

---

## ❌ Backend não conecta no banco

Verifique o `.env`:

```env
DATABASE_URL="postgresql://postgres:SENHA@localhost:5432/motormind"
```

---

## ❌ Porta ocupada

Backend usa:

```
3000
```

Frontend usa:

```
5173
```

---

## ❌ Esqueceu de rodar migration

```bash
npx prisma migrate dev
```

---

## ❌ Erro de CORS

Verifique se no backend tem:

```javascript
app.use(cors());
```

---

# 📌 REGRAS IMPORTANTES

* NÃO subir `.env`
* NÃO subir `node_modules`
* Sempre rodar backend e frontend juntos

---

# 🚀 COMO CONTINUAR O PROJETO

Sugestões:

* Adicionar CPF, endereço no cliente
* Criar módulo de veículos
* Criar agendamento
* Melhorar layout

---

# 👨‍💻 OBS

Se der erro, chama no grupo ou resolve olhando esse README com calma 😄
