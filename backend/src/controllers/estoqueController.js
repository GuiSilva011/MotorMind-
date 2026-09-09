import prisma from '../config/prisma.js';
import { criarEstoqueService, EstoqueError, inteiro } from '../services/estoqueService.js';

const service = criarEstoqueService(prisma);

function executar(acao, status = 200) {
  return async (req, res) => {
    try {
      const oficinaId = inteiro(req.user?.oficinaId, 'Oficina', 1);
      const usuarioId = inteiro(req.user?.id, 'Usuário', 1);
      const resultado = await acao(req, oficinaId, usuarioId);
      return res.status(status).json(resultado);
    } catch (error) {
      if (error instanceof EstoqueError) return res.status(error.status).json({ erro: error.message });
      if (error.code === 'P2002') return res.status(409).json({ erro: 'Código já utilizado nesta oficina.' });
      if (['P2034', 'P2028'].includes(error.code)) return res.status(409).json({ erro: 'Conflito de movimentação. Atualize a tela e tente novamente.' });
      console.error('Falha no módulo de estoque:', error.code || error.name);
      return res.status(500).json({ erro: 'Não foi possível concluir a operação de estoque.' });
    }
  };
}

const id = req => inteiro(req.params.id, 'ID da peça', 1);
export const listarEstoque = executar((req, oficina) => service.listar(oficina, req.user?.role === 'OPERADOR'));
export const criarPecaEstoque = executar((req, oficina, usuario) => service.criar(oficina, usuario, req.body), 201);
export const editarPecaEstoque = executar((req, oficina) => service.editar(oficina, id(req), req.body));
export const movimentarEstoque = executar((req, oficina, usuario) => service.movimentar(oficina, usuario, id(req), req.body), 201);
export const definirPecaAtiva = executar((req, oficina) => service.definirAtivo(oficina, id(req), req.body?.ativo));
export const listarHistorico = executar((req, oficina) => service.historico(oficina, id(req), inteiro(req.query.pagina ?? 1, 'Página', 1)));
export const listarAlertasEstoque = executar((req, oficina) => service.alertas(oficina));
