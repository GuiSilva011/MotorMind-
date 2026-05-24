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

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
