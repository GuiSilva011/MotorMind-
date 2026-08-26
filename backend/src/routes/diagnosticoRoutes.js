import express from "express";

import {
  listarDiagnosticos,
  buscarDiagnosticoPorNome,
  criarDiagnostico,
  editarDiagnostico,
  deletarDiagnostico,
} from "../controllers/diagnosticoController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listarDiagnosticos);
router.get("/buscar-por-nome", buscarDiagnosticoPorNome);
router.post("/", criarDiagnostico);
router.put("/:id", editarDiagnostico);
router.delete("/:id", deletarDiagnostico);

export default router;
