import express from 'express'
import {listarOrdensServico,buscarOrdensServico,buscarOrdemServicoPorId,criarOrdemServico,editarOrdemServico,deletarOrdemServico,gerarProximoCodigoOS} from '../controllers/ordemServicoController.js'

const router = express.Router()
/**
 * Rotas de ordens de serviço com CRUD e consultas auxiliares.
 */

// Rotas principais da ordem de serviço, com listagem, busca e CRUD.
router.get('/', listarOrdensServico)
router.get('/proximo-codigo', gerarProximoCodigoOS)
router.get('/buscar', buscarOrdensServico)
router.get('/:id', buscarOrdemServicoPorId)
router.post('/', criarOrdemServico)
router.put('/:id', editarOrdemServico)
router.delete('/:id', deletarOrdemServico)

export default router