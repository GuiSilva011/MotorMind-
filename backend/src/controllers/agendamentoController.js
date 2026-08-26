import prisma from '../config/prisma.js';

function obterOficinaId(req, res) {
  const oficinaId = Number(req.user?.oficinaId);

  if (!oficinaId) {
    res.status(401).json({ erro: 'Usuário não autenticado.' });
    return null;
  }

  return oficinaId;
}

async function validarClienteVeiculo(oficinaId, clienteId, veiculoId) {
  const cliente = await prisma.cliente.findFirst({
    where: {
      id: Number(clienteId),
      oficinaId,
    },
  });

  if (!cliente) {
    return { erro: 'Cliente não encontrado.' };
  }

  const veiculo = await prisma.veiculo.findFirst({
    where: {
      id: Number(veiculoId),
      oficinaId,
    },
  });

  if (!veiculo) {
    return { erro: 'Veículo não encontrado.' };
  }

  if (veiculo.clienteId !== cliente.id) {
    return { erro: 'O veículo não pertence ao cliente informado.' };
  }

  return { cliente, veiculo };
}

export async function criarAgendamento(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const {
      clienteId,
      veiculoId,
      dataHora,
      mecanico,
      tipo_servico,
      servico,
      status,
    } = req.body;

    if (!clienteId || !veiculoId || !dataHora || !servico) {
      return res.status(400).json({
        erro: 'Cliente, veículo, data/hora e serviço são obrigatórios.',
      });
    }

    const validacao = await validarClienteVeiculo(
      oficinaId,
      clienteId,
      veiculoId
    );

    if (validacao.erro) {
      return res.status(404).json({ erro: validacao.erro });
    }

    const agendamento = await prisma.agendamento.create({
      data: {
        oficinaId,
        clienteId: Number(clienteId),
        veiculoId: Number(veiculoId),
        dataHora: new Date(dataHora),
        mecanico: mecanico || null,
        tipo_servico: tipo_servico || null,
        servico,
        status: status || 'AGENDADO',
      },
      include: {
        cliente: true,
        veiculo: true,
      },
    });

    return res.status(201).json(agendamento);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    return res.status(500).json({ erro: 'Erro ao criar agendamento.' });
  }
}

export async function listarAgendamentos(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        oficinaId,
      },
      include: {
        cliente: true,
        veiculo: true,
      },
      orderBy: {
        dataHora: 'asc',
      },
    });

    return res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    return res.status(500).json({ erro: 'Erro ao listar agendamentos.' });
  }
}

export async function buscarAgendamentoPorId(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id: Number(req.params.id),
        oficinaId,
      },
      include: {
        cliente: true,
        veiculo: true,
      },
    });

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    return res.json(agendamento);
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    return res.status(500).json({ erro: 'Erro ao buscar agendamento.' });
  }
}

export async function editarAgendamento(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

    const agendamentoExistente = await prisma.agendamento.findFirst({
      where: {
        id,
        oficinaId,
      },
    });

    if (!agendamentoExistente) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    const {
      clienteId,
      veiculoId,
      dataHora,
      mecanico,
      tipo_servico,
      servico,
      status,
    } = req.body;

    const clienteIdFinal = clienteId
      ? Number(clienteId)
      : agendamentoExistente.clienteId;

    const veiculoIdFinal = veiculoId
      ? Number(veiculoId)
      : agendamentoExistente.veiculoId;

    const validacao = await validarClienteVeiculo(
      oficinaId,
      clienteIdFinal,
      veiculoIdFinal
    );

    if (validacao.erro) {
      return res.status(404).json({ erro: validacao.erro });
    }

    const agendamento = await prisma.agendamento.update({
      where: {
        id,
      },
      data: {
        clienteId: clienteIdFinal,
        veiculoId: veiculoIdFinal,
        dataHora: dataHora ? new Date(dataHora) : undefined,
        mecanico,
        tipo_servico,
        servico,
        status,
      },
      include: {
        cliente: true,
        veiculo: true,
      },
    });

    return res.json(agendamento);
  } catch (error) {
    console.error('Erro ao editar agendamento:', error);
    return res.status(500).json({ erro: 'Erro ao editar agendamento.' });
  }
}

export async function deletarAgendamento(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id,
        oficinaId,
      },
    });

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    await prisma.agendamento.delete({
      where: {
        id,
      },
    });

    return res.json({ mensagem: 'Agendamento deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    return res.status(500).json({ erro: 'Erro ao deletar agendamento.' });
  }
}
