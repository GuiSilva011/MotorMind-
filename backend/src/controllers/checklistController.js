import prisma from '../config/prisma.js';

function parseJsonField(value, fallback = []) {
  if (!value) return fallback;

  if (Array.isArray(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function pegarArquivo(req, campo) {
  const arquivo = req.files?.[campo]?.[0];

  if (!arquivo) return null;

  return `/uploads/checklists/${arquivo.filename}`;
}

export async function criarChecklist(req, res) {
  try {
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

    const veiculo = await prisma.veiculo.findUnique({
      where: {
        id: Number(veiculoId),
      },
    });

    if (!veiculo) {
      return res.status(404).json({
        erro: 'Veículo não encontrado.',
      });
    }

    const checklist = await prisma.checklist.create({
      data: {
        veiculoId: Number(veiculoId),
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

    return res.status(201).json({
      mensagem: 'Checklist criada com sucesso.',
      checklist,
    });
  } catch (error) {
    console.error('Erro ao criar checklist:', error);

    return res.status(500).json({
      erro: 'Erro ao criar checklist.',
      detalhe: error.message,
    });
  }
}

export async function listarChecklistsPorVeiculo(req, res) {
  try {
    const { veiculoId } = req.params;

    if (!veiculoId || Number.isNaN(Number(veiculoId))) {
      return res.status(400).json({
        erro: 'ID do veículo inválido.',
      });
    }

    const checklists = await prisma.checklist.findMany({
      where: {
        veiculoId: Number(veiculoId),
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
    const { id } = req.params;

    const checklist = await prisma.checklist.findUnique({
      where: {
        id: Number(id),
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
      return res.status(404).json({
        erro: 'Checklist não encontrada.',
      });
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
    const { id } = req.params;

    const checklist = await prisma.checklist.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!checklist) {
      return res.status(404).json({
        erro: 'Checklist não encontrada.',
      });
    }

    await prisma.checklist.delete({
      where: {
        id: Number(id),
      },
    });

    return res.json({
      mensagem: 'Checklist deletada com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao deletar checklist:', error);

    return res.status(500).json({
      erro: 'Erro ao deletar checklist.',
      detalhe: error.message,
    });
  }
}