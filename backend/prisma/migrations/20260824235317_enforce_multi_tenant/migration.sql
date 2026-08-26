-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERADOR', 'TECNICO');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusOrdem" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA', 'FINALIZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "Nome" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Senha" TEXT NOT NULL,
    "Role" "Role" NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" VARCHAR(11),
    "email" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "cep" TEXT,
    "endereco" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "uf" VARCHAR(2),
    "numero" TEXT,
    "complemento" TEXT,
    "celular" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" SERIAL NOT NULL,
    "placa" VARCHAR(7) NOT NULL,
    "chassi" VARCHAR(17),
    "modelo" TEXT,
    "fabricante" TEXT,
    "ano_modelo" INTEGER,
    "ano_fabricacao" INTEGER,
    "cambio" TEXT,
    "motor" TEXT,
    "km" TEXT,
    "cor" TEXT,
    "ar" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clienteId" INTEGER NOT NULL,

    CONSTRAINT "Veiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "mecanico" TEXT,
    "tipo_servico" TEXT,
    "servico" TEXT NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'AGENDADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticoCatalogo" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "descricao" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticoCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicoCatalogo" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "categoria" VARCHAR(50),
    "valorPadrao" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicoCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PecaCatalogo" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "marca" VARCHAR(50),
    "aplicacao" VARCHAR(120),
    "grupo" VARCHAR(50),
    "unidade" VARCHAR(10) DEFAULT 'UN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PecaCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemPecaItem" (
    "id" SERIAL NOT NULL,
    "ordemServicoId" INTEGER NOT NULL,
    "ordemDiagnosticoId" INTEGER,
    "ordemServicoItemId" INTEGER,
    "pecaCatalogoId" INTEGER,
    "codigoPeca" VARCHAR(20),
    "nomePeca" VARCHAR(80) NOT NULL,
    "fornecedorId" INTEGER,
    "fornecedorNome" VARCHAR(80),
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "custoUnitario" DECIMAL(10,2),
    "desconto" DECIMAL(10,2),
    "valorTotal" DECIMAL(10,2),
    "codigoVisual" VARCHAR(10),
    "codigoHierarquia" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemPecaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "cnpj" VARCHAR(18) NOT NULL,
    "email" VARCHAR(100),
    "telefone" VARCHAR(20),
    "celular" VARCHAR(20),
    "inscricao" VARCHAR(30),
    "cep" VARCHAR(9),
    "endereco" VARCHAR(120),
    "numero" VARCHAR(10),
    "uf" VARCHAR(2),
    "bairro" VARCHAR(60),
    "cidade" VARCHAR(60),
    "complemento" VARCHAR(80),
    "fornecePecas" BOOLEAN NOT NULL DEFAULT true,
    "forneceServicos" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServico" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "status" "StatusOrdem" NOT NULL DEFAULT 'ABERTA',
    "veiculoId" INTEGER NOT NULL,
    "operadorId" INTEGER,
    "tecnicoId" INTEGER,
    "observacoes" VARCHAR(255),
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemServico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemDiagnostico" (
    "id" SERIAL NOT NULL,
    "ordemServicoId" INTEGER NOT NULL,
    "diagnosticoCatalogoId" INTEGER,
    "codigoVisual" VARCHAR(10),
    "codigoHierarquia" VARCHAR(20),
    "nomeDiagnostico" VARCHAR(80) NOT NULL,
    "descricao" VARCHAR(255),
    "observacoes" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemDiagnostico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServicoItem" (
    "id" SERIAL NOT NULL,
    "ordemServicoId" INTEGER NOT NULL,
    "ordemDiagnosticoId" INTEGER,
    "servicoCatalogoId" INTEGER,
    "codigoVisual" VARCHAR(10),
    "codigoHierarquia" VARCHAR(20),
    "nomeServico" VARCHAR(80) NOT NULL,
    "descricao" VARCHAR(255),
    "responsavel" VARCHAR(80),
    "tipo" VARCHAR(50),
    "precoVenda" DECIMAL(10,2),
    "desconto" DECIMAL(10,2),
    "valorTotal" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemServicoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checklist" (
    "id" SERIAL NOT NULL,
    "veiculoId" INTEGER NOT NULL,
    "itensEntrada" JSONB,
    "itensDiagnostico" JSONB,
    "observacoesEntrada" VARCHAR(1000),
    "observacoesDiagnostico" VARCHAR(1000),
    "fotoFrente" TEXT,
    "fotoTraseira" TEXT,
    "fotoEsquerda" TEXT,
    "fotoDireita" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "Cpf" TEXT,
    "Rg" TEXT,
    "DataNascimento" TIMESTAMP(3),
    "Celular" TEXT,
    "Ctps" TEXT,
    "Cep" TEXT,
    "Endereco" TEXT,
    "Numero" TEXT,
    "Uf" TEXT,
    "Bairro" TEXT,
    "Cidade" TEXT,
    "Complemento" TEXT,
    "DataAdmissao" TIMESTAMP(3),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funcionario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_Email_key" ON "Usuario"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_placa_key" ON "Veiculo"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticoCatalogo_codigo_key" ON "DiagnosticoCatalogo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ServicoCatalogo_codigo_key" ON "ServicoCatalogo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "PecaCatalogo_codigo_key" ON "PecaCatalogo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_codigo_key" ON "Fornecedor"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_cnpj_key" ON "Fornecedor"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_codigo_key" ON "OrdemServico"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_usuarioId_key" ON "Funcionario"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_Cpf_key" ON "Funcionario"("Cpf");

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemPecaItem" ADD CONSTRAINT "OrdemPecaItem_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemPecaItem" ADD CONSTRAINT "OrdemPecaItem_ordemDiagnosticoId_fkey" FOREIGN KEY ("ordemDiagnosticoId") REFERENCES "OrdemDiagnostico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemPecaItem" ADD CONSTRAINT "OrdemPecaItem_ordemServicoItemId_fkey" FOREIGN KEY ("ordemServicoItemId") REFERENCES "OrdemServicoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemPecaItem" ADD CONSTRAINT "OrdemPecaItem_pecaCatalogoId_fkey" FOREIGN KEY ("pecaCatalogoId") REFERENCES "PecaCatalogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemDiagnostico" ADD CONSTRAINT "OrdemDiagnostico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemDiagnostico" ADD CONSTRAINT "OrdemDiagnostico_diagnosticoCatalogoId_fkey" FOREIGN KEY ("diagnosticoCatalogoId") REFERENCES "DiagnosticoCatalogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoItem" ADD CONSTRAINT "OrdemServicoItem_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoItem" ADD CONSTRAINT "OrdemServicoItem_ordemDiagnosticoId_fkey" FOREIGN KEY ("ordemDiagnosticoId") REFERENCES "OrdemDiagnostico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoItem" ADD CONSTRAINT "OrdemServicoItem_servicoCatalogoId_fkey" FOREIGN KEY ("servicoCatalogoId") REFERENCES "ServicoCatalogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
