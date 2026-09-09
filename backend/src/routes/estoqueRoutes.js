import { Router } from 'express';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import { listarEstoque, criarPecaEstoque, editarPecaEstoque, movimentarEstoque,
  definirPecaAtiva, listarHistorico, listarAlertasEstoque } from '../controllers/estoqueController.js';

const router = Router();
router.use(authMiddleware, authorizeRoles('ADMIN', 'OPERADOR'));
router.get('/', listarEstoque);
router.get('/alertas', listarAlertasEstoque);
router.get('/:id/movimentacoes', authorizeRoles('ADMIN'), listarHistorico);
router.post('/', authorizeRoles('ADMIN'), criarPecaEstoque);
router.put('/:id', authorizeRoles('ADMIN'), editarPecaEstoque);
router.patch('/:id/ativo', authorizeRoles('ADMIN'), definirPecaAtiva);
router.post('/:id/movimentacoes', authorizeRoles('ADMIN'), movimentarEstoque);

export default router;
