import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';

// Opt-in: cria e remove SOMENTE um schema descartável de nome aleatório.
test('tickets e chat via HTTP/PostgreSQL isolado', { skip: process.env.MOTORMIND_TESTE_TICKETS !== '1', timeout: 120000 }, async t => {
  dotenv.config({ quiet: true });
  const urlOriginal = process.env.DATABASE_URL;
  assert.ok(urlOriginal, 'Configure o PostgreSQL de desenvolvimento.');
  const schemaTeste = `tickets_test_${randomUUID().replaceAll('-', '')}`;
  assert.match(schemaTeste, /^tickets_test_[a-f0-9]{32}$/);
  const urlTeste = new URL(urlOriginal);
  assert.notEqual(urlTeste.searchParams.get('schema'), schemaTeste);
  urlTeste.searchParams.set('schema', schemaTeste);
  const admin = new PrismaClient({ datasources: { db: { url: urlOriginal } } });
  let criado = false;
  let db; let servidor; let arquivos;
  try {
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schemaTeste}"`);
    criado = true;
    process.env.DATABASE_URL = urlTeste.toString();
    process.env.JWT_SECRET = randomUUID();
    const migration = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, encoding: 'utf8', windowsHide: true, timeout: 60000 });
    assert.equal(migration.status, 0, 'Não foi possível aplicar as migrations no schema descartável. Nenhum schema de negócio foi alterado.');
    db = (await import('../src/config/prisma.js')).default;
    arquivos = await import('../src/services/ticketArquivos.js');
    const tickets = (await import('../src/routes/ticketRoutes.js')).default;
    const ordens = (await import('../src/routes/ordemServicoRoutes.js')).default;
    const app = express(); app.use(express.json()); app.use('/tickets', tickets); app.use('/ordens-servico', ordens);
    servidor = app.listen(0, '127.0.0.1');
    await new Promise(resolve => servidor.once('listening', resolve));
    const base = `http://127.0.0.1:${servidor.address().port}`;
    const oficina = await db.oficina.create({ data: { nomeFantasia: 'Oficina sintética A' } });
    const outraOficina = await db.oficina.create({ data: { nomeFantasia: 'Oficina sintética B' } });
    async function usuario(nome, role, oficinaId = oficina.id) {
      const u = await db.usuario.create({ data: { Nome: nome, Email: `${nome}@example.invalid`, Senha: 'sem-login-de-teste', Role: role, oficinaId } });
      return { id: u.id, oficinaId, role };
    }
    const tecnico = await usuario('tecnico1', 'TECNICO');
    const tecnico2 = await usuario('tecnico2', 'TECNICO');
    const op1 = await usuario('operador1', 'OPERADOR');
    const op2 = await usuario('operador2', 'OPERADOR');
    const opOutra = await usuario('operadorOutra', 'OPERADOR', outraOficina.id);
    const cliente = await db.cliente.create({ data: { oficinaId: oficina.id, nome: 'Cliente sintético' } });
    const veiculo = await db.veiculo.create({ data: { oficinaId: oficina.id, clienteId: cliente.id, placa: 'TST0001', modelo: 'Veículo de teste' } });
    async function call(u, method, rota, body) {
      const headers = u ? { Authorization: `Bearer ${jwt.sign({ oficinaId: u.oficinaId, role: u.role }, process.env.JWT_SECRET, { subject: String(u.id), expiresIn: '1h' })}` } : {};
      if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
      const response = await fetch(`${base}${rota}`, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
      const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.arrayBuffer();
      return { status: response.status, data };
    }
    const criada = await call(op1, 'POST', '/ordens-servico', { codigo: 'OS-TESTE', veiculoId: veiculo.id, tecnicoId: tecnico.id });
    assert.equal(criada.status, 201);
    const os = criada.data;
    const pedido = { ordemServicoId: os.id, chaveAbertura: randomUUID(), itens: [{ nomePeca: 'Filtro sintético', quantidadeSolicitada: 2 }] };
    let ticket; let responsavel; let outroOperador;

    await t.test('atribuição da OS usa o técnico escolhido e registra histórico', async () => {
      assert.equal(os.tecnicoId, tecnico.id); assert.equal(os.operadorId, op1.id);
      assert.equal(await db.ordemServicoAtribuicao.count({ where: { ordemServicoId: os.id, tecnicoId: tecnico.id, ativa: true } }), 1);
      assert.equal((await call(tecnico, 'GET', '/tickets/ordens')).data.length, 1);
      assert.equal((await call(tecnico2, 'GET', '/tickets/ordens')).data.length, 0);
      assert.equal((await call(tecnico2, 'GET', `/ordens-servico/${os.id}`)).status, 404);
    });
    await t.test('autenticação, oficina, técnico atribuído e quantidade são validados', async () => {
      assert.equal((await call(null, 'GET', '/tickets')).status, 401);
      assert.equal((await call(op1, 'POST', '/tickets', pedido)).status, 403);
      assert.equal((await call(tecnico2, 'POST', '/tickets', pedido)).status, 403);
      assert.equal((await call(tecnico, 'POST', '/tickets', { ...pedido, itens: [{ nomePeca: 'Filtro', quantidadeSolicitada: 0 }] })).status, 400);
    });
    await t.test('abertura concorrente com a mesma chave gera um único ticket', async () => {
      const resultados = await Promise.all([call(tecnico, 'POST', '/tickets', pedido), call(tecnico, 'POST', '/tickets', pedido)]);
      assert.deepEqual(resultados.map(r => r.status), [201, 201]);
      assert.equal(resultados[0].data.id, resultados[1].data.id);
      ticket = resultados[0].data;
      assert.match(ticket.codigo, /^TKT-\d+$/);
      assert.equal(await db.requisicaoPeca.count(), 1);
      const notifs = await db.notificacaoUsuario.findMany({ where: { notificacao: { requisicaoPecaId: ticket.id, tipo: 'REQUISICAO_PECA' } } });
      assert.deepEqual(notifs.map(n => n.usuarioId).sort(), [op1.id, op2.id].sort());
    });
    await t.test('outra oficina e outro técnico não veem ticket nem mensagens', async () => {
      assert.equal((await call(opOutra, 'GET', `/tickets/${ticket.id}`)).status, 404);
      assert.equal((await call(tecnico2, 'GET', `/tickets/${ticket.id}/mensagens`)).status, 404);
      assert.equal((await call(opOutra, 'GET', '/tickets')).data.total, 0);
    });
    await t.test('dois operadores disputam o ticket: apenas um assume', async () => {
      const resultados = await Promise.all([call(op1, 'POST', `/tickets/${ticket.id}/assumir`), call(op2, 'POST', `/tickets/${ticket.id}/assumir`)]);
      assert.deepEqual(resultados.map(r => r.status).sort(), [200, 409]);
      responsavel = resultados[0].status === 200 ? op1 : op2;
      outroOperador = responsavel === op1 ? op2 : op1;
      assert.equal(await db.requisicaoPecaHistorico.count({ where: { requisicaoPecaId: ticket.id } }), 2);
      assert.equal((await call(outroOperador, 'GET', `/tickets/${ticket.id}/mensagens`)).status, 403);
    });
    await t.test('OS com ticket pendente não pode fechar, trocar técnico ou ser excluída', async () => {
      assert.equal((await call(op1, 'PUT', `/ordens-servico/${os.id}`, { status: 'FECHADA' })).status, 409);
      assert.equal((await call(op1, 'PUT', `/ordens-servico/${os.id}`, { tecnicoId: tecnico2.id })).status, 409);
      assert.equal((await call(op1, 'DELETE', `/ordens-servico/${os.id}`)).status, 409);
      assert.equal((await db.ordemServico.findUnique({ where: { id: os.id } })).tecnicoId, tecnico.id);
    });
    await t.test('envio idempotente, leitura pelos participantes e expiração em 48 horas', async () => {
      const body = { conteudo: 'Mensagem sintética', chaveEnvio: randomUUID() };
      const resultados = await Promise.all([call(tecnico, 'POST', `/tickets/${ticket.id}/mensagens`, body), call(tecnico, 'POST', `/tickets/${ticket.id}/mensagens`, body)]);
      assert.deepEqual(resultados.map(r => r.status), [201, 201]);
      assert.equal(resultados[0].data.id, resultados[1].data.id);
      const prazo = new Date(resultados[0].data.expiresAt) - new Date(resultados[0].data.createdAt);
      assert.ok(Math.abs(prazo - 172800000) < 2000);
      assert.equal((await call(responsavel, 'GET', `/tickets/${ticket.id}/mensagens`)).data.itens.length, 1);
      assert.equal((await call(outroOperador, 'POST', `/tickets/${ticket.id}/mensagens`, body)).status, 403);
    });
    await t.test('anexos são privados, expiram e são removidos sem apagar o ticket/histórico', async () => {
      const form = new FormData(); form.append('chaveEnvio', randomUUID()); form.append('conteudo', 'Anexo sintético');
      form.append('anexos', new Blob(['%PDF-1.4\n%%EOF'], { type: 'application/pdf' }), 'teste.pdf');
      const resposta = await call(responsavel, 'POST', `/tickets/${ticket.id}/mensagens`, form);
      assert.equal(resposta.status, 201);
      const mensagem = resposta.data;
      const anexo = await db.mensagemAnexo.findUnique({ where: { id: mensagem.anexos[0].id } });
      const rota = `/tickets/${ticket.id}/anexos/${anexo.id}`;
      assert.equal((await call(tecnico, 'GET', rota)).status, 200);
      assert.equal((await call(outroOperador, 'GET', rota)).status, 403);
      assert.equal((await call(opOutra, 'GET', rota)).status, 404);
      await db.mensagemTicket.update({ where: { id: mensagem.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
      assert.equal((await call(tecnico, 'GET', rota)).status, 404);
      assert.equal((await call(tecnico, 'GET', `/tickets/${ticket.id}/mensagens`)).data.itens.some(m => m.id === mensagem.id), false);
      assert.equal((await call(responsavel, 'POST', `/tickets/${ticket.id}/mensagens`, { conteudo: 'Anexo sintético', chaveEnvio: form.get('chaveEnvio') })).status, 409);
      const historicos = await db.requisicaoPecaHistorico.count();
      await arquivos.limparChatExpirado(db);
      await assert.rejects(access(arquivos.caminhoAnexo(anexo.url)), { code: 'ENOENT' });
      assert.equal(await db.mensagemAnexo.count({ where: { id: anexo.id } }), 0);
      assert.equal(await db.requisicaoPeca.count(), 1);
      assert.equal(await db.requisicaoPecaHistorico.count(), historicos);
    });
    await t.test('leitura de notificações é individual e não altera estoque', async () => {
      const lista = (await call(responsavel, 'GET', '/tickets/notificacoes')).data;
      assert.ok(lista.naoLidas > 0);
      const id = lista.itens[0].id;
      assert.equal((await call(outroOperador, 'PATCH', `/tickets/notificacoes/${id}/lida`)).status, 404);
      assert.equal((await call(responsavel, 'PATCH', `/tickets/notificacoes/${id}/lida`)).status, 200);
      const estoque = await db.notificacao.create({ data: { oficinaId: oficina.id, tipo: 'ESTOQUE_BAIXO', titulo: 'Teste estoque', mensagem: 'Aviso sintético', usuarios: { create: { usuarioId: responsavel.id } } } });
      assert.equal((await call(responsavel, 'PATCH', '/tickets/notificacoes/lidas')).status, 200);
      assert.equal((await call(responsavel, 'GET', '/tickets/notificacoes')).data.naoLidas, 0);
      assert.equal((await db.notificacaoUsuario.findFirst({ where: { notificacaoId: estoque.id } })).lidaEm, null);
      assert.equal(await db.estoqueMovimentacao.count(), 0);
    });
    await t.test('entrega exige disponibilidade, preserva histórico e permite encerrar OS', async () => {
      assert.equal((await call(responsavel, 'PATCH', `/tickets/${ticket.id}/status`, { status: 'ENTREGUE' })).status, 409);
      for (const status of ['AGUARDANDO_PECA', 'DISPONIVEL', 'ENTREGUE']) assert.equal((await call(responsavel, 'PATCH', `/tickets/${ticket.id}/status`, { status, motivo: 'Registro sintético' })).status, 200);
      assert.equal((await call(tecnico, 'POST', `/tickets/${ticket.id}/mensagens`, { conteudo: 'Encerrado', chaveEnvio: randomUUID() })).status, 409);
      assert.equal((await call(op1, 'PUT', `/ordens-servico/${os.id}`, { status: 'FECHADA' })).status, 200);
      assert.equal((await call(tecnico, 'GET', '/tickets/ordens')).data.length, 0);
      assert.equal(await db.ordemServicoAtribuicao.count({ where: { ordemServicoId: os.id, ativa: true } }), 0);
      assert.equal((await call(op1, 'DELETE', `/ordens-servico/${os.id}`)).status, 409);
      assert.equal((await call(tecnico, 'GET', `/tickets/${ticket.id}`)).data.historico.length, 5);
      assert.equal(await db.estoqueMovimentacao.count(), 0);
    });
  } finally {
    if (servidor) { servidor.closeAllConnections(); await new Promise(resolve => servidor.close(resolve)); }
    if (db) {
      try { if (arquivos) for (const anexo of await db.mensagemAnexo.findMany()) await arquivos.arquivosTicket.remover(anexo.url); }
      finally { await db.$disconnect(); }
    }
    if (criado) {
      // O alvo só pode ser o schema aleatório criado por esta execução.
      assert.match(schemaTeste, /^tickets_test_[a-f0-9]{32}$/);
      const existe = await admin.$queryRaw`SELECT schema_name FROM information_schema.schemata WHERE schema_name = ${schemaTeste}`;
      if (existe.length === 1) await admin.$executeRawUnsafe(`DROP SCHEMA "${schemaTeste}" CASCADE`);
    }
    await admin.$disconnect(); process.env.DATABASE_URL = urlOriginal;
  }
});
