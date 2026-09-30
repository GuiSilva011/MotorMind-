import express from "express";

import {
  login,
  me,
} from "../controllers/authController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { criarCadastroOficina } from "../controllers/cadastroOficinaController.js";
import { criarLimitadorCadastro } from "../middlewares/limitarCadastroOficina.js";

const router = express.Router();

router.post("/login", login);
router.post("/cadastro-oficina", criarLimitadorCadastro(), criarCadastroOficina);
router.get("/me", authMiddleware, me);

export default router;
