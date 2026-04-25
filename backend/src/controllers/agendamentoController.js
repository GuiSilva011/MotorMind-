import prisma from '../config/prisma.js';

export async function criarAgendamento(req, res) {
  try {
    const {
      clienteId,
      veiculoId,
      dataHora,
      mecanico,
      tipo_servico,
      servico,
      status
    } = req.body;

    if (!clienteId || !veiculoId || !dataHora || !servico) {
      return res.status(400).json({
        erro: 'Cliente, veículo, data/hora e serviço são obrigatórios.'
      });
    }

    const agendamento = await prisma.agendamento.create({
      data: {
        clienteId: Number(clienteId),
        veiculoId: Number(veiculoId),
        dataHora: new Date(dataHora),
        mecanico: mecanico || null,
        tipo_servico: tipo_servico || null,
        servico,
        status: status || 'AGENDADO'
      },
      include: {
        cliente: true,
        veiculo: true
      }
    });

    return res.status(201).json(agendamento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao criar agendamento.' });
  }
}

export async function listarAgendamentos(req, res) {
  try {
    const agendamentos = await prisma.agendamento.findMany({
      include: {
        cliente: true,
        veiculo: true
      },
      orderBy: {
        dataHora: 'asc'
      }
    });

    return res.json(agendamentos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao listar agendamentos.' });
  }
}

export async function buscarAgendamentoPorId(req, res) {
  try {
    const { id } = req.params;

    const agendamento = await prisma.agendamento.findUnique({
      where: {
        id: Number(id)
      },
      include: {
        cliente: true,
        veiculo: true
      }
    });

    if (!agendamento) {
      return res.status(404).json({ erro: 'Agendamento não encontrado.' });
    }

    return res.json(agendamento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao buscar agendamento.' });
  }
}

export async function editarAgendamento(req, res) {
  try {
    const { id } = req.params;

    const {
      clienteId,
      veiculoId,
      dataHora,
      mecanico,
      tipo_servico,
      servico,
      status
    } = req.body;

    const agendamento = await prisma.agendamento.update({
      where: {
        id: Number(id)
      },
      data: {
        clienteId: clienteId ? Number(clienteId) : undefined,
        veiculoId: veiculoId ? Number(veiculoId) : undefined,
        dataHora: dataHora ? new Date(dataHora) : undefined,
        mecanico,
        tipo_servico,
        servico,
        status
      },
      include: {
        cliente: true,
        veiculo: true
      }
    });

    return res.json(agendamento);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao editar agendamento.' });
  }
}

export async function deletarAgendamento(req, res) {
  try {
    const { id } = req.params;

    await prisma.agendamento.delete({
      where: {
        id: Number(id)
      }
    });

    return res.json({ mensagem: 'Agendamento deletado com sucesso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: 'Erro ao deletar agendamento.' });
  }
}