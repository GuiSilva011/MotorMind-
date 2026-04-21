import express from 'express'
import {criarCliente} from '../controllers/clienteController.js'

const router = express.Router()

router.post('/', criarCliente)

export default router;

