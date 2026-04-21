import prisma from '../config/prisma.js'

export async function criarVeiculo(req, res){
    try{
        const {clienteId,placa, chassi, marca,modelo, ano,anoModelo} = req.body;  
        console.log(req.body)
        const veiculo = await prisma.veiculo.create({
            data:{
                clienteId,
                placa,
                chassi,
                marca,
                modelo,
                ano,
                anoModelo
            }
        })
        res.status(201).json(veiculo)
    }catch(error){
        console.log(error)
        res.status(500).json({erro: 'Falha ao criar cliente'})
    }
}

export async function listarVeiculo(req, res){
    try{
        const veiculo = await prisma.veiculo.findMany()
        res.json(veiculo);
    }catch(error){
        console.log(error)
        res.status(500).json({erro: 'Erro ao exibir clientes'})
    }
}

export async function editarVeiculo(req, res){
    try{
        const { id } = req.params
        const {clienteId,placa, chassi, marca,modelo, ano,anoModelo} = req.body
        console.log(req.body)
        const cliente = await prisma.cliente.update({
            where: {id: Number(id)},
            data: {
                clienteId,
                placa,
                chassi,
                marca,
                modelo,
                ano,
                anoModelo
            }
        })
        res.json(cliente)
}catch(error){
    console.log(error)
    res.status(500).json({ erro: 'Erro ao atualizar o cliente'})
    }
}

export async function deletarVeiculo(req, res){
    try{
        const {id} = req.params
        await prisma.veiculo.delete({
            where: { id: Number(id)}
        })
        res.json({ mensagem: "Cliente deletado com sucesso "})
    }catch(error){
        console.log(error)
        res.status(500).json({erro : "Erro ao deletar cliente"})
    }
}
