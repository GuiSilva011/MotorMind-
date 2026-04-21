import prisma from '../config/prisma.js'

//TODO O CRUD DO CLIENTE 

export async function criarCliente(req, res){
    
    try{
        const {nome,cpf,email,dataNascimento,rg,cep,endereco,bairro,cidade,uf,numero,celular} = req.body;  
        console.log(req.body)
        const cliente = await prisma.cliente.create({
            data: {
                nome,
                cpf,
                email,
                dataNascimento: new Date(dataNascimento),
                rg,
                cep,
                endereco,
                bairro,
                cidade,
                uf,
                numero,
                celular
            }
        })
        res.status(201).json(cliente)
    }catch(error){
        console.error(error)
        res.status(500).json({erro: 'Falha ao criar cliente'})
    }
}

export async function listarClientes(req, res){
    try{
        const clientes = await prisma.cliente.findMany()

        res.json(clientes);
    }catch(error){
        console.log(error)
        res.status(500).json({erro: 'Erro ao exibir clientes'})
    }
}

export async function editarClientes(req, res){
    try{
        const { id } = req.params
        const {nome,cpf,email,dataNascimento,rg,cep,endereco,bairro,cidade,uf,numero,celular} = req.body
        console.log(req.body)
        const cliente = await prisma.cliente.update({
            where: {id: Number(id)},
            data: {
               nome,
                cpf,
                email,
                dataNascimento,
                rg,
                cep,
                endereco,
                bairro,
                cidade,
                uf,
                numero,
                celular
            }
        })
        res.json(cliente)
}catch(error){
    console.log(error)
    res.status(500).json({ erro: 'Erro ao atualizar o cliente'})
    }
}

export async function deletarClientes(req, res){
    try{
        const {id} = req.params

        await prisma.cliente.delete({
            where: { id: Number(id)}
        })
        res.json({ mensagem: "Cliente deletado com sucesso "})
    }catch(error){
        console.log(error)
        res.status(500).json({erro : "Erro ao deletar cliente"})
    }
}
