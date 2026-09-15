export async function notificarTicket(tx, { oficinaId, tipo, titulo, mensagem, usuarios, ordemServicoId, requisicaoPecaId, expiresAt }) {
  const config = await tx.configuracaoOficina.findUnique({ where: { oficinaId } });
  if (tipo === 'MENSAGEM_TICKET' ? config?.notificarChatSistema === false : config?.notificarTicketsSistema === false) return;
  const destinatarios = await tx.usuario.findMany({
    where: { oficinaId, ...(usuarios ? { id: { in: [...new Set(usuarios)] } } : { Role: 'OPERADOR' }) }, select: { id: true },
  });
  if (!destinatarios.length) return;
  await tx.notificacao.create({ data: {
    oficinaId, tipo, titulo, mensagem, ordemServicoId, requisicaoPecaId, expiresAt,
    usuarios: { create: destinatarios.map(u => ({ usuarioId: u.id })) },
  } });
}
