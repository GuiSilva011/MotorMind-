/*
  Warnings:

  - You are about to drop the column `rg` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `ano` on the `Veiculo` table. All the data in the column will be lost.
  - You are about to drop the column `anoModelo` on the `Veiculo` table. All the data in the column will be lost.
  - You are about to drop the column `marca` on the `Veiculo` table. All the data in the column will be lost.
  - You are about to drop the column `modelo` on the `Veiculo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "rg",
ADD COLUMN     "complemento" TEXT,
ALTER COLUMN "cpf" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Veiculo" DROP COLUMN "ano",
DROP COLUMN "anoModelo",
DROP COLUMN "marca",
DROP COLUMN "modelo",
ADD COLUMN     "ano_fabricacao" INTEGER,
ADD COLUMN     "ano_modelo" INTEGER,
ADD COLUMN     "ar" BOOLEAN,
ADD COLUMN     "cor" TEXT,
ADD COLUMN     "fabricante" TEXT,
ADD COLUMN     "km" TEXT,
ADD COLUMN     "motor" TEXT,
ADD COLUMN     "observacoes" TEXT;
