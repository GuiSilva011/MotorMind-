import { OS_ENCERRADA, TicketError } from './ticketRegras.js';

export function filtroOrdensTecnico(usuario) {
  return { oficinaId: usuario.oficinaId, tecnicoId: usuario.id, status: { notIn: OS_ENCERRADA } };
}

export function filtroVeiculoTecnico(usuario) {
  return usuario.role === 'TECNICO' ? { ordensServico: { some: filtroOrdensTecnico(usuario) } } : {};
}

const selecaoVeiculoTecnico = {
  id: true, placa: true, fabricante: true, modelo: true, ano_modelo: true, ano_fabricacao: true,
  km: true, cor: true, chassi: true, motor: true, cambio: true, ar: true,
  cliente: { select: { id: true, nome: true } },
};
const selecaoPeca = { id: true, codigoPeca: true, codigoHierarquia: true, nomePeca: true, quantidade: true };
const selecaoServico = {
  id: true, codigoHierarquia: true, nomeServico: true, descricao: true, responsavel: true, tipo: true,
  pecas: { select: selecaoPeca, orderBy: { id: 'asc' } },
};

// Somente snapshots persistidos na OS, sem consultar ou completar itens pelo catálogo.
export const selecaoOrdemTecnica = {
  id: true, codigo: true, status: true, dataEmissao: true, createdAt: true, updatedAt: true,
  veiculoId: true, tecnicoId: true,
  veiculo: { select: selecaoVeiculoTecnico },
  diagnosticos: { orderBy: { id: 'asc' }, select: {
    id: true, codigoHierarquia: true, nomeDiagnostico: true, descricao: true, observacoes: true,
    servicos: { select: selecaoServico, orderBy: { id: 'asc' } },
    pecas: { where: { ordemServicoItemId: null }, select: selecaoPeca, orderBy: { id: 'asc' } },
  } },
  servicos: { where: { ordemDiagnosticoId: null }, select: selecaoServico, orderBy: { id: 'asc' } },
  pecas: { where: { ordemDiagnosticoId: null, ordemServicoItemId: null }, select: selecaoPeca, orderBy: { id: 'asc' } },
};

export async function bloquearVinculoVeiculo(tx, usuario, veiculoId) {
  if (usuario.role !== 'TECNICO') return;
  const ordens = await tx.$queryRaw`
    SELECT id FROM "OrdemServico"
    WHERE "oficinaId" = ${usuario.oficinaId} AND "veiculoId" = ${veiculoId}
      AND "tecnicoId" = ${usuario.id} AND status::text NOT IN ('FINALIZADA', 'FECHADA', 'CANCELADA')
    ORDER BY id FOR SHARE
  `;
  if (!ordens.length) throw new TicketError(404, 'Veículo sem OS ativa atribuída a você.');
}

export function consultaVeiculosTecnico(usuario) {
  const vinculo = filtroOrdensTecnico(usuario);
  return {
    where: { oficinaId: usuario.oficinaId, ordensServico: { some: vinculo } },
    select: {
      ...selecaoVeiculoTecnico,
      ordensServico: {
        where: vinculo,
        select: { id: true, codigo: true, status: true, updatedAt: true },
        orderBy: { id: 'desc' },
      },
    },
    orderBy: { placa: 'asc' },
  };
}
