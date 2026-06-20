import prisma from '../config/prisma.js';

/**
 * Autentica o usuário com base em email e senha armazenados no banco.
 *
 * @param {object} req - Requisição HTTP com Email e Senha no body.
 * @param {object} res - Resposta HTTP enviada ao cliente.
 * @returns {Promise<void>}
 */

/**
 * Autentica um usuário utilizando o e-mail e a senha informados.
 *
 * Busca o usuário pelo e-mail, valida as credenciais e retorna
 * os dados necessários para identificação e controle de acesso.
 *
 * @async
 * @function login
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.body - Dados enviados no corpo da requisição.
 * @param {string} req.body.Email - E-mail utilizado na autenticação.
 * @param {string} req.body.Senha - Senha utilizada na autenticação.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com os dados do usuário autenticado ou mensagem de erro.
 */
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

/**
 * Lista os usuários cadastrados com os campos utilizados
 * nos testes e na validação manual do sistema.
 *
 * A senha dos usuários não é incluída na resposta.
 *
 * @async
 * @function listarUsuariosTeste
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a lista de usuários ou mensagem de erro.
 */
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