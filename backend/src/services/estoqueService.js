import { randomUUID } from 'node:crypto';

export class EstoqueError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const MAX_INT = 2147483647;
const entradas = new Set(['ENTRADA', 'DEVOLUCAO', 'AJUSTE_ENTRADA']);
const tiposManuais = new Set([...entradas, 'SAIDA', 'AJUSTE_SAIDA']);
const unidadesEstoque = new Set(['UN', 'PAR', 'L']);

export function inteiro(valor, campo, minimo = 0) {
  if (!(typeof valor === 'number' || (typeof valor === 'string' && /^\d+$/.test(valor)))) {
    throw new EstoqueError(400, `${campo} deve ser um número inteiro.`);
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > MAX_INT) {
    throw new EstoqueError(400, `${campo} deve ser um inteiro entre ${minimo} e ${MAX_INT}.`);
  }
  return numero;
}

function texto(valor, campo, limite, obrigatorio = false) {
  if (valor == null && !obrigatorio) return null;
  if (typeof valor !== 'string' || valor.trim().length > limite || (obrigatorio && !valor.trim())) {
    throw new EstoqueError(400, `${campo}: informe ${obrigatorio ? 'um texto com 1 a' : 'um texto de até'} ${limite} caracteres.`);
  }
  return valor.trim() || null;
}

export function dadosPeca(body, criando = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new EstoqueError(400, 'Dados inválidos.');
  if (Object.hasOwn(body, 'codigo')) {
    throw new EstoqueError(400, 'O código da peça é gerado automaticamente e não pode ser informado.');
  }
  if (!criando && Object.hasOwn(body, 'quantidadeAtual')) {
    throw new EstoqueError(400, 'Altere o saldo pela opção Movimentar, para preservar o histórico.');
  }
  const unidade = texto(texto(body.unidade ?? 'UN', 'Unidade', 10, true).toUpperCase(), 'Unidade', 10, true);
  if (!unidadesEstoque.has(unidade)) {
    throw new EstoqueError(400, 'Unidade inválida. Escolha UN, PAR ou L.');
  }
  const data = {
    nome: texto(body.nome, 'Nome', 100, true),
    marca: texto(body.marca, 'Marca', 60),
    aplicacao: texto(body.aplicacao, 'Aplicação', 150),
    unidade,
    localizacao: texto(body.localizacao, 'Localização', 80),
    quantidadeMinima: inteiro(body.quantidadeMinima, 'Quantidade mínima'),
  };
  if (criando) data.quantidadeAtual = inteiro(body.quantidadeAtual, 'Quantidade inicial');
  return data;
}

export function gerarCodigoEstoque(id) {
  return `EST-${String(inteiro(id, 'ID da peça', 1)).padStart(6, '0')}`;
}

export async function bloquearPecaEstoque(tx, oficinaId, id) {
  const registros = await tx.$queryRaw`
    SELECT id FROM "EstoquePeca" WHERE id = ${id} AND "oficinaId" = ${oficinaId} FOR UPDATE
  `;
  if (!registros.length) throw new EstoqueError(404, 'Peça não encontrada nesta oficina.');
  return tx.estoquePeca.findFirst({ where: { id, oficinaId } });
}

export async function sincronizarAlertaEstoque(tx, peca) {
  const where = { oficinaId: peca.oficinaId, estoquePecaId: peca.id, status: 'ATIVO' };
  const baixo = peca.ativo && peca.quantidadeAtual < peca.quantidadeMinima;
  if (!baixo) {
    await tx.alertaEstoque.updateMany({ where, data: { status: 'RESOLVIDO', resolvidoEm: new Date() } });
    await tx.estoquePeca.update({ where: { id: peca.id }, data: { alertaAtivo: false } });
    return;
  }
  const existente = await tx.alertaEstoque.findFirst({ where });
  if (existente) {
    await tx.estoquePeca.update({ where: { id: peca.id }, data: { alertaAtivo: true } });
    return;
  }
  const alerta = await tx.alertaEstoque.create({ data: {
    oficinaId: peca.oficinaId, estoquePecaId: peca.id,
    quantidadeDetectada: peca.quantidadeAtual, quantidadeMinima: peca.quantidadeMinima,
  } });
  await tx.estoquePeca.update({ where: { id: peca.id }, data: { alertaAtivo: true, ultimoAlertaEm: new Date() } });
  const configuracao = await tx.configuracaoOficina.findUnique({ where: { oficinaId: peca.oficinaId } });
  if (configuracao?.notificarEstoqueSistema === false) return;
  const usuarios = await tx.usuario.findMany({
    where: { oficinaId: peca.oficinaId, Role: { in: ['ADMIN', 'OPERADOR'] } }, select: { id: true },
  });
  await tx.notificacao.create({ data: {
    oficinaId: peca.oficinaId, tipo: 'ESTOQUE_BAIXO', titulo: 'Peça abaixo do estoque mínimo',
    mensagem: `${peca.codigo} — ${peca.nome}: saldo ${peca.quantidadeAtual} ${peca.unidade}; mínimo ${peca.quantidadeMinima}.`,
    alertaEstoqueId: alerta.id,
    usuarios: { create: usuarios.map(({ id }) => ({ usuarioId: id })) },
  } });
}

export async function reconciliarEstoqueOrdem({
  tx,
  oficinaId,
  usuarioId,
  ordemServicoId,
  codigoOrdem,
  quantidadesAnteriores = new Map(),
  quantidadesAtuais = new Map(),
}) {
  const ids = [...new Set([...quantidadesAnteriores.keys(), ...quantidadesAtuais.keys()])]
    .map(Number)
    .sort((a, b) => a - b);

  for (const estoquePecaId of ids) {
    const anterior = Number(quantidadesAnteriores.get(estoquePecaId) || 0);
    const atual = Number(quantidadesAtuais.get(estoquePecaId) || 0);
    const diferenca = atual - anterior;
    if (diferenca === 0) continue;

    const peca = await bloquearPecaEstoque(tx, oficinaId, estoquePecaId);
    if (!peca.ativo) {
      throw new EstoqueError(409, `A peça ${peca.codigo} está inativa. Reative-a antes de alterar a OS.`);
    }

    const quantidadePosterior = peca.quantidadeAtual - diferenca;
    if (quantidadePosterior < 0) {
      throw new EstoqueError(409, `Saldo insuficiente para ${peca.codigo} — ${peca.nome}. Disponível: ${peca.quantidadeAtual} ${peca.unidade}.`);
    }
    if (quantidadePosterior > MAX_INT) {
      throw new EstoqueError(400, `O saldo da peça ${peca.codigo} ultrapassa o limite permitido.`);
    }

    const atualizada = await tx.estoquePeca.update({
      where: { id: estoquePecaId },
      data: { quantidadeAtual: quantidadePosterior },
    });
    const retirada = diferenca > 0;
    await tx.estoqueMovimentacao.create({ data: {
      oficinaId,
      estoquePecaId,
      usuarioId,
      ordemServicoId,
      tipo: retirada ? 'SAIDA_OS' : 'DEVOLUCAO_OS',
      quantidade: Math.abs(diferenca),
      quantidadeAnterior: peca.quantidadeAtual,
      quantidadePosterior,
      observacao: `${retirada ? 'Retirada' : 'Devolução'} vinculada à OS ${codigoOrdem}`,
    } });
    await sincronizarAlertaEstoque(tx, atualizada);
  }
}

export function calcularMovimentacao(saldo, body) {
  if (!body || !tiposManuais.has(body.tipo)) throw new EstoqueError(400, 'Tipo de movimentação inválido.');
  const quantidade = inteiro(body.quantidade, 'Quantidade', 1);
  const observacao = texto(body.observacao, 'Motivo', 255, true);
  const quantidadePosterior = saldo + (entradas.has(body.tipo) ? quantidade : -quantidade);
  if (quantidadePosterior < 0) throw new EstoqueError(409, 'Saldo insuficiente para esta saída.');
  if (quantidadePosterior > MAX_INT) throw new EstoqueError(400, 'O saldo ultrapassa o limite permitido.');
  return { tipo: body.tipo, quantidade, quantidadeAnterior: saldo, quantidadePosterior, observacao };
}

export function criarEstoqueService(prisma) {
  async function transacao(acao) {
    // PostgreSQL serializa alterações concorrentes da mesma peça pelo bloqueio abaixo.
    return prisma.$transaction(acao, { maxWait: 5000, timeout: 10000 });
  }

  return {
    async listar(oficinaId, somenteAtivas = false) {
      return prisma.estoquePeca.findMany({
        where: { oficinaId, ...(somenteAtivas ? { ativo: true } : {}) },
        orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
      });
    },
    async criar(oficinaId, usuarioId, body) {
      const data = dadosPeca(body, true);
      return transacao(async tx => {
        const codigoTemporario = `TMP-${randomUUID().replaceAll('-', '').slice(0, 16)}`;
        const criada = await tx.estoquePeca.create({ data: { ...data, oficinaId, codigo: codigoTemporario } });
        const peca = await tx.estoquePeca.update({
          where: { id: criada.id },
          data: { codigo: gerarCodigoEstoque(criada.id) },
        });
        if (peca.quantidadeAtual > 0) {
          await tx.estoqueMovimentacao.create({ data: {
            oficinaId, estoquePecaId: peca.id, usuarioId, tipo: 'ENTRADA',
            quantidade: peca.quantidadeAtual, quantidadeAnterior: 0,
            quantidadePosterior: peca.quantidadeAtual, observacao: 'Saldo inicial do cadastro',
          } });
        }
        await sincronizarAlertaEstoque(tx, peca);
        return tx.estoquePeca.findFirst({ where: { id: peca.id, oficinaId } });
      });
    },
    async editar(oficinaId, id, body) {
      const data = dadosPeca(body);
      return transacao(async tx => {
        const anterior = await bloquearPecaEstoque(tx, oficinaId, id);
        if (!anterior.ativo) throw new EstoqueError(409, 'Reative a peça antes de editá-la.');
        if (anterior.unidade !== data.unidade && anterior.quantidadeAtual !== 0) {
          throw new EstoqueError(409, 'Só é possível alterar a unidade quando o saldo estiver zerado.');
        }
        const peca = await tx.estoquePeca.update({ where: { id }, data });
        await sincronizarAlertaEstoque(tx, peca);
        return tx.estoquePeca.findFirst({ where: { id, oficinaId } });
      });
    },
    async movimentar(oficinaId, usuarioId, id, body) {
      return transacao(async tx => {
        const anterior = await bloquearPecaEstoque(tx, oficinaId, id);
        if (!anterior.ativo) throw new EstoqueError(409, 'Não é possível movimentar uma peça inativa.');
        const movimento = calcularMovimentacao(anterior.quantidadeAtual, body);
        const peca = await tx.estoquePeca.update({ where: { id }, data: { quantidadeAtual: movimento.quantidadePosterior } });
        await tx.estoqueMovimentacao.create({ data: { ...movimento, oficinaId, usuarioId, estoquePecaId: id } });
        await sincronizarAlertaEstoque(tx, peca);
        return tx.estoquePeca.findFirst({ where: { id, oficinaId } });
      });
    },
    async definirAtivo(oficinaId, id, ativo) {
      if (typeof ativo !== 'boolean') throw new EstoqueError(400, 'Ativo deve ser verdadeiro ou falso.');
      return transacao(async tx => {
        const peca = await bloquearPecaEstoque(tx, oficinaId, id);
        if (!ativo) {
          if (peca.quantidadeAtual !== 0) throw new EstoqueError(409, 'Zere o saldo por movimentação antes de inativar.');
          const pendentes = await tx.requisicaoPecaItem.count({ where: {
            estoquePecaId: id, requisicaoPeca: { oficinaId, status: { notIn: ['ENTREGUE', 'CANCELADA'] } },
          } });
          if (pendentes) throw new EstoqueError(409, 'Esta peça possui requisições pendentes.');
        }
        const atualizada = await tx.estoquePeca.update({ where: { id }, data: { ativo } });
        await sincronizarAlertaEstoque(tx, atualizada);
        return tx.estoquePeca.findFirst({ where: { id, oficinaId } });
      });
    },
    async historico(oficinaId, id, pagina = 1) {
      if ((pagina - 1) * 30 > MAX_INT) throw new EstoqueError(400, 'Página fora do limite permitido.');
      const peca = await prisma.estoquePeca.findFirst({ where: { id, oficinaId } });
      if (!peca) throw new EstoqueError(404, 'Peça não encontrada nesta oficina.');
      const where = { oficinaId, estoquePecaId: id };
      const [itens, total] = await Promise.all([
        prisma.estoqueMovimentacao.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (pagina - 1) * 30, take: 30, include: { usuario: { select: { Nome: true } } } }),
        prisma.estoqueMovimentacao.count({ where }),
      ]);
      return { itens, total, pagina, paginas: Math.max(1, Math.ceil(total / 30)) };
    },
    async alertas(oficinaId) {
      const config = await prisma.configuracaoOficina.findUnique({ where: { oficinaId } });
      if (config?.notificarEstoqueSistema === false) return [];
      return prisma.alertaEstoque.findMany({
        where: { oficinaId, status: 'ATIVO', estoquePeca: { ativo: true } },
        include: { estoquePeca: { select: { id: true, codigo: true, nome: true, quantidadeAtual: true, quantidadeMinima: true, unidade: true } } },
        orderBy: { createdAt: 'desc' },
      });
    },
  };
}
