import prisma from '../config/prisma.js'

export async function criarVeiculo(req, res) {
  try {
    const { clienteId, placa, chassi, marca, modelo, ano, anoModelo } = req.body;
    console.log(req.body);

    const veiculo = await prisma.veiculo.create({
      data: {
        clienteId: Number(clienteId),
        placa,
        chassi: chassi || null,
        marca: marca || null,
        modelo: modelo || null,
        ano: ano ? Number(ano) : null,
        anoModelo: anoModelo ? Number(anoModelo) : null
      }
    });

    res.status(201).json(veiculo);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: 'Falha ao criar veiculo' });
  }
}

export async function listarVeiculo(req, res) {
  try {
    const veiculo = await prisma.veiculo.findMany({
      include: {
        cliente: true
      }
    });

    res.json(veiculo);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: 'Erro ao exibir veiculo' });
  }
}

export async function editarVeiculo(req, res) {
  try {
    const { id } = req.params;
    const { clienteId, placa, chassi, marca, modelo, ano, anoModelo } = req.body;
    console.log(req.body);

    const veiculo = await prisma.veiculo.update({
      where: { id: Number(id) },
      data: {
        clienteId: Number(clienteId),
        placa,
        chassi: chassi || null,
        marca: marca || null,
        modelo: modelo || null,
        ano: ano ? Number(ano) : null,
        anoModelo: anoModelo ? Number(anoModelo) : null
      }
    });

    res.json(veiculo);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: 'Erro ao atualizar o veiculo' });
  }
}

export async function deletarVeiculo(req, res) {
  try {
    const { id } = req.params;

    await prisma.veiculo.delete({
      where: { id: Number(id) }
    });

    res.json({ mensagem: 'Veiculo deletado com sucesso' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: 'Erro ao deletar Veiculo' });
  }
}