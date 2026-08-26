import prisma from '../config/prisma.js';

function obterOficinaId(req, res) {
  const oficinaId = Number(req.user?.oficinaId);

  if (!oficinaId) {
    res.status(401).json({ erro: 'Usuário não autenticado.' });
    return null;
  }

  return oficinaId;
}

export async function listarFornecedores(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const fornecedores = await prisma.fornecedor.findMany({
      where: { oficinaId },
      orderBy: { nome: 'asc' },
    });

    return res.json(fornecedores);
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    return res.status(500).json({ erro: 'Erro ao listar fornecedores' });
  }
}

export async function buscarFornecedorPorNome(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const nome = req.query.nome?.trim();

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório' });
    }

    const fornecedores = await prisma.fornecedor.findMany({
      where: {
        oficinaId,
        OR: [
          { nome: { contains: nome, mode: 'insensitive' } },
          { codigo: { contains: nome, mode: 'insensitive' } },
          { cnpj: { contains: nome, mode: 'insensitive' } },
          { cidade: { contains: nome, mode: 'insensitive' } },
        ],
      },
      orderBy: { nome: 'asc' },
    });

    return res.json(fornecedores);
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    return res.status(500).json({ erro: 'Erro ao buscar fornecedor' });
  }
}

export async function criarFornecedor(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const {
      codigo,
      nome,
      cnpj,
      email,
      telefone,
      celular,
      inscricao,
      cep,
      endereco,
      numero,
      uf,
      bairro,
      cidade,
      complemento,
      fornecePecas,
      forneceServicos,
      observacoes,
    } = req.body;

    const codigoNormalizado = codigo?.trim();
    const nomeNormalizado = nome?.trim();
    const cnpjNormalizado = cnpj?.trim() || null;
    const telefoneNormalizado = telefone?.trim() || null;
    const celularNormalizado = celular?.trim() || null;

    if (!codigoNormalizado || !nomeNormalizado) {
      return res.status(400).json({ erro: 'Código e nome são obrigatórios' });
    }

    if (!cnpjNormalizado) {
      return res.status(400).json({
        erro: 'CNPJ é obrigatório para cadastro de fornecedor',
      });
    }

    if (!telefoneNormalizado && !celularNormalizado) {
      return res.status(400).json({
        erro: 'Informe pelo menos um contato: telefone (fixo) ou celular (WhatsApp)',
      });
    }

    const fornecedorExistente = await prisma.fornecedor.findFirst({
      where: {
        oficinaId,
        OR: [
          { codigo: codigoNormalizado },
          { cnpj: cnpjNormalizado },
        ],
      },
    });

    if (fornecedorExistente) {
      return res.status(409).json({
        erro: 'Já existe um fornecedor com esse código ou CNPJ',
      });
    }

    const fornecedor = await prisma.fornecedor.create({
      data: {
        oficinaId,
        codigo: codigoNormalizado,
        nome: nomeNormalizado,
        cnpj: cnpjNormalizado,
        email: email?.trim() || null,
        telefone: telefoneNormalizado,
        celular: celularNormalizado,
        inscricao: inscricao?.trim() || null,
        cep: cep?.trim() || null,
        endereco: endereco?.trim() || null,
        numero: numero?.trim() || null,
        uf: uf?.trim() || null,
        bairro: bairro?.trim() || null,
        cidade: cidade?.trim() || null,
        complemento: complemento?.trim() || null,
        fornecePecas: fornecePecas ?? true,
        forneceServicos: forneceServicos ?? false,
        observacoes: observacoes?.trim() || null,
      },
    });

    return res.status(201).json(fornecedor);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe um fornecedor com esse código ou CNPJ nesta oficina.',
      });
    }

    return res.status(500).json({ erro: 'Erro ao criar fornecedor' });
  }
}

export async function editarFornecedor(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

    const fornecedor = await prisma.fornecedor.findFirst({
      where: { id, oficinaId },
    });

    if (!fornecedor) {
      return res.status(404).json({ erro: 'Fornecedor não encontrado' });
    }

    const {
      codigo,
      nome,
      cnpj,
      email,
      telefone,
      celular,
      inscricao,
      cep,
      endereco,
      numero,
      uf,
      bairro,
      cidade,
      complemento,
      fornecePecas,
      forneceServicos,
      observacoes,
    } = req.body;

    const codigoFinal = codigo?.trim() || fornecedor.codigo;
    const cnpjFinal =
      cnpj !== undefined ? cnpj?.trim() || '' : fornecedor.cnpj;

    if (!cnpjFinal) {
      return res.status(400).json({ erro: 'CNPJ é obrigatório.' });
    }

    const fornecedorDuplicado = await prisma.fornecedor.findFirst({
      where: {
        oficinaId,
        id: { not: id },
        OR: [{ codigo: codigoFinal }, { cnpj: cnpjFinal }],
      },
    });

    if (fornecedorDuplicado) {
      return res.status(409).json({
        erro: 'Já existe outro fornecedor com esse código ou CNPJ',
      });
    }

    const telefoneFinal =
      telefone !== undefined ? telefone?.trim() || null : fornecedor.telefone;
    const celularFinal =
      celular !== undefined ? celular?.trim() || null : fornecedor.celular;

    if (!telefoneFinal && !celularFinal) {
      return res.status(400).json({
        erro: 'Informe pelo menos um contato: telefone (fixo) ou celular (WhatsApp)',
      });
    }

    const fornecedorAtualizado = await prisma.fornecedor.update({
      where: { id },
      data: {
        codigo: codigoFinal,
        nome: nome !== undefined ? nome?.trim() || fornecedor.nome : fornecedor.nome,
        cnpj: cnpjFinal,
        email: email !== undefined ? email?.trim() || null : fornecedor.email,
        telefone: telefoneFinal,
        celular: celularFinal,
        inscricao:
          inscricao !== undefined ? inscricao?.trim() || null : fornecedor.inscricao,
        cep: cep !== undefined ? cep?.trim() || null : fornecedor.cep,
        endereco:
          endereco !== undefined ? endereco?.trim() || null : fornecedor.endereco,
        numero: numero !== undefined ? numero?.trim() || null : fornecedor.numero,
        uf: uf !== undefined ? uf?.trim() || null : fornecedor.uf,
        bairro: bairro !== undefined ? bairro?.trim() || null : fornecedor.bairro,
        cidade: cidade !== undefined ? cidade?.trim() || null : fornecedor.cidade,
        complemento:
          complemento !== undefined
            ? complemento?.trim() || null
            : fornecedor.complemento,
        fornecePecas:
          fornecePecas !== undefined ? fornecePecas : fornecedor.fornecePecas,
        forneceServicos:
          forneceServicos !== undefined
            ? forneceServicos
            : fornecedor.forneceServicos,
        observacoes:
          observacoes !== undefined
            ? observacoes?.trim() || null
            : fornecedor.observacoes,
      },
    });

    return res.json(fornecedorAtualizado);
  } catch (error) {
    console.error('Erro ao editar fornecedor:', error);
    return res.status(500).json({ erro: 'Erro ao editar fornecedor' });
  }
}

export async function deletarFornecedor(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

    const fornecedor = await prisma.fornecedor.findFirst({
      where: { id, oficinaId },
    });

    if (!fornecedor) {
      return res.status(404).json({ erro: 'Fornecedor não encontrado' });
    }

    await prisma.fornecedor.delete({ where: { id } });

    return res.json({ mensagem: 'Fornecedor deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    return res.status(500).json({ erro: 'Erro ao deletar fornecedor' });
  }
}
