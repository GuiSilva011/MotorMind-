import express from "express";

import {
  criarFuncionario,
  listarFuncionarios,
  buscarFuncionarioPorId,
  atualizarFuncionario,
  deletarFuncionario,
} from "../controllers/funcionarioController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", criarFuncionario);
router.get("/", listarFuncionarios);
router.get("/:id", buscarFuncionarioPorId);
router.put("/:id", atualizarFuncionario);
router.delete("/:id", deletarFuncionario);

export default router;
