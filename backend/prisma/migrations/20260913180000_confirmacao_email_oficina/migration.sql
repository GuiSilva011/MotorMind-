CREATE TABLE "ConfirmacaoEmailOficina" (
  "id" SERIAL NOT NULL,
  "oficinaId" INTEGER NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "email" VARCHAR(120) NOT NULL,
  "tokenHash" VARCHAR(64) NOT NULL,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "enviadoEm" TIMESTAMP(3),
  "consumidoEm" TIMESTAMP(3),
  "invalidadoEm" TIMESTAMP(3),
  CONSTRAINT "ConfirmacaoEmailOficina_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConfirmacaoEmailOficina_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ConfirmacaoEmailOficina_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ConfirmacaoEmailOficina_tokenHash_key" ON "ConfirmacaoEmailOficina"("tokenHash");
CREATE INDEX "ConfirmacaoEmailOficina_oficinaId_criadoEm_idx" ON "ConfirmacaoEmailOficina"("oficinaId", "criadoEm");
CREATE INDEX "ConfirmacaoEmailOficina_usuarioId_idx" ON "ConfirmacaoEmailOficina"("usuarioId");
