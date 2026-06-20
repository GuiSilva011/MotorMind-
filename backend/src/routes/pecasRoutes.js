import express from 'express'
import {listarPecas,buscarPecaPorNome,criarPeca,editarPeca,deletarPeca} from '../controllers/pecasController.js'

const router = express.Router()
/**
 * Rotas de peças com CRUD e busca por nome.
 */

// Rotas do catálogo de peças.
router.get('/', listarPecas)
router.get('/buscar-por-nome', buscarPecaPorNome)
router.post('/', criarPeca)
router.put('/:id', editarPeca)
router.delete('/:id', deletarPeca)

export default router