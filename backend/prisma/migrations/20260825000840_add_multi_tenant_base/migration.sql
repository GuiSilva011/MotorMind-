/*
  Warnings:

  - A unique constraint covering the columns `[oficinaId,codigo]` on the table `DiagnosticoCatalogo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[oficinaId,codigo]` on the table `Fornecedor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[oficinaId,cnpj]` on the table `Fornecedor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[oficinaId,Cpf]` on the table `Funcionario` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[oficinaId,codigo]` on the table `OrdemServico` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[oficinaId,codigo]` on the table `PecaCatalogo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[oficinaId,codigo]` on the table `ServicoCatalogo` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[oficinaId,placa]` on the table `Veiculo` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `oficinaId` to the `Agendamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oficinaId` to the `Checklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oficinaId` to the `Cliente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oficinaId` to the `DiagnosticoCatalogo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oficinaId` to the `Fornecedor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oficinaId` to the `Funcionario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oficinaId` to the `OrdemServico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oficinaId` to the `PecaCatalogo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oficinaId` to the `ServicoCatalogo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oficinaId` to the `Usuario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oficinaId` to the `Veiculo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusOficina" AS ENUM ('PENDENTE', 'ATIVA', 'SUSPENSA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('PENDENTE', 'ATIVA', 'ATRASADA', 'CANCELADA', 'EXPIRADA');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OWNER';

-- DropIndex
DROP INDEX "DiagnosticoCatalogo_codigo_key";

-- DropIndex
DROP INDEX "Fornecedor_cnpj_key";

-- DropIndex
DROP INDEX "Fornecedor_codigo_key";

-- DropIndex
DROP INDEX "Funcionario_Cpf_key";

-- DropIndex
DROP INDEX "OrdemServico_codigo_key";

-- DropIndex
DROP INDEX "PecaCatalogo_codigo_key";

-- DropIndex
DROP INDEX "ServicoCatalogo_codigo_key";

-- DropIndex
DROP INDEX "Veiculo_placa_key";

-- AlterTable
ALTER TABLE "Agendamento" ADD COLUMN     "oficinaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Checklist" ADD COLUMN     "oficinaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "oficinaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "DiagnosticoCatalogo" ADD COLUMN     "oficinaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Fornecedor" ADD COLUMN     "oficinaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Funcionario" ADD COLUMN     "oficinaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "OrdemServico" ADD COLUMN     "oficinaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "PecaCatalogo" ADD COLUMN     "oficinaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ServicoCatalogo" ADD COLUMN     "oficinaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "oficinaId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Veiculo" ADD COLUMN     "oficinaId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Oficina" (
    "id" SERIAL NOT NULL,
    "nomeFantasia" VARCHAR(120) NOT NULL,
    "razaoSocial" VARCHAR(150),
    "cnpj" VARCHAR(18),
    "email" VARCHAR(120),
    "telefone" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "cep" VARCHAR(9),
    "endereco" VARCHAR(120),
    "numero" VARCHAR(10),
    "complemento" VARCHAR(80),
    "bairro" VARCHAR(60),
    "cidade" VARCHAR(60),
    "uf" VARCHAR(2),
    "logoUrl" TEXT,
    "status" "StatusOficina" NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oficina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plano" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "descricao" VARCHAR(255),
    "valorMensal" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" SERIAL NOT NULL,
    "oficinaId" INTEGER NOT NULL,
    "planoId" INTEGER NOT NULL,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'PENDENTE',
    "inicioEm" TIMESTAMP(3),
    "periodoFimEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "gateway" VARCHAR(30),
    "gatewayCustomerId" VARCHAR(150),
    "gatewaySubscriptionId" VARCHAR(150),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Oficina_cnpj_key" ON "Oficina"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Plano_codigo_key" ON "Plano"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_oficinaId_key" ON "Assinatura"("oficinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Assinatura_gatewaySubscriptionId_key" ON "Assinatura"("gatewaySubscriptionId");

-- CreateIndex
CREATE INDEX "Assinatura_planoId_idx" ON "Assinatura"("planoId");

-- CreateIndex
CREATE INDEX "Agendamento_oficinaId_idx" ON "Agendamento"("oficinaId");

-- CreateIndex
CREATE INDEX "Agendamento_clienteId_idx" ON "Agendamento"("clienteId");

-- CreateIndex
CREATE INDEX "Agendamento_veiculoId_idx" ON "Agendamento"("veiculoId");

-- CreateIndex
CREATE INDEX "Agendamento_dataHora_idx" ON "Agendamento"("dataHora");

-- CreateIndex
CREATE INDEX "Checklist_oficinaId_idx" ON "Checklist"("oficinaId");

-- CreateIndex
CREATE INDEX "Checklist_veiculoId_idx" ON "Checklist"("veiculoId");

-- CreateIndex
CREATE INDEX "Cliente_oficinaId_idx" ON "Cliente"("oficinaId");

-- CreateIndex
CREATE INDEX "DiagnosticoCatalogo_oficinaId_idx" ON "DiagnosticoCatalogo"("oficinaId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticoCatalogo_oficinaId_codigo_key" ON "DiagnosticoCatalogo"("oficinaId", "codigo");

-- CreateIndex
CREATE INDEX "Fornecedor_oficinaId_idx" ON "Fornecedor"("oficinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_oficinaId_codigo_key" ON "Fornecedor"("oficinaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_oficinaId_cnpj_key" ON "Fornecedor"("oficinaId", "cnpj");

-- CreateIndex
CREATE INDEX "Funcionario_oficinaId_idx" ON "Funcionario"("oficinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_oficinaId_Cpf_key" ON "Funcionario"("oficinaId", "Cpf");

-- CreateIndex
CREATE INDEX "OrdemDiagnostico_ordemServicoId_idx" ON "OrdemDiagnostico"("ordemServicoId");

-- CreateIndex
CREATE INDEX "OrdemDiagnostico_diagnosticoCatalogoId_idx" ON "OrdemDiagnostico"("diagnosticoCatalogoId");

-- CreateIndex
CREATE INDEX "OrdemPecaItem_ordemServicoId_idx" ON "OrdemPecaItem"("ordemServicoId");

-- CreateIndex
CREATE INDEX "OrdemPecaItem_ordemDiagnosticoId_idx" ON "OrdemPecaItem"("ordemDiagnosticoId");

-- CreateIndex
CREATE INDEX "OrdemPecaItem_ordemServicoItemId_idx" ON "OrdemPecaItem"("ordemServicoItemId");

-- CreateIndex
CREATE INDEX "OrdemPecaItem_pecaCatalogoId_idx" ON "OrdemPecaItem"("pecaCatalogoId");

-- CreateIndex
CREATE INDEX "OrdemServico_oficinaId_idx" ON "OrdemServico"("oficinaId");

-- CreateIndex
CREATE INDEX "OrdemServico_veiculoId_idx" ON "OrdemServico"("veiculoId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemServico_oficinaId_codigo_key" ON "OrdemServico"("oficinaId", "codigo");

-- CreateIndex
CREATE INDEX "OrdemServicoItem_ordemServicoId_idx" ON "OrdemServicoItem"("ordemServicoId");

-- CreateIndex
CREATE INDEX "OrdemServicoItem_ordemDiagnosticoId_idx" ON "OrdemServicoItem"("ordemDiagnosticoId");

-- CreateIndex
CREATE INDEX "OrdemServicoItem_servicoCatalogoId_idx" ON "OrdemServicoItem"("servicoCatalogoId");

-- CreateIndex
CREATE INDEX "PecaCatalogo_oficinaId_idx" ON "PecaCatalogo"("oficinaId");

-- CreateIndex
CREATE UNIQUE INDEX "PecaCatalogo_oficinaId_codigo_key" ON "PecaCatalogo"("oficinaId", "codigo");

-- CreateIndex
CREATE INDEX "ServicoCatalogo_oficinaId_idx" ON "ServicoCatalogo"("oficinaId");

-- CreateIndex
CREATE UNIQUE INDEX "ServicoCatalogo_oficinaId_codigo_key" ON "ServicoCatalogo"("oficinaId", "codigo");

-- CreateIndex
CREATE INDEX "Usuario_oficinaId_idx" ON "Usuario"("oficinaId");

-- CreateIndex
CREATE INDEX "Veiculo_oficinaId_idx" ON "Veiculo"("oficinaId");

-- CreateIndex
CREATE INDEX "Veiculo_clienteId_idx" ON "Veiculo"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Veiculo_oficinaId_placa_key" ON "Veiculo"("oficinaId", "placa");

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "Plano"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticoCatalogo" ADD CONSTRAINT "DiagnosticoCatalogo_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicoCatalogo" ADD CONSTRAINT "ServicoCatalogo_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PecaCatalogo" ADD CONSTRAINT "PecaCatalogo_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
