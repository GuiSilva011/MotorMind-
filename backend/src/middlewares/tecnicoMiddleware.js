import { TicketError } from '../utils/ticketRegras.js';

export function desativarCacheTecnico(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}

export function tratarErroTecnico(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof TicketError) return res.status(error.status).json({ erro: error.message });
  console.error('Falha na consulta do painel técnico:', error.code || error.name);
  return res.status(500).json({ erro: 'Não foi possível consultar os dados técnicos.' });
}
