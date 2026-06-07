import prisma from '../config/prisma.js'

// Funções auxiliares para montar valores, códigos e relações da ordem de serviço.
function toNumberOrNull(valor) {
  if (valor === undefined || valor === null || valor === '') {
    return null
  }

  return Number(valor)
}

// Converte uma data opcional vinda do frontend em objeto Date.
function toDateOrNull(valor) {
  if (!valor) {
    return null
  }

  return new Date(valor)
}

// Calcula o total de um serviço já descontando abatimentos.
function calcularTotalServico(servico) {
  const preco = Number(servico.precoVenda || 0)
  const desconto = Number(servico.desconto || 0)

  return Math.max(preco - desconto, 0)
}

// Calcula o total de uma peça considerando quantidade, custo e desconto.
function calcularTotalPeca(peca) {
  const quantidade = Number(peca.quantidade || 0)
  const custoUnitario = Number(peca.custoUnitario || 0)
  const desconto = Number(peca.desconto || 0)

  return Math.max(quantidade * custoUnitario - desconto, 0)
}

// Gera o identificador em letra para diagnóstico hierárquico.
function letraDiagnostico(index) {
  return String.fromCharCode(65 + index)
}

// Define quais relações precisam ser carregadas junto da ordem completa.
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

// Busca um serviço do catálogo antes de copiar dados para a ordem.
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

// Busca uma peça do catálogo antes de copiar dados para a ordem.
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

// Busca um diagnóstico do catálogo antes de gerar os dados da ordem.
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

// Monta o payload de um diagnóstico da ordem, incluindo o código hierárquico.
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

// Monta o payload de um serviço da ordem, com vínculo opcional ao diagnóstico.
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

// Monta o payload de uma peça da ordem e define sua hierarquia.
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

// Cria peças ligadas a um serviço, diagnóstico ou ordem avulsa.
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

// Cria os serviços vinculados a um diagnóstico ou diretamente à ordem.
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

// Cria os diagnósticos da ordem e seus serviços filhos.
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

// Cria peças que não pertencem a um diagnóstico nem a um serviço específico.
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

// Recria toda a estrutura filha da ordem após limpeza ou criação inicial.
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

// Remove itens filhos antes de atualizar ou excluir a ordem.
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

// Carrega a ordem completa com veículo, cliente, diagnósticos, serviços e peças.
async function buscarOrdemCompleta(tx, id) {
  return tx.ordemServico.findUnique({
    where: {
      id: Number(id)
    },
    include: montarIncludeOrdemCompleta()
  })
}

// Resume a ordem em uma linha para uso na busca/listagem filtrada.
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

// Lista todas as ordens de serviço com a estrutura completa relacionada.
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

// Busca uma ordem específica pelo ID com todos os relacionamentos.
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

// Cria uma ordem de serviço e seus itens filhos dentro de uma transação.
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

// Atualiza uma ordem existente recriando diagnósticos, serviços e peças.
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

// Exclui a ordem e remove primeiro todos os registros filhos relacionados.
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

// Gera o próximo código sequencial no formato OS-0001.
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

// Faz busca filtrada por termo, status e intervalo de datas.
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