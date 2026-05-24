/*
  Warnings:

  - You are about to drop the column `ativo` on the `Fornecedor` table. All the data in the column will be lost.
  - You are about to alter the column `nome` on the `Fornecedor` table. The data in that column could be lost. The data in that column will be cast from `VarChar(80)` to `VarChar(50)`.
  - You are about to alter the column `telefone` on the `Fornecedor` table. The data in that column could be lost. The data in that column will be cast from `VarChar(15)` to `VarChar(11)`.
  - You are about to alter the column `celular` on the `Fornecedor` table. The data in that column could be lost. The data in that column will be cast from `VarChar(15)` to `VarChar(14)`.
  - A unique constraint covering the columns `[cnpj]` on the table `Fornecedor` will be added. If there are existing duplicate values, this will fail.
  - Made the column `cnpj` on table `Fornecedor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Fornecedor" DROP COLUMN "ativo",
ADD COLUMN     "bairro" VARCHAR(50),
ADD COLUMN     "cep" VARCHAR(9),
ADD COLUMN     "cidade" VARCHAR(50),
ADD COLUMN     "complemento" VARCHAR(20),
ADD COLUMN     "endereco" VARCHAR(100),
ADD COLUMN     "inscricao" VARCHAR(20),
ADD COLUMN     "numero" VARCHAR(10),
ADD COLUMN     "uf" VARCHAR(2),
ALTER COLUMN "nome" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "cnpj" SET NOT NULL,
ALTER COLUMN "telefone" SET DATA TYPE VARCHAR(11),
ALTER COLUMN "celular" SET DATA TYPE VARCHAR(14);

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_cnpj_key" ON "Fornecedor"("cnpj");
