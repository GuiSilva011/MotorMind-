import prisma from '../config/prisma.js';

// Lista os serviços cadastrados no catálogo.
export async function listarServicos(req, res) {
  try {
    const servicos = await prisma.servicoCatalogo.findMany({
      orderBy: {
        nome: 'asc',
      },
    });

    return res.json(servicos);
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    return res.status(500).json({ erro: 'Erro ao listar serviços' });
  }
}

// Pesquisa serviços por nome, código ou categoria.
export async function buscarServicoPorNome(req, res) {
  try {
    const { nome } = req.query;

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório' });
    }

    const servicos = await prisma.servicoCatalogo.findMany({
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
            categoria: {
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

    return res.json(servicos);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    return res.status(500).json({ erro: 'Erro ao buscar serviço' });
  }
}

// Cria um novo serviço no catálogo.
export async function criarServico(req, res) {
  try {
    const { codigo, nome, categoria, valorPadrao } = req.body;

    if (!codigo || !nome) {
      return res.status(400).json({ erro: 'Código e nome são obrigatórios' });
    }

    const servicoExistente = await prisma.servicoCatalogo.findFirst({
      where: {
        OR: [
          { codigo: codigo.trim() },
          { nome: nome.trim() },
        ],
      },
    });

    if (servicoExistente) {
      return res.status(409).json({
        erro: 'Já existe um serviço com esse código ou nome',
      });
    }

    const servico = await prisma.servicoCatalogo.create({
      data: {
        codigo: codigo.trim(),
        nome: nome.trim(),
        categoria: categoria?.trim() || null,
        valorPadrao:
          valorPadrao !== undefined && valorPadrao !== ''
            ? Number(valorPadrao)
            : null,
      },
    });

    return res.status(201).json(servico);
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    return res.status(500).json({ erro: 'Erro ao criar serviço' });
  }
}

// Atualiza um serviço já cadastrado.
export async function editarServico(req, res) {
  try {
    const { id } = req.params;
    const { codigo, nome, categoria, valorPadrao } = req.body;

    const servico = await prisma.servicoCatalogo.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    const servicoDuplicado = await prisma.servicoCatalogo.findFirst({
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

    if (servicoDuplicado) {
      return res.status(409).json({
        erro: 'Já existe outro serviço com esse código ou nome',
      });
    }

    const servicoAtualizado = await prisma.servicoCatalogo.update({
      where: {
        id: Number(id),
      },
      data: {
        codigo: codigo?.trim() || servico.codigo,
        nome: nome?.trim() || servico.nome,
        categoria:
          categoria !== undefined
            ? categoria?.trim() || null
            : servico.categoria,
        valorPadrao:
          valorPadrao !== undefined
            ? valorPadrao !== ''
              ? Number(valorPadrao)
              : null
            : servico.valorPadrao,
      },
    });

    return res.json(servicoAtualizado);
  } catch (error) {
    console.error('Erro ao editar serviço:', error);
    return res.status(500).json({ erro: 'Erro ao editar serviço' });
  }
}

// Exclui um serviço do catálogo.
export async function deletarServico(req, res) {
  try {
    const { id } = req.params;

    const servico = await prisma.servicoCatalogo.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    await prisma.servicoCatalogo.delete({
      where: {
        id: Number(id),
      },
    });

    return res.json({ mensagem: 'Serviço deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar serviço:', error);

    if (error.code === 'P2003') {
      return res.status(409).json({
        erro: 'Não é possível excluir este serviço porque ele já está vinculado a uma ordem de serviço.',
      });
    }

    return res.status(500).json({ erro: 'Erro ao deletar serviço' });
  }
}