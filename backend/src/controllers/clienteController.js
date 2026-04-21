import prisma from '../config/prisma.js'

export async function criarCliente(req, res){
    try{
        const {nome, telefone} = req.body;

        const cliente = await prisma.cliente.create({
            data: {
                nome,
                telefone
            }
        })
        res.status(201).json(cliente)
    }catch(error){
        console.error(error)
        res.status(500).json(error)
    }
}