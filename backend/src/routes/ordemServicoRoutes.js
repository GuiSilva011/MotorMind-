import express from 'express'
import {listarOrdensServico,buscarOrdemServicoPorId,criarOrdemServico,editarOrdemServico,deletarOrdemServico} from '../controllers/ordemServicoController.js'

const router = express.Router()

router.get('/', listarOrdensServico)
router.get('/:id', buscarOrdemServicoPorId)
router.post('/', criarOrdemServico)
router.put('/:id', editarOrdemServico)
router.delete('/:id', deletarOrdemServico)

export default router