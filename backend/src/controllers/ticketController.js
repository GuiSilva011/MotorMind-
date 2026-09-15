import prisma from '../config/prisma.js';
import { arquivosTicket, caminhoAnexo } from '../utils/ticketArquivos.js';
import { notificarTicket } from '../utils/notificacaoTicket.js';
import { randomUUID } from 'node:crypto';
import {
  TicketError, PRAZO_CHAT_MS, OS_ENCERRADA, PERFIS_ATENDIMENTO, STATUS_FINAIS,
  STATUS_TICKET, inteiro, texto, chave, validarItens, validarAcesso, validarChat,
  validarTransicao, participante,
} from '../utils/ticketRegras.js';

const pessoa = { select: { id: true, Nome: true } };
const includeTicket = {
  solicitante: pessoa, responsavel: pessoa,
  ordemServico: { select: {
    id: true, codigo: true, status: true, tecnicoId: true,
    veiculo: { select: { placa: true, modelo: true, fabricante: true } },
  } },
  itens: { orderBy: { id: 'asc' } },
};
const includeMensagem = {
  autor: pessoa,
  anexos: { select: { id: true, nomeArquivo: true, mimeType: true, tamanhoBytes: true } },
};

async function buscar(db, usuario, id) {
  const ticket = await db.requisicaoPeca.findFirst({ where: { id: inteiro(id), oficinaId: usuario.oficinaId }, include: includeTicket });
  validarAcesso(ticket, usuario);
  return ticket;
}

// A OS é sempre bloqueada antes do ticket, como na edição/exclusão da OS.
async function comTicket(usuario, id, acao) {
  return prisma.$transaction(async tx => {
    const inicial = await buscar(tx, usuario, id);
    await tx.$queryRaw`SELECT id FROM "OrdemServico" WHERE id = ${inicial.ordemServicoId} AND "oficinaId" = ${usuario.oficinaId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM "RequisicaoPeca" WHERE id = ${inicial.id} AND "oficinaId" = ${usuario.oficinaId} FOR UPDATE`;
    return acao(tx, await buscar(tx, usuario, id));
  }, { timeout: 15000 });
}

async function historico(tx, ticket, usuario, statusAtual, motivo = null) {
  await tx.requisicaoPecaHistorico.create({ data: {
    requisicaoPecaId: ticket.id, usuarioId: usuario.id, statusAnterior: ticket.status, statusAtual, motivo,
  } });
}

function filtroNotificacoes(usuario) {
  return { usuarioId: usuario.id, notificacao: {
    oficinaId: usuario.oficinaId, tipo: { not: 'ESTOQUE_BAIXO' },
    OR: [{ requisicaoPecaId: { not: null } }, { tipo: 'ORDEM_ATRIBUIDA' }],
    AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
  } };
}

export async function listarTecnicosTicket(req, res, next) {
  try {
    const tecnicos = await prisma.usuario.findMany({
      where: { oficinaId: req.user.oficinaId, Role: 'TECNICO' },
      select: { id: true, Nome: true },
      orderBy: { Nome: 'asc' },
    });
    return res.json(tecnicos);
  } catch (error) {
    next(error);
  }
}

export async function listarNotificacoesTicket(req, res, next) {
  try {
    const where = filtroNotificacoes(req.user);
    const [itens, naoLidas] = await prisma.$transaction([
      prisma.notificacaoUsuario.findMany({ where, include: { notificacao: true }, orderBy: { id: 'desc' }, take: 30 }),
      prisma.notificacaoUsuario.count({ where: { ...where, lidaEm: null } }),
    ]);
    return res.json({ itens, naoLidas });
  } catch (error) {
    next(error);
  }
}

export async function marcarNotificacoesTicketLidas(req, res, next) {
  try {
    await prisma.notificacaoUsuario.updateMany({
      where: { ...filtroNotificacoes(req.user), lidaEm: null },
      data: { lidaEm: new Date() },
    });
    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function marcarNotificacaoTicketLida(req, res, next) {
  try {
    const resultado = await prisma.notificacaoUsuario.updateMany({
      where: { ...filtroNotificacoes(req.user), id: inteiro(req.params.id) },
      data: { lidaEm: new Date() },
    });
    if (!resultado.count) throw new TicketError(404, 'Notificação não encontrada.');
    return res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

export async function listarOrdensTicket(req, res, next) {
  try {
    const usuario = req.user;
    if (usuario.role !== 'TECNICO') throw new TicketError(403, 'Esta lista é exclusiva do técnico.');
    const resultado = await prisma.ordemServico.findMany({
      where: { oficinaId: usuario.oficinaId, tecnicoId: usuario.id, status: { notIn: OS_ENCERRADA } },
      select: { id: true, codigo: true, status: true, observacoes: true, veiculo: { select: { placa: true, fabricante: true, modelo: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return res.json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function listarTickets(req, res, next) {
  try {
    const usuario = req.user;
    const filtros = req.query;
    const pagina = inteiro(filtros.pagina || 1, 'Página', 100000);
    const where = { oficinaId: usuario.oficinaId };
    if (usuario.role === 'TECNICO') where.solicitanteId = usuario.id;
    else if (!PERFIS_ATENDIMENTO.includes(usuario.role)) throw new TicketError(403, 'Perfil sem acesso.');
    if (filtros.status === 'ATIVOS' || !filtros.status) where.status = { notIn: STATUS_FINAIS };
    else if (filtros.status !== 'TODOS') {
      if (!STATUS_TICKET.includes(filtros.status)) throw new TicketError(400, 'Status inválido.');
      where.status = filtros.status;
    }
    if (filtros.meus === 'true' && usuario.role !== 'TECNICO') where.responsavelId = usuario.id;
    if (filtros.ordemServicoId) where.ordemServicoId = inteiro(filtros.ordemServicoId);
    const [total, itens] = await prisma.$transaction([
      prisma.requisicaoPeca.count({ where }),
      prisma.requisicaoPeca.findMany({ where, include: includeTicket, orderBy: { id: 'desc' }, take: 30, skip: (pagina - 1) * 30 }),
    ]);
    return res.json({ itens, total, pagina });
  } catch (error) {
    next(error);
  }
}

export async function buscarTicketPorId(req, res, next) {
  try {
    const usuario = req.user;
    const id = req.params.id;
    const ticket = await buscar(prisma, usuario, id);
    const registros = await prisma.requisicaoPecaHistorico.findMany({ where: { requisicaoPecaId: ticket.id }, orderBy: { id: 'asc' } });
    const autores = await prisma.usuario.findMany({ where: { oficinaId: usuario.oficinaId, id: { in: [...new Set(registros.map(h => h.usuarioId))] } }, select: { id: true, Nome: true } });
    return res.json({ ...ticket, podeLerChat: participante(ticket, usuario), historico: registros.map(h => ({ ...h, usuarioNome: autores.find(u => u.id === h.usuarioId)?.Nome || `Usuário ${h.usuarioId}` })) });
  } catch (error) {
    next(error);
  }
}

export async function criarTicket(req, res, next) {
  try {
    const usuario = req.user;
    const dados = req.body || {};
    if (usuario.role !== 'TECNICO') throw new TicketError(403, 'Somente o técnico pode solicitar peças.');
    const ordemServicoId = inteiro(dados.ordemServicoId);
    const chaveAbertura = chave(dados.chaveAbertura);
    const itens = validarItens(dados.itens);
    const observacao = texto(dados.observacao, 1000, 'Observação');
    const resultado = await prisma.$transaction(async tx => {
      const bloqueio = await tx.$queryRaw`SELECT id FROM "OrdemServico" WHERE id = ${ordemServicoId} AND "oficinaId" = ${usuario.oficinaId} FOR UPDATE`;
      if (!bloqueio.length) throw new TicketError(404, 'OS não encontrada.');
      const existente = await tx.requisicaoPeca.findFirst({ where: { oficinaId: usuario.oficinaId, solicitanteId: usuario.id, chaveAbertura } });
      if (existente) {
        if (existente.ordemServicoId !== ordemServicoId) throw new TicketError(409, 'Esta chave de abertura já foi utilizada em outra OS. Reabra o formulário.');
        return buscar(tx, usuario, existente.id);
      }
      const ordem = await tx.ordemServico.findFirst({ where: { id: ordemServicoId, oficinaId: usuario.oficinaId, tecnicoId: usuario.id } });
      if (!ordem) throw new TicketError(403, 'Solicite peças somente para uma OS atribuída a você.');
      if (OS_ENCERRADA.includes(ordem.status)) throw new TicketError(409, 'Não é possível solicitar peças para uma OS encerrada.');
      const ticket = await tx.requisicaoPeca.create({ data: {
        oficinaId: usuario.oficinaId, ordemServicoId, solicitanteId: usuario.id,
        codigo: `TMP-${randomUUID().replaceAll('-', '').slice(0, 16)}`, chaveAbertura, observacao,
        itens: { create: itens }, conversa: { create: { oficinaId: usuario.oficinaId } },
      } });
      const codigo = `TKT-${String(ticket.id).padStart(6, '0')}`;
      await tx.requisicaoPeca.update({ where: { id: ticket.id }, data: { codigo } });
      await tx.requisicaoPecaHistorico.create({ data: { requisicaoPecaId: ticket.id, usuarioId: usuario.id, statusAtual: 'ABERTA' } });
      await notificarTicket(tx, { oficinaId: usuario.oficinaId, tipo: 'REQUISICAO_PECA', titulo: `Nova solicitação ${codigo}`, mensagem: `Há uma solicitação de peças na OS ${ordem.codigo}.`, ordemServicoId, requisicaoPecaId: ticket.id });
      return buscar(tx, usuario, ticket.id);
    });
    return res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function assumirTicket(req, res, next) {
  try {
    const usuario = req.user;
    const id = req.params.id;
    if (!PERFIS_ATENDIMENTO.includes(usuario.role)) throw new TicketError(403, 'Somente o atendimento pode assumir tickets.');
    const resultado = await comTicket(usuario, id, async (tx, ticket) => {
      if (ticket.responsavelId === usuario.id) return ticket;
      if (ticket.responsavelId || ticket.status !== 'ABERTA') throw new TicketError(409, 'Este ticket já foi assumido ou encerrado.');
      if (OS_ENCERRADA.includes(ticket.ordemServico.status)) throw new TicketError(409, 'A OS está encerrada.');
      const resultado = await tx.requisicaoPeca.updateMany({ where: { id: ticket.id, oficinaId: usuario.oficinaId, responsavelId: null, status: 'ABERTA' }, data: { responsavelId: usuario.id, status: 'EM_ATENDIMENTO', assumidaEm: new Date() } });
      if (resultado.count !== 1) throw new TicketError(409, 'Outro operador assumiu este ticket.');
      await historico(tx, ticket, usuario, 'EM_ATENDIMENTO');
      await notificarTicket(tx, { oficinaId: usuario.oficinaId, tipo: 'TICKET_ASSUMIDO', titulo: `${ticket.codigo} em atendimento`, mensagem: 'Um responsável assumiu sua solicitação. O chat está disponível.', usuarios: [ticket.solicitanteId], ordemServicoId: ticket.ordemServicoId, requisicaoPecaId: ticket.id });
      return buscar(tx, usuario, ticket.id);
    });
    return res.json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function atualizarStatusTicket(req, res, next) {
  try {
    const usuario = req.user;
    const id = req.params.id;
    const dados = req.body || {};
    const motivo = texto(dados.motivo, 500, 'Motivo');
    const status = dados.status;
    if (!STATUS_TICKET.includes(status)) throw new TicketError(400, 'Status inválido.');
    const resultado = await comTicket(usuario, id, async (tx, ticket) => {
      validarTransicao(ticket, usuario, status, motivo);
      await tx.requisicaoPeca.update({ where: { id: ticket.id }, data: {
        status, ...(status === 'ENTREGUE' ? { concluidaEm: new Date() } : {}), ...(status === 'CANCELADA' ? { canceladaEm: new Date() } : {}),
      } });
      if (status === 'ENTREGUE') {
        for (const item of ticket.itens) await tx.requisicaoPecaItem.update({ where: { id: item.id }, data: { quantidadeAtendida: item.quantidadeSolicitada } });
      }
      if (STATUS_FINAIS.includes(status)) await tx.conversaTicket.updateMany({ where: { requisicaoPecaId: ticket.id, oficinaId: usuario.oficinaId }, data: { encerradaEm: new Date() } });
      await historico(tx, ticket, usuario, status, motivo);
      await notificarTicket(tx, { oficinaId: usuario.oficinaId, tipo: status === 'DISPONIVEL' ? 'PECA_DISPONIVEL' : 'SISTEMA', titulo: `Atualização de ${ticket.codigo}`, mensagem: `Status: ${status.replaceAll('_', ' ')}.`, usuarios: [ticket.solicitanteId, ticket.responsavelId].filter(u => u && u !== usuario.id), ordemServicoId: ticket.ordemServicoId, requisicaoPecaId: ticket.id });
      return buscar(tx, usuario, ticket.id);
    });
    return res.json(resultado);
  } catch (error) {
    next(error);
  }
}

export async function autorizarEnvioMensagem(req, res, next) {
  try {
    const usuario = req.user;
    const id = req.params.id;
    const ticket = await buscar(prisma, usuario, id);
    validarChat(ticket, usuario, true);
    return next();
  } catch (error) {
    next(error);
  }
}

export async function listarMensagensTicket(req, res, next) {
  try {
    const usuario = req.user;
    const id = req.params.id;
    const antesDe = req.query.antesDe;
    const ticket = await buscar(prisma, usuario, id);
    validarChat(ticket, usuario);
    const itens = await prisma.mensagemTicket.findMany({
      where: { oficinaId: usuario.oficinaId, conversa: { requisicaoPecaId: ticket.id }, expiresAt: { gt: new Date() }, ...(antesDe ? { id: { lt: inteiro(antesDe) } } : {}) },
      include: includeMensagem, orderBy: { id: 'desc' }, take: 51,
    });
    return res.json({ itens: itens.slice(0, 50).reverse(), antesDe: itens.length > 50 ? itens[49].id : null });
  } catch (error) {
    next(error);
  }
}

export async function enviarMensagemTicket(req, res, next) {
  try {
    const usuario = req.user;
    const id = req.params.id;
    const dados = req.body || {};
    const uploads = req.files || [];
    const conteudo = texto(dados.conteudo, 2000, 'Mensagem');
    const chaveEnvio = chave(dados.chaveEnvio);
    if (!conteudo && !uploads.length) throw new TicketError(400, 'Escreva uma mensagem ou anexe um arquivo.');
    arquivosTicket.validar(uploads);
    const gravados = [];
    try {
      const resultado = await comTicket(usuario, id, async (tx, ticket) => {
        validarChat(ticket, usuario, true);
        const conversa = await tx.conversaTicket.upsert({ where: { requisicaoPecaId: ticket.id }, update: {}, create: { requisicaoPecaId: ticket.id, oficinaId: usuario.oficinaId } });
        const existente = await tx.mensagemTicket.findFirst({ where: { conversaId: conversa.id, autorId: usuario.id, chaveEnvio }, include: includeMensagem });
        if (existente) {
          if (existente.expiresAt <= new Date()) throw new TicketError(409, 'Este envio já expirou. Escreva uma nova mensagem.');
          return existente;
        }
        const recentes = await tx.mensagemTicket.count({ where: { oficinaId: usuario.oficinaId, autorId: usuario.id, createdAt: { gt: new Date(Date.now() - 60000) } } });
        if (recentes >= 30) throw new TicketError(429, 'Aguarde um minuto antes de enviar mais mensagens.');
        for (const arquivo of uploads) gravados.push(await arquivosTicket.salvar(arquivo));
        const expiresAt = new Date(Date.now() + PRAZO_CHAT_MS);
        const mensagem = await tx.mensagemTicket.create({ data: { oficinaId: usuario.oficinaId, conversaId: conversa.id, autorId: usuario.id, conteudo, chaveEnvio, expiresAt, anexos: { create: gravados } }, include: includeMensagem });
        await notificarTicket(tx, { oficinaId: usuario.oficinaId, tipo: 'MENSAGEM_TICKET', titulo: `Nova mensagem em ${ticket.codigo}`, mensagem: 'Abra o chat do ticket para ler a mensagem.', usuarios: [ticket.solicitanteId, ticket.responsavelId].filter(u => u && u !== usuario.id), ordemServicoId: ticket.ordemServicoId, requisicaoPecaId: ticket.id, expiresAt });
        return mensagem;
      });
      return res.status(201).json(resultado);
    } catch (error) {
      // Em erro de conexão/commit incerto, só remove arquivos comprovadamente sem vínculo.
      for (const arquivo of gravados) {
        try {
          if (!await prisma.mensagemAnexo.findFirst({ where: { url: arquivo.url } })) await arquivosTicket.remover(arquivo.url);
        } catch { /* A varredura de órfãos tentará novamente após 48 horas. */ }
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

export async function baixarAnexoTicket(req, res, next) {
  try {
    const usuario = req.user;
    const id = req.params.id;
    const anexoId = req.params.anexoId;
    const ticket = await buscar(prisma, usuario, id);
    validarChat(ticket, usuario);
    const anexo = await prisma.mensagemAnexo.findFirst({ where: { id: inteiro(anexoId), mensagem: { oficinaId: usuario.oficinaId, expiresAt: { gt: new Date() }, conversa: { requisicaoPecaId: ticket.id } } } });
    if (!anexo) throw new TicketError(404, 'Anexo não encontrado ou expirado.');
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Content-Type': anexo.mimeType, 'Cache-Control': 'no-store' });
    return res.download(caminhoAnexo(anexo.url), anexo.nomeArquivo || 'anexo', error => {
      if (error && !res.headersSent) next(error.code === 'ENOENT' ? new TicketError(404, 'Anexo não encontrado ou expirado.') : error);
    });
  } catch (error) {
    next(error);
  }
}
