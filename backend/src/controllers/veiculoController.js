import prisma from '../config/prisma.js'

export async function criarVeiculo(req, res) {
  try {
    const { clienteId, placa,modelo,chassi,fabricante, ano_modelo, ano_fabricacao, motor, km, cor,ar } = req.body;
    console.log(req.body);

    const veiculo = await prisma.veiculo.create({
      data: {
        clienteId: Number(clienteId),
        placa,
        modelo: modelo || null,
        chassi: chassi || null,
        fabricante: fabricante || null,
        ano_modelo: ano_modelo ? Number(ano_modelo) : null,
        ano_fabricacao: ano_fabricacao ? Number(ano_fabricacao) : null,
        motor: motor || null,
        km: km || null,
        cor: cor || null,
        ar: ar !== undefined ? ar : null
      }
    });

    res.status(201).json(veiculo);
  } catch (error) {
    console.log(error);
    res.status(500).json({erro : "Falha ao cadastrar veiculo"});
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
    const { clienteId, placa,modelo,chassi,fabricante, ano_modelo, ano_fabricacao, motor, km, cor,ar} = req.body;
    console.log(req.body);

    const veiculo = await prisma.veiculo.update({
      where: { id: Number(id) },
      data: {
        clienteId: Number(clienteId),
        placa,
        modelo: modelo || null,
        chassi: chassi || null,
        fabricante: fabricante || null,
        ano_modelo: ano_modelo ? Number(ano_modelo) : null,
        ano_fabricacao: ano_fabricacao ? Number(ano_fabricacao) : null,
        motor: motor || null,
        km: km || null,
        cor: cor || null,
        ar: ar !== undefined ? ar : null
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