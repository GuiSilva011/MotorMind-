import prisma from '../config/prisma.js';

// Garante que apenas perfis permitidos possam ser usados no cadastro.
function validarRole(role) {
  return ['OPERADOR', 'TECNICO'].includes(role);
}

// Normaliza datas opcionais que chegam do frontend.
function converterData(data) {
  if (!data) return null;

  return new Date(data);
}

// Monta o select usado para trazer funcionário e usuário juntos.
function montarSelectFuncionario() {
  return {
    id: true,
    usuarioId: true,
    Cpf: true,
    Rg: true,
    DataNascimento: true,
    Celular: true,
    Ctps: true,
    Cep: true,
    Endereco: true,
    Numero: true,
    Uf: true,
    Bairro: true,
    Cidade: true,
    Complemento: true,
    DataAdmissao: true,
    CreatedAt: true,
    UpdatedAt: true,
    usuario: {
      select: {
        id: true,
        Nome: true,
        Email: true,
        Role: true,
        CreatedAt: true,
      },
    },
  };
}

// Cria o usuário e o registro de funcionário dentro da mesma transação.
export async function criarFuncionario(req, res) {
  try {
    const {
      Nome,
      Email,
      Senha,
      Role,
      Cpf,
      Rg,
      DataNascimento,
      Celular,
      Ctps,
      Cep,
      Endereco,
      Numero,
      Uf,
      Bairro,
      Cidade,
      Complemento,
      DataAdmissao,
    } = req.body;

    if (!Nome || !Email || !Senha || !Role) {
      return res.status(400).json({
        erro: 'Nome, email, senha e perfil são obrigatórios.',
      });
    }

    if (!validarRole(Role)) {
      return res.status(400).json({
        erro: 'Perfil inválido. Use OPERADOR ou TECNICO.',
      });
    }

    const emailExistente = await prisma.usuario.findUnique({
      where: {
        Email: Email.trim(),
      },
    });

    if (emailExistente) {
      return res.status(409).json({
        erro: 'Já existe um usuário cadastrado com este email.',
      });
    }

    const cpfNormalizado = Cpf?.trim() || null;

    if (cpfNormalizado) {
      const cpfExistente = await prisma.funcionario.findUnique({
        where: {
          Cpf: cpfNormalizado,
        },
      });

      if (cpfExistente) {
        return res.status(409).json({
          erro: 'Já existe um funcionário cadastrado com este CPF.',
        });
      }
    }

    const funcionario = await prisma.$transaction(async (tx) => {
      const usuarioCriado = await tx.usuario.create({
        data: {
          Nome: Nome.trim(),
          Email: Email.trim(),
          Senha: Senha.trim(),
          Role,
        },
      });

      const funcionarioCriado = await tx.funcionario.create({
        data: {
          usuarioId: usuarioCriado.id,
          Cpf: cpfNormalizado,
          Rg: Rg?.trim() || null,
          DataNascimento: converterData(DataNascimento),
          Celular: Celular?.trim() || null,
          Ctps: Ctps?.trim() || null,
          Cep: Cep?.trim() || null,
          Endereco: Endereco?.trim() || null,
          Numero: Numero?.trim() || null,
          Uf: Uf?.trim() || null,
          Bairro: Bairro?.trim() || null,
          Cidade: Cidade?.trim() || null,
          Complemento: Complemento?.trim() || null,
          DataAdmissao: converterData(DataAdmissao),
        },
        select: montarSelectFuncionario(),
      });

      return funcionarioCriado;
    });

    return res.status(201).json({
      mensagem: 'Funcionário cadastrado com sucesso.',
      funcionario,
    });
  } catch (error) {
    console.error('Erro ao cadastrar funcionário:', error);

    return res.status(500).json({
      erro: 'Erro ao cadastrar funcionário.',
      detalhe: error.message,
    });
  }
}

// Lista os funcionários ligados aos perfis OPERADOR e TECNICO.
export async function listarFuncionarios(req, res) {
  try {
    const funcionarios = await prisma.funcionario.findMany({
      where: {
        usuario: {
          Role: {
            in: ['OPERADOR', 'TECNICO'],
          },
        },
      },
      select: montarSelectFuncionario(),
      orderBy: {
        id: 'desc',
      },
    });

    return res.json(funcionarios);
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);

    return res.status(500).json({
      erro: 'Erro ao listar funcionários.',
      detalhe: error.message,
    });
  }
}

// Busca um funcionário específico pelo ID.
export async function buscarFuncionarioPorId(req, res) {
  try {
    const { id } = req.params;

    const funcionario = await prisma.funcionario.findUnique({
      where: {
        id: Number(id),
      },
      select: montarSelectFuncionario(),
    });

    if (!funcionario) {
      return res.status(404).json({
        erro: 'Funcionário não encontrado.',
      });
    }

    return res.json(funcionario);
  } catch (error) {
    console.error('Erro ao buscar funcionário:', error);

    return res.status(500).json({
      erro: 'Erro ao buscar funcionário.',
      detalhe: error.message,
    });
  }
}

// Atualiza dados do usuário e do funcionário de forma sincronizada.
export async function atualizarFuncionario(req, res) {
  try {
    const { id } = req.params;

    const {
      Nome,
      Email,
      Senha,
      Role,
      Cpf,
      Rg,
      DataNascimento,
      Celular,
      Ctps,
      Cep,
      Endereco,
      Numero,
      Uf,
      Bairro,
      Cidade,
      Complemento,
      DataAdmissao,
    } = req.body;

    const funcionarioExistente = await prisma.funcionario.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        usuario: true,
      },
    });

    if (!funcionarioExistente) {
      return res.status(404).json({
        erro: 'Funcionário não encontrado.',
      });
    }

    if (Role && !validarRole(Role)) {
      return res.status(400).json({
        erro: 'Perfil inválido. Use OPERADOR ou TECNICO.',
      });
    }

    if (Email && Email.trim() !== funcionarioExistente.usuario.Email) {
      const emailExistente = await prisma.usuario.findUnique({
        where: {
          Email: Email.trim(),
        },
      });

      if (emailExistente) {
        return res.status(409).json({
          erro: 'Já existe outro usuário cadastrado com este email.',
        });
      }
    }

    const cpfNormalizado = Cpf?.trim() || null;

    if (cpfNormalizado && cpfNormalizado !== funcionarioExistente.Cpf) {
      const cpfExistente = await prisma.funcionario.findUnique({
        where: {
          Cpf: cpfNormalizado,
        },
      });

      if (cpfExistente) {
        return res.status(409).json({
          erro: 'Já existe outro funcionário cadastrado com este CPF.',
        });
      }
    }

    const funcionarioAtualizado = await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: {
          id: funcionarioExistente.usuarioId,
        },
        data: {
          Nome: Nome?.trim() ?? funcionarioExistente.usuario.Nome,
          Email: Email?.trim() ?? funcionarioExistente.usuario.Email,
          Senha: Senha?.trim() ?? funcionarioExistente.usuario.Senha,
          Role: Role ?? funcionarioExistente.usuario.Role,
        },
      });

      const funcionario = await tx.funcionario.update({
        where: {
          id: Number(id),
        },
        data: {
          Cpf:
            Cpf !== undefined ? cpfNormalizado : funcionarioExistente.Cpf,
          Rg: Rg !== undefined ? Rg?.trim() || null : funcionarioExistente.Rg,
          DataNascimento:
            DataNascimento !== undefined
              ? converterData(DataNascimento)
              : funcionarioExistente.DataNascimento,
          Celular:
            Celular !== undefined
              ? Celular?.trim() || null
              : funcionarioExistente.Celular,
          Ctps:
            Ctps !== undefined
              ? Ctps?.trim() || null
              : funcionarioExistente.Ctps,
          Cep:
            Cep !== undefined
              ? Cep?.trim() || null
              : funcionarioExistente.Cep,
          Endereco:
            Endereco !== undefined
              ? Endereco?.trim() || null
              : funcionarioExistente.Endereco,
          Numero:
            Numero !== undefined
              ? Numero?.trim() || null
              : funcionarioExistente.Numero,
          Uf: Uf !== undefined ? Uf?.trim() || null : funcionarioExistente.Uf,
          Bairro:
            Bairro !== undefined
              ? Bairro?.trim() || null
              : funcionarioExistente.Bairro,
          Cidade:
            Cidade !== undefined
              ? Cidade?.trim() || null
              : funcionarioExistente.Cidade,
          Complemento:
            Complemento !== undefined
              ? Complemento?.trim() || null
              : funcionarioExistente.Complemento,
          DataAdmissao:
            DataAdmissao !== undefined
              ? converterData(DataAdmissao)
              : funcionarioExistente.DataAdmissao,
        },
        select: montarSelectFuncionario(),
      });

      return funcionario;
    });

    return res.json({
      mensagem: 'Funcionário atualizado com sucesso.',
      funcionario: funcionarioAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);

    return res.status(500).json({
      erro: 'Erro ao atualizar funcionário.',
      detalhe: error.message,
    });
  }
}

// Remove o funcionário e o usuário associado a ele.
export async function deletarFuncionario(req, res) {
  try {
    const { id } = req.params;

    const funcionarioExistente = await prisma.funcionario.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!funcionarioExistente) {
      return res.status(404).json({
        erro: 'Funcionário não encontrado.',
      });
    }

    await prisma.usuario.delete({
      where: {
        id: funcionarioExistente.usuarioId,
      },
    });

    return res.json({
      mensagem: 'Funcionário deletado com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao deletar funcionário:', error);

    return res.status(500).json({
      erro: 'Erro ao deletar funcionário.',
      detalhe: error.message,
    });
  }
}