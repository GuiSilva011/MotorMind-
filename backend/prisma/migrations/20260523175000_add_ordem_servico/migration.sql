-- CreateEnum
CREATE TYPE "StatusOrdem" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA', 'FINALIZADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "OrdemPecaItem" ADD COLUMN     "codigoVisual" VARCHAR(10);

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

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_codigo_key" ON "OrdemServico"("codigo");

-- AddForeignKey
ALTER TABLE "OrdemPecaItem" ADD CONSTRAINT "OrdemPecaItem_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemPecaItem" ADD CONSTRAINT "OrdemPecaItem_ordemDiagnosticoId_fkey" FOREIGN KEY ("ordemDiagnosticoId") REFERENCES "OrdemDiagnostico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemPecaItem" ADD CONSTRAINT "OrdemPecaItem_ordemServicoItemId_fkey" FOREIGN KEY ("ordemServicoItemId") REFERENCES "OrdemServicoItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemPecaItem" ADD CONSTRAINT "OrdemPecaItem_pecaCatalogoId_fkey" FOREIGN KEY ("pecaCatalogoId") REFERENCES "PecaCatalogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
