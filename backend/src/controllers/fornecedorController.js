import prisma from '../config/prisma.js'

/**
 * Controlador responsável pelas operações de listagem, busca,
 * cadastro, atualização e exclusão de fornecedores.
 *
 * @module controllers/fornecedorController
 */

/**
 * Lista todos os fornecedores cadastrados.
 *
 * Os registros são retornados em ordem alfabética pelo nome.
 *
 * @async
 * @function listarFornecedores
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com a lista de fornecedores ou mensagem de erro.
 */
export async function listarFornecedores(req, res) {
  try {
    const fornecedores = await prisma.fornecedor.findMany({
      orderBy: {
        nome: 'asc'
      }
    })

    return res.json(fornecedores)
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error)
    return res.status(500).json({ erro: 'Erro ao listar fornecedores' })
  }
}

/**
 * Busca fornecedores pelo nome, código, CNPJ ou cidade.
 *
 * A pesquisa não diferencia letras maiúsculas e minúsculas.
 *
 * @async
 * @function buscarFornecedorPorNome
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.query - Parâmetros enviados na URL.
 * @param {string} req.query.nome - Termo utilizado na pesquisa.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com os fornecedores encontrados ou mensagem de erro.
 */
export async function buscarFornecedorPorNome(req, res) {
  try {
    const { nome } = req.query

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório' })
    }

    const fornecedores = await prisma.fornecedor.findMany({
      where: {
        OR: [
          {
            nome: {
              contains: nome,
              mode: 'insensitive'
            }
          },
          {
            codigo: {
              contains: nome,
              mode: 'insensitive'
            }
          },
          {
            cnpj: {
              contains: nome,
              mode: 'insensitive'
            }
          },
          {
            cidade: {
              contains: nome,
              mode: 'insensitive'
            }
          }
        ]
      },
      orderBy: {
        nome: 'asc'
      }
    })

    return res.json(fornecedores)
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error)
    return res.status(500).json({ erro: 'Erro ao buscar fornecedor' })
  }
}

/**
 * Cria um novo fornecedor no sistema.
 *
 * Valida os campos obrigatórios, exige pelo menos um contato
 * e impede a duplicidade de código ou CNPJ.
 *
 * @async
 * @function criarFornecedor
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.body - Dados enviados no corpo da requisição.
 * @param {string} req.body.codigo - Código único do fornecedor.
 * @param {string} req.body.nome - Nome do fornecedor.
 * @param {string} req.body.cnpj - CNPJ do fornecedor.
 * @param {string} [req.body.email] - E-mail do fornecedor.
 * @param {string} [req.body.telefone] - Telefone fixo do fornecedor.
 * @param {string} [req.body.celular] - Celular ou WhatsApp do fornecedor.
 * @param {string} [req.body.inscricao] - Inscrição estadual ou municipal.
 * @param {string} [req.body.cep] - CEP do fornecedor.
 * @param {string} [req.body.endereco] - Endereço do fornecedor.
 * @param {string} [req.body.numero] - Número do endereço.
 * @param {string} [req.body.uf] - Unidade federativa.
 * @param {string} [req.body.bairro] - Bairro do fornecedor.
 * @param {string} [req.body.cidade] - Cidade do fornecedor.
 * @param {string} [req.body.complemento] - Complemento do endereço.
 * @param {boolean} [req.body.fornecePecas=true] - Indica se fornece peças.
 * @param {boolean} [req.body.forneceServicos=false] - Indica se fornece serviços.
 * @param {string} [req.body.observacoes] - Observações adicionais.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o fornecedor criado ou mensagem de erro.
 */
export async function criarFornecedor(req, res) {
  try {
    const {
      codigo,
      nome,
      cnpj,
      email,
      telefone,
      celular,
      inscricao,
      cep,
      endereco,
      numero,
      uf,
      bairro,
      cidade,
      complemento,
      fornecePecas,
      forneceServicos,
      observacoes
    } = req.body

    if (!codigo || !nome) {
      return res.status(400).json({
        erro: 'Código e nome são obrigatórios'
      })
    }

    const cnpjNormalizado = cnpj?.trim() || null
    const telefoneNormalizado = telefone?.trim() || null
    const celularNormalizado = celular?.trim() || null

    if (!cnpjNormalizado) {
      return res.status(400).json({
        erro: 'CNPJ é obrigatório para cadastro de fornecedor'
      })
    }

    if (!telefoneNormalizado && !celularNormalizado) {
      return res.status(400).json({
        erro: 'Informe pelo menos um contato: telefone (fixo) ou celular (WhatsApp)'
      })
    }

    const fornecedorExistente = await prisma.fornecedor.findFirst({
      where: {
        OR: [
          { codigo },
          ...(cnpjNormalizado ? [{ cnpj: cnpjNormalizado }] : [])
        ]
      }
    })

    if (fornecedorExistente) {
      return res.status(409).json({
        erro: 'Já existe um fornecedor com esse código ou CNPJ'
      })
    }

    const fornecedor = await prisma.fornecedor.create({
      data: {
        codigo,
        nome,
        cnpj: cnpjNormalizado,
        email,
        telefone: telefoneNormalizado,
        celular: celularNormalizado,
        inscricao,
        cep,
        endereco,
        numero,
        uf,
        bairro,
        cidade,
        complemento,
        fornecePecas: fornecePecas ?? true,
        forneceServicos: forneceServicos ?? false,
        observacoes
      }
    })

    return res.status(201).json(fornecedor)
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error)
    return res.status(500).json({ erro: 'Erro ao criar fornecedor' })
  }
}

/**
 * Atualiza os dados de um fornecedor existente.
 *
 * Verifica se o fornecedor está cadastrado e impede a duplicidade
 * de código ou CNPJ em outros registros.
 *
 * @async
 * @function editarFornecedor
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do fornecedor.
 * @param {Object} req.body - Dados que serão atualizados.
 * @param {string} [req.body.codigo] - Código do fornecedor.
 * @param {string} [req.body.nome] - Nome do fornecedor.
 * @param {string|null} [req.body.cnpj] - CNPJ do fornecedor.
 * @param {string|null} [req.body.email] - E-mail do fornecedor.
 * @param {string|null} [req.body.telefone] - Telefone do fornecedor.
 * @param {string|null} [req.body.celular] - Celular do fornecedor.
 * @param {string|null} [req.body.inscricao] - Inscrição estadual ou municipal.
 * @param {string|null} [req.body.cep] - CEP do fornecedor.
 * @param {string|null} [req.body.endereco] - Endereço do fornecedor.
 * @param {string|null} [req.body.numero] - Número do endereço.
 * @param {string|null} [req.body.uf] - Unidade federativa.
 * @param {string|null} [req.body.bairro] - Bairro do fornecedor.
 * @param {string|null} [req.body.cidade] - Cidade do fornecedor.
 * @param {string|null} [req.body.complemento] - Complemento do endereço.
 * @param {boolean} [req.body.fornecePecas] - Indica se fornece peças.
 * @param {boolean} [req.body.forneceServicos] - Indica se fornece serviços.
 * @param {string|null} [req.body.observacoes] - Observações adicionais.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com o fornecedor atualizado ou mensagem de erro.
 */
export async function editarFornecedor(req, res) {
  try {
    const { id } = req.params

    const fornecedor = await prisma.fornecedor.findUnique({
      where: {
        id: Number(id)
      }
    })

    if (!fornecedor) {
      return res.status(404).json({ erro: 'Fornecedor não encontrado' })
    }

    const {
      codigo,
      nome,
      cnpj,
      email,
      telefone,
      celular,
      inscricao,
      cep,
      endereco,
      numero,
      uf,
      bairro,
      cidade,
      complemento,
      fornecePecas,
      forneceServicos,
      observacoes
    } = req.body

    const cnpjNormalizado = cnpj?.trim() || null

    const fornecedorDuplicado = await prisma.fornecedor.findFirst({
      where: {
        id: {
          not: Number(id)
        },
        OR: [
          codigo ? { codigo } : undefined,
          cnpjNormalizado ? { cnpj: cnpjNormalizado } : undefined
        ].filter(Boolean)
      }
    })

    if (fornecedorDuplicado) {
      return res.status(409).json({
        erro: 'Já existe outro fornecedor com esse código ou CNPJ'
      })
    }

    const fornecedorAtualizado = await prisma.fornecedor.update({
      where: {
        id: Number(id)
      },
      data: {
        codigo,
        nome,
        cnpj: cnpjNormalizado,
        email,
        telefone,
        celular,
        inscricao,
        cep,
        endereco,
        numero,
        uf,
        bairro,
        cidade,
        complemento,
        fornecePecas,
        forneceServicos,
        observacoes
      }
    })

    return res.json(fornecedorAtualizado)
  } catch (error) {
    console.error('Erro ao editar fornecedor:', error)
    return res.status(500).json({ erro: 'Erro ao editar fornecedor' })
  }
}

/**
 * Exclui um fornecedor pelo identificador informado.
 *
 * Antes da exclusão, verifica se o fornecedor está cadastrado.
 *
 * @async
 * @function deletarFornecedor
 * @param {Object} req - Objeto da requisição HTTP.
 * @param {Object} req.params - Parâmetros da rota.
 * @param {number|string} req.params.id - Identificador do fornecedor.
 * @param {Object} res - Objeto da resposta HTTP.
 * @returns {Promise<Object>} Resposta com mensagem de sucesso ou erro.
 */
export async function deletarFornecedor(req, res) {
  try {
    const { id } = req.params

    const fornecedor = await prisma.fornecedor.findUnique({
      where: {
        id: Number(id)
      }
    })

    if (!fornecedor) {
      return res.status(404).json({ erro: 'Fornecedor não encontrado' })
    }

    await prisma.fornecedor.delete({
      where: {
        id: Number(id)
      }
    })

    return res.json({ mensagem: 'Fornecedor deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error)
    return res.status(500).json({ erro: 'Erro ao deletar fornecedor' })
  }
}