import prisma from '../config/prisma.js';

function obterOficinaId(req, res) {
  const oficinaId = Number(req.user?.oficinaId);

  if (!oficinaId) {
    res.status(401).json({ erro: 'Usuário não autenticado.' });
    return null;
  }

  return oficinaId;
}

function normalizarKm(km) {
  if (km === undefined || km === null || km === '') return null;
  return String(km);
}

export async function criarVeiculo(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

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

    if (!clienteId) {
      return res.status(400).json({ erro: 'Cliente é obrigatório' });
    }

    if (!placa?.trim()) {
      return res.status(400).json({ erro: 'Placa é obrigatória' });
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id: Number(clienteId),
        oficinaId,
      },
    });

    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado.' });
    }

    const veiculo = await prisma.veiculo.create({
      data: {
        oficinaId,
        clienteId: cliente.id,
        placa: placa.trim().toUpperCase(),
        modelo: modelo?.trim() || null,
        chassi: chassi?.trim() || null,
        fabricante: fabricante?.trim() || null,
        ano_modelo: ano_modelo ? Number(ano_modelo) : null,
        ano_fabricacao: ano_fabricacao ? Number(ano_fabricacao) : null,
        motor: motor?.trim() || null,
        km: normalizarKm(km),
        cor: cor?.trim() || null,
        ar: ar !== undefined ? ar : null,
        cambio: Cambio?.trim() || cambio?.trim() || null,
      },
      include: {
        cliente: true,
      },
    });

    return res.status(201).json(veiculo);
  } catch (error) {
    console.error('Erro ao cadastrar veículo:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe um veículo cadastrado com esta placa nesta oficina.',
      });
    }

    return res.status(500).json({ erro: 'Falha ao cadastrar veículo' });
  }
}

export async function listarVeiculo(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const veiculos = await prisma.veiculo.findMany({
      where: { oficinaId },
      include: {
        cliente: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(veiculos);
  } catch (error) {
    console.error('Erro ao exibir veículo:', error);
    return res.status(500).json({ erro: 'Erro ao exibir veículo' });
  }
}

export async function editarVeiculo(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

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

    const veiculoExistente = await prisma.veiculo.findFirst({
      where: { id, oficinaId },
    });

    if (!veiculoExistente) {
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    let clienteIdFinal = veiculoExistente.clienteId;

    if (clienteId) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          id: Number(clienteId),
          oficinaId,
        },
      });

      if (!cliente) {
        return res.status(404).json({ erro: 'Cliente não encontrado.' });
      }

      clienteIdFinal = cliente.id;
    }

    const veiculo = await prisma.veiculo.update({
      where: { id },
      data: {
        clienteId: clienteIdFinal,
        placa: placa?.trim().toUpperCase() || veiculoExistente.placa,
        modelo:
          modelo !== undefined ? modelo?.trim() || null : veiculoExistente.modelo,
        chassi:
          chassi !== undefined ? chassi?.trim() || null : veiculoExistente.chassi,
        fabricante:
          fabricante !== undefined
            ? fabricante?.trim() || null
            : veiculoExistente.fabricante,
        ano_modelo:
          ano_modelo !== undefined
            ? ano_modelo !== ''
              ? Number(ano_modelo)
              : null
            : veiculoExistente.ano_modelo,
        ano_fabricacao:
          ano_fabricacao !== undefined
            ? ano_fabricacao !== ''
              ? Number(ano_fabricacao)
              : null
            : veiculoExistente.ano_fabricacao,
        motor:
          motor !== undefined ? motor?.trim() || null : veiculoExistente.motor,
        km: km !== undefined ? normalizarKm(km) : veiculoExistente.km,
        cor: cor !== undefined ? cor?.trim() || null : veiculoExistente.cor,
        ar: ar !== undefined ? ar : veiculoExistente.ar,
        cambio:
          Cambio !== undefined || cambio !== undefined
            ? Cambio?.trim() || cambio?.trim() || null
            : veiculoExistente.cambio,
      },
      include: {
        cliente: true,
      },
    });

    return res.json(veiculo);
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe outro veículo cadastrado com esta placa nesta oficina.',
      });
    }

    return res.status(500).json({ erro: 'Erro ao atualizar o veículo' });
  }
}

export async function deletarVeiculo(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

    const veiculo = await prisma.veiculo.findFirst({
      where: { id, oficinaId },
    });

    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    await prisma.veiculo.delete({ where: { id } });

    return res.json({ mensagem: 'Veículo deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar veículo:', error);

    if (error.code === 'P2003') {
      return res.status(409).json({
        erro: 'Este veículo não pode ser removido porque possui registros vinculados.',
      });
    }

    return res.status(500).json({ erro: 'Erro ao deletar veículo' });
  }
}

export async function buscarVeiculosParaOS(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const termo = req.query.termo?.trim();

    if (!termo) {
      return res.status(400).json({ erro: 'Termo de busca é obrigatório' });
    }

    const veiculos = await prisma.veiculo.findMany({
      where: {
        oficinaId,
        OR: [
          { placa: { contains: termo, mode: 'insensitive' } },
          { modelo: { contains: termo, mode: 'insensitive' } },
          { fabricante: { contains: termo, mode: 'insensitive' } },
          { cambio: { contains: termo, mode: 'insensitive' } },
          {
            cliente: {
              nome: { contains: termo, mode: 'insensitive' },
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
