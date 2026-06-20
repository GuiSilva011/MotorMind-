import prisma from '../config/prisma.js';

/**
 * Controlador responsável pelas operações de cadastro, consulta,
 * listagem, atualização e exclusão de clientes e seus veículos.
 *
 * @module controllers/clienteController
 */


/**
 * Cria um novo cliente e cadastra os veículos enviados na requisição.
 *
 * @async
 * @function criarCliente
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.body - Dados enviados no corpo da requisição.
 * @param {string} req.body.nome - Nome do cliente.
 * @param {string} req.body.cpf - CPF do cliente.
 * @param {string} [req.body.email] - E-mail do cliente.
 * @param {string|Date} [req.body.dataNascimento] - Data de nascimento.
 * @param {string} [req.body.cep] - CEP do cliente.
 * @param {string} [req.body.endereco] - Endereço do cliente.
 * @param {string} [req.body.bairro] - Bairro do cliente.
 * @param {string} [req.body.cidade] - Cidade do cliente.
 * @param {string} [req.body.uf] - Unidade federativa.
 * @param {string} [req.body.numero] - Número do endereço.
 * @param {string} [req.body.complemento] - Complemento do endereço.
 * @param {string} [req.body.celular] - Celular do cliente.
 * @param {Array<Object>} [req.body.veiculos] - Veículos vinculados ao cliente.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o cliente criado ou mensagem de erro.
 */
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

/**
 * Busca um cliente pelo nome informado na query.
 *
 * A pesquisa não diferencia letras maiúsculas e minúsculas
 * e inclui os veículos vinculados ao cliente.
 *
 * @async
 * @function buscarClientePorNome
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.query - Parâmetros enviados na URL.
 * @param {string} req.query.nome - Nome exato do cliente.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o cliente encontrado ou mensagem de erro.
 */
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

/**
 * Lista todos os clientes cadastrados com seus veículos.
 *
 * Os registros são ordenados do cliente mais recente
 * para o mais antigo.
 *
 * @async
 * @function listarClientes
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a lista de clientes ou mensagem de erro.
 */
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

/**
 * Atualiza os dados de um cliente e gerencia seus veículos vinculados.
 *
 * A operação é executada em uma transação. Veículos existentes podem
 * ser atualizados, novos veículos podem ser criados e veículos marcados
 * para remoção podem ser excluídos.
 *
 * @async
 * @function editarClientes
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do cliente.
 * @param {Object} req.body - Dados atualizados do cliente.
 * @param {string} req.body.nome - Nome do cliente.
 * @param {string} req.body.cpf - CPF do cliente.
 * @param {string} [req.body.email] - E-mail do cliente.
 * @param {string|Date} [req.body.dataNascimento] - Data de nascimento.
 * @param {string} [req.body.cep] - CEP do cliente.
 * @param {string} [req.body.endereco] - Endereço do cliente.
 * @param {string} [req.body.bairro] - Bairro do cliente.
 * @param {string} [req.body.cidade] - Cidade do cliente.
 * @param {string} [req.body.uf] - Unidade federativa.
 * @param {string} [req.body.numero] - Número do endereço.
 * @param {string} [req.body.complemento] - Complemento do endereço.
 * @param {string} [req.body.celular] - Celular do cliente.
 * @param {Array<Object>} [req.body.veiculos] - Veículos que serão atualizados, criados ou removidos.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o cliente atualizado e seus veículos ou mensagem de erro.
 */
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

    if (!clienteId) {
      return res.status(400).json({
        erro: 'ID do cliente inválido.',
      });
    }

    const clienteExistente = await prisma.cliente.findUnique({
      where: {
        id: clienteId,
      },
      include: {
        veiculos: true,
      },
    });

    if (!clienteExistente) {
      return res.status(404).json({
        erro: 'Cliente não encontrado.',
      });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      await tx.cliente.update({
        where: {
          id: clienteId,
        },
        data: {
          nome,
          cpf,
          email: email || null,
          dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
          cep: cep || null,
          endereco: endereco || null,
          bairro: bairro || null,
          cidade: cidade || null,
          uf: uf || null,
          numero: numero || null,
          complemento: complemento || null,
          celular: celular || null,
        },
      });

      if (Array.isArray(veiculos)) {
        for (const veiculo of veiculos) {
          const veiculoId = veiculo.id ? Number(veiculo.id) : null;

          // Caso o veículo tenha sido marcado para remoção no frontend
          if (veiculo._remover === true) {
            if (!veiculoId) {
              continue;
            }

            await tx.veiculo.delete({
              where: {
                id: veiculoId,
              },
            });

            continue;
          }

          const dadosVeiculo = {
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
          };

          // Caso 1: veículo existente, atualiza pelo ID
          if (veiculoId) {
            const veiculoExistente = await tx.veiculo.findUnique({
              where: {
                id: veiculoId,
              },
            });

            if (!veiculoExistente) {
              continue;
            }

            if (Number(veiculoExistente.clienteId) !== Number(clienteId)) {
              const error = new Error(
                'Este veículo não pertence ao cliente informado.'
              );

              error.code = 'VEICULO_NAO_PERTENCE_CLIENTE';
              throw error;
            }

            await tx.veiculo.update({
              where: {
                id: veiculoId,
              },
              data: dadosVeiculo,
            });

            continue;
          }

          // Caso 2: veículo sem ID, mas já existe pela placa
          const veiculoExistentePorPlaca = veiculo.placa
            ? await tx.veiculo.findUnique({
                where: {
                  placa: veiculo.placa,
                },
              })
            : null;

          if (
            veiculoExistentePorPlaca &&
            Number(veiculoExistentePorPlaca.clienteId) === Number(clienteId)
          ) {
            await tx.veiculo.update({
              where: {
                id: veiculoExistentePorPlaca.id,
              },
              data: dadosVeiculo,
            });

            continue;
          }

          if (
            veiculoExistentePorPlaca &&
            Number(veiculoExistentePorPlaca.clienteId) !== Number(clienteId)
          ) {
            const error = new Error(
              'Já existe um veículo cadastrado com esta placa para outro cliente.'
            );

            error.code = 'PLACA_OUTRO_CLIENTE';
            throw error;
          }

          // Caso 3: veículo realmente novo
          await tx.veiculo.create({
            data: {
              clienteId,
              ...dadosVeiculo,
            },
          });
        }
      }

      const clienteComVeiculos = await tx.cliente.findUnique({
        where: {
          id: clienteId,
        },
        include: {
          veiculos: true,
        },
      });

      return clienteComVeiculos;
    });

    return res.json(resultado);
  } catch (error) {
    console.log(error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe um veículo cadastrado com esta placa.',
      });
    }

    if (error.code === 'PLACA_OUTRO_CLIENTE') {
      return res.status(409).json({
        erro: error.message,
      });
    }

    if (error.code === 'VEICULO_NAO_PERTENCE_CLIENTE') {
      return res.status(403).json({
        erro: error.message,
      });
    }

    if (
      error.code === 'P2003' ||
      String(error.message || '').includes('OrdemServico_veiculoId_fkey') ||
      String(error.message || '').includes('Checklist_veiculoId_fkey') ||
      String(error.message || '').includes('Agendamento_veiculoId_fkey')
    ) {
      return res.status(409).json({
        erro:
          'Este veículo não pode ser removido porque já possui ordem de serviço, checklist ou agendamento vinculado.',
      });
    }

    return res.status(500).json({
      erro: 'Erro ao atualizar o cliente.',
      detalhe: error.message,
    });
  }
}

/**
 * Exclui um cliente e todos os veículos vinculados a ele.
 *
 * A exclusão é executada em uma transação para manter
 * a consistência dos dados.
 *
 * @async
 * @function deletarClientes
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do cliente.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com mensagem de sucesso ou erro.
 */
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