-- CreateTable
CREATE TABLE "DiagnosticoCatalogo" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "descricao" VARCHAR(255),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
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
    "ativo" BOOLEAN NOT NULL DEFAULT true,
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
    "unidade" VARCHAR(10) DEFAULT 'UN',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
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
    "codigoHierarquia" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemPecaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "cnpj" VARCHAR(18),
    "email" VARCHAR(70),
    "telefone" VARCHAR(15),
    "celular" VARCHAR(15),
    "fornecePecas" BOOLEAN NOT NULL DEFAULT true,
    "forneceServicos" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" VARCHAR(255),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticoCatalogo_codigo_key" ON "DiagnosticoCatalogo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ServicoCatalogo_codigo_key" ON "ServicoCatalogo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "PecaCatalogo_codigo_key" ON "PecaCatalogo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_codigo_key" ON "Fornecedor"("codigo");
