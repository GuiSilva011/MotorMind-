import express from 'express';
import multer from 'multer';
import prisma from '../config/prisma.js';
import { authMiddleware, authorizeRoles } from '../middlewares/authMiddleware.js';
import { criarTicketService } from '../services/ticketService.js';
import { arquivosTicket, caminhoAnexo, MAX_ARQUIVO } from '../services/ticketArquivos.js';
import { TicketError, inteiro } from '../services/ticketRegras.js';

const router = express.Router();
const service = criarTicketService(prisma, arquivosTicket);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_ARQUIVO, files: 3, fields: 2, fieldSize: 10000, parts: 5 } });
const acao = (fn, codigo = 200) => async (req, res, next) => {
  try { res.status(codigo).json(await fn(req)); } catch (error) { next(error); }
};

function filtroNotificacoes(usuario) {
  return { usuarioId: usuario.id, notificacao: {
    oficinaId: usuario.oficinaId, tipo: { not: 'ESTOQUE_BAIXO' },
    OR: [{ requisicaoPecaId: { not: null } }, { tipo: 'ORDEM_ATRIBUIDA' }],
    AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
  } };
}

router.use(authMiddleware, authorizeRoles('TECNICO', 'OPERADOR', 'ADMIN'));
router.use((req, res, next) => {
  try { inteiro(req.user.id); inteiro(req.user.oficinaId); res.set('Cache-Control', 'no-store'); next(); }
  catch { res.status(401).json({ erro: 'Sessão inválida.' }); }
});

router.get('/tecnicos', authorizeRoles('OPERADOR', 'ADMIN'), acao(req => prisma.usuario.findMany({ where: { oficinaId: req.user.oficinaId, Role: 'TECNICO' }, select: { id: true, Nome: true }, orderBy: { Nome: 'asc' } })));
router.get('/ordens', acao(req => service.ordens(req.user)));
router.get('/notificacoes', acao(async req => {
  const where = filtroNotificacoes(req.user);
  const [itens, naoLidas] = await prisma.$transaction([
    prisma.notificacaoUsuario.findMany({ where, include: { notificacao: true }, orderBy: { id: 'desc' }, take: 30 }),
    prisma.notificacaoUsuario.count({ where: { ...where, lidaEm: null } }),
  ]);
  return { itens, naoLidas };
}));
router.patch('/notificacoes/lidas', acao(async req => {
  await prisma.notificacaoUsuario.updateMany({ where: { ...filtroNotificacoes(req.user), lidaEm: null }, data: { lidaEm: new Date() } });
  return { ok: true };
}));
router.patch('/notificacoes/:id/lida', acao(async req => {
  const resultado = await prisma.notificacaoUsuario.updateMany({ where: { ...filtroNotificacoes(req.user), id: inteiro(req.params.id) }, data: { lidaEm: new Date() } });
  if (!resultado.count) throw new TicketError(404, 'Notificação não encontrada.');
  return { ok: true };
}));
router.get('/', acao(req => service.listar(req.user, req.query)));
router.post('/', acao(req => service.abrir(req.user, req.body || {}), 201));
router.get('/:id', acao(req => service.detalhe(req.user, req.params.id)));
router.post('/:id/assumir', acao(req => service.assumir(req.user, req.params.id)));
router.patch('/:id/status', acao(req => service.status(req.user, req.params.id, req.body || {})));
router.get('/:id/mensagens', acao(req => service.mensagens(req.user, req.params.id, req.query.antesDe)));
router.post('/:id/mensagens', async (req, res, next) => {
  try { await service.autorizarChat(req.user, req.params.id, true); next(); } catch (error) { next(error); }
}, upload.array('anexos', 3), acao(req => service.enviar(req.user, req.params.id, req.body || {}, req.files), 201));
router.get('/:id/anexos/:anexoId', async (req, res, next) => {
  try {
    const anexo = await service.anexo(req.user, req.params.id, req.params.anexoId);
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Content-Type': anexo.mimeType, 'Cache-Control': 'no-store' });
    res.download(caminhoAnexo(anexo.url), anexo.nomeArquivo || 'anexo', error => {
      if (error && !res.headersSent) next(error.code === 'ENOENT' ? new TicketError(404, 'Anexo não encontrado ou expirado.') : error);
    });
  } catch (error) { next(error); }
});

router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof multer.MulterError) return res.status(400).json({ erro: 'Envie até 3 anexos de 5 MB e uma mensagem de até 2.000 caracteres.' });
  if (error instanceof TicketError) return res.status(error.status).json({ erro: error.message });
  if (['P2002', 'P2034', 'P2028'].includes(error.code)) return res.status(409).json({ erro: 'Houve um conflito no atendimento. Atualize o ticket antes de tentar novamente.' });
  console.error('Falha na API de tickets:', error.code || error.name);
  return res.status(500).json({ erro: 'Não foi possível concluir a operação do ticket.' });
});

export default router;
