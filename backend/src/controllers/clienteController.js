import prisma from '../config/prisma.js';

// Cria um cliente e, se vierem veículos no body, cadastra os veículos vinculados.
export async function criarCliente(req, res) {
  try {
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
        celular,
      },
    });

    if (Array.isArray(veiculos) && veiculos.length > 0) {
      for (const veiculo of veiculos) {
        await prisma.veiculo.create({
          data: {
            clienteId: cliente.id,
            placa: veiculo.placa,
            modelo: veiculo.modelo || null,
            chassi: veiculo.chassi || null,
            fabricante: veiculo.fabricante || null,
            ano_modelo: veiculo.ano_modelo
              ? Number(veiculo.ano_modelo)
              : null,
            ano_fabricacao: veiculo.ano_fabricacao
              ? Number(veiculo.ano_fabricacao)
              : null,
            motor: veiculo.motor || null,
            km: veiculo.km || null,
            cor: veiculo.cor || null,
            ar: veiculo.ar !== undefined ? veiculo.ar : null,
            cambio: veiculo.Cambio || veiculo.cambio || null,
          },
        });
      }
    }

    return res.status(201).json(cliente);
  } catch (error) {
    console.error(error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe um registro com esses dados únicos.',
      });
    }

    return res.status(500).json({ erro: 'Falha ao criar cliente' });
  }
}

// Busca um cliente exato pelo nome informado na query e traz os veículos junto.
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
    console.log(error);
    return res.status(500).json({ erro: 'Erro ao buscar cliente por nome' });
  }
}

// Lista todos os clientes com seus veículos, do mais recente para o mais antigo.
export async function listarClientes(req, res) {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        veiculos: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(clientes);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ erro: 'Erro ao exibir clientes' });
  }
}

// Atualiza dados do cliente e substitui a lista de veículos quando ela é enviada.
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
      veiculos,
    } = req.body;

    const clienteId = Number(id);

    const clienteExistente = await prisma.cliente.findUnique({
      where: {
        id: clienteId,
      },
    });

    if (!clienteExistente) {
      return res.status(404).json({ erro: 'Cliente não encontrado' });
    }

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
        celular,
      },
    });

    if (Array.isArray(veiculos)) {
      await prisma.veiculo.deleteMany({
        where: {
          clienteId,
        },
      });

      if (veiculos.length > 0) {
        await prisma.veiculo.createMany({
          data: veiculos.map((veiculo) => ({
            clienteId,
            placa: veiculo.placa,
            modelo: veiculo.modelo || null,
            chassi: veiculo.chassi || null,
            fabricante: veiculo.fabricante || null,
            ano_modelo: veiculo.ano_modelo
              ? Number(veiculo.ano_modelo)
              : null,
            ano_fabricacao: veiculo.ano_fabricacao
              ? Number(veiculo.ano_fabricacao)
              : null,
            motor: veiculo.motor || null,
            km: veiculo.km || null,
            cor: veiculo.cor || null,
            ar: veiculo.ar !== undefined ? veiculo.ar : null,
            cambio: veiculo.Cambio || veiculo.cambio || null,
          })),
        });
      }
    }

    return res.json(cliente);
  } catch (error) {
    console.log(error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe um veículo cadastrado com esta placa.',
      });
    }

    return res.status(500).json({ erro: 'Erro ao atualizar o cliente' });
  }
}

// Remove o cliente e todos os veículos ligados a ele dentro de uma transação.
export async function deletarClientes(req, res) {
  try {
    const { id } = req.params;

    const clienteId = Number(id);

    const cliente = await prisma.cliente.findUnique({
      where: {
        id: clienteId,
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
        },
      });

      await tx.cliente.delete({
        where: {
          id: clienteId,
        },
      });
    });

    return res.json({
      mensagem: 'Cliente deletado com sucesso',
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      erro: 'Erro ao deletar cliente',
    });
  }
}