import prisma from '../config/prisma.js';

export async function login(req, res) {
  try {
    const { Email, Senha } = req.body;

    if (!Email || !Senha) {
      return res.status(400).json({
        erro: 'Email e senha são obrigatórios.',
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: {
        Email,
      },
    });

    if (!usuario) {
      return res.status(401).json({
        erro: 'Usuário ou senha inválidos.',
      });
    }

    if (usuario.Senha !== Senha) {
      return res.status(401).json({
        erro: 'Usuário ou senha inválidos.',
      });
    }

    return res.json({
      mensagem: 'Login realizado com sucesso.',
      usuario: {
        id: usuario.id,
        Nome: usuario.Nome,
        Email: usuario.Email,
        Role: usuario.Role,
      },
    });
  } catch (error) {
    console.error('Erro ao realizar login:', error);

    return res.status(500).json({
      erro: 'Erro ao realizar login.',
      detalhe: error.message,
    });
  }
}

export async function listarUsuariosTeste(req, res) {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        Nome: true,
        Email: true,
        Role: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return res.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);

    return res.status(500).json({
      erro: 'Erro ao listar usuários.',
      detalhe: error.message,
    });
  }
}