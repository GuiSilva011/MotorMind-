import prisma from '../config/prisma.js';
import { bloquearVinculoVeiculo, filtroVeiculoTecnico } from '../utils/tecnicoRegras.js';
import { TicketError } from '../utils/ticketRegras.js';

function obterOficinaId(req, res) {
  const oficinaId = Number(req.user?.oficinaId);

  if (!oficinaId) {
    res.status(401).json({ erro: 'Usuário não autenticado.' });
    return null;
  }

  return oficinaId;
}

function parseJsonField(value, fallback = []) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function pegarArquivo(req, campo) {
  const arquivo = req.files?.[campo]?.[0];
  return arquivo ? `/uploads/checklists/${arquivo.filename}` : null;
}

export async function criarChecklist(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const {
      veiculoId,
      itensEntrada,
      itensDiagnostico,
      observacoesEntrada,
      observacoesDiagnostico,
    } = req.body;

    if (!veiculoId) {
      return res.status(400).json({
        erro: 'O veículo é obrigatório para criar uma checklist.',
      });
    }

    const veiculo = await prisma.veiculo.findFirst({
      where: {
        id: Number(veiculoId),
        oficinaId,
        ...filtroVeiculoTecnico(req.user),
      },
    });

    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const checklist = await prisma.$transaction(async tx => {
      await bloquearVinculoVeiculo(tx, req.user, veiculo.id);
      return tx.checklist.create({
        data: {
          oficinaId,
          veiculoId: veiculo.id,
          itensEntrada: parseJsonField(itensEntrada),
          itensDiagnostico: parseJsonField(itensDiagnostico),
          observacoesEntrada: observacoesEntrada || null,
          observacoesDiagnostico: observacoesDiagnostico || null,
          fotoFrente: pegarArquivo(req, 'fotoFrente'),
          fotoTraseira: pegarArquivo(req, 'fotoTraseira'),
          fotoEsquerda: pegarArquivo(req, 'fotoEsquerda'),
          fotoDireita: pegarArquivo(req, 'fotoDireita'),
        },
        include: {
          veiculo: {
            include: {
              cliente: true,
            },
          },
        },
      });

    });

    return res.status(201).json({
      mensagem: 'Checklist criada com sucesso.',
      checklist,
    });
  } catch (error) {
    if (error instanceof TicketError) return res.status(error.status).json({ erro: error.message });
    console.error('Erro ao criar checklist:', error);
    return res.status(500).json({
      erro: 'Erro ao criar checklist.',
      detalhe: error.message,
    });
  }
}

export async function listarChecklistsPorVeiculo(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const veiculoId = Number(req.params.veiculoId);

    if (!veiculoId) {
      return res.status(400).json({ erro: 'ID do veículo inválido.' });
    }

    const veiculo = await prisma.veiculo.findFirst({
      where: {
        id: veiculoId,
        oficinaId,
        ...filtroVeiculoTecnico(req.user),
      },
      select: {
        id: true,
      },
    });

    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const checklists = await prisma.checklist.findMany({
      where: {
        oficinaId,
        veiculoId,
        veiculo: filtroVeiculoTecnico(req.user),
      },
      include: {
        veiculo: {
          include: {
            cliente: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(checklists);
  } catch (error) {
    console.error('Erro ao listar checklists:', error);
    return res.status(500).json({
      erro: 'Erro ao listar checklists.',
      detalhe: error.message,
    });
  }
}

export async function buscarChecklistPorId(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const checklist = await prisma.checklist.findFirst({
      where: {
        id: Number(req.params.id),
        oficinaId,
        veiculo: filtroVeiculoTecnico(req.user),
      },
      include: {
        veiculo: {
          include: {
            cliente: true,
          },
        },
      },
    });

    if (!checklist) {
      return res.status(404).json({ erro: 'Checklist não encontrada.' });
    }

    return res.json(checklist);
  } catch (error) {
    console.error('Erro ao buscar checklist:', error);
    return res.status(500).json({
      erro: 'Erro ao buscar checklist.',
      detalhe: error.message,
    });
  }
}

export async function deletarChecklist(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

    const checklist = await prisma.checklist.findFirst({
      where: {
        id,
        oficinaId,
        veiculo: filtroVeiculoTecnico(req.user),
      },
    });

    if (!checklist) {
      return res.status(404).json({ erro: 'Checklist não encontrada.' });
    }

    await prisma.checklist.delete({
      where: {
        id,
      },
    });

    return res.json({ mensagem: 'Checklist deletada com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar checklist:', error);
    return res.status(500).json({
      erro: 'Erro ao deletar checklist.',
      detalhe: error.message,
    });
  }
}
