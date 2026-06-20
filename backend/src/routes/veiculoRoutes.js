import express from 'express'
import {criarVeiculo, deletarVeiculo, editarVeiculo, listarVeiculo,buscarVeiculosParaOS} from '../controllers/veiculoController.js'

const router = express.Router()
/**
 * Rotas de veículos com CRUD e consulta para ordem de serviço.
 */

// Rotas de CRUD de veículos e busca para ordem de serviço.
router.post('/', criarVeiculo)
router.get('/', listarVeiculo)
router.put('/:id',editarVeiculo)
router.delete('/:id', deletarVeiculo)
router.get('/buscar-para-os', buscarVeiculosParaOS)

export default router;