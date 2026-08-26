import express from "express";

import {
  listarServicos,
  buscarServicoPorNome,
  criarServico,
  editarServico,
  deletarServico,
} from "../controllers/servicosController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listarServicos);
router.get("/buscar-por-nome", buscarServicoPorNome);
router.post("/", criarServico);
router.put("/:id", editarServico);
router.delete("/:id", deletarServico);

export default router;
