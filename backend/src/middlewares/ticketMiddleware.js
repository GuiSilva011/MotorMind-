import multer from 'multer';
import { MAX_ARQUIVO } from '../utils/ticketArquivos.js';
import { TicketError, inteiro } from '../utils/ticketRegras.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ARQUIVO, files: 3, fields: 2, fieldSize: 10000, parts: 5 },
});

export const uploadAnexosTicket = upload.array('anexos', 3);

export function validarSessaoTicket(req, res, next) {
  try {
    inteiro(req.user.id);
    inteiro(req.user.oficinaId);
    res.set('Cache-Control', 'no-store');
    next();
  } catch {
    res.status(401).json({ erro: 'Sessão inválida.' });
  }
}

export function tratarErroTicket(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) return res.status(400).json({ erro: 'Envie até 3 anexos de 5 MB e uma mensagem de até 2.000 caracteres.' });
  if (error instanceof TicketError) return res.status(error.status).json({ erro: error.message });
  if (['P2002', 'P2034', 'P2028'].includes(error.code)) return res.status(409).json({ erro: 'Houve um conflito no atendimento. Atualize o ticket antes de tentar novamente.' });
  console.error('Falha na API de tickets:', error.code || error.name);
  return res.status(500).json({ erro: 'Não foi possível concluir a operação do ticket.' });
}
