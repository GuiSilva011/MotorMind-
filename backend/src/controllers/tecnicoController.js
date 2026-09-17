import prisma from '../config/prisma.js';
import { inteiro, TicketError } from '../utils/ticketRegras.js';
import {
  consultaVeiculosTecnico,
  filtroOrdensTecnico,
  selecaoOrdemTecnica,
} from '../utils/tecnicoRegras.js';

export async function listarVeiculosTecnico(req, res, next) {
  try {
    const veiculos = await prisma.veiculo.findMany(consultaVeiculosTecnico(req.user));
    return res.json(veiculos);
  } catch (error) {
    next(error);
  }
}

export async function buscarOrdemTecnica(req, res, next) {
  try {
    const ordem = await prisma.ordemServico.findFirst({
      where: { id: inteiro(req.params.id), ...filtroOrdensTecnico(req.user) },
      select: selecaoOrdemTecnica,
    });
    if (!ordem) throw new TicketError(404, 'OS não encontrada ou não está mais atribuída a você.');
    return res.json(ordem);
  } catch (error) {
    next(error);
  }
}

export async function consultarHistoricoTecnico(req, res, next) {
  try {
    const { veiculoId, ordemId } = req.params;
    const usuario = req.user;
    const veiculo = await prisma.veiculo.findFirst({
      where: {
        id: inteiro(veiculoId),
        oficinaId: usuario.oficinaId,
        ordensServico: { some: filtroOrdensTecnico(usuario) },
      },
      select: { id: true },
    });
    if (!veiculo) throw new TicketError(404, 'Veículo sem OS ativa atribuída a você.');

    const where = {
      oficinaId: usuario.oficinaId,
      veiculoId: veiculo.id,
      veiculo: { ordensServico: { some: filtroOrdensTecnico(usuario) } },
    };
    if (ordemId !== undefined) {
      const ordem = await prisma.ordemServico.findFirst({
        where: { ...where, id: inteiro(ordemId) },
        select: selecaoOrdemTecnica,
      });
      if (!ordem) throw new TicketError(404, 'OS não encontrada no histórico deste veículo.');
      return res.json(ordem);
    }

    const historico = await prisma.ordemServico.findMany({
      where,
      select: selecaoOrdemTecnica,
      orderBy: { dataEmissao: 'desc' },
    });
    return res.json(historico);
  } catch (error) {
    next(error);
  }
}
