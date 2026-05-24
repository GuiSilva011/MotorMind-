# 🚀 MotorMind - Tutorial Completo para Rodar o Projeto

Este guia explica do zero como configurar e rodar o sistema **MotorMind** no computador.

---

## 📌 O QUE É ESSE PROJETO?

O **MotorMind** é um sistema de gestão para oficinas mecânicas.

O sistema permite controlar clientes, veículos, funcionários, fornecedores, agendamentos, ordens de serviço, checklists técnicos, peças, serviços, diagnósticos, histórico veicular, relatórios e cotações de peças via WhatsApp.

---

## ✅ FUNCIONALIDADES DO SISTEMA

Atualmente o sistema possui:

- Login com controle de perfil
- Perfil de Administrador
- Perfil de Operador
- Perfil de Técnico
- Cadastro de clientes
- Listagem de clientes
- Edição de clientes
- Exclusão de clientes
- Cadastro de veículos vinculados ao cliente
- Busca de clientes por nome
- Busca de clientes por placa do veículo
- Cadastro de funcionários
- Listagem de funcionários
- Edição de funcionários
- Exclusão de funcionários
- Cadastro de fornecedores
- Listagem de fornecedores
- Edição de fornecedores
- Exclusão de fornecedores
- Cadastro de agendamentos
- Calendário de agendamentos
- Exclusão de agendamentos
- Criação de ordem de serviço a partir de agendamento
- Criação manual de ordem de serviço
- Busca de ordens de serviço existentes
- Edição de ordem de serviço
- Diagnósticos dentro da ordem de serviço
- Serviços dentro da ordem de serviço
- Peças dentro da ordem de serviço
- Peças avulsas dentro da ordem de serviço
- Serviços avulsos dentro da ordem de serviço
- Catálogo de diagnósticos
- Catálogo de serviços
- Catálogo de peças
- Grupos de peças
- Cotação de peças via WhatsApp
- Checklist técnico do veículo
- Upload de fotos no checklist
- Visualização de checklists do veículo
- Histórico veicular
- Relatórios administrativos

---

## 🧱 TECNOLOGIAS UTILIZADAS

### Backend

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JavaScript

### Frontend

- React
- Vite
- React Router DOM
- Axios
- React Toastify
- React Big Calendar
- Date-fns
- CSS

### Banco de dados

- PostgreSQL

---

## 📦 DEPENDÊNCIAS PRINCIPAIS DO PROJETO

As dependências do projeto são instaladas automaticamente com:

```bash
npm install
```

Esse comando deve ser executado dentro da pasta `backend` e também dentro da pasta `frontend`.

O `npm install` lê o arquivo `package.json` e instala tudo que o projeto precisa.

---

## 📦 DEPENDÊNCIAS DO BACKEND

O backend utiliza principalmente:

- `express` — criação da API
- `cors` — liberação de acesso entre frontend e backend
- `dotenv` — leitura das variáveis do arquivo `.env`
- `prisma` — CLI do Prisma para migrations, generate e studio
- `@prisma/client` — cliente Prisma usado no código
- `multer` — upload de imagens/fotos, usado nos checklists
- `nodemon` — reiniciar o servidor automaticamente em desenvolvimento

Para instalar manualmente, caso necessário:

```bash
cd backend
npm install express cors dotenv @prisma/client multer
npm install prisma nodemon --save-dev
```

Depois gere o Prisma Client:

```bash
npx prisma generate
```

E rode as migrations:

```bash
npx prisma migrate dev
```

---

## 📦 DEPENDÊNCIAS DO FRONTEND

O frontend utiliza principalmente:

- `react` — biblioteca principal da interface
- `react-dom` — renderização do React
- `vite` — servidor e build do frontend
- `@vitejs/plugin-react` — plugin React para o Vite
- `react-router-dom` — rotas do sistema
- `axios` — comunicação com a API/backend
- `react-toastify` — mensagens de alerta/toast
- `react-big-calendar` — calendário de agendamentos
- `date-fns` — formatação de datas usada no calendário

Para instalar manualmente, caso necessário:

```bash
cd frontend
npm install axios react-router-dom react-toastify react-big-calendar date-fns
```

Se o projeto estiver sem as dependências base do Vite/React, rode:

```bash
npm install react react-dom
npm install vite @vitejs/plugin-react --save-dev
```

---

## ⚙️ PASSO 1 — INSTALAR PROGRAMAS NECESSÁRIOS

Antes de rodar o projeto, instale os programas abaixo.

---

### 1. Node.js

Baixe e instale a versão LTS:

https://nodejs.org/

Depois de instalar, abra o terminal e verifique:

```bash
node -v
npm -v
```

Se aparecerem as versões, está tudo certo.

---

### 2. PostgreSQL

Baixe e instale:

https://www.postgresql.org/download/

Durante a instalação:

- Defina uma senha para o usuário `postgres`
- Guarde essa senha
- Use a porta padrão `5432`
- Instale também o pgAdmin

---

### 3. Git

Baixe e instale:

https://git-scm.com/downloads

Depois verifique no terminal:

```bash
git --version
```

---

## 🗄️ PASSO 2 — CRIAR O BANCO DE DADOS

Abra o **pgAdmin**.

Depois vá em:

```txt
Servers → PostgreSQL → Databases
```

Clique com o botão direito em **Databases**.

Depois clique em:

```txt
Create → Database
```

Crie o banco com o nome:

```txt
motormind
```

---

## 📥 PASSO 3 — CLONAR O PROJETO

No terminal, rode:

```bash
git clone URL_DO_REPOSITORIO
```

Depois entre na pasta do projeto:

```bash
cd MotorMind-
```

Caso a pasta tenha outro nome, entre nela:

```bash
cd nome-da-pasta
```

---

## 🔧 PASSO 4 — CONFIGURAR O BACKEND

Entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

---

## 🔐 PASSO 5 — CRIAR O ARQUIVO `.env`

Dentro da pasta `backend`, crie um arquivo chamado:

```txt
.env
```

Dentro dele, coloque:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/motormind?schema=public"
```

Troque `SUA_SENHA` pela senha que você definiu no PostgreSQL.

Exemplo:

```env
DATABASE_URL="postgresql://postgres:123456@localhost:5432/motormind?schema=public"
```

---

## 🧱 PASSO 6 — RODAR O PRISMA

Ainda dentro da pasta `backend`, rode:

```bash
npx prisma generate
```

Depois rode:

```bash
npx prisma migrate dev
```

Esse comando cria as tabelas no banco de dados.

Se quiser abrir o Prisma Studio para visualizar o banco:

```bash
npx prisma studio
```

---

## ▶️ PASSO 7 — RODAR O BACKEND

Ainda dentro da pasta `backend`, rode:

```bash
npm run dev
```

Se deu certo, vai aparecer algo parecido com:

```txt
Servidor rodando na porta 3000
```

O backend ficará rodando em:

```txt
http://localhost:3000
```

---

## 💻 PASSO 8 — CONFIGURAR O FRONTEND

Abra outro terminal.

Se estiver dentro da pasta `backend`, volte para a raiz do projeto:

```bash
cd ..
```

Entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Rode o frontend:

```bash
npm run dev
```

Abra no navegador:

```txt
http://localhost:5173
```

---

## 🔑 USUÁRIOS DE TESTE

A tela de login possui atalhos para usuários de teste.

Usuários usados no projeto:

```txt
Administrador
Email: admin@motormind.com
Senha: admin123
```

```txt
Operador
Email: operador@motormind.com
Senha: operador123
```

```txt
Técnico
Email: tecnico@motormind.com
Senha: tecnico123
```

Os perfis usados no sistema são:

```txt
ADMIN
OPERADOR
TECNICO
```

---

## 📦 COMANDOS PRINCIPAIS

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 ONDE OS DADOS FICAM?

Os dados ficam no PostgreSQL.

Para visualizar pelo pgAdmin:

```txt
Databases → motormind → Schemas → public → Tables
```

Também é possível visualizar pelo Prisma Studio:

```bash
cd backend
npx prisma studio
```

---

## 🗃️ TABELAS IMPORTANTES

Algumas tabelas principais do projeto:

```txt
Cliente
Veiculo
Usuario
Funcionario
Fornecedor
Agendamento
OrdemServico
OrdemDiagnostico
OrdemServicoItem
OrdemPecaItem
DiagnosticoCatalogo
ServicoCatalogo
PecaCatalogo
Checklist
```

---

## 🧹 RESETAR BANCO EM DESENVOLVIMENTO

Use apenas se puder apagar todos os dados.

Dentro da pasta `backend`, rode:

```bash
npx prisma migrate reset
npx prisma generate
```

Esse comando:

- Apaga os dados do banco
- Recria as tabelas
- Aplica as migrations
- Gera novamente o Prisma Client

Depois será necessário cadastrar novamente:

- Usuários
- Clientes
- Veículos
- Funcionários
- Fornecedores
- Peças
- Serviços
- Diagnósticos
- Agendamentos
- Ordens de serviço

---

## 📌 REGRAS IMPORTANTES

Não subir para o GitHub:

```txt
.env
node_modules
```

O arquivo `.gitignore` deve conter:

```gitignore
node_modules
.env
```

Sempre rode backend e frontend juntos:

```txt
backend → http://localhost:3000
frontend → http://localhost:5173
```

---

## ✅ CHECKLIST PARA RODAR O PROJETO

Antes de pedir ajuda, confira:

- Node.js instalado
- PostgreSQL instalado
- Git instalado
- Banco `motormind` criado
- Arquivo `.env` criado dentro do backend
- Senha do banco correta no `.env`
- `npm install` rodado no backend
- `npm install` rodado no frontend
- `npx prisma generate` executado
- `npx prisma migrate dev` executado
- Backend rodando
- Frontend rodando
- URL aberta no navegador: `http://localhost:5173`

---

## 🧭 FLUXO PARA USAR O SISTEMA

### Administrador

O administrador acessa:

- Relatórios
- Cadastro de funcionários
- Visualização de funcionários
- Cadastro de fornecedores
- Visualização de fornecedores

---

### Operador

O operador acessa:

- Cadastro de clientes
- Consulta de clientes
- Cadastro de agendamentos
- Calendário de agendamentos
- Ordem de serviço
- Diagnósticos
- Serviços
- Peças

---

### Técnico

O técnico acessa:

- Painel técnico
- Checklist do veículo
- Checklists cadastrados
- Histórico veicular

---

## 📲 COTAÇÃO VIA WHATSAPP

Na ordem de serviço, é possível gerar cotação de peças para fornecedores.

A cotação usa:

- Dados do veículo
- Placa
- Motor
- Câmbio
- Chassi
- Peças necessárias
- Quantidade de cada peça

O fornecedor precisa ter telefone/celular cadastrado.

---

## 📸 UPLOAD DE FOTOS NO CHECKLIST

O checklist técnico permite registrar fotos do veículo.

As fotos são enviadas para o backend usando `multer`.

Por isso, no backend, a dependência importante é:

```bash
npm install multer
```

Normalmente ela já será instalada com:

```bash
npm install
```

dentro da pasta `backend`.

---

## 🔧 OBSERVAÇÕES SOBRE O PRISMA

Se alterar models no `schema.prisma`, rode:

```bash
npx prisma migrate dev
npx prisma generate
```

Se for apenas sincronizar rapidamente em desenvolvimento:

```bash
npx prisma db push
npx prisma generate
```

Para abrir o banco visualmente:

```bash
npx prisma studio
```

---

## 🧾 SOBRE O PACKAGE.JSON

As dependências oficiais do projeto ficam nos arquivos:

```txt
backend/package.json
frontend/package.json
```

Por isso, o comando recomendado é sempre:

```bash
npm install
```

Ele instala automaticamente tudo que estiver listado nesses arquivos.

Só instale dependências manualmente se aparecer erro dizendo que algum pacote não foi encontrado, por exemplo:

```txt
Cannot find module 'axios'
Cannot find module 'multer'
Cannot find module '@prisma/client'
Cannot find module 'react-toastify'
```

---

## 👨‍💻 OBS FINAL

Se der erro, leia a mensagem com calma e veja em qual etapa aconteceu.

Se mesmo assim não resolver, chama no grupo com o print do erro e explica em qual tela ou comando aconteceu.