/*
  Warnings:

  - You are about to drop the column `ativo` on the `DiagnosticoCatalogo` table. All the data in the column will be lost.
  - You are about to drop the column `ativo` on the `PecaCatalogo` table. All the data in the column will be lost.
  - You are about to drop the column `ativo` on the `ServicoCatalogo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DiagnosticoCatalogo" DROP COLUMN "ativo";

-- AlterTable
ALTER TABLE "PecaCatalogo" DROP COLUMN "ativo";

-- AlterTable
ALTER TABLE "ServicoCatalogo" DROP COLUMN "ativo";
