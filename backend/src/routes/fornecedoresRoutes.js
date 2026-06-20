import express from 'express'
import {listarFornecedores,buscarFornecedorPorNome,criarFornecedor,editarFornecedor,deletarFornecedor} from '../controllers/fornecedorController.js'

const router = express.Router()
/**
 * Rotas de fornecedores com CRUD e busca por nome.
 */

// Rotas do cadastro e consulta de fornecedores.
router.get('/', listarFornecedores)
router.get('/buscar-por-nome', buscarFornecedorPorNome)
router.post('/', criarFornecedor)
router.put('/:id', editarFornecedor)
router.delete('/:id', deletarFornecedor)

export default router