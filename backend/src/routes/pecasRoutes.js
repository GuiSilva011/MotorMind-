import express from 'express'
import {listarPecas,buscarPecaPorNome,criarPeca,editarPeca,deletarPeca} from '../controllers/pecasController.js'

const router = express.Router()

router.get('/', listarPecas)
router.get('/buscar-por-nome', buscarPecaPorNome)
router.post('/', criarPeca)
router.put('/:id', editarPeca)
router.delete('/:id', deletarPeca)

export default router