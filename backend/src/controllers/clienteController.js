import prisma from '../config/prisma.js'

// TODO O CRUD DO CLIENTE
export async function criarCliente(req, res) {
  try {
    const { nome, cpf, email, dataNascimento, cep, endereco,  bairro, cidade, uf, numero,complemento, celular, veiculos} = req.body;

    console.log(req.body);

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        cpf,
        email,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        cep,
        endereco,
        bairro,
        cidade,
        uf,
        numero,
        complemento,
        celular
      }
    });

    if (veiculos && veiculos.length > 0) {
      for (const veiculo of veiculos) {
        await prisma.veiculo.create({
          data: {
            clienteId: cliente.id,
            placa: veiculo.placa,
            modelo: veiculo.modelo || null,
            chassi: veiculo.chassi || null,
            fabricante: veiculo.fabricante || null,
            ano_modelo: veiculo.ano_modelo ? Number(veiculo.ano_modelo) : null,
            ano_fabricacao: veiculo.ano_fabricacao ? Number(veiculo.ano_fabricacao) : null,
            motor: veiculo.motor || null,
            km: veiculo.km || null,
            cor: veiculo.cor || null,
            ar: veiculo.ar !== undefined ? veiculo.ar : null
          }
        });
      }
    }

    res.status(201).json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Falha ao criar cliente' });
  }
}

export async function buscarClientePorNome(req, res) {
  try {
    const nome = req.query.nome?.trim();

    if (!nome) {
      return res.status(400).json({ erro: 'Informe o nome para busca' });
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        nome: {
          equals: nome,
          mode: 'insensitive'
        }
      },
      include: {
        veiculos: true
      }
    });

    if (!cliente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

    return res.json(cliente);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ erro: 'Erro ao buscar cliente por nome' });
  }
}

export async function listarClientes(req, res) {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        veiculos: true
      }
    });

    res.json(clientes);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: 'Erro ao exibir clientes' });
  }
}

export async function editarClientes(req, res) {
  try {
    const { id } = req.params;

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
      veiculos
    } = req.body;

    const clienteId = Number(id);

    const cliente = await prisma.cliente.update({
      where: { id: clienteId },
      data: {
        nome,
        cpf,
        email,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        cep,
        endereco,
        bairro,
        cidade,
        uf,
        numero,
        complemento,
        celular
      }
    });

    if (Array.isArray(veiculos)) {
      await prisma.veiculo.deleteMany({
        where: {
          clienteId: clienteId
        }
      });

      if (veiculos.length > 0) {
        await prisma.veiculo.createMany({
          data: veiculos.map((veiculo) => ({
            clienteId: clienteId,
            placa: veiculo.placa,
            modelo: veiculo.modelo || null,
            chassi: veiculo.chassi || null,
            fabricante: veiculo.fabricante || null,
            ano_modelo: veiculo.ano_modelo ? Number(veiculo.ano_modelo) : null,
            ano_fabricacao: veiculo.ano_fabricacao? Number(veiculo.ano_fabricacao): null,
            motor: veiculo.motor || null,
            km: veiculo.km || null,
            cor: veiculo.cor || null,
            ar: veiculo.ar !== undefined ? veiculo.ar : null
          }))
        });
      }
    }

    res.json(cliente);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: 'Erro ao atualizar o cliente' });
  }
}
export async function deletarClientes(req, res) {
  try {
    const { id } = req.params;

    await prisma.cliente.delete({
      where: { id: Number(id) }
    });

    res.json({ mensagem: 'Cliente deletado com sucesso' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: 'Erro ao deletar cliente' });
  }
}