import express from 'express'
import {criarCliente, deletarClientes, editarClientes, listarClientes} from '../controllers/clienteController.js'

const router = express.Router()

router.get('/', listarClientes);
router.post('/', criarCliente);
router.put('/:id', editarClientes);
router.delete('/:id', deletarClientes);

export default router;

