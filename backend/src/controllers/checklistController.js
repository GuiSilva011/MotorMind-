import prisma from '../config/prisma.js';

/**
 * Controlador responsável pelo cadastro, consulta e exclusão
 * de checklists vinculadas aos veículos.
 *
 * @module controllers/checklistController
 */

/**
 * Converte um campo JSON recebido como texto para um valor utilizável.
 *
 * Caso o valor já seja um array, ele é retornado diretamente.
 * Se a conversão falhar, o valor padrão é retornado.
 *
 * @function parseJsonField
 * @param {string|Array<Object>|null|undefined} value - Valor que será convertido.
 * @param {Array<Object>} [fallback=[]] - Valor retornado em caso de falha.
 * @returns {Array<Object>|Object} Conteúdo convertido ou valor padrão.
 */
function parseJsonField(value, fallback = []) {
  if (!value) return fallback;

  if (Array.isArray(value)) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Recupera o caminho de uma imagem enviada na requisição.
 *
 * @function pegarArquivo
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} [req.files] - Arquivos enviados na requisição.
 * @param {string} campo - Nome do campo que contém o arquivo.
 * @returns {string|null} Caminho público do arquivo ou null.
 */
function pegarArquivo(req, campo) {
  const arquivo = req.files?.[campo]?.[0];

  if (!arquivo) return null;

  return `/uploads/checklists/${arquivo.filename}`;
}

/**
 * Cria uma checklist vinculada a um veículo.
 *
 * Processa os itens de entrada e diagnóstico, registra observações
 * e armazena os caminhos das fotos enviadas.
 *
 * @async
 * @function criarChecklist
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.body - Dados enviados no corpo da requisição.
 * @param {number|string} req.body.veiculoId - Identificador do veículo.
 * @param {string|Array<Object>} [req.body.itensEntrada] - Itens da inspeção de entrada.
 * @param {string|Array<Object>} [req.body.itensDiagnostico] - Itens da etapa de diagnóstico.
 * @param {string} [req.body.observacoesEntrada] - Observações da inspeção de entrada.
 * @param {string} [req.body.observacoesDiagnostico] - Observações do diagnóstico.
 * @param {Object} [req.files] - Fotos enviadas no formulário.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a checklist criada ou mensagem de erro.
 */
export async function criarChecklist(req, res) {
  try {
    const {
      veiculoId,
      itensEntrada,
      itensDiagnostico,
      observacoesEntrada,
      observacoesDiagnostico,
    } = req.body;

    if (!veiculoId) {
      return res.status(400).json({
        erro: 'O veículo é obrigatório para criar uma checklist.',
      });
    }

    const veiculo = await prisma.veiculo.findUnique({
      where: {
        id: Number(veiculoId),
      },
    });

    if (!veiculo) {
      return res.status(404).json({
        erro: 'Veículo não encontrado.',
      });
    }

    const checklist = await prisma.checklist.create({
      data: {
        veiculoId: Number(veiculoId),
        itensEntrada: parseJsonField(itensEntrada),
        itensDiagnostico: parseJsonField(itensDiagnostico),
        observacoesEntrada: observacoesEntrada || null,
        observacoesDiagnostico: observacoesDiagnostico || null,
        fotoFrente: pegarArquivo(req, 'fotoFrente'),
        fotoTraseira: pegarArquivo(req, 'fotoTraseira'),
        fotoEsquerda: pegarArquivo(req, 'fotoEsquerda'),
        fotoDireita: pegarArquivo(req, 'fotoDireita'),
      },
      include: {
        veiculo: {
          include: {
            cliente: true,
          },
        },
      },
    });

    return res.status(201).json({
      mensagem: 'Checklist criada com sucesso.',
      checklist,
    });
  } catch (error) {
    console.error('Erro ao criar checklist:', error);

    return res.status(500).json({
      erro: 'Erro ao criar checklist.',
      detalhe: error.message,
    });
  }
}

/**
 * Lista todas as checklists vinculadas a um veículo.
 *
 * Os registros são retornados com os dados do veículo e do cliente,
 * ordenados da checklist mais recente para a mais antiga.
 *
 * @async
 * @function listarChecklistsPorVeiculo
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.veiculoId - Identificador do veículo.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a lista de checklists ou mensagem de erro.
 */
export async function listarChecklistsPorVeiculo(req, res) {
  try {
    const { veiculoId } = req.params;

    if (!veiculoId || Number.isNaN(Number(veiculoId))) {
      return res.status(400).json({
        erro: 'ID do veículo inválido.',
      });
    }

    const checklists = await prisma.checklist.findMany({
      where: {
        veiculoId: Number(veiculoId),
      },
      include: {
        veiculo: {
          include: {
            cliente: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(checklists);
  } catch (error) {
    console.error('Erro ao listar checklists:', error);

    return res.status(500).json({
      erro: 'Erro ao listar checklists.',
      detalhe: error.message,
    });
  }
}

/**
 * Busca uma checklist pelo identificador informado.
 *
 * A resposta inclui os dados do veículo e do cliente vinculados.
 *
 * @async
 * @function buscarChecklistPorId
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador da checklist.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a checklist encontrada ou mensagem de erro.
 */
export async function buscarChecklistPorId(req, res) {
  try {
    const { id } = req.params;

    const checklist = await prisma.checklist.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        veiculo: {
          include: {
            cliente: true,
          },
        },
      },
    });

    if (!checklist) {
      return res.status(404).json({
        erro: 'Checklist não encontrada.',
      });
    }

    return res.json(checklist);
  } catch (error) {
    console.error('Erro ao buscar checklist:', error);

    return res.status(500).json({
      erro: 'Erro ao buscar checklist.',
      detalhe: error.message,
    });
  }
}

/**
 * Exclui uma checklist existente pelo identificador informado.
 *
 * Antes da exclusão, verifica se a checklist está cadastrada.
 *
 * @async
 * @function deletarChecklist
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador da checklist.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com mensagem de sucesso ou erro.
 */
export async function deletarChecklist(req, res) {
  try {
    const { id } = req.params;

    const checklist = await prisma.checklist.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!checklist) {
      return res.status(404).json({
        erro: 'Checklist não encontrada.',
      });
    }

    await prisma.checklist.delete({
      where: {
        id: Number(id),
      },
    });

    return res.json({
      mensagem: 'Checklist deletada com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao deletar checklist:', error);

    return res.status(500).json({
      erro: 'Erro ao deletar checklist.',
      detalhe: error.message,
    });
  }
}