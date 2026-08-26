import prisma from '../config/prisma.js';

function obterOficinaId(req, res) {
  const oficinaId = Number(req.user?.oficinaId);

  if (!oficinaId) {
    res.status(401).json({ erro: 'Usuário não autenticado.' });
    return null;
  }

  return oficinaId;
}

function toNumberOrNull(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  return Number(valor);
}

function toDateOrNull(valor) {
  if (!valor) return null;
  return new Date(valor);
}

function calcularTotalServico(servico) {
  const preco = Number(servico.precoVenda || 0);
  const desconto = Number(servico.desconto || 0);
  return Math.max(preco - desconto, 0);
}

function calcularTotalPeca(peca) {
  const quantidade = Number(peca.quantidade || 0);
  const custoUnitario = Number(peca.custoUnitario || 0);
  const desconto = Number(peca.desconto || 0);
  return Math.max(quantidade * custoUnitario - desconto, 0);
}

function letraDiagnostico(index) {
  return String.fromCharCode(65 + index);
}

function montarIncludeOrdemCompleta() {
  return {
    veiculo: {
      include: {
        cliente: true,
      },
    },
    diagnosticos: {
      include: {
        servicos: {
          include: {
            pecas: true,
          },
        },
        pecas: true,
      },
    },
    servicos: {
      where: {
        ordemDiagnosticoId: null,
      },
      include: {
        pecas: true,
      },
    },
    pecas: true,
  };
}

function criarErroReferencia(mensagem) {
  const error = new Error(mensagem);
  error.code = 'REFERENCIA_FORA_DA_OFICINA';
  return error;
}

async function buscarServicoCatalogo(tx, servicoCatalogoId, oficinaId) {
  if (!servicoCatalogoId) return null;

  const servico = await tx.servicoCatalogo.findFirst({
    where: {
      id: Number(servicoCatalogoId),
      oficinaId,
    },
  });

  if (!servico) {
    throw criarErroReferencia('Serviço do catálogo não encontrado nesta oficina.');
  }

  return servico;
}

async function buscarPecaCatalogo(tx, pecaCatalogoId, oficinaId) {
  if (!pecaCatalogoId) return null;

  const peca = await tx.pecaCatalogo.findFirst({
    where: {
      id: Number(pecaCatalogoId),
      oficinaId,
    },
  });

  if (!peca) {
    throw criarErroReferencia('Peça do catálogo não encontrada nesta oficina.');
  }

  return peca;
}

async function buscarDiagnosticoCatalogo(tx, diagnosticoCatalogoId, oficinaId) {
  if (!diagnosticoCatalogoId) return null;

  const diagnostico = await tx.diagnosticoCatalogo.findFirst({
    where: {
      id: Number(diagnosticoCatalogoId),
      oficinaId,
    },
  });

  if (!diagnostico) {
    throw criarErroReferencia(
      'Diagnóstico do catálogo não encontrado nesta oficina.'
    );
  }

  return diagnostico;
}

async function buscarFornecedor(tx, fornecedorId, oficinaId) {
  if (!fornecedorId) return null;

  const fornecedor = await tx.fornecedor.findFirst({
    where: {
      id: Number(fornecedorId),
      oficinaId,
    },
  });

  if (!fornecedor) {
    throw criarErroReferencia('Fornecedor não encontrado nesta oficina.');
  }

  return fornecedor;
}

async function validarUsuarioDaOficina(
  usuarioId,
  oficinaId,
  rolesPermitidas = []
) {
  if (!usuarioId) return null;

  const usuario = await prisma.usuario.findFirst({
    where: {
      id: Number(usuarioId),
      oficinaId,
      ...(rolesPermitidas.length > 0
        ? {
            Role: {
              in: rolesPermitidas,
            },
          }
        : {}),
    },
  });

  return usuario;
}

async function montarDadosDiagnostico(
  tx,
  diagnostico,
  diagnosticoIndex,
  oficinaId
) {
  const codigoDiagnostico = letraDiagnostico(diagnosticoIndex);

  let nomeDiagnostico =
    diagnostico.nomeDiagnostico ||
    diagnostico.descricao ||
    'Diagnóstico sem nome';

  const diagnosticoCatalogo = await buscarDiagnosticoCatalogo(
    tx,
    diagnostico.diagnosticoCatalogoId,
    oficinaId
  );

  if (diagnosticoCatalogo) {
    nomeDiagnostico = diagnosticoCatalogo.nome;
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
      observacoes: diagnostico.observacoes || diagnostico.observacao || null,
    },
  };
}

async function montarDadosServico({
  tx,
  servico,
  servicoIndex,
  codigoDiagnostico = null,
  oficinaId,
}) {
  const codigoVisualServico = String(servicoIndex + 1);
  const codigoHierarquiaServico = codigoDiagnostico
    ? `${codigoDiagnostico}.${servicoIndex + 1}`
    : `S.${servicoIndex + 1}`;

  let nomeServico =
    servico.nomeServico || servico.descricao || 'Serviço sem nome';

  const servicoCatalogo = await buscarServicoCatalogo(
    tx,
    servico.servicoCatalogoId,
    oficinaId
  );

  if (servicoCatalogo) {
    nomeServico = servicoCatalogo.nome;
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
      valorTotal: calcularTotalServico(servico),
    },
  };
}

async function montarDadosPeca({
  tx,
  peca,
  pecaIndex,
  codigoHierarquiaPai = null,
  oficinaId,
}) {
  const codigoVisualPeca = String(pecaIndex + 1);
  const codigoHierarquiaPeca = codigoHierarquiaPai
    ? `${codigoHierarquiaPai}.${pecaIndex + 1}`
    : `P.${pecaIndex + 1}`;

  let nomePeca = peca.nomePeca || peca.descricao || 'Peça sem nome';
  let codigoPeca = peca.codigoPeca || null;
  let fornecedorNome = peca.fornecedorNome || null;

  const pecaCatalogo = await buscarPecaCatalogo(
    tx,
    peca.pecaCatalogoId,
    oficinaId
  );

  if (pecaCatalogo) {
    nomePeca = pecaCatalogo.nome;
    codigoPeca = pecaCatalogo.codigo;
  }

  const fornecedor = await buscarFornecedor(tx, peca.fornecedorId, oficinaId);

  if (fornecedor) {
    fornecedorNome = fornecedor.nome;
  }

  return {
    data: {
      pecaCatalogoId: peca.pecaCatalogoId
        ? Number(peca.pecaCatalogoId)
        : null,
      codigoPeca,
      nomePeca,
      fornecedorId: fornecedor ? fornecedor.id : null,
      fornecedorNome,
      quantidade: Number(peca.quantidade || 1),
      custoUnitario: toNumberOrNull(peca.custoUnitario),
      desconto: toNumberOrNull(peca.desconto),
      valorTotal: calcularTotalPeca(peca),
      codigoVisual: codigoVisualPeca,
      codigoHierarquia: codigoHierarquiaPeca,
    },
  };
}

async function criarPecasDaOrdem({
  tx,
  ordemServicoId,
  ordemDiagnosticoId = null,
  ordemServicoItemId = null,
  codigoHierarquiaPai = null,
  pecas = [],
  oficinaId,
}) {
  for (let pecaIndex = 0; pecaIndex < pecas.length; pecaIndex++) {
    const peca = pecas[pecaIndex];

    const { data } = await montarDadosPeca({
      tx,
      peca,
      pecaIndex,
      codigoHierarquiaPai,
      oficinaId,
    });

    await tx.ordemPecaItem.create({
      data: {
        ordemServicoId,
        ordemDiagnosticoId,
        ordemServicoItemId,
        ...data,
      },
    });
  }
}

async function criarServicosDaOrdem({
  tx,
  ordemServicoId,
  ordemDiagnosticoId = null,
  codigoDiagnostico = null,
  servicos = [],
  oficinaId,
}) {
  for (let servicoIndex = 0; servicoIndex < servicos.length; servicoIndex++) {
    const servico = servicos[servicoIndex];

    const { codigoHierarquiaServico, data } = await montarDadosServico({
      tx,
      servico,
      servicoIndex,
      codigoDiagnostico,
      oficinaId,
    });

    const servicoCriado = await tx.ordemServicoItem.create({
      data: {
        ordemServicoId,
        ordemDiagnosticoId,
        ...data,
      },
    });

    await criarPecasDaOrdem({
      tx,
      ordemServicoId,
      ordemDiagnosticoId,
      ordemServicoItemId: servicoCriado.id,
      codigoHierarquiaPai: codigoHierarquiaServico,
      pecas: servico.pecas || [],
      oficinaId,
    });
  }
}

async function criarDiagnosticosDaOrdem({
  tx,
  ordemServicoId,
  diagnosticos = [],
  oficinaId,
}) {
  for (
    let diagnosticoIndex = 0;
    diagnosticoIndex < diagnosticos.length;
    diagnosticoIndex++
  ) {
    const diagnostico = diagnosticos[diagnosticoIndex];

    const { codigoDiagnostico, data } = await montarDadosDiagnostico(
      tx,
      diagnostico,
      diagnosticoIndex,
      oficinaId
    );

    const diagnosticoCriado = await tx.ordemDiagnostico.create({
      data: {
        ordemServicoId,
        ...data,
      },
    });

    await criarServicosDaOrdem({
      tx,
      ordemServicoId,
      ordemDiagnosticoId: diagnosticoCriado.id,
      codigoDiagnostico,
      servicos: diagnostico.servicos || [],
      oficinaId,
    });
  }
}

async function recriarItensDaOrdem({
  tx,
  ordemServicoId,
  diagnosticos = [],
  servicosSemDiagnostico = [],
  pecasAvulsas = [],
  oficinaId,
}) {
  await criarDiagnosticosDaOrdem({
    tx,
    ordemServicoId,
    diagnosticos,
    oficinaId,
  });

  await criarServicosDaOrdem({
    tx,
    ordemServicoId,
    ordemDiagnosticoId: null,
    codigoDiagnostico: null,
    servicos: servicosSemDiagnostico,
    oficinaId,
  });

  await criarPecasDaOrdem({
    tx,
    ordemServicoId,
    ordemDiagnosticoId: null,
    ordemServicoItemId: null,
    codigoHierarquiaPai: null,
    pecas: pecasAvulsas,
    oficinaId,
  });
}

async function limparItensDaOrdem(tx, ordemServicoId) {
  await tx.ordemPecaItem.deleteMany({
    where: { ordemServicoId },
  });

  await tx.ordemServicoItem.deleteMany({
    where: { ordemServicoId },
  });

  await tx.ordemDiagnostico.deleteMany({
    where: { ordemServicoId },
  });
}

async function buscarOrdemCompleta(tx, id, oficinaId) {
  return tx.ordemServico.findFirst({
    where: {
      id: Number(id),
      oficinaId,
    },
    include: montarIncludeOrdemCompleta(),
  });
}

function montarResumoBusca(ordem) {
  const totalServicos = ordem.servicos.reduce((acc, servico) => {
    return acc + Number(servico.valorTotal || 0);
  }, 0);

  const totalPecas = ordem.pecas.reduce((acc, peca) => {
    return acc + Number(peca.valorTotal || 0);
  }, 0);

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
      ano_fabricacao: ordem.veiculo?.ano_fabricacao || null,
    },
    quantidadeDiagnosticos: ordem.diagnosticos.length,
    quantidadeServicos: ordem.servicos.length,
    quantidadePecas: ordem.pecas.length,
    totalServicos,
    totalPecas,
    totalGeral: totalServicos + totalPecas,
  };
}

export async function listarOrdensServico(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const ordens = await prisma.ordemServico.findMany({
      where: { oficinaId },
      orderBy: {
        createdAt: 'desc',
      },
      include: montarIncludeOrdemCompleta(),
    });

    return res.json(ordens);
  } catch (error) {
    console.error('Erro ao listar ordens de serviço:', error);
    return res.status(500).json({
      erro: 'Erro ao listar ordens de serviço',
      detalhe: error.message,
    });
  }
}

export async function buscarOrdemServicoPorId(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const ordem = await buscarOrdemCompleta(
      prisma,
      Number(req.params.id),
      oficinaId
    );

    if (!ordem) {
      return res.status(404).json({ erro: 'Ordem de serviço não encontrada' });
    }

    return res.json(ordem);
  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error);
    return res.status(500).json({
      erro: 'Erro ao buscar ordem de serviço',
      detalhe: error.message,
    });
  }
}

export async function criarOrdemServico(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const {
      codigo,
      veiculoId,
      operadorId,
      tecnicoId,
      observacoes,
      status,
      diagnosticos = [],
      servicosSemDiagnostico = [],
      pecasAvulsas = [],
    } = req.body;

    if (!codigo?.trim() || !veiculoId) {
      return res.status(400).json({
        erro: 'Código e veículo são obrigatórios',
      });
    }

    const codigoNormalizado = codigo.trim();

    const ordemExistente = await prisma.ordemServico.findFirst({
      where: {
        oficinaId,
        codigo: codigoNormalizado,
      },
    });

    if (ordemExistente) {
      return res.status(409).json({
        erro: 'Já existe uma ordem de serviço com esse código nesta oficina',
      });
    }

    const veiculoExiste = await prisma.veiculo.findFirst({
      where: {
        id: Number(veiculoId),
        oficinaId,
      },
    });

    if (!veiculoExiste) {
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    const operadorIdFinal = operadorId ? Number(operadorId) : Number(req.user.id);

    const operador = await validarUsuarioDaOficina(
      operadorIdFinal,
      oficinaId,
      ['OWNER', 'ADMIN', 'OPERADOR']
    );

    if (!operador) {
      return res.status(400).json({
        erro: 'Operador informado não pertence a esta oficina.',
      });
    }

    let tecnicoIdFinal = null;

    if (tecnicoId) {
      const tecnico = await validarUsuarioDaOficina(tecnicoId, oficinaId, [
        'TECNICO',
      ]);

      if (!tecnico) {
        return res.status(400).json({
          erro: 'Técnico informado não pertence a esta oficina.',
        });
      }

      tecnicoIdFinal = tecnico.id;
    }

    const ordemCriada = await prisma.$transaction(async (tx) => {
      const ordem = await tx.ordemServico.create({
        data: {
          oficinaId,
          codigo: codigoNormalizado,
          veiculoId: veiculoExiste.id,
          operadorId: operador.id,
          tecnicoId: tecnicoIdFinal,
          observacoes: observacoes || null,
          status: status || 'ABERTA',
        },
      });

      await recriarItensDaOrdem({
        tx,
        ordemServicoId: ordem.id,
        diagnosticos,
        servicosSemDiagnostico,
        pecasAvulsas,
        oficinaId,
      });

      return buscarOrdemCompleta(tx, ordem.id, oficinaId);
    });

    return res.status(201).json(ordemCriada);
  } catch (error) {
    console.error('Erro ao criar ordem de serviço:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe uma ordem de serviço com esse código nesta oficina.',
      });
    }

    if (error.code === 'REFERENCIA_FORA_DA_OFICINA') {
      return res.status(400).json({ erro: error.message });
    }

    return res.status(500).json({
      erro: 'Erro ao criar ordem de serviço',
      detalhe: error.message,
    });
  }
}

export async function editarOrdemServico(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

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
      pecasAvulsas = [],
    } = req.body;

    const ordemExistente = await prisma.ordemServico.findFirst({
      where: {
        id,
        oficinaId,
      },
    });

    if (!ordemExistente) {
      return res.status(404).json({ erro: 'Ordem de serviço não encontrada' });
    }

    const codigoFinal = codigo?.trim() || ordemExistente.codigo;

    if (codigoFinal !== ordemExistente.codigo) {
      const codigoDuplicado = await prisma.ordemServico.findFirst({
        where: {
          oficinaId,
          codigo: codigoFinal,
          id: { not: id },
        },
      });

      if (codigoDuplicado) {
        return res.status(409).json({
          erro: 'Já existe uma ordem de serviço com esse código nesta oficina',
        });
      }
    }

    let veiculoIdFinal = ordemExistente.veiculoId;

    if (veiculoId) {
      const veiculoExiste = await prisma.veiculo.findFirst({
        where: {
          id: Number(veiculoId),
          oficinaId,
        },
      });

      if (!veiculoExiste) {
        return res.status(404).json({ erro: 'Veículo não encontrado' });
      }

      veiculoIdFinal = veiculoExiste.id;
    }

    let operadorIdFinal = ordemExistente.operadorId;

    if (operadorId !== undefined) {
      if (operadorId === null || operadorId === '') {
        operadorIdFinal = null;
      } else {
        const operador = await validarUsuarioDaOficina(
          operadorId,
          oficinaId,
          ['OWNER', 'ADMIN', 'OPERADOR']
        );

        if (!operador) {
          return res.status(400).json({
            erro: 'Operador informado não pertence a esta oficina.',
          });
        }

        operadorIdFinal = operador.id;
      }
    }

    let tecnicoIdFinal = ordemExistente.tecnicoId;

    if (tecnicoId !== undefined) {
      if (tecnicoId === null || tecnicoId === '') {
        tecnicoIdFinal = null;
      } else {
        const tecnico = await validarUsuarioDaOficina(tecnicoId, oficinaId, [
          'TECNICO',
        ]);

        if (!tecnico) {
          return res.status(400).json({
            erro: 'Técnico informado não pertence a esta oficina.',
          });
        }

        tecnicoIdFinal = tecnico.id;
      }
    }

    const ordemAtualizada = await prisma.$transaction(async (tx) => {
      await limparItensDaOrdem(tx, id);

      await tx.ordemServico.update({
        where: { id },
        data: {
          codigo: codigoFinal,
          veiculoId: veiculoIdFinal,
          operadorId: operadorIdFinal,
          tecnicoId: tecnicoIdFinal,
          observacoes:
            observacoes !== undefined
              ? observacoes || null
              : ordemExistente.observacoes,
          status: status || ordemExistente.status,
          dataFechamento:
            dataFechamento !== undefined
              ? toDateOrNull(dataFechamento)
              : ordemExistente.dataFechamento,
        },
      });

      await recriarItensDaOrdem({
        tx,
        ordemServicoId: id,
        diagnosticos,
        servicosSemDiagnostico,
        pecasAvulsas,
        oficinaId,
      });

      return buscarOrdemCompleta(tx, id, oficinaId);
    });

    return res.json(ordemAtualizada);
  } catch (error) {
    console.error('Erro ao editar ordem de serviço:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe uma ordem de serviço com esse código nesta oficina.',
      });
    }

    if (error.code === 'REFERENCIA_FORA_DA_OFICINA') {
      return res.status(400).json({ erro: error.message });
    }

    return res.status(500).json({
      erro: 'Erro ao editar ordem de serviço',
      detalhe: error.message,
    });
  }
}

export async function deletarOrdemServico(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

    const ordem = await prisma.ordemServico.findFirst({
      where: {
        id,
        oficinaId,
      },
    });

    if (!ordem) {
      return res.status(404).json({ erro: 'Ordem de serviço não encontrada' });
    }

    await prisma.$transaction(async (tx) => {
      await limparItensDaOrdem(tx, id);
      await tx.ordemServico.delete({ where: { id } });
    });

    return res.json({ mensagem: 'Ordem de serviço deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar ordem de serviço:', error);
    return res.status(500).json({
      erro: 'Erro ao deletar ordem de serviço',
      detalhe: error.message,
    });
  }
}

export async function gerarProximoCodigoOS(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const ordens = await prisma.ordemServico.findMany({
      where: {
        oficinaId,
        codigo: {
          startsWith: 'OS-',
        },
      },
      select: {
        codigo: true,
      },
    });

    const maiorNumero = ordens.reduce((maior, ordem) => {
      const match = /^OS-(\d+)$/.exec(ordem.codigo);
      if (!match) return maior;

      const numero = Number(match[1]);
      return numero > maior ? numero : maior;
    }, 0);

    const codigo = `OS-${String(maiorNumero + 1).padStart(4, '0')}`;

    return res.json({ codigo });
  } catch (error) {
    console.error('Erro ao gerar código da OS:', error);
    return res.status(500).json({
      erro: 'Erro ao gerar código da OS',
      detalhe: error.message,
    });
  }
}

export async function buscarOrdensServico(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const { termo, status, dataInicio, dataFim } = req.query;
    const filtros = [{ oficinaId }];

    if (termo) {
      filtros.push({
        OR: [
          {
            codigo: {
              contains: termo,
              mode: 'insensitive',
            },
          },
          {
            veiculo: {
              placa: {
                contains: termo,
                mode: 'insensitive',
              },
            },
          },
          {
            veiculo: {
              modelo: {
                contains: termo,
                mode: 'insensitive',
              },
            },
          },
          {
            veiculo: {
              fabricante: {
                contains: termo,
                mode: 'insensitive',
              },
            },
          },
          {
            veiculo: {
              cliente: {
                nome: {
                  contains: termo,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      });
    }

    if (status) {
      filtros.push({ status });
    }

    if (dataInicio || dataFim) {
      const filtroData = {};

      if (dataInicio) {
        filtroData.gte = new Date(`${dataInicio}T00:00:00`);
      }

      if (dataFim) {
        filtroData.lte = new Date(`${dataFim}T23:59:59`);
      }

      filtros.push({ dataEmissao: filtroData });
    }

    const ordens = await prisma.ordemServico.findMany({
      where: {
        AND: filtros,
      },
      orderBy: {
        dataEmissao: 'desc',
      },
      include: {
        veiculo: {
          include: {
            cliente: true,
          },
        },
        diagnosticos: true,
        servicos: true,
        pecas: true,
      },
    });

    const resultado = ordens.map((ordem) => montarResumoBusca(ordem));

    return res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar ordens de serviço:', error);
    return res.status(500).json({
      erro: 'Erro ao buscar ordens de serviço',
      detalhe: error.message,
    });
  }
}
