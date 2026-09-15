import express from 'express';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import { validarSessaoTicket, uploadAnexosTicket, tratarErroTicket } from '../middlewares/ticketMiddleware.js';
import {
  listarTecnicosTicket,
  listarOrdensTicket,
  listarNotificacoesTicket,
  marcarNotificacoesTicketLidas,
  marcarNotificacaoTicketLida,
  listarTickets,
  criarTicket,
  buscarTicketPorId,
  assumirTicket,
  atualizarStatusTicket,
  autorizarEnvioMensagem,
  listarMensagensTicket,
  enviarMensagemTicket,
  baixarAnexoTicket,
} from '../controllers/ticketController.js';

const router = express.Router();

router.use(authMiddleware, authorizeRoles('TECNICO', 'OPERADOR', 'ADMIN'), validarSessaoTicket);

router.get('/tecnicos', authorizeRoles('OPERADOR', 'ADMIN'), listarTecnicosTicket);
router.get('/ordens', listarOrdensTicket);
router.get('/notificacoes', listarNotificacoesTicket);
router.patch('/notificacoes/lidas', marcarNotificacoesTicketLidas);
router.patch('/notificacoes/:id/lida', marcarNotificacaoTicketLida);
router.get('/', listarTickets);
router.post('/', criarTicket);
router.get('/:id', buscarTicketPorId);
router.post('/:id/assumir', assumirTicket);
router.patch('/:id/status', atualizarStatusTicket);
router.get('/:id/mensagens', listarMensagensTicket);
router.post('/:id/mensagens', autorizarEnvioMensagem, uploadAnexosTicket, enviarMensagemTicket);
router.get('/:id/anexos/:anexoId', baixarAnexoTicket);

router.use(tratarErroTicket);

export default router;
