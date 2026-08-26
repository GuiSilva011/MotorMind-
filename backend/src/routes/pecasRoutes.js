import express from "express";

import {
  listarPecas,
  buscarPecaPorNome,
  criarPeca,
  editarPeca,
  deletarPeca,
} from "../controllers/pecasController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listarPecas);
router.get("/buscar-por-nome", buscarPecaPorNome);
router.post("/", criarPeca);
router.put("/:id", editarPeca);
router.delete("/:id", deletarPeca);

export default router;
