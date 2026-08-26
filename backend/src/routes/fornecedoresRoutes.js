import express from "express";

import {
  listarFornecedores,
  buscarFornecedorPorNome,
  criarFornecedor,
  editarFornecedor,
  deletarFornecedor,
} from "../controllers/fornecedorController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", listarFornecedores);
router.get("/buscar-por-nome", buscarFornecedorPorNome);
router.post("/", criarFornecedor);
router.put("/:id", editarFornecedor);
router.delete("/:id", deletarFornecedor);

export default router;
