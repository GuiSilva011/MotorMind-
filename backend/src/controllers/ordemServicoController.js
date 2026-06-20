import prisma from '../config/prisma.js'

/**
 * Controlador responsável pelas operações de criação, consulta,
 * atualização, exclusão e busca de ordens de serviço.
 *
 * Também gerencia diagnósticos, serviços e peças vinculados à ordem.
 *
 * @module controllers/ordemServicoController
 */

/**
 * Converte um valor para número ou retorna null quando estiver vazio.
 *
 * @function toNumberOrNull
 * @param {*} valor - Valor que será convertido.
 * @returns {number|null} Valor numérico ou null.
 */
function toNumberOrNull(valor) {
  if (valor === undefined || valor === null || valor === '') {
    return null
  }

  return Number(valor)
}

/**
 * Converte um valor opcional para uma instância de Date.
 *
 * @function toDateOrNull
 * @param {string|Date|null|undefined} valor - Data que será convertida.
 * @returns {Date|null} Data convertida ou null.
 */
function toDateOrNull(valor) {
  if (!valor) {
    return null
  }

  return new Date(valor)
}

/**
 * Calcula o valor total de um serviço após aplicar o desconto.
 *
 * @function calcularTotalServico
 * @param {Object} servico - Serviço que será calculado.
 * @param {number|string} [servico.precoVenda] - Preço de venda do serviço.
 * @param {number|string} [servico.desconto] - Desconto aplicado.
 * @returns {number} Valor total do serviço.
 */
function calcularTotalServico(servico) {
  const preco = Number(servico.precoVenda || 0)
  const desconto = Number(servico.desconto || 0)

  return Math.max(preco - desconto, 0)
}

/**
 * Calcula o valor total de uma peça considerando quantidade,
 * custo unitário e desconto.
 *
 * @function calcularTotalPeca
 * @param {Object} peca - Peça que será calculada.
 * @param {number|string} [peca.quantidade] - Quantidade da peça.
 * @param {number|string} [peca.custoUnitario] - Custo unitário.
 * @param {number|string} [peca.desconto] - Desconto aplicado.
 * @returns {number} Valor total da peça.
 */
function calcularTotalPeca(peca) {
  const quantidade = Number(peca.quantidade || 0)
  const custoUnitario = Number(peca.custoUnitario || 0)
  const desconto = Number(peca.desconto || 0)

  return Math.max(quantidade * custoUnitario - desconto, 0)
}

/**
 * Gera uma letra identificadora para um diagnóstico hierárquico.
 *
 * @function letraDiagnostico
 * @param {number} index - Posição do diagnóstico na lista.
 * @returns {string} Letra correspondente ao índice.
 */
function letraDiagnostico(index) {
  return String.fromCharCode(65 + index)
}

/**
 * Monta a configuração de relacionamentos utilizada para carregar
 * uma ordem de serviço completa.
 *
 * Inclui veículo, cliente, diagnósticos, serviços e peças.
 *
 * @function montarIncludeOrdemCompleta
 * @returns {Object} Configuração de inclusão utilizada pelo Prisma.
 */
function montarIncludeOrdemCompleta() {
  return {
    veiculo: {
      include: {
        cliente: true
      }
    },

    diagnosticos: {
      include: {
        servicos: {
          include: {
            pecas: true
          }
        },
        pecas: true
      }
    },

    servicos: {
      where: {
        ordemDiagnosticoId: null
      },
      include: {
        pecas: true
      }
    },

    pecas: true
  }
}

/**
 * Busca um serviço no catálogo pelo identificador informado.
 *
 * @async
 * @function buscarServicoCatalogo
 * @param {Object} tx - Cliente Prisma ou transação ativa.
 * @param {number|string|null} servicoCatalogoId - Identificador do serviço.
 * @returns {Promise<Object|null>} Serviço encontrado ou null.
 */
async function buscarServicoCatalogo(tx, servicoCatalogoId) {
  if (!servicoCatalogoId) {
    return null
  }

  return tx.servicoCatalogo.findUnique({
    where: {
      id: Number(servicoCatalogoId)
    }
  })
}

/**
 * Busca uma peça no catálogo pelo identificador informado.
 *
 * @async
 * @function buscarPecaCatalogo
 * @param {Object} tx - Cliente Prisma ou transação ativa.
 * @param {number|string|null} pecaCatalogoId - Identificador da peça.
 * @returns {Promise<Object|null>} Peça encontrada ou null.
 */
async function buscarPecaCatalogo(tx, pecaCatalogoId) {
  if (!pecaCatalogoId) {
    return null
  }

  return tx.pecaCatalogo.findUnique({
    where: {
      id: Number(pecaCatalogoId)
    }
  })
}

/**
 * Busca um diagnóstico no catálogo pelo identificador informado.
 *
 * @async
 * @function buscarDiagnosticoCatalogo
 * @param {Object} tx - Cliente Prisma ou transação ativa.
 * @param {number|string|null} diagnosticoCatalogoId - Identificador do diagnóstico.
 * @returns {Promise<Object|null>} Diagnóstico encontrado ou null.
 */
async function buscarDiagnosticoCatalogo(tx, diagnosticoCatalogoId) {
  if (!diagnosticoCatalogoId) {
    return null
  }

  return tx.diagnosticoCatalogo.findUnique({
    where: {
      id: Number(diagnosticoCatalogoId)
    }
  })
}

/**
 * Monta os dados de um diagnóstico para cadastro na ordem de serviço.
 *
 * Também gera seu código visual e hierárquico.
 *
 * @async
 * @function montarDadosDiagnostico
 * @param {Object} tx - Cliente Prisma ou transação ativa.
 * @param {Object} diagnostico - Dados do diagnóstico.
 * @param {number} diagnosticoIndex - Posição do diagnóstico na ordem.
 * @returns {Promise<Object>} Código hierárquico e dados preparados.
 */
async function montarDadosDiagnostico(tx, diagnostico, diagnosticoIndex) {
  const codigoDiagnostico = letraDiagnostico(diagnosticoIndex)

  let nomeDiagnostico =
    diagnostico.nomeDiagnostico ||
    diagnostico.descricao ||
    'Diagnóstico sem nome'

  const diagnosticoCatalogo = await buscarDiagnosticoCatalogo(
    tx,
    diagnostico.diagnosticoCatalogoId
  )

  if (diagnosticoCatalogo) {
    nomeDiagnostico = diagnosticoCatalogo.nome
  }

  return {
    codigoDiagnostico,
    data: {
      diagnosticoCatalogoId: diagnostico.diagnosticoCatalogoId
        ? Number(diagnostico.diagnosticoCatalogoId)
        : null,

      codigoVisual: codigoDiagnostico,
      codigoHierarquia: codigoDiagnostico,

      nomeDiagnostico,
      descricao: diagnostico.descricao || null,
      observacoes: diagnostico.observacoes || diagnostico.observacao || null
    }
  }
}

/**
 * Monta os dados de um serviço para cadastro na ordem de serviço.
 *
 * O serviço pode estar vinculado a um diagnóstico ou diretamente à ordem.
 *
 * @async
 * @function montarDadosServico
 * @param {Object} parametros - Parâmetros da operação.
 * @param {Object} parametros.tx - Cliente Prisma ou transação ativa.
 * @param {Object} parametros.servico - Dados do serviço.
 * @param {number} parametros.servicoIndex - Posição do serviço na lista.
 * @param {string|null} [parametros.codigoDiagnostico=null] - Código do diagnóstico pai.
 * @returns {Promise<Object>} Código hierárquico e dados preparados.
 */
async function montarDadosServico({
  tx,
  servico,
  servicoIndex,
  codigoDiagnostico = null
}) {
  const codigoVisualServico = String(servicoIndex + 1)

  const codigoHierarquiaServico = codigoDiagnostico
    ? `${codigoDiagnostico}.${servicoIndex + 1}`
    : `S.${servicoIndex + 1}`

  let nomeServico =
    servico.nomeServico ||
    servico.descricao ||
    'Serviço sem nome'

  const servicoCatalogo = await buscarServicoCatalogo(
    tx,
    servico.servicoCatalogoId
  )

  if (servicoCatalogo) {
    nomeServico = servicoCatalogo.nome
  }

  return {
    codigoHierarquiaServico,
    data: {
      servicoCatalogoId: servico.servicoCatalogoId
        ? Number(servico.servicoCatalogoId)
        : null,

      codigoVisual: codigoVisualServico,
      codigoHierarquia: codigoHierarquiaServico,

      nomeServico,
      descricao: servico.descricao || null,
      responsavel: servico.responsavel || null,
      tipo: servico.tipo || null,

      precoVenda: toNumberOrNull(servico.precoVenda),
      desconto: toNumberOrNull(servico.desconto),
      valorTotal: calcularTotalServico(servico)
    }
  }
}

/**
 * Monta os dados de uma peça para cadastro na ordem de serviço.
 *
 * Também define o código visual e a posição hierárquica da peça.
 *
 * @async
 * @function montarDadosPeca
 * @param {Object} parametros - Parâmetros da operação.
 * @param {Object} parametros.tx - Cliente Prisma ou transação ativa.
 * @param {Object} parametros.peca - Dados da peça.
 * @param {number} parametros.pecaIndex - Posição da peça na lista.
 * @param {string|null} [parametros.codigoHierarquiaPai=null] - Código do item pai.
 * @returns {Promise<Object>} Dados preparados para criação da peça.
 */
async function montarDadosPeca({
  tx,
  peca,
  pecaIndex,
  codigoHierarquiaPai = null
}) {
  const codigoVisualPeca = String(pecaIndex + 1)

  const codigoHierarquiaPeca = codigoHierarquiaPai
    ? `${codigoHierarquiaPai}.${pecaIndex + 1}`
    : `P.${pecaIndex + 1}`

  let nomePeca =
    peca.nomePeca ||
    peca.descricao ||
    'Peça sem nome'

  let codigoPeca = peca.codigoPeca || null

  const pecaCatalogo = await buscarPecaCatalogo(tx, peca.pecaCatalogoId)

  if (pecaCatalogo) {
    nomePeca = pecaCatalogo.nome
    codigoPeca = pecaCatalogo.codigo
  }

  return {
    data: {
      pecaCatalogoId: peca.pecaCatalogoId
        ? Number(peca.pecaCatalogoId)
        : null,

      codigoPeca,
      nomePeca,

      fornecedorId: peca.fornecedorId ? Number(peca.fornecedorId) : null,
      fornecedorNome: peca.fornecedorNome || null,

      quantidade: Number(peca.quantidade || 1),
      custoUnitario: toNumberOrNull(peca.custoUnitario),
      desconto: toNumberOrNull(peca.desconto),
      valorTotal: calcularTotalPeca(peca),

      codigoVisual: codigoVisualPeca,
      codigoHierarquia: codigoHierarquiaPeca
    }
  }
}

/**
 * Cria as peças vinculadas a uma ordem de serviço.
 *
 * As peças podem estar ligadas a um diagnóstico, serviço ou diretamente à ordem.
 *
 * @async
 * @function criarPecasDaOrdem
 * @param {Object} parametros - Parâmetros da operação.
 * @param {Object} parametros.tx - Transação ativa do Prisma.
 * @param {number} parametros.ordemServicoId - Identificador da ordem.
 * @param {number|null} [parametros.ordemDiagnosticoId=null] - Identificador do diagnóstico.
 * @param {number|null} [parametros.ordemServicoItemId=null] - Identificador do serviço.
 * @param {string|null} [parametros.codigoHierarquiaPai=null] - Código hierárquico do item pai.
 * @param {Array<Object>} [parametros.pecas=[]] - Peças que serão criadas.
 * @returns {Promise<void>}
 */
async function criarPecasDaOrdem({
  tx,
  ordemServicoId,
  ordemDiagnosticoId = null,
  ordemServicoItemId = null,
  codigoHierarquiaPai = null,
  pecas = []
}) {
  for (let pecaIndex = 0; pecaIndex < pecas.length; pecaIndex++) {
    const peca = pecas[pecaIndex]

    const { data } = await montarDadosPeca({
      tx,
      peca,
      pecaIndex,
      codigoHierarquiaPai
    })

    await tx.ordemPecaItem.create({
      data: {
        ordemServicoId,
        ordemDiagnosticoId,
        ordemServicoItemId,
        ...data
      }
    })
  }
}
/**
 * Cria os serviços vinculados a um diagnóstico ou diretamente à ordem.
 *
 * Após criar cada serviço, também cadastra suas peças relacionadas.
 *
 * @async
 * @function criarServicosDaOrdem
 * @param {Object} parametros - Parâmetros da operação.
 * @param {Object} parametros.tx - Transação ativa do Prisma.
 * @param {number} parametros.ordemServicoId - Identificador da ordem.
 * @param {number|null} [parametros.ordemDiagnosticoId=null] - Identificador do diagnóstico.
 * @param {string|null} [parametros.codigoDiagnostico=null] - Código visual do diagnóstico.
 * @param {Array<Object>} [parametros.servicos=[]] - Serviços que serão criados.
 * @returns {Promise<void>}
 */
async function criarServicosDaOrdem({
  tx,
  ordemServicoId,
  ordemDiagnosticoId = null,
  codigoDiagnostico = null,
  servicos = []
}) {
  for (let servicoIndex = 0; servicoIndex < servicos.length; servicoIndex++) {
    const servico = servicos[servicoIndex]

    const { codigoHierarquiaServico, data } = await montarDadosServico({
      tx,
      servico,
      servicoIndex,
      codigoDiagnostico
    })

    const servicoCriado = await tx.ordemServicoItem.create({
      data: {
        ordemServicoId,
        ordemDiagnosticoId,
        ...data
      }
    })

    await criarPecasDaOrdem({
      tx,
      ordemServicoId,
      ordemDiagnosticoId,
      ordemServicoItemId: servicoCriado.id,
      codigoHierarquiaPai: codigoHierarquiaServico,
      pecas: servico.pecas || []
    })
  }
}

/**
 * Cria os diagnósticos vinculados à ordem de serviço.
 *
 * Também cadastra os serviços e as peças relacionados a cada diagnóstico.
 *
 * @async
 * @function criarDiagnosticosDaOrdem
 * @param {Object} parametros - Parâmetros da operação.
 * @param {Object} parametros.tx - Transação ativa do Prisma.
 * @param {number} parametros.ordemServicoId - Identificador da ordem.
 * @param {Array<Object>} [parametros.diagnosticos=[]] - Diagnósticos que serão criados.
 * @returns {Promise<void>}
 */
async function criarDiagnosticosDaOrdem({
  tx,
  ordemServicoId,
  diagnosticos = []
}) {
  for (
    let diagnosticoIndex = 0;
    diagnosticoIndex < diagnosticos.length;
    diagnosticoIndex++
  ) {
    const diagnostico = diagnosticos[diagnosticoIndex]

    const { codigoDiagnostico, data } = await montarDadosDiagnostico(
      tx,
      diagnostico,
      diagnosticoIndex
    )

    const diagnosticoCriado = await tx.ordemDiagnostico.create({
      data: {
        ordemServicoId,
        ...data
      }
    })

    await criarServicosDaOrdem({
      tx,
      ordemServicoId,
      ordemDiagnosticoId: diagnosticoCriado.id,
      codigoDiagnostico,
      servicos: diagnostico.servicos || []
    })
  }
}

/**
 * Cria peças avulsas que não pertencem a diagnóstico ou serviço.
 *
 * @async
 * @function criarPecasAvulsasDaOrdem
 * @param {Object} parametros - Parâmetros da operação.
 * @param {Object} parametros.tx - Transação ativa do Prisma.
 * @param {number} parametros.ordemServicoId - Identificador da ordem.
 * @param {Array<Object>} [parametros.pecasAvulsas=[]] - Peças avulsas.
 * @returns {Promise<void>}
 */
async function criarPecasAvulsasDaOrdem({
  tx,
  ordemServicoId,
  pecasAvulsas = []
}) {
  await criarPecasDaOrdem({
    tx,
    ordemServicoId,
    ordemDiagnosticoId: null,
    ordemServicoItemId: null,
    codigoHierarquiaPai: null,
    pecas: pecasAvulsas
  })
}

/**
 * Cria novamente toda a estrutura filha de uma ordem de serviço.
 *
 * Inclui diagnósticos, serviços sem diagnóstico e peças avulsas.
 *
 * @async
 * @function recriarItensDaOrdem
 * @param {Object} parametros - Parâmetros da operação.
 * @param {Object} parametros.tx - Transação ativa do Prisma.
 * @param {number} parametros.ordemServicoId - Identificador da ordem.
 * @param {Array<Object>} [parametros.diagnosticos=[]] - Diagnósticos da ordem.
 * @param {Array<Object>} [parametros.servicosSemDiagnostico=[]] - Serviços sem diagnóstico.
 * @param {Array<Object>} [parametros.pecasAvulsas=[]] - Peças avulsas.
 * @returns {Promise<void>}
 */
async function recriarItensDaOrdem({
  tx,
  ordemServicoId,
  diagnosticos = [],
  servicosSemDiagnostico = [],
  pecasAvulsas = []
}) {
  await criarDiagnosticosDaOrdem({
    tx,
    ordemServicoId,
    diagnosticos
  })

  await criarServicosDaOrdem({
    tx,
    ordemServicoId,
    ordemDiagnosticoId: null,
    codigoDiagnostico: null,
    servicos: servicosSemDiagnostico
  })

  await criarPecasAvulsasDaOrdem({
    tx,
    ordemServicoId,
    pecasAvulsas
  })
}

/**
 * Remove todos os itens filhos vinculados a uma ordem de serviço.
 *
 * A remoção ocorre na ordem correta para respeitar as relações do banco.
 *
 * @async
 * @function limparItensDaOrdem
 * @param {Object} tx - Transação ativa do Prisma.
 * @param {number|string} ordemServicoId - Identificador da ordem.
 * @returns {Promise<void>}
 */
async function limparItensDaOrdem(tx, ordemServicoId) {
  await tx.ordemPecaItem.deleteMany({
    where: {
      ordemServicoId
    }
  })

  await tx.ordemServicoItem.deleteMany({
    where: {
      ordemServicoId
    }
  })

  await tx.ordemDiagnostico.deleteMany({
    where: {
      ordemServicoId
    }
  })
}

/**
 * Busca uma ordem de serviço pelo ID com todos os relacionamentos.
 *
 * @async
 * @function buscarOrdemCompleta
 * @param {Object} tx - Cliente Prisma ou transação ativa.
 * @param {number|string} id - Identificador da ordem.
 * @returns {Promise<Object|null>} Ordem completa ou null.
 */
async function buscarOrdemCompleta(tx, id) {
  return tx.ordemServico.findUnique({
    where: {
      id: Number(id)
    },
    include: montarIncludeOrdemCompleta()
  })
}

/**
 * Monta um resumo simplificado de uma ordem de serviço.
 *
 * O resumo contém dados do cliente, veículo, quantidades e valores totais.
 *
 * @function montarResumoBusca
 * @param {Object} ordem - Ordem de serviço que será resumida.
 * @returns {Object} Resumo da ordem de serviço.
 */
function montarResumoBusca(ordem) {
  const totalServicos = ordem.servicos.reduce((acc, servico) => {
    return acc + Number(servico.valorTotal || 0)
  }, 0)

  const totalPecas = ordem.pecas.reduce((acc, peca) => {
    return acc + Number(peca.valorTotal || 0)
  }, 0)

  return {
    id: ordem.id,
    codigo: ordem.codigo,
    status: ordem.status,
    dataEmissao: ordem.dataEmissao,
    dataFechamento: ordem.dataFechamento,

    clienteNome: ordem.veiculo?.cliente?.nome || null,

    veiculo: {
      id: ordem.veiculo?.id || null,
      placa: ordem.veiculo?.placa || null,
      fabricante: ordem.veiculo?.fabricante || null,
      modelo: ordem.veiculo?.modelo || null,
      ano_modelo: ordem.veiculo?.ano_modelo || null,
      ano_fabricacao: ordem.veiculo?.ano_fabricacao || null
    },

    quantidadeDiagnosticos: ordem.diagnosticos.length,
    quantidadeServicos: ordem.servicos.length,
    quantidadePecas: ordem.pecas.length,

    totalServicos,
    totalPecas,
    totalGeral: totalServicos + totalPecas
  }
}

/**
 * Lista todas as ordens de serviço com sua estrutura completa.
 *
 * Os registros são ordenados da ordem mais recente para a mais antiga.
 *
 * @async
 * @function listarOrdensServico
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a lista de ordens ou mensagem de erro.
 */
export async function listarOrdensServico(req, res) {
  try {
    const ordens = await prisma.ordemServico.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: montarIncludeOrdemCompleta()
    })

    return res.json(ordens)
  } catch (error) {
    console.error('Erro ao listar ordens de serviço:', error)

    return res.status(500).json({
      erro: 'Erro ao listar ordens de serviço',
      detalhe: error.message
    })
  }
}

/**
 * Busca uma ordem de serviço pelo identificador informado.
 *
 * A resposta inclui veículo, cliente, diagnósticos, serviços e peças.
 *
 * @async
 * @function buscarOrdemServicoPorId
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador da ordem.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a ordem encontrada ou mensagem de erro.
 */
export async function buscarOrdemServicoPorId(req, res) {
  try {
    const { id } = req.params

    const ordem = await buscarOrdemCompleta(prisma, id)

    if (!ordem) {
      return res.status(404).json({
        erro: 'Ordem de serviço não encontrada'
      })
    }

    return res.json(ordem)
  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error)

    return res.status(500).json({
      erro: 'Erro ao buscar ordem de serviço',
      detalhe: error.message
    })
  }
}

/**
 * Cria uma ordem de serviço e todos os seus itens relacionados.
 *
 * A criação de diagnósticos, serviços e peças é executada
 * dentro da mesma transação.
 *
 * @async
 * @function criarOrdemServico
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.body - Dados enviados no corpo da requisição.
 * @param {string} req.body.codigo - Código único da ordem.
 * @param {number|string} req.body.veiculoId - Identificador do veículo.
 * @param {number|string} [req.body.operadorId] - Identificador do operador.
 * @param {number|string} [req.body.tecnicoId] - Identificador do técnico.
 * @param {string} [req.body.observacoes] - Observações da ordem.
 * @param {string} [req.body.status='ABERTA'] - Status da ordem.
 * @param {Array<Object>} [req.body.diagnosticos=[]] - Diagnósticos da ordem.
 * @param {Array<Object>} [req.body.servicosSemDiagnostico=[]] - Serviços sem diagnóstico.
 * @param {Array<Object>} [req.body.pecasAvulsas=[]] - Peças avulsas.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a ordem criada ou mensagem de erro.
 */
export async function criarOrdemServico(req, res) {
  try {
    const {
      codigo,
      veiculoId,
      operadorId,
      tecnicoId,
      observacoes,
      status,
      diagnosticos = [],
      servicosSemDiagnostico = [],
      pecasAvulsas = []
    } = req.body

    if (!codigo || !veiculoId) {
      return res.status(400).json({
        erro: 'Código e veículo são obrigatórios'
      })
    }

    const ordemExistente = await prisma.ordemServico.findUnique({
      where: {
        codigo
      }
    })

    if (ordemExistente) {
      return res.status(409).json({
        erro: 'Já existe uma ordem de serviço com esse código'
      })
    }

    const veiculoExiste = await prisma.veiculo.findUnique({
      where: {
        id: Number(veiculoId)
      }
    })

    if (!veiculoExiste) {
      return res.status(404).json({
        erro: 'Veículo não encontrado'
      })
    }

    const ordemCriada = await prisma.$transaction(async (tx) => {
      const ordem = await tx.ordemServico.create({
        data: {
          codigo,
          veiculoId: Number(veiculoId),
          operadorId: operadorId ? Number(operadorId) : null,
          tecnicoId: tecnicoId ? Number(tecnicoId) : null,
          observacoes: observacoes || null,
          status: status || 'ABERTA'
        }
      })

      await recriarItensDaOrdem({
        tx,
        ordemServicoId: ordem.id,
        diagnosticos,
        servicosSemDiagnostico,
        pecasAvulsas
      })

      return buscarOrdemCompleta(tx, ordem.id)
    })

    return res.status(201).json(ordemCriada)
  } catch (error) {
    console.error('Erro ao criar ordem de serviço:', error)

    return res.status(500).json({
      erro: 'Erro ao criar ordem de serviço',
      detalhe: error.message
    })
  }
}

/**
 * Atualiza uma ordem de serviço existente.
 *
 * Os itens antigos são removidos e a estrutura de diagnósticos,
 * serviços e peças é recriada dentro de uma transação.
 *
 * @async
 * @function editarOrdemServico
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador da ordem.
 * @param {Object} req.body - Dados atualizados da ordem.
 * @param {string} [req.body.codigo] - Código da ordem.
 * @param {number|string} [req.body.veiculoId] - Identificador do veículo.
 * @param {number|string} [req.body.operadorId] - Identificador do operador.
 * @param {number|string} [req.body.tecnicoId] - Identificador do técnico.
 * @param {string|null} [req.body.observacoes] - Observações da ordem.
 * @param {string} [req.body.status] - Status da ordem.
 * @param {string|Date|null} [req.body.dataFechamento] - Data de fechamento.
 * @param {Array<Object>} [req.body.diagnosticos=[]] - Diagnósticos atualizados.
 * @param {Array<Object>} [req.body.servicosSemDiagnostico=[]] - Serviços sem diagnóstico.
 * @param {Array<Object>} [req.body.pecasAvulsas=[]] - Peças avulsas.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a ordem atualizada ou mensagem de erro.
 */
export async function editarOrdemServico(req, res) {
  try {
    const { id } = req.params

    const {
      codigo,
      veiculoId,
      operadorId,
      tecnicoId,
      observacoes,
      status,
      dataFechamento,
      diagnosticos = [],
      servicosSemDiagnostico = [],
      pecasAvulsas = []
    } = req.body

    const ordemExistente = await prisma.ordemServico.findUnique({
      where: {
        id: Number(id)
      }
    })

    if (!ordemExistente) {
      return res.status(404).json({
        erro: 'Ordem de serviço não encontrada'
      })
    }

    if (codigo && codigo !== ordemExistente.codigo) {
      const codigoDuplicado = await prisma.ordemServico.findUnique({
        where: {
          codigo
        }
      })

      if (codigoDuplicado) {
        return res.status(409).json({
          erro: 'Já existe uma ordem de serviço com esse código'
        })
      }
    }

    if (veiculoId) {
      const veiculoExiste = await prisma.veiculo.findUnique({
        where: {
          id: Number(veiculoId)
        }
      })

      if (!veiculoExiste) {
        return res.status(404).json({
          erro: 'Veículo não encontrado'
        })
      }
    }

    const ordemAtualizada = await prisma.$transaction(async (tx) => {
      await limparItensDaOrdem(tx, Number(id))

      await tx.ordemServico.update({
        where: {
          id: Number(id)
        },
        data: {
          codigo: codigo || ordemExistente.codigo,
          veiculoId: veiculoId ? Number(veiculoId) : ordemExistente.veiculoId,
          operadorId: operadorId ? Number(operadorId) : null,
          tecnicoId: tecnicoId ? Number(tecnicoId) : null,
          observacoes: observacoes || null,
          status: status || ordemExistente.status,
          dataFechamento: toDateOrNull(dataFechamento)
        }
      })

      await recriarItensDaOrdem({
        tx,
        ordemServicoId: Number(id),
        diagnosticos,
        servicosSemDiagnostico,
        pecasAvulsas
      })

      return buscarOrdemCompleta(tx, Number(id))
    })

    return res.json(ordemAtualizada)
  } catch (error) {
    console.error('Erro ao editar ordem de serviço:', error)

    return res.status(500).json({
      erro: 'Erro ao editar ordem de serviço',
      detalhe: error.message
    })
  }
}

/**
 * Exclui uma ordem de serviço e todos os seus registros filhos.
 *
 * A exclusão é executada em uma transação para manter
 * a integridade dos dados.
 *
 * @async
 * @function deletarOrdemServico
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador da ordem.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com mensagem de sucesso ou erro.
 */
export async function deletarOrdemServico(req, res) {
  try {
    const { id } = req.params

    const ordem = await prisma.ordemServico.findUnique({
      where: {
        id: Number(id)
      }
    })

    if (!ordem) {
      return res.status(404).json({
        erro: 'Ordem de serviço não encontrada'
      })
    }

    await prisma.$transaction(async (tx) => {
      await limparItensDaOrdem(tx, Number(id))

      await tx.ordemServico.delete({
        where: {
          id: Number(id)
        }
      })
    })

    return res.json({
      mensagem: 'Ordem de serviço deletada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar ordem de serviço:', error)

    return res.status(500).json({
      erro: 'Erro ao deletar ordem de serviço',
      detalhe: error.message
    })
  }
}

/**
 * Gera o próximo código sequencial de ordem de serviço.
 *
 * O código segue o formato OS-0001.
 *
 * @async
 * @function gerarProximoCodigoOS
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o próximo código ou mensagem de erro.
 */
export async function gerarProximoCodigoOS(req, res) {
  try {
    const ultimaOS = await prisma.ordemServico.findFirst({
      orderBy: {
        id: 'desc'
      }
    })

    const proximoNumero = ultimaOS ? ultimaOS.id + 1 : 1
    const codigo = `OS-${String(proximoNumero).padStart(4, '0')}`

    return res.json({ codigo })
  } catch (error) {
    console.error('Erro ao gerar código da OS:', error)

    return res.status(500).json({
      erro: 'Erro ao gerar código da OS',
      detalhe: error.message
    })
  }
}

/**
 * Busca ordens de serviço utilizando filtros opcionais.
 *
 * A pesquisa pode considerar código, placa, modelo, fabricante,
 * cliente, status e intervalo de datas.
 *
 * @async
 * @function buscarOrdensServico
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.query - Filtros enviados na URL.
 * @param {string} [req.query.termo] - Termo geral da pesquisa.
 * @param {string} [req.query.status] - Status da ordem.
 * @param {string} [req.query.dataInicio] - Data inicial no formato YYYY-MM-DD.
 * @param {string} [req.query.dataFim] - Data final no formato YYYY-MM-DD.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com as ordens encontradas ou mensagem de erro.
 */
export async function buscarOrdensServico(req, res) {
  try {
    const {
      termo,
      status,
      dataInicio,
      dataFim
    } = req.query

    const filtros = []

    if (termo) {
      filtros.push({
        OR: [
          {
            codigo: {
              contains: termo,
              mode: 'insensitive'
            }
          },
          {
            veiculo: {
              placa: {
                contains: termo,
                mode: 'insensitive'
              }
            }
          },
          {
            veiculo: {
              modelo: {
                contains: termo,
                mode: 'insensitive'
              }
            }
          },
          {
            veiculo: {
              fabricante: {
                contains: termo,
                mode: 'insensitive'
              }
            }
          },
          {
            veiculo: {
              cliente: {
                nome: {
                  contains: termo,
                  mode: 'insensitive'
                }
              }
            }
          }
        ]
      })
    }

    if (status) {
      filtros.push({ status })
    }

    if (dataInicio || dataFim) {
      const filtroData = {}

      if (dataInicio) {
        filtroData.gte = new Date(`${dataInicio}T00:00:00`)
      }

      if (dataFim) {
        filtroData.lte = new Date(`${dataFim}T23:59:59`)
      }

      filtros.push({
        dataEmissao: filtroData
      })
    }

    const ordens = await prisma.ordemServico.findMany({
      where: filtros.length > 0 ? { AND: filtros } : {},
      orderBy: {
        dataEmissao: 'desc'
      },
      include: {
        veiculo: {
          include: {
            cliente: true
          }
        },
        diagnosticos: true,
        servicos: true,
        pecas: true
      }
    })

    const resultado = ordens.map((ordem) => montarResumoBusca(ordem))

    return res.json(resultado)
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço:', error)

    return res.status(500).json({
      erro: 'Erro ao buscar ordens de serviço',
      detalhe: error.message
    })
  }
}