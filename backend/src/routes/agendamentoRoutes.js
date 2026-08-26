import express from "express";

import {
  criarAgendamento,
  listarAgendamentos,
  buscarAgendamentoPorId,
  editarAgendamento,
  deletarAgendamento,
} from "../controllers/agendamentoController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", criarAgendamento);
router.get("/", listarAgendamentos);
router.get("/:id", buscarAgendamentoPorId);
router.put("/:id", editarAgendamento);
router.delete("/:id", deletarAgendamento);

export default router;
