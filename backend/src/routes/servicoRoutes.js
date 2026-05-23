import express from 'express'
import {listarServicos,buscarServicoPorNome,criarServico,editarServico,deletarServico} from '../controllers/servicosController.js'

const router = express.Router()

router.get('/', listarServicos)
router.get('/buscar-por-nome', buscarServicoPorNome)
router.post('/', criarServico)
router.put('/:id', editarServico)
router.delete('/:id', deletarServico)

export default router