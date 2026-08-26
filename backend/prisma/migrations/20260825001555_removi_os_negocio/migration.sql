/*
  Warnings:

  - You are about to drop the `Assinatura` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Plano` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusLicenca" AS ENUM ('PENDENTE', 'ATIVA', 'CANCELADA');

-- DropForeignKey
ALTER TABLE "Assinatura" DROP CONSTRAINT "Assinatura_oficinaId_fkey";

-- DropForeignKey
ALTER TABLE "Assinatura" DROP CONSTRAINT "Assinatura_planoId_fkey";

-- DropTable
DROP TABLE "Assinatura";

-- DropTable
DROP TABLE "Plano";

-- DropEnum
DROP TYPE "StatusAssinatura";

-- CreateTable
CREATE TABLE "Licenca" (
    "id" SERIAL NOT NULL,
    "oficinaId" INTEGER NOT NULL,
    "status" "StatusLicenca" NOT NULL DEFAULT 'PENDENTE',
    "valor" DECIMAL(10,2),
    "codigoCompra" VARCHAR(100),
    "compradaEm" TIMESTAMP(3),
    "ativadaEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Licenca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Licenca_oficinaId_key" ON "Licenca"("oficinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Licenca_codigoCompra_key" ON "Licenca"("codigoCompra");

-- AddForeignKey
ALTER TABLE "Licenca" ADD CONSTRAINT "Licenca_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
