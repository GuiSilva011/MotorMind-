import express from 'express';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import { desativarCacheTecnico, tratarErroTecnico } from '../middlewares/tecnicoMiddleware.js';
import {
  listarVeiculosTecnico,
  buscarOrdemTecnica,
  consultarHistoricoTecnico,
} from '../controllers/tecnicoController.js';

const router = express.Router();

router.use(authMiddleware, authorizeRoles('TECNICO'), desativarCacheTecnico);

router.get('/veiculos', listarVeiculosTecnico);
router.get('/ordens/:id', buscarOrdemTecnica);
router.get('/veiculos/:veiculoId/historico', consultarHistoricoTecnico);
router.get('/veiculos/:veiculoId/historico/:ordemId', consultarHistoricoTecnico);

router.use(tratarErroTecnico);

export default router;
