-- CreateEnum
CREATE TYPE "TipoMovimentacaoEstoque" AS ENUM ('ENTRADA', 'SAIDA', 'SAIDA_REQUISICAO', 'DEVOLUCAO', 'AJUSTE_ENTRADA', 'AJUSTE_SAIDA');

-- CreateEnum
CREATE TYPE "StatusAlertaEstoque" AS ENUM ('ATIVO', 'RESOLVIDO');

-- CreateEnum
CREATE TYPE "StatusRequisicaoPeca" AS ENUM ('ABERTA', 'EM_ATENDIMENTO', 'AGUARDANDO_PECA', 'DISPONIVEL', 'ENTREGUE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "OrigemAtendimentoPeca" AS ENUM ('ESTOQUE', 'COMPRA_FORNECEDOR');

-- CreateEnum
CREATE TYPE "TipoNotificacao" AS ENUM ('ESTOQUE_BAIXO', 'ORDEM_ATRIBUIDA', 'REQUISICAO_PECA', 'TICKET_ASSUMIDO', 'PECA_DISPONIVEL', 'MENSAGEM_TICKET', 'SISTEMA');

-- AlterEnum
ALTER TYPE "StatusOrdem" ADD VALUE 'FECHADA';

-- CreateTable
CREATE TABLE "ConfiguracaoOficina" (
    "id" SERIAL NOT NULL,
    "oficinaId" INTEGER NOT NULL,
    "notificarEstoqueEmail" BOOLEAN NOT NULL DEFAULT true,
    "notificarEstoqueSistema" BOOLEAN NOT NULL DEFAULT true,
    "notificarTicketsSistema" BOOLEAN NOT NULL DEFAULT true,
    "notificarChatSistema" BOOLEAN NOT NULL DEFAULT true,
    "emailNotificacaoEstoque" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoOficina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemServicoAtribuicao" (
    "id" SERIAL NOT NULL,
    "oficinaId" INTEGER NOT NULL,
    "ordemServicoId" INTEGER NOT NULL,
    "tecnicoId" INTEGER NOT NULL,
    "atribuidoPorId" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "atribuidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "encerradoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemServicoAtribuicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoquePeca" (
    "id" SERIAL NOT NULL,
    "oficinaId" INTEGER NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "marca" VARCHAR(60),
    "aplicacao" VARCHAR(150),
    "unidade" VARCHAR(10) NOT NULL DEFAULT 'UN',
    "quantidadeAtual" INTEGER NOT NULL DEFAULT 0,
    "quantidadeMinima" INTEGER NOT NULL DEFAULT 0,
    "localizacao" VARCHAR(80),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "alertaAtivo" BOOLEAN NOT NULL DEFAULT false,
    "ultimoAlertaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstoquePeca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstoqueMovimentacao" (
    "id" SERIAL NOT NULL,
    "oficinaId" INTEGER NOT NULL,
    "estoquePecaId" INTEGER NOT NULL,
    "usuarioId" INTEGER,
    "requisicaoItemId" INTEGER,
    "tipo" "TipoMovimentacaoEstoque" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "quantidadeAnterior" INTEGER NOT NULL,
    "quantidadePosterior" INTEGER NOT NULL,
    "observacao" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstoqueMovimentacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertaEstoque" (
    "id" SERIAL NOT NULL,
    "oficinaId" INTEGER NOT NULL,
    "estoquePecaId" INTEGER NOT NULL,
    "status" "StatusAlertaEstoque" NOT NULL DEFAULT 'ATIVO',
    "quantidadeDetectada" INTEGER NOT NULL,
    "quantidadeMinima" INTEGER NOT NULL,
    "emailEnviadoEm" TIMESTAMP(3),
    "resolvidoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertaEstoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisicaoPeca" (
    "id" SERIAL NOT NULL,
    "oficinaId" INTEGER NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "ordemServicoId" INTEGER NOT NULL,
    "solicitanteId" INTEGER NOT NULL,
    "responsavelId" INTEGER,
    "status" "StatusRequisicaoPeca" NOT NULL DEFAULT 'ABERTA',
    "observacao" VARCHAR(1000),
    "abertaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assumidaEm" TIMESTAMP(3),
    "concluidaEm" TIMESTAMP(3),
    "canceladaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequisicaoPeca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequisicaoPecaItem" (
    "id" SERIAL NOT NULL,
    "requisicaoPecaId" INTEGER NOT NULL,
    "estoquePecaId" INTEGER,
    "fornecedorId" INTEGER,
    "nomePeca" VARCHAR(120) NOT NULL,
    "quantidadeSolicitada" INTEGER NOT NULL DEFAULT 1,
    "quantidadeAtendida" INTEGER NOT NULL DEFAULT 0,
    "origemAtendimento" "OrigemAtendimentoPeca",
    "observacao" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequisicaoPecaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversaTicket" (
    "id" SERIAL NOT NULL,
    "oficinaId" INTEGER NOT NULL,
    "requisicaoPecaId" INTEGER NOT NULL,
    "encerradaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversaTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemTicket" (
    "id" SERIAL NOT NULL,
    "oficinaId" INTEGER NOT NULL,
    "conversaId" INTEGER NOT NULL,
    "autorId" INTEGER NOT NULL,
    "conteudo" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MensagemTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemAnexo" (
    "id" SERIAL NOT NULL,
    "mensagemId" INTEGER NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "nomeArquivo" VARCHAR(255),
    "mimeType" VARCHAR(100),
    "tamanhoBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemAnexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" SERIAL NOT NULL,
    "oficinaId" INTEGER NOT NULL,
    "tipo" "TipoNotificacao" NOT NULL,
    "titulo" VARCHAR(120) NOT NULL,
    "mensagem" VARCHAR(500) NOT NULL,
    "ordemServicoId" INTEGER,
    "requisicaoPecaId" INTEGER,
    "alertaEstoqueId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificacaoUsuario" (
    "id" SERIAL NOT NULL,
    "notificacaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "lidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificacaoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguracaoOficina_oficinaId_key" ON "ConfiguracaoOficina"("oficinaId");

-- CreateIndex
CREATE INDEX "OrdemServicoAtribuicao_oficinaId_idx" ON "OrdemServicoAtribuicao"("oficinaId");

-- CreateIndex
CREATE INDEX "OrdemServicoAtribuicao_ordemServicoId_idx" ON "OrdemServicoAtribuicao"("ordemServicoId");

-- CreateIndex
CREATE INDEX "OrdemServicoAtribuicao_tecnicoId_idx" ON "OrdemServicoAtribuicao"("tecnicoId");

-- CreateIndex
CREATE INDEX "OrdemServicoAtribuicao_ativa_idx" ON "OrdemServicoAtribuicao"("ativa");

-- CreateIndex
CREATE INDEX "EstoquePeca_oficinaId_idx" ON "EstoquePeca"("oficinaId");

-- CreateIndex
CREATE INDEX "EstoquePeca_quantidadeAtual_idx" ON "EstoquePeca"("quantidadeAtual");

-- CreateIndex
CREATE UNIQUE INDEX "EstoquePeca_oficinaId_codigo_key" ON "EstoquePeca"("oficinaId", "codigo");

-- CreateIndex
CREATE INDEX "EstoqueMovimentacao_oficinaId_idx" ON "EstoqueMovimentacao"("oficinaId");

-- CreateIndex
CREATE INDEX "EstoqueMovimentacao_estoquePecaId_idx" ON "EstoqueMovimentacao"("estoquePecaId");

-- CreateIndex
CREATE INDEX "EstoqueMovimentacao_usuarioId_idx" ON "EstoqueMovimentacao"("usuarioId");

-- CreateIndex
CREATE INDEX "EstoqueMovimentacao_requisicaoItemId_idx" ON "EstoqueMovimentacao"("requisicaoItemId");

-- CreateIndex
CREATE INDEX "EstoqueMovimentacao_createdAt_idx" ON "EstoqueMovimentacao"("createdAt");

-- CreateIndex
CREATE INDEX "AlertaEstoque_oficinaId_idx" ON "AlertaEstoque"("oficinaId");

-- CreateIndex
CREATE INDEX "AlertaEstoque_estoquePecaId_idx" ON "AlertaEstoque"("estoquePecaId");

-- CreateIndex
CREATE INDEX "AlertaEstoque_status_idx" ON "AlertaEstoque"("status");

-- CreateIndex
CREATE INDEX "RequisicaoPeca_oficinaId_idx" ON "RequisicaoPeca"("oficinaId");

-- CreateIndex
CREATE INDEX "RequisicaoPeca_ordemServicoId_idx" ON "RequisicaoPeca"("ordemServicoId");

-- CreateIndex
CREATE INDEX "RequisicaoPeca_solicitanteId_idx" ON "RequisicaoPeca"("solicitanteId");

-- CreateIndex
CREATE INDEX "RequisicaoPeca_responsavelId_idx" ON "RequisicaoPeca"("responsavelId");

-- CreateIndex
CREATE INDEX "RequisicaoPeca_status_idx" ON "RequisicaoPeca"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RequisicaoPeca_oficinaId_codigo_key" ON "RequisicaoPeca"("oficinaId", "codigo");

-- CreateIndex
CREATE INDEX "RequisicaoPecaItem_requisicaoPecaId_idx" ON "RequisicaoPecaItem"("requisicaoPecaId");

-- CreateIndex
CREATE INDEX "RequisicaoPecaItem_estoquePecaId_idx" ON "RequisicaoPecaItem"("estoquePecaId");

-- CreateIndex
CREATE INDEX "RequisicaoPecaItem_fornecedorId_idx" ON "RequisicaoPecaItem"("fornecedorId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversaTicket_requisicaoPecaId_key" ON "ConversaTicket"("requisicaoPecaId");

-- CreateIndex
CREATE INDEX "ConversaTicket_oficinaId_idx" ON "ConversaTicket"("oficinaId");

-- CreateIndex
CREATE INDEX "MensagemTicket_oficinaId_idx" ON "MensagemTicket"("oficinaId");

-- CreateIndex
CREATE INDEX "MensagemTicket_conversaId_idx" ON "MensagemTicket"("conversaId");

-- CreateIndex
CREATE INDEX "MensagemTicket_autorId_idx" ON "MensagemTicket"("autorId");

-- CreateIndex
CREATE INDEX "MensagemTicket_expiresAt_idx" ON "MensagemTicket"("expiresAt");

-- CreateIndex
CREATE INDEX "MensagemAnexo_mensagemId_idx" ON "MensagemAnexo"("mensagemId");

-- CreateIndex
CREATE INDEX "Notificacao_oficinaId_idx" ON "Notificacao"("oficinaId");

-- CreateIndex
CREATE INDEX "Notificacao_tipo_idx" ON "Notificacao"("tipo");

-- CreateIndex
CREATE INDEX "Notificacao_ordemServicoId_idx" ON "Notificacao"("ordemServicoId");

-- CreateIndex
CREATE INDEX "Notificacao_requisicaoPecaId_idx" ON "Notificacao"("requisicaoPecaId");

-- CreateIndex
CREATE INDEX "Notificacao_alertaEstoqueId_idx" ON "Notificacao"("alertaEstoqueId");

-- CreateIndex
CREATE INDEX "Notificacao_expiresAt_idx" ON "Notificacao"("expiresAt");

-- CreateIndex
CREATE INDEX "Notificacao_createdAt_idx" ON "Notificacao"("createdAt");

-- CreateIndex
CREATE INDEX "NotificacaoUsuario_usuarioId_idx" ON "NotificacaoUsuario"("usuarioId");

-- CreateIndex
CREATE INDEX "NotificacaoUsuario_lidaEm_idx" ON "NotificacaoUsuario"("lidaEm");

-- CreateIndex
CREATE UNIQUE INDEX "NotificacaoUsuario_notificacaoId_usuarioId_key" ON "NotificacaoUsuario"("notificacaoId", "usuarioId");

-- CreateIndex
CREATE INDEX "OrdemServico_operadorId_idx" ON "OrdemServico"("operadorId");

-- CreateIndex
CREATE INDEX "OrdemServico_tecnicoId_idx" ON "OrdemServico"("tecnicoId");

-- AddForeignKey
ALTER TABLE "ConfiguracaoOficina" ADD CONSTRAINT "ConfiguracaoOficina_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServico" ADD CONSTRAINT "OrdemServico_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoAtribuicao" ADD CONSTRAINT "OrdemServicoAtribuicao_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoAtribuicao" ADD CONSTRAINT "OrdemServicoAtribuicao_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoAtribuicao" ADD CONSTRAINT "OrdemServicoAtribuicao_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemServicoAtribuicao" ADD CONSTRAINT "OrdemServicoAtribuicao_atribuidoPorId_fkey" FOREIGN KEY ("atribuidoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoquePeca" ADD CONSTRAINT "EstoquePeca_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimentacao" ADD CONSTRAINT "EstoqueMovimentacao_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimentacao" ADD CONSTRAINT "EstoqueMovimentacao_estoquePecaId_fkey" FOREIGN KEY ("estoquePecaId") REFERENCES "EstoquePeca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimentacao" ADD CONSTRAINT "EstoqueMovimentacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstoqueMovimentacao" ADD CONSTRAINT "EstoqueMovimentacao_requisicaoItemId_fkey" FOREIGN KEY ("requisicaoItemId") REFERENCES "RequisicaoPecaItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaEstoque" ADD CONSTRAINT "AlertaEstoque_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertaEstoque" ADD CONSTRAINT "AlertaEstoque_estoquePecaId_fkey" FOREIGN KEY ("estoquePecaId") REFERENCES "EstoquePeca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoPeca" ADD CONSTRAINT "RequisicaoPeca_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoPeca" ADD CONSTRAINT "RequisicaoPeca_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoPeca" ADD CONSTRAINT "RequisicaoPeca_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoPeca" ADD CONSTRAINT "RequisicaoPeca_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoPecaItem" ADD CONSTRAINT "RequisicaoPecaItem_requisicaoPecaId_fkey" FOREIGN KEY ("requisicaoPecaId") REFERENCES "RequisicaoPeca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoPecaItem" ADD CONSTRAINT "RequisicaoPecaItem_estoquePecaId_fkey" FOREIGN KEY ("estoquePecaId") REFERENCES "EstoquePeca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoPecaItem" ADD CONSTRAINT "RequisicaoPecaItem_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversaTicket" ADD CONSTRAINT "ConversaTicket_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversaTicket" ADD CONSTRAINT "ConversaTicket_requisicaoPecaId_fkey" FOREIGN KEY ("requisicaoPecaId") REFERENCES "RequisicaoPeca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemTicket" ADD CONSTRAINT "MensagemTicket_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemTicket" ADD CONSTRAINT "MensagemTicket_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "ConversaTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemTicket" ADD CONSTRAINT "MensagemTicket_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemAnexo" ADD CONSTRAINT "MensagemAnexo_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "MensagemTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_requisicaoPecaId_fkey" FOREIGN KEY ("requisicaoPecaId") REFERENCES "RequisicaoPeca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_alertaEstoqueId_fkey" FOREIGN KEY ("alertaEstoqueId") REFERENCES "AlertaEstoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacaoUsuario" ADD CONSTRAINT "NotificacaoUsuario_notificacaoId_fkey" FOREIGN KEY ("notificacaoId") REFERENCES "Notificacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacaoUsuario" ADD CONSTRAINT "NotificacaoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
