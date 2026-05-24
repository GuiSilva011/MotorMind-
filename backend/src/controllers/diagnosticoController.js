import prisma from '../config/prisma.js';

export async function listarDiagnosticos(req, res) {
  try {
    const diagnosticos = await prisma.diagnosticoCatalogo.findMany({
      orderBy: {
        nome: 'asc',
      },
    });

    return res.json(diagnosticos);
  } catch (error) {
    console.error('Erro ao listar diagnósticos:', error);
    return res.status(500).json({ erro: 'Erro ao listar diagnósticos' });
  }
}

export async function buscarDiagnosticoPorNome(req, res) {
  try {
    const { nome } = req.query;

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório' });
    }

    const diagnosticos = await prisma.diagnosticoCatalogo.findMany({
      where: {
        OR: [
          {
            nome: {
              contains: nome,
              mode: 'insensitive',
            },
          },
          {
            codigo: {
              contains: nome,
              mode: 'insensitive',
            },
          },
          {
            descricao: {
              contains: nome,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return res.json(diagnosticos);
  } catch (error) {
    console.error('Erro ao buscar diagnóstico:', error);
    return res.status(500).json({ erro: 'Erro ao buscar diagnóstico' });
  }
}

export async function criarDiagnostico(req, res) {
  try {
    const { codigo, nome, descricao } = req.body;

    if (!codigo || !nome) {
      return res.status(400).json({ erro: 'Código e nome são obrigatórios' });
    }

    const diagnosticoExistente = await prisma.diagnosticoCatalogo.findFirst({
      where: {
        OR: [
          { codigo: codigo.trim() },
          { nome: nome.trim() },
        ],
      },
    });

    if (diagnosticoExistente) {
      return res.status(409).json({
        erro: 'Já existe um diagnóstico com esse código ou nome',
      });
    }

    const diagnostico = await prisma.diagnosticoCatalogo.create({
      data: {
        codigo: codigo.trim(),
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
      },
    });

    return res.status(201).json(diagnostico);
  } catch (error) {
    console.error('Erro ao criar diagnóstico:', error);
    return res.status(500).json({ erro: 'Erro ao criar diagnóstico' });
  }
}

export async function editarDiagnostico(req, res) {
  try {
    const { id } = req.params;
    const { codigo, nome, descricao } = req.body;

    const diagnostico = await prisma.diagnosticoCatalogo.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!diagnostico) {
      return res.status(404).json({ erro: 'Diagnóstico não encontrado' });
    }

    const diagnosticoDuplicado = await prisma.diagnosticoCatalogo.findFirst({
      where: {
        id: {
          not: Number(id),
        },
        OR: [
          codigo ? { codigo: codigo.trim() } : undefined,
          nome ? { nome: nome.trim() } : undefined,
        ].filter(Boolean),
      },
    });

    if (diagnosticoDuplicado) {
      return res.status(409).json({
        erro: 'Já existe outro diagnóstico com esse código ou nome',
      });
    }

    const diagnosticoAtualizado = await prisma.diagnosticoCatalogo.update({
      where: {
        id: Number(id),
      },
      data: {
        codigo: codigo?.trim() || diagnostico.codigo,
        nome: nome?.trim() || diagnostico.nome,
        descricao:
          descricao !== undefined
            ? descricao?.trim() || null
            : diagnostico.descricao,
      },
    });

    return res.json(diagnosticoAtualizado);
  } catch (error) {
    console.error('Erro ao editar diagnóstico:', error);
    return res.status(500).json({ erro: 'Erro ao editar diagnóstico' });
  }
}

export async function deletarDiagnostico(req, res) {
  try {
    const { id } = req.params;

    const diagnostico = await prisma.diagnosticoCatalogo.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!diagnostico) {
      return res.status(404).json({ erro: 'Diagnóstico não encontrado' });
    }

    await prisma.diagnosticoCatalogo.delete({
      where: {
        id: Number(id),
      },
    });

    return res.json({ mensagem: 'Diagnóstico deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar diagnóstico:', error);

    if (error.code === 'P2003') {
      return res.status(409).json({
        erro: 'Não é possível excluir este diagnóstico porque ele já está vinculado a uma ordem de serviço.',
      });
    }

    return res.status(500).json({ erro: 'Erro ao deletar diagnóstico' });
  }
}