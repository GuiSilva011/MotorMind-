import express from "express";

import {
  listarOrdensServico,
  buscarOrdensServico,
  buscarOrdemServicoPorId,
  criarOrdemServico,
  editarOrdemServico,
  deletarOrdemServico,
  gerarProximoCodigoOS,
} from "../controllers/ordemServicoController.js";

import { authMiddleware, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listarOrdensServico);
router.get("/proximo-codigo", gerarProximoCodigoOS);
router.get("/buscar", buscarOrdensServico);
router.get("/:id", buscarOrdemServicoPorId);
router.post("/", authorizeRoles('ADMIN', 'OPERADOR'), criarOrdemServico);
router.put("/:id", authorizeRoles('ADMIN', 'OPERADOR'), editarOrdemServico);
router.delete("/:id", authorizeRoles('ADMIN', 'OPERADOR'), deletarOrdemServico);

export default router;
