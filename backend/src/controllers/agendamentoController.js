import prisma from '../config/prisma.js';

/**
 * Controlador responsável pelas operações de criação, consulta,
 * atualização e exclusão de agendamentos.
 *
 * @module controllers/agendamentoController
 */
/**
 * Cria um novo agendamento vinculando cliente, veículo e serviço.
 *
 * @async
 * @function criarAgendamento
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.body - Dados enviados no corpo da requisição.
 * @param {number|string} req.body.clienteId - Identificador do cliente.
 * @param {number|string} req.body.veiculoId - Identificador do veículo.
 * @param {string|Date} req.body.dataHora - Data e hora do agendamento.
 * @param {string} [req.body.mecanico] - Nome do mecânico responsável.
 * @param {string} [req.body.tipo_servico] - Tipo do serviço agendado.
 * @param {string} req.body.servico - Descrição do serviço.
 * @param {string} [req.body.status='AGENDADO'] - Status do agendamento.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta HTTP com o agendamento criado ou mensagem de erro.
 */
export async function criarAgendamento(req, res) {
  try {
    const {
      clienteId,
      veiculoId,
      dataHora,
      mecanico,
      tipo_servico,
      servico,
      status
    } = req.body;

    if (!clienteId || !veiculoId || !dataHora || !servico) {
      return res.status(400).json({
        erro: 'Cliente, veículo, data/hora e serviço são obrigatórios.'
      });
    }

    const agendamento = await prisma.agendamento.create({
      data: {
        clienteId: Number(clienteId),
        veiculoId: Number(veiculoId),
        dataHora: new Date(dataHora),
        mecanico: mecanico || null,
        tipo_servico: tipo_servico || null,
        servico,
        status: status || 'AGENDADO'
      },
      include: {
        cliente: true,
        veiculo: true
      }
    });

    return res.status(201).json(agendamento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao criar agendamento.' });
  }
}

/**
 * Lista todos os agendamentos cadastrados.
 *
 * Os registros são retornados com os dados do cliente e do veículo,
 * ordenados pela data e hora em ordem crescente.
 *
 * @async
 * @function listarAgendamentos
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta HTTP com a lista de agendamentos ou mensagem de erro.
 */
export async function listarAgendamentos(req, res) {
  try {
    const agendamentos = await prisma.agendamento.findMany({
      include: {
        cliente: true,
        veiculo: true
      },
      orderBy: {
        dataHora: 'asc'
      }
    });

    return res.json(agendamentos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao listar agendamentos.' });
  }
}

/**
 * Busca um agendamento pelo identificador informado.
 *
 * @async
 * @function buscarAgendamentoPorId
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do agendamento.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta HTTP com o agendamento encontrado ou mensagem de erro.
 */
export async function buscarAgendamentoPorId(req, res) {
  try {
    const { id } = req.params;

    const agendamento = await prisma.agendamento.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        cliente: true,
        veiculo: true
      }
    });

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    return res.json(agendamento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao buscar agendamento.' });
  }
}

/**
 * Atualiza os dados de um agendamento existente.
 *
 * Apenas os campos enviados no corpo da requisição são modificados.
 *
 * @async
 * @function editarAgendamento
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do agendamento.
 * @param {Object} req.body - Dados que serão atualizados.
 * @param {number|string} [req.body.clienteId] - Identificador do cliente.
 * @param {number|string} [req.body.veiculoId] - Identificador do veículo.
 * @param {string|Date} [req.body.dataHora] - Nova data e hora do agendamento.
 * @param {string|null} [req.body.mecanico] - Mecânico responsável.
 * @param {string|null} [req.body.tipo_servico] - Tipo do serviço.
 * @param {string} [req.body.servico] - Descrição do serviço.
 * @param {string} [req.body.status] - Status do agendamento.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta HTTP com o agendamento atualizado ou mensagem de erro.
 */
export async function editarAgendamento(req, res) {
  try {
    const { id } = req.params;

    const {
      clienteId,
      veiculoId,
      dataHora,
      mecanico,
      tipo_servico,
      servico,
      status
    } = req.body;

    const agendamento = await prisma.agendamento.update({
      where: {
        id: Number(id)
      },
      data: {
        clienteId: clienteId ? Number(clienteId) : undefined,
        veiculoId: veiculoId ? Number(veiculoId) : undefined,
        dataHora: dataHora ? new Date(dataHora) : undefined,
        mecanico,
        tipo_servico,
        servico,
        status
      },
      include: {
        cliente: true,
        veiculo: true
      }
    });

    return res.json(agendamento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao editar agendamento.' });
  }
}

/**
 * Exclui um agendamento pelo identificador informado.
 *
 * @async
 * @function deletarAgendamento
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do agendamento.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta HTTP com mensagem de sucesso ou erro.
 */
export async function deletarAgendamento(req, res) {
  try {
    const { id } = req.params;

    await prisma.agendamento.delete({
      where: {
        id: Number(id)
      }
    });

    return res.json({ mensagem: 'Agendamento deletado com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao deletar agendamento.' });
  }
}