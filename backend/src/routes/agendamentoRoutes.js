import express from 'express';
import {criarAgendamento,listarAgendamentos,buscarAgendamentoPorId,editarAgendamento,deletarAgendamento} from '../controllers/agendamentoController.js';

const router = express.Router();
/**
 * Rotas de agendamentos expostas pela API.
 */

// Rotas de agendamento usadas pelo calendário e pela tela de cadastro.
router.post('/', criarAgendamento);
router.get('/', listarAgendamentos);
router.get('/:id', buscarAgendamentoPorId);
router.delete('/:id', deletarAgendamento);

export default router;