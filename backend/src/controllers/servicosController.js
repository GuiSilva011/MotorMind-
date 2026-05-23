import prisma from '../config/prisma.js'

export async function listarServicos(req, res) {
  try {
    const servicos = await prisma.servicoCatalogo.findMany({
      orderBy: {
        nome: 'asc'
      }
    })

    return res.json(servicos)
  } catch (error) {
    console.error('Erro ao listar serviços:', error)
    return res.status(500).json({ erro: 'Erro ao listar serviços' })
  }
}

export async function buscarServicoPorNome(req, res) {
  try {
    const { nome } = req.query

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório' })
    }

    const servicos = await prisma.servicoCatalogo.findMany({
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
            categoria: {
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

    return res.json(servicos)
  } catch (error) {
    console.error('Erro ao buscar serviço:', error)
    return res.status(500).json({ erro: 'Erro ao buscar serviço' })
  }
}

export async function criarServico(req, res) {
  try {
    const { codigo, nome, categoria, valorPadrao, ativo } = req.body

    if (!codigo || !nome) {
      return res.status(400).json({ erro: 'Código e nome são obrigatórios' })
    }

    const servicoExistente = await prisma.servicoCatalogo.findFirst({
      where: {
        OR: [
          { codigo },
          { nome }
        ]
      }
    })

    if (servicoExistente) {
      return res.status(409).json({
        erro: 'Já existe um serviço com esse código ou nome'
      })
    }

    const servico = await prisma.servicoCatalogo.create({
      data: {
        codigo,
        nome,
        categoria,
        valorPadrao:
          valorPadrao !== undefined && valorPadrao !== ''
            ? Number(valorPadrao)
            : null,
        ativo: ativo ?? true
      }
    })

    return res.status(201).json(servico)
  } catch (error) {
    console.error('Erro ao criar serviço:', error)
    return res.status(500).json({ erro: 'Erro ao criar serviço' })
  }
}

export async function editarServico(req, res) {
  try {
    const { id } = req.params
    const { codigo, nome, categoria, valorPadrao, ativo } = req.body

    const servico = await prisma.servicoCatalogo.findUnique({
      where: {
        id: Number(id)
      }
    })

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' })
    }

    const servicoDuplicado = await prisma.servicoCatalogo.findFirst({
      where: {
        id: {
          not: Number(id)
        },
        OR: [
          codigo ? { codigo } : undefined,
          nome ? { nome } : undefined
        ].filter(Boolean)
      }
    })

    if (servicoDuplicado) {
      return res.status(409).json({
        erro: 'Já existe outro serviço com esse código ou nome'
      })
    }

    const servicoAtualizado = await prisma.servicoCatalogo.update({
      where: {
        id: Number(id)
      },
      data: {
        codigo,
        nome,
        categoria,
        valorPadrao:
          valorPadrao !== undefined && valorPadrao !== ''
            ? Number(valorPadrao)
            : null,
        ativo
      }
    })

    return res.json(servicoAtualizado)
  } catch (error) {
    console.error('Erro ao editar serviço:', error)
    return res.status(500).json({ erro: 'Erro ao editar serviço' })
  }
}

export async function deletarServico(req, res) {
  try {
    const { id } = req.params

    const servico = await prisma.servicoCatalogo.findUnique({
      where: {
        id: Number(id)
      }
    })

    if (!servico) {
      return res.status(404).json({ erro: 'Serviço não encontrado' })
    }

    await prisma.servicoCatalogo.delete({
      where: {
        id: Number(id)
      }
    })

    return res.json({ mensagem: 'Serviço deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar serviço:', error)
    return res.status(500).json({ erro: 'Erro ao deletar serviço' })
  }
}