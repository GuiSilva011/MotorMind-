import express from 'express'
import {criarVeiculo, deletarVeiculo, editarVeiculo, listarVeiculo} from '../controllers/veiculoController.js'

const router = express.Router()

router.post('/', criarVeiculo)
router.get('/', listarVeiculo)
router.put('/:id',editarVeiculo)
router.delete('/:id', deletarVeiculo)

export default router;