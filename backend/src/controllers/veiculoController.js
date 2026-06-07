import prisma from '../config/prisma.js';

// Cria um veículo associado a um cliente e valida placa/cliente antes de salvar.
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

// Lista os veículos cadastrados, incluindo o cliente dono de cada veículo.
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

// Atualiza os campos do veículo sem apagar o vínculo com o cliente.
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

// Remove um veículo depois de confirmar que ele existe.
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

// Faz busca textual de veículos para uso na criação de ordem de serviço.
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