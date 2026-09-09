ALTER TYPE "TipoMovimentacaoEstoque" ADD VALUE 'SAIDA_OS';
ALTER TYPE "TipoMovimentacaoEstoque" ADD VALUE 'DEVOLUCAO_OS';

ALTER TABLE "OrdemPecaItem" ADD COLUMN "estoquePecaId" INTEGER;
ALTER TABLE "EstoqueMovimentacao" ADD COLUMN "ordemServicoId" INTEGER;

CREATE INDEX "OrdemPecaItem_estoquePecaId_idx" ON "OrdemPecaItem"("estoquePecaId");
CREATE INDEX "EstoqueMovimentacao_ordemServicoId_idx" ON "EstoqueMovimentacao"("ordemServicoId");

ALTER TABLE "OrdemPecaItem"
ADD CONSTRAINT "OrdemPecaItem_estoquePecaId_fkey"
FOREIGN KEY ("estoquePecaId") REFERENCES "EstoquePeca"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EstoqueMovimentacao"
ADD CONSTRAINT "EstoqueMovimentacao_ordemServicoId_fkey"
FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
