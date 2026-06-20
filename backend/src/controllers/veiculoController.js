import prisma from '../config/prisma.js';

/**
 * Controlador responsável pelas operações de cadastro, listagem,
 * atualização, exclusão e busca de veículos para ordens de serviço.
 *
 * @module controllers/veiculoController
 */

/**
 * Cria um novo veículo vinculado a um cliente.
 *
 * Valida a presença do cliente e da placa, normaliza os dados
 * recebidos e impede o cadastro de placas duplicadas.
 *
 * @async
 * @function criarVeiculo
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.body - Dados enviados no corpo da requisição.
 * @param {number|string} req.body.clienteId - Identificador do cliente.
 * @param {string} req.body.placa - Placa do veículo.
 * @param {string} [req.body.modelo] - Modelo do veículo.
 * @param {string} [req.body.chassi] - Número do chassi.
 * @param {string} [req.body.fabricante] - Fabricante do veículo.
 * @param {number|string} [req.body.ano_modelo] - Ano do modelo.
 * @param {number|string} [req.body.ano_fabricacao] - Ano de fabricação.
 * @param {string} [req.body.motor] - Descrição do motor.
 * @param {number|string} [req.body.km] - Quilometragem do veículo.
 * @param {string} [req.body.cor] - Cor do veículo.
 * @param {boolean} [req.body.ar] - Indica se o veículo possui ar-condicionado.
 * @param {string} [req.body.cambio] - Tipo de câmbio do veículo.
 * @param {string} [req.body.Cambio] - Tipo de câmbio enviado com inicial maiúscula.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o veículo criado ou mensagem de erro.
 */
export async function criarVeiculo(req, res) {
  try {
    const {
      clienteId,
      placa,
      modelo,
      chassi,
      fabricante,
      ano_modelo,
      ano_fabricacao,
      motor,
      km,
      cor,
      ar,
      cambio,
      Cambio,
    } = req.body;

    console.log(req.body);

    if (!clienteId) {
      return res.status(400).json({ erro: 'Cliente é obrigatório' });
    }

    if (!placa) {
      return res.status(400).json({ erro: 'Placa é obrigatória' });
    }

    const veiculo = await prisma.veiculo.create({
      data: {
        clienteId: Number(clienteId),
        placa: placa.trim().toUpperCase(),
        modelo: modelo?.trim() || null,
        chassi: chassi?.trim() || null,
        fabricante: fabricante?.trim() || null,
        ano_modelo: ano_modelo ? Number(ano_modelo) : null,
        ano_fabricacao: ano_fabricacao ? Number(ano_fabricacao) : null,
        motor: motor?.trim() || null,
        km: km || null,
        cor: cor?.trim() || null,
        ar: ar !== undefined ? ar : null,
        Cambio: Cambio?.trim() || cambio?.trim() || null,
      },
      include: {
        cliente: true,
      },
    });

    return res.status(201).json(veiculo);
  } catch (error) {
    console.log(error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe um veículo cadastrado com esta placa.',
      });
    }

    return res.status(500).json({ erro: 'Falha ao cadastrar veículo' });
  }
}

/**
 * Lista todos os veículos cadastrados.
 *
 * A resposta inclui os dados do cliente vinculado a cada veículo.
 * Os registros são ordenados do mais recente para o mais antigo.
 *
 * @async
 * @function listarVeiculo
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a lista de veículos ou mensagem de erro.
 */
export async function listarVeiculo(req, res) {
  try {
    const veiculo = await prisma.veiculo.findMany({
      include: {
        cliente: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(veiculo);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ erro: 'Erro ao exibir veículo' });
  }
}

/**
 * Atualiza os dados de um veículo existente.
 *
 * Mantém os valores atuais nos campos que não forem enviados,
 * preserva o vínculo com o cliente e impede placas duplicadas.
 *
 * @async
 * @function editarVeiculo
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do veículo.
 * @param {Object} req.body - Dados que serão atualizados.
 * @param {number|string} [req.body.clienteId] - Identificador do cliente.
 * @param {string} [req.body.placa] - Nova placa do veículo.
 * @param {string|null} [req.body.modelo] - Novo modelo do veículo.
 * @param {string|null} [req.body.chassi] - Novo número do chassi.
 * @param {string|null} [req.body.fabricante] - Novo fabricante.
 * @param {number|string|null} [req.body.ano_modelo] - Novo ano do modelo.
 * @param {number|string|null} [req.body.ano_fabricacao] - Novo ano de fabricação.
 * @param {string|null} [req.body.motor] - Nova descrição do motor.
 * @param {number|string|null} [req.body.km] - Nova quilometragem.
 * @param {string|null} [req.body.cor] - Nova cor do veículo.
 * @param {boolean|null} [req.body.ar] - Indica se possui ar-condicionado.
 * @param {string|null} [req.body.cambio] - Novo tipo de câmbio.
 * @param {string|null} [req.body.Cambio] - Novo tipo de câmbio com inicial maiúscula.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o veículo atualizado ou mensagem de erro.
 */
export async function editarVeiculo(req, res) {
  try {
    const { id } = req.params;

    const {
      clienteId,
      placa,
      modelo,
      chassi,
      fabricante,
      ano_modelo,
      ano_fabricacao,
      motor,
      km,
      cor,
      ar,
      cambio,
      Cambio,
    } = req.body;

    console.log(req.body);

    const veiculoExistente = await prisma.veiculo.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!veiculoExistente) {
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    const veiculo = await prisma.veiculo.update({
      where: {
        id: Number(id),
      },
      data: {
        clienteId: clienteId ? Number(clienteId) : veiculoExistente.clienteId,
        placa: placa?.trim().toUpperCase() || veiculoExistente.placa,
        modelo: modelo !== undefined ? modelo?.trim() || null : veiculoExistente.modelo,
        chassi: chassi !== undefined ? chassi?.trim() || null : veiculoExistente.chassi,
        fabricante:
          fabricante !== undefined
            ? fabricante?.trim() || null
            : veiculoExistente.fabricante,
        ano_modelo:
          ano_modelo !== undefined && ano_modelo !== ''
            ? Number(ano_modelo)
            : ano_modelo === ''
            ? null
            : veiculoExistente.ano_modelo,
        ano_fabricacao:
          ano_fabricacao !== undefined && ano_fabricacao !== ''
            ? Number(ano_fabricacao)
            : ano_fabricacao === ''
            ? null
            : veiculoExistente.ano_fabricacao,
        motor: motor !== undefined ? motor?.trim() || null : veiculoExistente.motor,
        km: km !== undefined ? km || null : veiculoExistente.km,
        cor: cor !== undefined ? cor?.trim() || null : veiculoExistente.cor,
        ar: ar !== undefined ? ar : veiculoExistente.ar,
        Cambio:
          Cambio !== undefined || cambio !== undefined
            ? Cambio?.trim() || cambio?.trim() || null
            : veiculoExistente.Cambio,
      },
      include: {
        cliente: true,
      },
    });

    return res.json(veiculo);
  } catch (error) {
    console.log(error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe outro veículo cadastrado com esta placa.',
      });
    }

    return res.status(500).json({ erro: 'Erro ao atualizar o veículo' });
  }
}

/**
 * Exclui um veículo pelo identificador informado.
 *
 * Antes da exclusão, verifica se o veículo está cadastrado.
 *
 * @async
 * @function deletarVeiculo
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do veículo.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com mensagem de sucesso ou erro.
 */
export async function deletarVeiculo(req, res) {
  try {
    const { id } = req.params;

    const veiculo = await prisma.veiculo.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    await prisma.veiculo.delete({
      where: {
        id: Number(id),
      },
    });

    return res.json({ mensagem: 'Veículo deletado com sucesso' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ erro: 'Erro ao deletar veículo' });
  }
}

/**
 * Busca veículos para utilização na criação de ordens de serviço.
 *
 * A pesquisa considera placa, modelo, fabricante, câmbio
 * e nome do cliente vinculado ao veículo.
 *
 * @async
 * @function buscarVeiculosParaOS
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.query - Parâmetros enviados na URL.
 * @param {string} req.query.termo - Termo utilizado na pesquisa.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com os veículos encontrados ou mensagem de erro.
 */
export async function buscarVeiculosParaOS(req, res) {
  try {
    const { termo } = req.query;

    if (!termo) {
      return res.status(400).json({ erro: 'Termo de busca é obrigatório' });
    }

    const veiculos = await prisma.veiculo.findMany({
      where: {
        OR: [
          {
            placa: {
              contains: termo,
              mode: 'insensitive',
            },
          },
          {
            modelo: {
              contains: termo,
              mode: 'insensitive',
            },
          },
          {
            fabricante: {
              contains: termo,
              mode: 'insensitive',
            },
          },
          {
            cambio: {
              contains: termo,
              mode: 'insensitive',
            },
          },
          {
            cliente: {
              nome: {
                contains: termo,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      include: {
        cliente: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(veiculos);
  } catch (error) {
    console.error('Erro ao buscar veículos para OS:', error);
    return res.status(500).json({ erro: 'Erro ao buscar veículos para OS' });
  }
}