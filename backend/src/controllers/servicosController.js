import prisma from '../config/prisma.js';

/**
 * Controlador responsável pelas operações de listagem, busca,
 * cadastro, atualização e exclusão de serviços do catálogo.
 *
 * @module controllers/servicoController
 */

/**
 * Lista todos os serviços cadastrados no catálogo.
 *
 * Os registros são retornados em ordem alfabética pelo nome.
 *
 * @async
 * @function listarServicos
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a lista de serviços ou mensagem de erro.
 */
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

/**
 * Busca serviços pelo nome, código ou categoria.
 *
 * A pesquisa não diferencia letras maiúsculas e minúsculas.
 *
 * @async
 * @function buscarServicoPorNome
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.query - Parâmetros enviados na URL.
 * @param {string} req.query.nome - Termo utilizado na pesquisa.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com os serviços encontrados ou mensagem de erro.
 */
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

/**
 * Cria um novo serviço no catálogo.
 *
 * Valida os campos obrigatórios e impede a duplicidade
 * de código ou nome.
 *
 * @async
 * @function criarServico
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.body - Dados enviados no corpo da requisição.
 * @param {string} req.body.codigo - Código único do serviço.
 * @param {string} req.body.nome - Nome do serviço.
 * @param {string} [req.body.categoria] - Categoria do serviço.
 * @param {number|string} [req.body.valorPadrao] - Valor padrão do serviço.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o serviço criado ou mensagem de erro.
 */
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

/**
 * Atualiza os dados de um serviço existente.
 *
 * Verifica se o serviço está cadastrado e impede a duplicidade
 * de código ou nome em outros registros.
 *
 * @async
 * @function editarServico
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do serviço.
 * @param {Object} req.body - Dados que serão atualizados.
 * @param {string} [req.body.codigo] - Novo código do serviço.
 * @param {string} [req.body.nome] - Novo nome do serviço.
 * @param {string|null} [req.body.categoria] - Nova categoria do serviço.
 * @param {number|string|null} [req.body.valorPadrao] - Novo valor padrão.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o serviço atualizado ou mensagem de erro.
 */
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

/**
 * Exclui um serviço do catálogo pelo identificador informado.
 *
 * A exclusão é impedida quando o serviço estiver vinculado
 * a uma ordem de serviço.
 *
 * @async
 * @function deletarServico
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do serviço.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com mensagem de sucesso ou erro.
 */
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