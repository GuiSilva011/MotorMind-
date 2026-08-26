import prisma from '../config/prisma.js';

function obterOficinaId(req, res) {
  const oficinaId = Number(req.user?.oficinaId);

  if (!oficinaId) {
    res.status(401).json({ erro: 'Usuário não autenticado.' });
    return null;
  }

  return oficinaId;
}

function montarDadosVeiculo(veiculo) {
  return {
    placa: veiculo.placa?.trim().toUpperCase(),
    modelo: veiculo.modelo?.trim() || null,
    chassi: veiculo.chassi?.trim() || null,
    fabricante: veiculo.fabricante?.trim() || null,
    ano_modelo: veiculo.ano_modelo ? Number(veiculo.ano_modelo) : null,
    ano_fabricacao: veiculo.ano_fabricacao
      ? Number(veiculo.ano_fabricacao)
      : null,
    motor: veiculo.motor?.trim() || null,
    km:
      veiculo.km !== undefined && veiculo.km !== null && veiculo.km !== ''
        ? String(veiculo.km)
        : null,
    cor: veiculo.cor?.trim() || null,
    ar: veiculo.ar !== undefined ? veiculo.ar : null,
    cambio: veiculo.Cambio?.trim() || veiculo.cambio?.trim() || null,
  };
}

export async function criarCliente(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const {
      nome,
      cpf,
      email,
      dataNascimento,
      cep,
      endereco,
      bairro,
      cidade,
      uf,
      numero,
      complemento,
      celular,
      veiculos = [],
    } = req.body;

    if (!nome?.trim()) {
      return res.status(400).json({ erro: 'Nome é obrigatório.' });
    }

    const cliente = await prisma.$transaction(async (tx) => {
      const clienteCriado = await tx.cliente.create({
        data: {
          oficinaId,
          nome: nome.trim(),
          cpf: cpf?.trim() || null,
          email: email?.trim() || null,
          dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
          cep: cep?.trim() || null,
          endereco: endereco?.trim() || null,
          bairro: bairro?.trim() || null,
          cidade: cidade?.trim() || null,
          uf: uf?.trim() || null,
          numero: numero?.trim() || null,
          complemento: complemento?.trim() || null,
          celular: celular?.trim() || null,
        },
      });

      for (const veiculo of Array.isArray(veiculos) ? veiculos : []) {
        if (veiculo._remover || !veiculo.placa?.trim()) continue;

        await tx.veiculo.create({
          data: {
            oficinaId,
            clienteId: clienteCriado.id,
            ...montarDadosVeiculo(veiculo),
          },
        });
      }

      return tx.cliente.findFirst({
        where: {
          id: clienteCriado.id,
          oficinaId,
        },
        include: {
          veiculos: true,
        },
      });
    });

    return res.status(201).json(cliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe um veículo cadastrado com esta placa nesta oficina.',
      });
    }

    return res.status(500).json({ erro: 'Falha ao criar cliente' });
  }
}

export async function buscarClientePorNome(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const nome = req.query.nome?.trim();

    if (!nome) {
      return res.status(400).json({ erro: 'Informe o nome para busca' });
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        oficinaId,
        nome: {
          equals: nome,
          mode: 'insensitive',
        },
      },
      include: {
        veiculos: true,
      },
    });

    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    return res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente por nome:', error);
    return res.status(500).json({ erro: 'Erro ao buscar cliente por nome' });
  }
}

export async function listarClientes(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const clientes = await prisma.cliente.findMany({
      where: { oficinaId },
      include: {
        veiculos: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(clientes);
  } catch (error) {
    console.error('Erro ao exibir clientes:', error);
    return res.status(500).json({ erro: 'Erro ao exibir clientes' });
  }
}

export async function editarClientes(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const clienteId = Number(req.params.id);

    if (!clienteId) {
      return res.status(400).json({ erro: 'ID do cliente inválido.' });
    }

    const {
      nome,
      cpf,
      email,
      dataNascimento,
      cep,
      endereco,
      bairro,
      cidade,
      uf,
      numero,
      complemento,
      celular,
      veiculos,
    } = req.body;

    const clienteExistente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        oficinaId,
      },
      include: {
        veiculos: true,
      },
    });

    if (!clienteExistente) {
      return res.status(404).json({ erro: 'Cliente não encontrado.' });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      await tx.cliente.update({
        where: { id: clienteId },
        data: {
          nome: nome !== undefined ? nome?.trim() || clienteExistente.nome : clienteExistente.nome,
          cpf: cpf !== undefined ? cpf?.trim() || null : clienteExistente.cpf,
          email:
            email !== undefined ? email?.trim() || null : clienteExistente.email,
          dataNascimento:
            dataNascimento !== undefined
              ? dataNascimento
                ? new Date(dataNascimento)
                : null
              : clienteExistente.dataNascimento,
          cep: cep !== undefined ? cep?.trim() || null : clienteExistente.cep,
          endereco:
            endereco !== undefined
              ? endereco?.trim() || null
              : clienteExistente.endereco,
          bairro:
            bairro !== undefined ? bairro?.trim() || null : clienteExistente.bairro,
          cidade:
            cidade !== undefined ? cidade?.trim() || null : clienteExistente.cidade,
          uf: uf !== undefined ? uf?.trim() || null : clienteExistente.uf,
          numero:
            numero !== undefined ? numero?.trim() || null : clienteExistente.numero,
          complemento:
            complemento !== undefined
              ? complemento?.trim() || null
              : clienteExistente.complemento,
          celular:
            celular !== undefined
              ? celular?.trim() || null
              : clienteExistente.celular,
        },
      });

      if (Array.isArray(veiculos)) {
        for (const veiculo of veiculos) {
          const veiculoId = veiculo.id ? Number(veiculo.id) : null;

          if (veiculo._remover === true) {
            if (!veiculoId) continue;

            const veiculoParaExcluir = await tx.veiculo.findFirst({
              where: {
                id: veiculoId,
                oficinaId,
                clienteId,
              },
            });

            if (!veiculoParaExcluir) {
              const erro = new Error('Veículo não encontrado para este cliente.');
              erro.code = 'VEICULO_NAO_PERTENCE_CLIENTE';
              throw erro;
            }

            await tx.veiculo.delete({ where: { id: veiculoId } });
            continue;
          }

          if (!veiculo.placa?.trim() && !veiculoId) continue;

          const dadosVeiculo = montarDadosVeiculo(veiculo);

          if (veiculoId) {
            const veiculoExistente = await tx.veiculo.findFirst({
              where: {
                id: veiculoId,
                oficinaId,
              },
            });

            if (!veiculoExistente || veiculoExistente.clienteId !== clienteId) {
              const erro = new Error(
                'Este veículo não pertence ao cliente informado.'
              );
              erro.code = 'VEICULO_NAO_PERTENCE_CLIENTE';
              throw erro;
            }

            await tx.veiculo.update({
              where: { id: veiculoId },
              data: dadosVeiculo,
            });

            continue;
          }

          const placa = dadosVeiculo.placa;

          const veiculoExistentePorPlaca = placa
            ? await tx.veiculo.findFirst({
                where: {
                  oficinaId,
                  placa,
                },
              })
            : null;

          if (
            veiculoExistentePorPlaca &&
            veiculoExistentePorPlaca.clienteId === clienteId
          ) {
            await tx.veiculo.update({
              where: { id: veiculoExistentePorPlaca.id },
              data: dadosVeiculo,
            });
            continue;
          }

          if (veiculoExistentePorPlaca) {
            const erro = new Error(
              'Já existe um veículo cadastrado com esta placa para outro cliente.'
            );
            erro.code = 'PLACA_OUTRO_CLIENTE';
            throw erro;
          }

          await tx.veiculo.create({
            data: {
              oficinaId,
              clienteId,
              ...dadosVeiculo,
            },
          });
        }
      }

      return tx.cliente.findFirst({
        where: {
          id: clienteId,
          oficinaId,
        },
        include: {
          veiculos: true,
        },
      });
    });

    return res.json(resultado);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe um veículo cadastrado com esta placa nesta oficina.',
      });
    }

    if (error.code === 'PLACA_OUTRO_CLIENTE') {
      return res.status(409).json({ erro: error.message });
    }

    if (error.code === 'VEICULO_NAO_PERTENCE_CLIENTE') {
      return res.status(403).json({ erro: error.message });
    }

    if (
      error.code === 'P2003' ||
      String(error.message || '').includes('OrdemServico_veiculoId_fkey') ||
      String(error.message || '').includes('Checklist_veiculoId_fkey') ||
      String(error.message || '').includes('Agendamento_veiculoId_fkey')
    ) {
      return res.status(409).json({
        erro: 'Este veículo não pode ser removido porque já possui ordem de serviço, checklist ou agendamento vinculado.',
      });
    }

    return res.status(500).json({
      erro: 'Erro ao atualizar o cliente.',
      detalhe: error.message,
    });
  }
}

export async function deletarClientes(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const clienteId = Number(req.params.id);

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: clienteId,
        oficinaId,
      },
      include: {
        veiculos: true,
      },
    });

    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.veiculo.deleteMany({
        where: {
          clienteId,
          oficinaId,
        },
      });

      await tx.cliente.delete({
        where: { id: clienteId },
      });
    });

    return res.json({ mensagem: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);

    if (error.code === 'P2003') {
      return res.status(409).json({
        erro: 'Este cliente não pode ser removido porque possui registros vinculados.',
      });
    }

    return res.status(500).json({ erro: 'Erro ao deletar cliente' });
  }
}
