import prisma from '../config/prisma.js'

function toNumberOrNull(valor) {
  if (valor === undefined || valor === null || valor === '') {
    return null
  }

  return Number(valor)
}

function calcularTotalServico(servico) {
  const preco = Number(servico.precoVenda || 0)
  const desconto = Number(servico.desconto || 0)

  return Math.max(preco - desconto, 0)
}

function calcularTotalPeca(peca) {
  const quantidade = Number(peca.quantidade || 0)
  const custoUnitario = Number(peca.custoUnitario || 0)
  const desconto = Number(peca.desconto || 0)

  return Math.max(quantidade * custoUnitario - desconto, 0)
}

function letraDiagnostico(index) {
  return String.fromCharCode(65 + index)
}

async function criarServicosDaOrdem({
  tx,
  ordemServicoId,
  ordemDiagnosticoId = null,
  codigoDiagnostico = null,
  servicos = []
}) {
  for (let servicoIndex = 0; servicoIndex < servicos.length; servicoIndex++) {
    const servico = servicos[servicoIndex]

    const codigoVisualServico = String(servicoIndex + 1)
    const codigoHierarquiaServico = codigoDiagnostico
      ? `${codigoDiagnostico}.${servicoIndex + 1}`
      : `S.${servicoIndex + 1}`

    let nomeServico = servico.nomeServico || servico.descricao || 'Serviço sem nome'

    if (servico.servicoCatalogoId) {
      const servicoCatalogo = await tx.servicoCatalogo.findUnique({
        where: {
          id: Number(servico.servicoCatalogoId)
        }
      })

      if (servicoCatalogo) {
        nomeServico = servicoCatalogo.nome
      }
    }

    const servicoCriado = await tx.ordemServicoItem.create({
      data: {
        ordemServicoId,
        ordemDiagnosticoId,
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
    })

    const pecas = servico.pecas || []

    for (let pecaIndex = 0; pecaIndex < pecas.length; pecaIndex++) {
      const peca = pecas[pecaIndex]

      const codigoVisualPeca = String(pecaIndex + 1)
      const codigoHierarquiaPeca = `${codigoHierarquiaServico}.${pecaIndex + 1}`

      let nomePeca = peca.nomePeca || peca.descricao || 'Peça sem nome'
      let codigoPeca = peca.codigoPeca || null

      if (peca.pecaCatalogoId) {
        const pecaCatalogo = await tx.pecaCatalogo.findUnique({
          where: {
            id: Number(peca.pecaCatalogoId)
          }
        })

        if (pecaCatalogo) {
          nomePeca = pecaCatalogo.nome
          codigoPeca = pecaCatalogo.codigo
        }
      }

      await tx.ordemPecaItem.create({
        data: {
          ordemServicoId,
          ordemDiagnosticoId,
          ordemServicoItemId: servicoCriado.id,

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
      })
    }
  }
}

export async function listarOrdensServico(req, res) {
  try {
    const ordens = await prisma.ordemServico.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        diagnosticos: true,
        servicos: true,
        pecas: true
      }
    })

    return res.json(ordens)
  } catch (error) {
    console.error('Erro ao listar ordens de serviço:', error)
    return res.status(500).json({ erro: 'Erro ao listar ordens de serviço' })
  }
}

export async function buscarOrdemServicoPorId(req, res) {
  try {
    const { id } = req.params

    const ordem = await prisma.ordemServico.findUnique({
      where: {
        id: Number(id)
      },
      include: {
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
    })

    if (!ordem) {
      return res.status(404).json({ erro: 'Ordem de serviço não encontrada' })
    }

    return res.json(ordem)
  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error)
    return res.status(500).json({ erro: 'Erro ao buscar ordem de serviço' })
  }
}

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
      servicosSemDiagnostico = []
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

      for (
        let diagnosticoIndex = 0;
        diagnosticoIndex < diagnosticos.length;
        diagnosticoIndex++
      ) {
        const diagnostico = diagnosticos[diagnosticoIndex]

        const codigoDiagnostico = letraDiagnostico(diagnosticoIndex)

        let nomeDiagnostico =
          diagnostico.nomeDiagnostico ||
          diagnostico.descricao ||
          'Diagnóstico sem nome'

        if (diagnostico.diagnosticoCatalogoId) {
          const diagnosticoCatalogo = await tx.diagnosticoCatalogo.findUnique({
            where: {
              id: Number(diagnostico.diagnosticoCatalogoId)
            }
          })

          if (diagnosticoCatalogo) {
            nomeDiagnostico = diagnosticoCatalogo.nome
          }
        }

        const diagnosticoCriado = await tx.ordemDiagnostico.create({
          data: {
            ordemServicoId: ordem.id,
            diagnosticoCatalogoId: diagnostico.diagnosticoCatalogoId
              ? Number(diagnostico.diagnosticoCatalogoId)
              : null,

            codigoVisual: codigoDiagnostico,
            codigoHierarquia: codigoDiagnostico,

            nomeDiagnostico,
            descricao: diagnostico.descricao || null,
            observacoes: diagnostico.observacoes || null
          }
        })

        await criarServicosDaOrdem({
          tx,
          ordemServicoId: ordem.id,
          ordemDiagnosticoId: diagnosticoCriado.id,
          codigoDiagnostico,
          servicos: diagnostico.servicos || []
        })
      }

      await criarServicosDaOrdem({
        tx,
        ordemServicoId: ordem.id,
        ordemDiagnosticoId: null,
        codigoDiagnostico: null,
        servicos: servicosSemDiagnostico
      })

      return tx.ordemServico.findUnique({
        where: {
          id: ordem.id
        },
        include: {
          diagnosticos: {
            include: {
              servicos: {
                include: {
                  pecas: true
                }
              }
            }
          },
          servicos: {
            include: {
              pecas: true
            }
          },
          pecas: true
        }
      })
    })

    return res.status(201).json(ordemCriada)
  } catch (error) {
    console.error('Erro ao criar ordem de serviço:', error)
    return res.status(500).json({ erro: 'Erro ao criar ordem de serviço' })
  }
}

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
      servicosSemDiagnostico = []
    } = req.body

    const ordemExistente = await prisma.ordemServico.findUnique({
      where: {
        id: Number(id)
      }
    })

    if (!ordemExistente) {
      return res.status(404).json({ erro: 'Ordem de serviço não encontrada' })
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

    const ordemAtualizada = await prisma.$transaction(async (tx) => {
      await tx.ordemPecaItem.deleteMany({
        where: {
          ordemServicoId: Number(id)
        }
      })

      await tx.ordemServicoItem.deleteMany({
        where: {
          ordemServicoId: Number(id)
        }
      })

      await tx.ordemDiagnostico.deleteMany({
        where: {
          ordemServicoId: Number(id)
        }
      })

      await tx.ordemServico.update({
        where: {
          id: Number(id)
        },
        data: {
          codigo,
          veiculoId: veiculoId ? Number(veiculoId) : ordemExistente.veiculoId,
          operadorId: operadorId ? Number(operadorId) : null,
          tecnicoId: tecnicoId ? Number(tecnicoId) : null,
          observacoes: observacoes || null,
          status: status || ordemExistente.status,
          dataFechamento: dataFechamento ? new Date(dataFechamento) : null
        }
      })

      for (
        let diagnosticoIndex = 0;
        diagnosticoIndex < diagnosticos.length;
        diagnosticoIndex++
      ) {
        const diagnostico = diagnosticos[diagnosticoIndex]

        const codigoDiagnostico = letraDiagnostico(diagnosticoIndex)

        let nomeDiagnostico =
          diagnostico.nomeDiagnostico ||
          diagnostico.descricao ||
          'Diagnóstico sem nome'

        if (diagnostico.diagnosticoCatalogoId) {
          const diagnosticoCatalogo = await tx.diagnosticoCatalogo.findUnique({
            where: {
              id: Number(diagnostico.diagnosticoCatalogoId)
            }
          })

          if (diagnosticoCatalogo) {
            nomeDiagnostico = diagnosticoCatalogo.nome
          }
        }

        const diagnosticoCriado = await tx.ordemDiagnostico.create({
          data: {
            ordemServicoId: Number(id),
            diagnosticoCatalogoId: diagnostico.diagnosticoCatalogoId
              ? Number(diagnostico.diagnosticoCatalogoId)
              : null,

            codigoVisual: codigoDiagnostico,
            codigoHierarquia: codigoDiagnostico,

            nomeDiagnostico,
            descricao: diagnostico.descricao || null,
            observacoes: diagnostico.observacoes || null
          }
        })

        await criarServicosDaOrdem({
          tx,
          ordemServicoId: Number(id),
          ordemDiagnosticoId: diagnosticoCriado.id,
          codigoDiagnostico,
          servicos: diagnostico.servicos || []
        })
      }

      await criarServicosDaOrdem({
        tx,
        ordemServicoId: Number(id),
        ordemDiagnosticoId: null,
        codigoDiagnostico: null,
        servicos: servicosSemDiagnostico
      })

      return tx.ordemServico.findUnique({
        where: {
          id: Number(id)
        },
        include: {
          diagnosticos: {
            include: {
              servicos: {
                include: {
                  pecas: true
                }
              }
            }
          },
          servicos: {
            include: {
              pecas: true
            }
          },
          pecas: true
        }
      })
    })

    return res.json(ordemAtualizada)
  } catch (error) {
    console.error('Erro ao editar ordem de serviço:', error)
    return res.status(500).json({ erro: 'Erro ao editar ordem de serviço' })
  }
}

export async function deletarOrdemServico(req, res) {
  try {
    const { id } = req.params

    const ordem = await prisma.ordemServico.findUnique({
      where: {
        id: Number(id)
      }
    })

    if (!ordem) {
      return res.status(404).json({ erro: 'Ordem de serviço não encontrada' })
    }

    await prisma.ordemServico.delete({
      where: {
        id: Number(id)
      }
    })

    return res.json({ mensagem: 'Ordem de serviço deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar ordem de serviço:', error)
    return res.status(500).json({ erro: 'Erro ao deletar ordem de serviço' })
  }
}