import prisma from '../config/prisma.js';

function obterOficinaId(req, res) {
  const oficinaId = Number(req.user?.oficinaId);

  if (!oficinaId) {
    res.status(401).json({ erro: 'Usuário não autenticado.' });
    return null;
  }

  return oficinaId;
}

export async function listarDiagnosticos(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const diagnosticos = await prisma.diagnosticoCatalogo.findMany({
      where: { oficinaId },
      orderBy: { nome: 'asc' },
    });

    return res.json(diagnosticos);
  } catch (error) {
    console.error('Erro ao listar diagnósticos:', error);
    return res.status(500).json({ erro: 'Erro ao listar diagnósticos' });
  }
}

export async function buscarDiagnosticoPorNome(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const nome = req.query.nome?.trim();

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório' });
    }

    const diagnosticos = await prisma.diagnosticoCatalogo.findMany({
      where: {
        oficinaId,
        OR: [
          { nome: { contains: nome, mode: 'insensitive' } },
          { codigo: { contains: nome, mode: 'insensitive' } },
          { descricao: { contains: nome, mode: 'insensitive' } },
        ],
      },
      orderBy: { nome: 'asc' },
    });

    return res.json(diagnosticos);
  } catch (error) {
    console.error('Erro ao buscar diagnóstico:', error);
    return res.status(500).json({ erro: 'Erro ao buscar diagnóstico' });
  }
}

export async function criarDiagnostico(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const codigo = req.body.codigo?.trim();
    const nome = req.body.nome?.trim();
    const descricao = req.body.descricao?.trim() || null;

    if (!codigo || !nome) {
      return res.status(400).json({ erro: 'Código e nome são obrigatórios' });
    }

    const diagnosticoExistente = await prisma.diagnosticoCatalogo.findFirst({
      where: {
        oficinaId,
        OR: [{ codigo }, { nome }],
      },
    });

    if (diagnosticoExistente) {
      return res.status(409).json({
        erro: 'Já existe um diagnóstico com esse código ou nome',
      });
    }

    const diagnostico = await prisma.diagnosticoCatalogo.create({
      data: {
        oficinaId,
        codigo,
        nome,
        descricao,
      },
    });

    return res.status(201).json(diagnostico);
  } catch (error) {
    console.error('Erro ao criar diagnóstico:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({ erro: 'Código já utilizado nesta oficina.' });
    }

    return res.status(500).json({ erro: 'Erro ao criar diagnóstico' });
  }
}

export async function editarDiagnostico(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);
    const { codigo, nome, descricao } = req.body;

    const diagnostico = await prisma.diagnosticoCatalogo.findFirst({
      where: { id, oficinaId },
    });

    if (!diagnostico) {
      return res.status(404).json({ erro: 'Diagnóstico não encontrado' });
    }

    const codigoFinal = codigo?.trim() || diagnostico.codigo;
    const nomeFinal = nome?.trim() || diagnostico.nome;

    const diagnosticoDuplicado = await prisma.diagnosticoCatalogo.findFirst({
      where: {
        oficinaId,
        id: { not: id },
        OR: [{ codigo: codigoFinal }, { nome: nomeFinal }],
      },
    });

    if (diagnosticoDuplicado) {
      return res.status(409).json({
        erro: 'Já existe outro diagnóstico com esse código ou nome',
      });
    }

    const diagnosticoAtualizado = await prisma.diagnosticoCatalogo.update({
      where: { id },
      data: {
        codigo: codigoFinal,
        nome: nomeFinal,
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
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

    const diagnostico = await prisma.diagnosticoCatalogo.findFirst({
      where: { id, oficinaId },
    });

    if (!diagnostico) {
      return res.status(404).json({ erro: 'Diagnóstico não encontrado' });
    }

    await prisma.diagnosticoCatalogo.delete({ where: { id } });

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
