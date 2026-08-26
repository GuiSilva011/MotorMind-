import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

const SALT_ROUNDS = 12;

function obterOficinaId(req, res) {
  const oficinaId = Number(req.user?.oficinaId);

  if (!oficinaId) {
    res.status(401).json({ erro: 'Usuário não autenticado.' });
    return null;
  }

  return oficinaId;
}

function validarRole(role) {
  return ['OPERADOR', 'TECNICO'].includes(role);
}

function converterData(data) {
  if (!data) return null;
  return new Date(data);
}

function montarSelectFuncionario() {
  return {
    id: true,
    oficinaId: true,
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
        oficinaId: true,
        CreatedAt: true,
      },
    },
  };
}

export async function criarFuncionario(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

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

    if (!Nome?.trim() || !Email?.trim() || !Senha || !Role) {
      return res.status(400).json({
        erro: 'Nome, email, senha e perfil são obrigatórios.',
      });
    }

    if (!validarRole(Role)) {
      return res.status(400).json({
        erro: 'Perfil inválido. Use OPERADOR ou TECNICO.',
      });
    }

    const emailNormalizado = Email.trim();

    const emailExistente = await prisma.usuario.findUnique({
      where: { Email: emailNormalizado },
    });

    if (emailExistente) {
      return res.status(409).json({
        erro: 'Já existe um usuário cadastrado com este email.',
      });
    }

    const cpfNormalizado = Cpf?.trim() || null;

    if (cpfNormalizado) {
      const cpfExistente = await prisma.funcionario.findFirst({
        where: {
          oficinaId,
          Cpf: cpfNormalizado,
        },
      });

      if (cpfExistente) {
        return res.status(409).json({
          erro: 'Já existe um funcionário cadastrado com este CPF nesta oficina.',
        });
      }
    }

    const senhaHash = await bcrypt.hash(Senha, SALT_ROUNDS);

    const funcionario = await prisma.$transaction(async (tx) => {
      const usuarioCriado = await tx.usuario.create({
        data: {
          oficinaId,
          Nome: Nome.trim(),
          Email: emailNormalizado,
          Senha: senhaHash,
          Role,
        },
      });

      return tx.funcionario.create({
        data: {
          oficinaId,
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
    });

    return res.status(201).json({
      mensagem: 'Funcionário cadastrado com sucesso.',
      funcionario,
    });
  } catch (error) {
    console.error('Erro ao cadastrar funcionário:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe um funcionário com os dados informados.',
      });
    }

    return res.status(500).json({
      erro: 'Erro ao cadastrar funcionário.',
      detalhe: error.message,
    });
  }
}

export async function listarFuncionarios(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const funcionarios = await prisma.funcionario.findMany({
      where: {
        oficinaId,
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

export async function buscarFuncionarioPorId(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: Number(req.params.id),
        oficinaId,
      },
      select: montarSelectFuncionario(),
    });

    if (!funcionario) {
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });
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

export async function atualizarFuncionario(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const id = Number(req.params.id);

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

    const funcionarioExistente = await prisma.funcionario.findFirst({
      where: {
        id,
        oficinaId,
      },
      include: {
        usuario: true,
      },
    });

    if (!funcionarioExistente) {
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    }

    if (Role && !validarRole(Role)) {
      return res.status(400).json({
        erro: 'Perfil inválido. Use OPERADOR ou TECNICO.',
      });
    }

    const emailFinal = Email?.trim() || funcionarioExistente.usuario.Email;

    if (emailFinal !== funcionarioExistente.usuario.Email) {
      const emailExistente = await prisma.usuario.findUnique({
        where: { Email: emailFinal },
      });

      if (emailExistente) {
        return res.status(409).json({
          erro: 'Já existe outro usuário cadastrado com este email.',
        });
      }
    }

    const cpfNormalizado = Cpf?.trim() || null;

    if (
      Cpf !== undefined &&
      cpfNormalizado &&
      cpfNormalizado !== funcionarioExistente.Cpf
    ) {
      const cpfExistente = await prisma.funcionario.findFirst({
        where: {
          oficinaId,
          Cpf: cpfNormalizado,
          id: { not: id },
        },
      });

      if (cpfExistente) {
        return res.status(409).json({
          erro: 'Já existe outro funcionário cadastrado com este CPF nesta oficina.',
        });
      }
    }

    const senhaHash = Senha ? await bcrypt.hash(Senha, SALT_ROUNDS) : null;

    const funcionarioAtualizado = await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: {
          id: funcionarioExistente.usuarioId,
        },
        data: {
          Nome: Nome?.trim() || funcionarioExistente.usuario.Nome,
          Email: emailFinal,
          Senha: senhaHash || funcionarioExistente.usuario.Senha,
          Role: Role || funcionarioExistente.usuario.Role,
        },
      });

      return tx.funcionario.update({
        where: { id },
        data: {
          Cpf: Cpf !== undefined ? cpfNormalizado : funcionarioExistente.Cpf,
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
            Cep !== undefined ? Cep?.trim() || null : funcionarioExistente.Cep,
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
    });

    return res.json({
      mensagem: 'Funcionário atualizado com sucesso.',
      funcionario: funcionarioAtualizado,
    });
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        erro: 'Já existe um funcionário com os dados informados.',
      });
    }

    return res.status(500).json({
      erro: 'Erro ao atualizar funcionário.',
      detalhe: error.message,
    });
  }
}

export async function deletarFuncionario(req, res) {
  try {
    const oficinaId = obterOficinaId(req, res);
    if (!oficinaId) return;

    const funcionarioExistente = await prisma.funcionario.findFirst({
      where: {
        id: Number(req.params.id),
        oficinaId,
      },
    });

    if (!funcionarioExistente) {
      return res.status(404).json({ erro: 'Funcionário não encontrado.' });
    }

    if (funcionarioExistente.usuarioId === req.user.id) {
      return res.status(400).json({
        erro: 'Você não pode excluir o próprio usuário por esta operação.',
      });
    }

    await prisma.usuario.delete({
      where: {
        id: funcionarioExistente.usuarioId,
      },
    });

    return res.json({ mensagem: 'Funcionário deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar funcionário:', error);
    return res.status(500).json({
      erro: 'Erro ao deletar funcionário.',
      detalhe: error.message,
    });
  }
}
