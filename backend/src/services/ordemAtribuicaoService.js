import { TicketError, OS_ENCERRADA, STATUS_FINAIS } from '../utils/ticketRegras.js';
import { notificarTicket } from '../utils/notificacaoTicket.js';

export async function sincronizarAtribuicao(tx, ordem, tecnicoId, status, usuario) {
  const encerrada = OS_ENCERRADA.includes(status);
  if (encerrada || ordem.tecnicoId !== tecnicoId) {
    const pendentes = await tx.requisicaoPeca.count({ where: { ordemServicoId: ordem.id, oficinaId: usuario.oficinaId, status: { notIn: STATUS_FINAIS } } });
    if (pendentes) throw new TicketError(409, 'Conclua ou cancele os tickets pendentes antes de encerrar a OS ou trocar o mecânico.');
  }
  const atuais = await tx.ordemServicoAtribuicao.findMany({ where: { oficinaId: usuario.oficinaId, ordemServicoId: ordem.id, ativa: true } });
  const manter = !encerrada && tecnicoId ? atuais.find(a => a.tecnicoId === tecnicoId) : null;
  await tx.ordemServicoAtribuicao.updateMany({ where: { oficinaId: usuario.oficinaId, ordemServicoId: ordem.id, ativa: true, ...(manter ? { id: { not: manter.id } } : {}) }, data: { ativa: false, encerradoEm: new Date() } });
  if (encerrada || !tecnicoId || manter) return;
  await tx.ordemServicoAtribuicao.create({ data: { oficinaId: usuario.oficinaId, ordemServicoId: ordem.id, tecnicoId, atribuidoPorId: usuario.id } });
  await notificarTicket(tx, { oficinaId: usuario.oficinaId, tipo: 'ORDEM_ATRIBUIDA', titulo: `OS ${ordem.codigo} atribuída`, mensagem: 'Uma ordem de serviço foi atribuída a você. Acesse o painel técnico para visualizar os itens salvos.', usuarios: [tecnicoId], ordemServicoId: ordem.id });
}
