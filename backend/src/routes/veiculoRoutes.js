import express from "express";

import {
  criarVeiculo,
  deletarVeiculo,
  editarVeiculo,
  listarVeiculo,
  buscarVeiculosParaOS,
} from "../controllers/veiculoController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", criarVeiculo);
router.get("/", listarVeiculo);
router.get("/buscar-para-os", buscarVeiculosParaOS);
router.put("/:id", editarVeiculo);
router.delete("/:id", deletarVeiculo);

export default router;
