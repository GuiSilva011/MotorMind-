import prisma from '../config/prisma.js';

function obterOficinaId(req, res) {
  const oficinaId = Number(req.user?.oficinaId);

  if (!oficinaId) {
    res.status(401).json({ erro: 'Usuário não autenticado.' });
    return null;
  }

  return oficinaId;
}

export async function listarServicos(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const servicos = await prisma.servicoCatalogo.findMany({
      where: { oficinaId },
      orderBy: { nome: 'asc' },
    });

    return res.json(servicos);
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    return res.status(500).json({ erro: 'Erro ao listar serviços' });
  }
}

export async function buscarServicoPorNome(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const nome = req.query.nome?.trim();

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório' });
    }

    const servicos = await prisma.servicoCatalogo.findMany({
      where: {
        oficinaId,
        OR: [
          { nome: { contains: nome, mode: 'insensitive' } },
          { codigo: { contains: nome, mode: 'insensitive' } },
          { categoria: { contains: nome, mode: 'insensitive' } },
        ],
      },
      orderBy: { nome: 'asc' },
    });

    return res.json(servicos);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    return res.status(500).json({ erro: 'Erro ao buscar serviço' });
  }
}

export async function criarServico(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const codigo = req.body.codigo?.trim();
    const nome = req.body.nome?.trim();
    const categoria = req.body.categoria?.trim() || null;
    const { valorPadrao } = req.body;

    if (!codigo || !nome) {
      return res.status(400).json({ erro: 'Código e nome são obrigatórios' });
    }

    const servicoExistente = await prisma.servicoCatalogo.findFirst({
      where: {
        oficinaId,
        OR: [{ codigo }, { nome }],
      },
    });

    if (servicoExistente) {
      return res.status(409).json({
        erro: 'Já existe um serviço com esse código ou nome',
      });
    }

    const servico = await prisma.servicoCatalogo.create({
      data: {
        oficinaId,
        codigo,
        nome,
        categoria,
        valorPadrao:
          valorPadrao !== undefined && valorPadrao !== ''
            ? Number(valorPadrao)
            : null,
      },
    });

    return res.status(201).json(servico);
  } catch (error) {
    console.error('Erro ao criar serviço:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ erro: 'Código já utilizado nesta oficina.' });
    }

    return res.status(500).json({ erro: 'Erro ao criar serviço' });
  }
}

export async function editarServico(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);
    const { codigo, nome, categoria, valorPadrao } = req.body;

    const servico = await prisma.servicoCatalogo.findFirst({
      where: { id, oficinaId },
    });

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    const codigoFinal = codigo?.trim() || servico.codigo;
    const nomeFinal = nome?.trim() || servico.nome;

    const servicoDuplicado = await prisma.servicoCatalogo.findFirst({
      where: {
        oficinaId,
        id: { not: id },
        OR: [{ codigo: codigoFinal }, { nome: nomeFinal }],
      },
    });

    if (servicoDuplicado) {
      return res.status(409).json({
        erro: 'Já existe outro serviço com esse código ou nome',
      });
    }

    const servicoAtualizado = await prisma.servicoCatalogo.update({
      where: { id },
      data: {
        codigo: codigoFinal,
        nome: nomeFinal,
        categoria:
          categoria !== undefined ? categoria?.trim() || null : servico.categoria,
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

export async function deletarServico(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

    const servico = await prisma.servicoCatalogo.findFirst({
      where: { id, oficinaId },
    });

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' });
    }

    await prisma.servicoCatalogo.delete({ where: { id } });

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
