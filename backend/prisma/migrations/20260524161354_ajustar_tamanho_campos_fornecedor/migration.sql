/*
  Warnings:

  - Added the required column `UpdatedAt` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Fornecedor" ALTER COLUMN "nome" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "telefone" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "celular" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "bairro" SET DATA TYPE VARCHAR(60),
ALTER COLUMN "cidade" SET DATA TYPE VARCHAR(60),
ALTER COLUMN "complemento" SET DATA TYPE VARCHAR(80),
ALTER COLUMN "endereco" SET DATA TYPE VARCHAR(120),
ALTER COLUMN "inscricao" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL;

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
CREATE UNIQUE INDEX "Funcionario_usuarioId_key" ON "Funcionario"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_Cpf_key" ON "Funcionario"("Cpf");

-- AddForeignKey
ALTER TABLE "Funcionario" ADD CONSTRAINT "Funcionario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
