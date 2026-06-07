import prisma from '../config/prisma.js'

// Lista todos os fornecedores em ordem alfabética.
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

// Busca fornecedores por nome, código, CNPJ ou cidade.
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

// Cadastra um fornecedor novo validando os campos obrigatórios.
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

// Atualiza os dados do fornecedor selecionado.
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

// Exclui um fornecedor depois de confirmar que ele existe.
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