import express from 'express';
import {login,listarUsuariosTeste,} from '../controllers/authController.js';

const router = express.Router();
/**
 * Rotas de autenticação e usuários de apoio para testes.
 */

// Rotas de autenticação usadas pela tela de login.
router.post('/login', login);
router.get('/usuarios-teste', listarUsuariosTeste);

export default router;