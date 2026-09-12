ALTER TABLE "RequisicaoPeca" DROP CONSTRAINT "RequisicaoPeca_ordemServicoId_fkey";
ALTER TABLE "RequisicaoPeca" ADD CONSTRAINT "RequisicaoPeca_ordemServicoId_fkey"
  FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RequisicaoPeca" ADD COLUMN "chaveAbertura" VARCHAR(36);
ALTER TABLE "MensagemTicket" ADD COLUMN "chaveEnvio" VARCHAR(36);
CREATE UNIQUE INDEX "RequisicaoPeca_oficinaId_solicitanteId_chaveAbertura_key"
  ON "RequisicaoPeca"("oficinaId", "solicitanteId", "chaveAbertura");
CREATE UNIQUE INDEX "MensagemTicket_conversaId_autorId_chaveEnvio_key"
  ON "MensagemTicket"("conversaId", "autorId", "chaveEnvio");
CREATE TABLE "RequisicaoPecaHistorico" (
  "id" SERIAL NOT NULL,
  "requisicaoPecaId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "statusAnterior" "StatusRequisicaoPeca",
  "statusAtual" "StatusRequisicaoPeca" NOT NULL,
  "motivo" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequisicaoPecaHistorico_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RequisicaoPecaHistorico_requisicaoPecaId_fkey"
    FOREIGN KEY ("requisicaoPecaId") REFERENCES "RequisicaoPeca"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "RequisicaoPecaHistorico_requisicaoPecaId_createdAt_idx"
  ON "RequisicaoPecaHistorico"("requisicaoPecaId", "createdAt");
