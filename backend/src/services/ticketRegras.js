export class TicketError extends Error {
  constructor(status, mensagem) { super(mensagem); this.status = status; }
}

export const PRAZO_CHAT_MS = 48 * 60 * 60 * 1000;
export const STATUS_FINAIS = ['ENTREGUE', 'CANCELADA'];
export const STATUS_TICKET = ['ABERTA', 'EM_ATENDIMENTO', 'AGUARDANDO_PECA', 'DISPONIVEL', ...STATUS_FINAIS];
export const OS_ENCERRADA = ['FECHADA', 'CANCELADA'];
export const PERFIS_ATENDIMENTO = ['OPERADOR', 'ADMIN', 'OWNER'];
export const TRANSICOES = {
  EM_ATENDIMENTO: ['AGUARDANDO_PECA', 'DISPONIVEL', 'CANCELADA'],
  AGUARDANDO_PECA: ['EM_ATENDIMENTO', 'DISPONIVEL', 'CANCELADA'],
  DISPONIVEL: ['EM_ATENDIMENTO', 'ENTREGUE', 'CANCELADA'],
};

export function inteiro(valor, nome = 'ID', maximo = 2147483647) {
  if (!['number', 'string'].includes(typeof valor) || !/^\d+$/.test(String(valor))) throw new TicketError(400, `${nome} inválido.`);
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero < 1 || numero > maximo) throw new TicketError(400, `${nome} inválido.`);
  return numero;
}

export function texto(valor, maximo, nome, obrigatorio = false) {
  if (valor != null && typeof valor !== 'string') throw new TicketError(400, `${nome} inválido.`);
  const resultado = valor?.trim() || '';
  if ((obrigatorio && !resultado) || resultado.length > maximo) throw new TicketError(400, `${nome}: informe ${obrigatorio ? 'de 1 até' : 'até'} ${maximo} caracteres.`);
  return resultado || null;
}

export function chave(val) {
  if (typeof val !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(val)) throw new TicketError(400, 'Identificador de envio inválido. Reabra o formulário.');
  return val.toLowerCase();
}

export function validarItens(itens) {
  if (!Array.isArray(itens) || !itens.length || itens.length > 20) throw new TicketError(400, 'Informe de 1 a 20 peças.');
  return itens.map(item => ({
    nomePeca: texto(item?.nomePeca, 120, 'Nome da peça', true),
    quantidadeSolicitada: inteiro(item?.quantidadeSolicitada, 'Quantidade', 100000),
    observacao: texto(item?.observacao, 500, 'Observação da peça'),
  }));
}

export function validarAcesso(ticket, usuario) {
  if (!ticket || ticket.oficinaId !== usuario.oficinaId ||
    (usuario.role === 'TECNICO' ? ticket.solicitanteId !== usuario.id : !PERFIS_ATENDIMENTO.includes(usuario.role))) throw new TicketError(404, 'Ticket não encontrado.');
}

export function participante(ticket, usuario) {
  return ticket.oficinaId === usuario.oficinaId && (ticket.solicitanteId === usuario.id || ticket.responsavelId === usuario.id);
}

export function validarChat(ticket, usuario, escrita = false) {
  validarAcesso(ticket, usuario);
  if (!participante(ticket, usuario)) throw new TicketError(403, 'O chat é exclusivo do solicitante e do responsável.');
  if (escrita && (!ticket.responsavelId || STATUS_FINAIS.includes(ticket.status))) throw new TicketError(409, 'O chat exige um ticket assumido e em aberto.');
  if (escrita && OS_ENCERRADA.includes(ticket.ordemServico.status)) throw new TicketError(409, 'A OS está encerrada; o chat está em somente leitura.');
  if (escrita && usuario.role === 'TECNICO' && ticket.ordemServico.tecnicoId !== usuario.id) throw new TicketError(403, 'Esta OS não está mais atribuída a você.');
}

export function validarTransicao(ticket, usuario, status, motivo) {
  validarAcesso(ticket, usuario);
  const cancelaAberta = ticket.status === 'ABERTA' && status === 'CANCELADA' && ticket.solicitanteId === usuario.id;
  if (!cancelaAberta && (ticket.responsavelId !== usuario.id || !PERFIS_ATENDIMENTO.includes(usuario.role))) throw new TicketError(403, 'Somente o responsável pode alterar o atendimento.');
  if (!cancelaAberta && !TRANSICOES[ticket.status]?.includes(status)) throw new TicketError(409, 'Mudança de status não permitida. Atualize o ticket.');
  if (OS_ENCERRADA.includes(ticket.ordemServico.status) && status !== 'CANCELADA') throw new TicketError(409, 'A OS está encerrada. Apenas o cancelamento do ticket é permitido.');
  if (status === 'CANCELADA' && !motivo) throw new TicketError(400, 'Informe o motivo do cancelamento.');
}
