import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import {
  criarChecklist,
  listarChecklistsPorVeiculo,
  buscarChecklistPorId,
  deletarChecklist,
} from '../controllers/checklistController.js';

const router = express.Router();

const uploadDir = path.resolve('uploads/checklists');

// Garante que a pasta de uploads exista antes de receber fotos.
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// Configura o nome e o destino dos arquivos enviados na checklist.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname);
    const nomeArquivo = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extensao}`;

    cb(null, nomeArquivo);
  },
});

const upload = multer({
  storage,
});
/**
 * Rotas de checklist, incluindo upload de imagens e consultas por veículo.
 */

// Rotas de checklist, incluindo upload de imagens em múltiplos campos.
router.post(
  '/',
  upload.fields([
    { name: 'fotoFrente', maxCount: 1 },
    { name: 'fotoTraseira', maxCount: 1 },
    { name: 'fotoEsquerda', maxCount: 1 },
    { name: 'fotoDireita', maxCount: 1 },
  ]),
  criarChecklist
);

router.get('/veiculo/:veiculoId', listarChecklistsPorVeiculo);
router.get('/:id', buscarChecklistPorId);
router.delete('/:id', deletarChecklist);

export default router;