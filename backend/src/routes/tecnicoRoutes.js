import express from 'express';
import prisma from '../config/prisma.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import { criarTecnicoService } from '../services/tecnicoService.js';
import { TicketError } from '../utils/ticketRegras.js';

const router = express.Router();
const service = criarTecnicoService(prisma);
router.use(authMiddleware, authorizeRoles('TECNICO'));
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const consultar = fn => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (error) { next(error); }
};
router.get('/veiculos', consultar(req => service.veiculos(req.user)));
router.get('/ordens/:id', consultar(req => service.ordem(req.user, req.params.id)));
router.get('/veiculos/:veiculoId/historico', consultar(req => service.historico(req.user, req.params.veiculoId)));
router.get('/veiculos/:veiculoId/historico/:ordemId', consultar(req => service.historico(req.user, req.params.veiculoId, req.params.ordemId)));
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof TicketError) return res.status(error.status).json({ erro: error.message });
  console.error('Falha na consulta do painel técnico:', error.code || error.name);
  res.status(500).json({ erro: 'Não foi possível consultar os dados técnicos.' });
});
export default router;
