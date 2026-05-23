import express from 'express'
import {listarDiagnosticos,buscarDiagnosticoPorNome,criarDiagnostico,editarDiagnostico,deletarDiagnostico} from '../controllers/diagnosticoController.js'

const router = express.Router()

router.get('/', listarDiagnosticos)
router.get('/buscar-por-nome', buscarDiagnosticoPorNome)
router.post('/', criarDiagnostico)
router.put('/:id', editarDiagnostico)
router.delete('/:id', deletarDiagnostico)

export default router