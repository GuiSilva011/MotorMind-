import prisma from '../config/prisma.js';

/**
 * Controlador responsável pelas operações de listagem, busca,
 * cadastro, atualização e exclusão de diagnósticos do catálogo.
 *
 * @module controllers/diagnosticoController
 */


/**
 * Lista todos os diagnósticos cadastrados no catálogo.
 *
 * Os registros são retornados em ordem alfabética pelo nome.
 *
 * @async
 * @function listarDiagnosticos
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a lista de diagnósticos ou mensagem de erro.
 */
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

/**
 * Busca diagnósticos pelo nome, código ou descrição.
 *
 * A pesquisa não diferencia letras maiúsculas e minúsculas.
 *
 * @async
 * @function buscarDiagnosticoPorNome
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.query - Parâmetros enviados na URL.
 * @param {string} req.query.nome - Termo utilizado na pesquisa.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com os diagnósticos encontrados ou mensagem de erro.
 */
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

/**
 * Cria um novo diagnóstico no catálogo.
 *
 * Antes do cadastro, verifica se já existe outro diagnóstico
 * com o mesmo código ou nome.
 *
 * @async
 * @function criarDiagnostico
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.body - Dados enviados no corpo da requisição.
 * @param {string} req.body.codigo - Código único do diagnóstico.
 * @param {string} req.body.nome - Nome do diagnóstico.
 * @param {string} [req.body.descricao] - Descrição complementar do diagnóstico.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o diagnóstico criado ou mensagem de erro.
 */
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

/**
 * Atualiza os dados de um diagnóstico existente.
 *
 * Verifica a existência do registro e impede a duplicidade
 * de código ou nome em outros diagnósticos.
 *
 * @async
 * @function editarDiagnostico
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do diagnóstico.
 * @param {Object} req.body - Dados que serão atualizados.
 * @param {string} [req.body.codigo] - Novo código do diagnóstico.
 * @param {string} [req.body.nome] - Novo nome do diagnóstico.
 * @param {string|null} [req.body.descricao] - Nova descrição do diagnóstico.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o diagnóstico atualizado ou mensagem de erro.
 */
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

/**
 * Exclui um diagnóstico do catálogo.
 *
 * A exclusão é impedida quando o diagnóstico estiver vinculado
 * a uma ordem de serviço.
 *
 * @async
 * @function deletarDiagnostico
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do diagnóstico.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com mensagem de sucesso ou erro.
 */
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