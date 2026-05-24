import prisma from '../config/prisma.js';

export async function listarPecas(req, res) {
  try {
    const pecas = await prisma.pecaCatalogo.findMany({
      orderBy: {
        nome: 'asc',
      },
    });

    return res.json(pecas);
  } catch (error) {
    console.error('Erro ao listar peças:', error);
    return res.status(500).json({ erro: 'Erro ao listar peças' });
  }
}

export async function buscarPecaPorNome(req, res) {
  try {
    const { nome } = req.query;

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório' });
    }

    const pecas = await prisma.pecaCatalogo.findMany({
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
            marca: {
              contains: nome,
              mode: 'insensitive',
            },
          },
          {
            aplicacao: {
              contains: nome,
              mode: 'insensitive',
            },
          },
          {
            grupo: {
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

    return res.json(pecas);
  } catch (error) {
    console.error('Erro ao buscar peça:', error);
    return res.status(500).json({ erro: 'Erro ao buscar peça' });
  }
}

export async function criarPeca(req, res) {
  try {
    const { codigo, nome, marca, aplicacao, grupo, unidade } = req.body;

    if (!codigo || !nome) {
      return res.status(400).json({ erro: 'Código e nome são obrigatórios' });
    }

    const pecaExistente = await prisma.pecaCatalogo.findFirst({
      where: {
        OR: [{ codigo: codigo.trim() }, { nome: nome.trim() }],
      },
    });

    if (pecaExistente) {
      return res.status(409).json({
        erro: 'Já existe uma peça com esse código ou nome',
      });
    }

    const peca = await prisma.pecaCatalogo.create({
      data: {
        codigo: codigo.trim(),
        nome: nome.trim(),
        marca: marca?.trim() || null,
        aplicacao: aplicacao?.trim() || null,
        grupo: grupo?.trim() || null,
        unidade: unidade?.trim() || 'UN',
      },
    });

    return res.status(201).json(peca);
  } catch (error) {
    console.error('Erro ao criar peça:', error);
    return res.status(500).json({ erro: 'Erro ao criar peça' });
  }
}

export async function editarPeca(req, res) {
  try {
    const { id } = req.params;
    const { codigo, nome, marca, aplicacao, grupo, unidade } = req.body;

    const peca = await prisma.pecaCatalogo.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!peca) {
      return res.status(404).json({ erro: 'Peça não encontrada' });
    }

    const pecaDuplicada = await prisma.pecaCatalogo.findFirst({
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

    if (pecaDuplicada) {
      return res.status(409).json({
        erro: 'Já existe outra peça com esse código ou nome',
      });
    }

    const pecaAtualizada = await prisma.pecaCatalogo.update({
      where: {
        id: Number(id),
      },
      data: {
        codigo: codigo?.trim() || peca.codigo,
        nome: nome?.trim() || peca.nome,
        marca: marca !== undefined ? marca?.trim() || null : peca.marca,
        aplicacao:
          aplicacao !== undefined ? aplicacao?.trim() || null : peca.aplicacao,
        grupo: grupo !== undefined ? grupo?.trim() || null : peca.grupo,
        unidade: unidade?.trim() || peca.unidade || 'UN',
      },
    });

    return res.json(pecaAtualizada);
  } catch (error) {
    console.error('Erro ao editar peça:', error);
    return res.status(500).json({ erro: 'Erro ao editar peça' });
  }
}

export async function deletarPeca(req, res) {
  try {
    const { id } = req.params;

    const peca = await prisma.pecaCatalogo.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!peca) {
      return res.status(404).json({ erro: 'Peça não encontrada' });
    }

    await prisma.pecaCatalogo.delete({
      where: {
        id: Number(id),
      },
    });

    return res.json({ mensagem: 'Peça deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar peça:', error);

    if (error.code === 'P2003') {
      return res.status(409).json({
        erro: 'Não é possível excluir esta peça porque ela já está vinculada a uma ordem de serviço.',
      });
    }

    return res.status(500).json({ erro: 'Erro ao deletar peça' });
  }
}