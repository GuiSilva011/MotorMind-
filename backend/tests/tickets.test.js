import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { TicketError, inteiro, texto, chave, validarItens, validarAcesso, validarChat, validarTransicao, PRAZO_CHAT_MS, OS_ENCERRADA } from '../src/services/ticketRegras.js';
import { arquivosTicket, caminhoAnexo, limparChatExpirado, tipoArquivo } from '../src/services/ticketArquivos.js';
import { criarTicketService, notificarTicket } from '../src/services/ticketService.js';

const tecnico = { id: 1, oficinaId: 10, role: 'TECNICO' };
const operador = { id: 2, oficinaId: 10, role: 'OPERADOR' };
const ticket = { id: 5, oficinaId: 10, ordemServicoId: 20, solicitanteId: 1, responsavelId: 2, status: 'EM_ATENDIMENTO', ordemServico: { tecnicoId: 1, status: 'ABERTA' } };
const erro = status => error => error instanceof TicketError && error.status === status;

test('quantidades e IDs são inteiros positivos, não booleanos ou frações', () => {
  assert.equal(inteiro('2'), 2);
  for (const invalido of [0, -1, 1.2, '', null, true, {}, '1e2', ' 1', 2147483648]) assert.throws(() => inteiro(invalido), erro(400));
});
test('itens só recebem nome, quantidade e observação, sem IDs de estoque enviados pelo navegador', () => {
  assert.deepEqual(validarItens([{ nomePeca: ' Filtro ', quantidadeSolicitada: '2', estoquePecaId: 90 }]), [{ nomePeca: 'Filtro', quantidadeSolicitada: 2, observacao: null }]);
  for (const lista of [[], null, [{}], Array.from({ length: 21 }, () => ({ nomePeca: 'Filtro', quantidadeSolicitada: 1 }))]) assert.throws(() => validarItens(lista), erro(400));
});
test('limites de texto e chave idempotente são validados', () => {
  assert.equal(texto('  mensagem ', 20, 'Mensagem'), 'mensagem');
  assert.throws(() => texto('a'.repeat(2001), 2000, 'Mensagem'), erro(400));
  assert.throws(() => texto({}, 20, 'Mensagem'), erro(400));
  assert.equal(chave(randomUUID()).length, 36);
  assert.throws(() => chave('../arquivo'), erro(400));
});
test('ticket de outra oficina e de outro técnico retornam 404', () => {
  assert.doesNotThrow(() => validarAcesso(ticket, tecnico));
  assert.doesNotThrow(() => validarAcesso(ticket, operador));
  assert.throws(() => validarAcesso(ticket, { ...operador, oficinaId: 11 }), erro(404));
  assert.throws(() => validarAcesso(ticket, { ...tecnico, id: 3 }), erro(404));
});
test('chat é exclusivo dos dois participantes, inclusive para admin', () => {
  assert.doesNotThrow(() => validarChat(ticket, tecnico, true));
  assert.doesNotThrow(() => validarChat(ticket, operador, true));
  assert.throws(() => validarChat(ticket, { ...operador, id: 3 }), erro(403));
  assert.throws(() => validarChat(ticket, { ...operador, id: 3, role: 'ADMIN' }), erro(403));
});
test('chat aguarda responsável, encerra a escrita e preserva a leitura histórica', () => {
  assert.throws(() => validarChat({ ...ticket, responsavelId: null }, tecnico, true), erro(409));
  assert.throws(() => validarChat({ ...ticket, status: 'ENTREGUE' }, tecnico, true), erro(409));
  assert.doesNotThrow(() => validarChat({ ...ticket, status: 'ENTREGUE' }, tecnico));
  assert.throws(() => validarChat({ ...ticket, ordemServico: { tecnicoId: 3, status: 'ABERTA' } }, tecnico, true), erro(403));
  assert.throws(() => validarChat({ ...ticket, ordemServico: { tecnicoId: 1, status: 'FECHADA' } }, operador, true), erro(409));
  assert.throws(() => validarChat({ ...ticket, ordemServico: { tecnicoId: 1, status: 'FINALIZADA' } }, operador, true), erro(409));
  assert.ok(OS_ENCERRADA.includes('FINALIZADA'));
});
test('status não pode pular disponibilidade, reabrir concluído nem ser alterado por outro operador', () => {
  assert.doesNotThrow(() => validarTransicao(ticket, operador, 'DISPONIVEL'));
  assert.throws(() => validarTransicao(ticket, operador, 'ENTREGUE'), erro(409));
  assert.throws(() => validarTransicao(ticket, { ...operador, id: 3 }, 'DISPONIVEL'), erro(403));
  assert.throws(() => validarTransicao({ ...ticket, status: 'ENTREGUE' }, operador, 'EM_ATENDIMENTO'), erro(409));
  assert.throws(() => validarTransicao(ticket, operador, 'CANCELADA'), erro(400));
});
test('solicitante pode cancelar antes de alguém assumir, com motivo', () => {
  assert.doesNotThrow(() => validarTransicao({ ...ticket, status: 'ABERTA', responsavelId: null }, tecnico, 'CANCELADA', 'Pedido duplicado'));
  assert.throws(() => validarTransicao(ticket, tecnico, 'CANCELADA', 'Pedido duplicado'), erro(403));
});
test('validação de anexos verifica assinatura, MIME, tamanho e caminho privado', () => {
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(tipoArquivo(png), 'image/png');
  assert.doesNotThrow(() => arquivosTicket.validar([{ buffer: png, mimetype: 'image/png' }]));
  assert.throws(() => arquivosTicket.validar([{ buffer: png, mimetype: 'application/pdf' }]), erro(400));
  assert.throws(() => arquivosTicket.validar([{ buffer: Buffer.from('<svg/>'), mimetype: 'image/svg+xml' }]), erro(400));
  assert.throws(() => arquivosTicket.validar([{ buffer: Buffer.alloc(5 * 1024 * 1024 + 1), mimetype: 'image/png' }]), erro(400));
  for (const nome of ['../../.env', 'C:\\Windows\\arquivo', '/uploads/a', 'arquivo.pdf']) assert.throws(() => caminhoAnexo(nome), erro(404));
});
test('expiração remove arquivos antes das mensagens e não toca registros permanentes', async () => {
  const operacoes = [];
  const db = { mensagemTicket: {
    findMany: async ({ where }) => where.id.gt === 0 ? [{ id: 1, anexos: [{ url: 'arquivo' }] }] : [],
    deleteMany: async () => operacoes.push('mensagem'),
  } };
  const removidas = await limparChatExpirado(db, { remover: async () => operacoes.push('arquivo') });
  assert.equal(PRAZO_CHAT_MS, 172800000);
  assert.equal(removidas, 1); assert.deepEqual(operacoes, ['arquivo', 'mensagem']);
});
test('falha na remoção do arquivo preserva a mensagem para nova tentativa', async t => {
  t.mock.method(console, 'error', () => {});
  let apagou = false;
  const db = { mensagemTicket: { findMany: async ({ where }) => where.id.gt === 0 ? [{ id: 1, anexos: [{ url: 'arquivo' }] }] : [], deleteMany: async () => { apagou = true; } } };
  assert.equal(await limparChatExpirado(db, { remover: async () => { throw new Error('Sem acesso'); } }), 0);
  assert.equal(apagou, false);
});
test('assumir usa atualização condicionada e rejeita disputa sem criar histórico', async () => {
  let condicao;
  const db = {
    $transaction: async fn => fn(db), $queryRaw: async () => [{ id: 5 }],
    requisicaoPeca: { findFirst: async () => ({ ...ticket, responsavelId: null, status: 'ABERTA' }), updateMany: async args => { condicao = args.where; return { count: 0 }; } },
  };
  await assert.rejects(criarTicketService(db).assumir(operador, 5), erro(409));
  assert.deepEqual(condicao, { id: 5, oficinaId: 10, responsavelId: null, status: 'ABERTA' });
});
test('notificação respeita configuração e limita destinatários à oficina', async () => {
  let filtro; let dados;
  const db = { configuracaoOficina: { findUnique: async () => null }, usuario: { findMany: async ({ where }) => { filtro = where; return [{ id: 2 }]; } }, notificacao: { create: async ({ data }) => { dados = data; } } };
  await notificarTicket(db, { oficinaId: 10, tipo: 'REQUISICAO_PECA', titulo: 'Ticket', mensagem: 'Solicitação' });
  assert.deepEqual(filtro, { oficinaId: 10, Role: 'OPERADOR' });
  assert.deepEqual(dados.usuarios.create, [{ usuarioId: 2 }]);
  db.configuracaoOficina.findUnique = async () => ({ notificarChatSistema: false });
  dados = null;
  await notificarTicket(db, { oficinaId: 10, tipo: 'MENSAGEM_TICKET' });
  assert.equal(dados, null);
});
