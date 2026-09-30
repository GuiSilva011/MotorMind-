import express from "express";

import {
  criarFuncionario,
  listarFuncionarios,
  buscarFuncionarioPorId,
  atualizarFuncionario,
  deletarFuncionario,
} from "../controllers/funcionarioController.js";

import { authMiddleware, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", authorizeRoles('ADMIN'), criarFuncionario);
router.get("/", listarFuncionarios);
router.get("/:id", buscarFuncionarioPorId);
router.put("/:id", authorizeRoles('ADMIN'), atualizarFuncionario);
router.delete("/:id", authorizeRoles('ADMIN'), deletarFuncionario);

export default router;
