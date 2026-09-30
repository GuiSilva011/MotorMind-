import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express from 'express';
import jwt from 'jsonwebtoken';

test('exclusão de funcionários preserva histórico e encerra acesso', { skip: process.env.MOTORMIND_TESTE_FUNCIONARIOS !== '1', timeout: 120000 }, async t => {
  dotenv.config({ quiet: true });
  const urlOriginal = process.env.DATABASE_URL;
  const segredoOriginal = process.env.JWT_SECRET;
  assert.ok(urlOriginal, 'Configure o PostgreSQL de desenvolvimento.');
  const schemaTeste = `funcionarios_test_${randomUUID().replaceAll('-', '')}`;
  assert.match(schemaTeste, /^funcionarios_test_[a-f0-9]{32}$/);
  const urlTeste = new URL(urlOriginal);
  urlTeste.searchParams.set('schema', schemaTeste);
  const adminBanco = new PrismaClient({ datasources: { db: { url: urlOriginal } } });
  let criado = false;
  let db; let servidor;
  try {
    await adminBanco.$executeRawUnsafe(`CREATE SCHEMA "${schemaTeste}"`);
    criado = true;
    process.env.DATABASE_URL = urlTeste.toString();
    process.env.JWT_SECRET = randomUUID();
    const migration = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, encoding: 'utf8', windowsHide: true, timeout: 60000 });
    assert.equal(migration.status, 0, 'As migrations precisam funcionar no schema descartável.');
    db = (await import('../src/config/prisma.js')).default;
    const app = express();
    app.use(express.json());
    for (const [rota, arquivo] of [['auth', 'authRoutes'], ['funcionarios', 'funcionarioRoutes'], ['ordens-servico', 'ordemServicoRoutes'], ['tickets', 'ticketRoutes'], ['estoque', 'estoqueRoutes']]) {
      app.use(`/${rota}`, (await import(`../src/routes/${arquivo}.js`)).default);
    }
    servidor = app.listen(0, '127.0.0.1');
    await new Promise(resolve => servidor.once('listening', resolve));
    const base = `http://127.0.0.1:${servidor.address().port}`;
    async function call(token, method, path, body) {
      const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
      return { status: response.status, data: await response.json() };
    }
    const oficina = await db.oficina.create({ data: { nomeFantasia: 'Oficina sintética', status: 'ATIVA', licenca: { create: { status: 'ATIVA' } } } });
    const outra = await db.oficina.create({ data: { nomeFantasia: 'Outra oficina sintética', status: 'ATIVA', licenca: { create: { status: 'ATIVA' } } } });
    const senha = randomUUID();
    const hash = await bcrypt.hash(senha, 4);
    async function usuario(Role, oficinaId = oficina.id) {
      const u = await db.usuario.create({ data: { Nome: `Pessoa ${Role}`, Email: `${randomUUID()}@example.invalid`, Senha: hash, Role, oficinaId, funcionario: { create: { oficinaId } } }, include: { funcionario: true } });
      const token = jwt.sign({ oficinaId, role: Role }, process.env.JWT_SECRET, { subject: String(u.id), expiresIn: '1h' });
      return { ...u, token };
    }
    const admin = await usuario('ADMIN');
    const operador = await usuario('OPERADOR');
    const tecnico = await usuario('TECNICO');
    const tecnicoNovo = await usuario('TECNICO');
    const externo = await usuario('TECNICO', outra.id);
    const cliente = await db.cliente.create({ data: { oficinaId: oficina.id, nome: 'Cliente sintético' } });
    const veiculo = await db.veiculo.create({ data: { oficinaId: oficina.id, clienteId: cliente.id, placa: 'TST9999', modelo: 'Veículo sintético' } });
    const osResult = await call(operador.token, 'POST', '/ordens-servico', { codigo: 'OS-HISTORICO', veiculoId: veiculo.id, tecnicoId: tecnico.id });
    assert.equal(osResult.status, 201);
    const os = osResult.data;

    await t.test('exclusão exige administrador, oficina correta e ID válido', async () => {
      const path = `/funcionarios/${tecnico.funcionario.id}`;
      assert.equal((await call(null, 'DELETE', path)).status, 401);
      assert.equal((await call(operador.token, 'DELETE', path)).status, 403);
      assert.equal((await call(tecnico.token, 'DELETE', path)).status, 403);
      assert.equal((await call(admin.token, 'DELETE', `/funcionarios/${externo.funcionario.id}`)).status, 404);
      assert.equal((await call(admin.token, 'DELETE', '/funcionarios/invalido')).status, 400);
      assert.equal((await call(admin.token, 'DELETE', `/funcionarios/${admin.funcionario.id}`)).status, 400);
      const outroAdmin = await usuario('ADMIN');
      assert.equal((await call(admin.token, 'DELETE', `/funcionarios/${outroAdmin.funcionario.id}`)).status, 403);
      assert.equal((await db.usuario.findUnique({ where: { id: tecnico.id } })).excluidoEm, null);
    });

    let ticket;
    await t.test('tickets pendentes impedem exclusão com mensagem clara', async () => {
      const abertura = await call(tecnico.token, 'POST', '/tickets', { ordemServicoId: os.id, chaveAbertura: randomUUID(), itens: [{ nomePeca: 'Filtro', quantidadeSolicitada: 1 }] });
      assert.equal(abertura.status, 201);
      ticket = abertura.data;
      assert.equal((await call(operador.token, 'POST', `/tickets/${ticket.id}/assumir`)).status, 200);
      for (const u of [tecnico, operador]) {
        const result = await call(admin.token, 'DELETE', `/funcionarios/${u.funcionario.id}`);
        assert.equal(result.status, 409);
        assert.ok(result.data.erro.includes(ticket.codigo));
        assert.equal((await db.usuario.findUnique({ where: { id: u.id } })).excluidoEm, null);
      }
      assert.equal((await call(operador.token, 'PATCH', `/tickets/${ticket.id}/status`, { status: 'CANCELADA', motivo: 'Encerramento do cenário de teste' })).status, 200);
    });

    await t.test('exclui técnico e operador com OS, atribuições, tickets e movimentações sem apagar histórico', async () => {
      const peca = await db.estoquePeca.create({ data: { oficinaId: oficina.id, codigo: 'EST-TESTE', nome: 'Peça de teste' } });
      const mov = await db.estoqueMovimentacao.create({ data: { oficinaId: oficina.id, estoquePecaId: peca.id, usuarioId: operador.id, ordemServicoId: os.id, tipo: 'SAIDA_OS', quantidade: 1, quantidadeAnterior: 1, quantidadePosterior: 0 } });
      const atribuicoesAntes = await db.ordemServicoAtribuicao.findMany({ where: { ordemServicoId: os.id } });
      const historicoAntes = await db.requisicaoPecaHistorico.findMany({ where: { requisicaoPecaId: ticket.id } });
      for (const u of [tecnico, operador]) {
        assert.equal((await call(admin.token, 'DELETE', `/funcionarios/${u.funcionario.id}`)).status, 200);
        assert.ok((await db.usuario.findUnique({ where: { id: u.id } })).excluidoEm);
        assert.ok(await db.funcionario.findUnique({ where: { id: u.funcionario.id } }));
      }
      const ordem = await db.ordemServico.findUnique({ where: { id: os.id }, include: { tecnico: true, operador: true } });
      assert.equal(ordem.tecnico.Nome, tecnico.Nome);
      assert.equal(ordem.operador.Nome, operador.Nome);
      assert.deepEqual(await db.ordemServicoAtribuicao.findMany({ where: { ordemServicoId: os.id } }), atribuicoesAntes);
      assert.deepEqual(await db.requisicaoPecaHistorico.findMany({ where: { requisicaoPecaId: ticket.id } }), historicoAntes);
      assert.equal((await db.estoqueMovimentacao.findUnique({ where: { id: mov.id } })).usuarioId, operador.id);
      assert.equal((await db.requisicaoPeca.findUnique({ where: { id: ticket.id } })).responsavelId, operador.id);
    });

    await t.test('login e tokens anteriores dos usuários excluídos deixam de funcionar', async () => {
      for (const u of [tecnico, operador]) {
        const login = await call(null, 'POST', '/auth/login', { Email: u.Email, Senha: senha });
        assert.equal(login.status, 401);
        assert.equal(login.data.token, undefined);
        for (const path of ['/auth/me', '/funcionarios', '/tickets', '/estoque']) {
          assert.equal((await call(u.token, 'GET', path)).status, 401);
        }
      }
      assert.equal((await call(admin.token, 'GET', '/auth/me')).status, 200);
      const antigo = jwt.sign({ oficinaId: admin.oficinaId, role: admin.Role, iat: Math.floor(admin.CreatedAt.getTime() / 1000) - 60 }, process.env.JWT_SECRET, { subject: String(admin.id), expiresIn: '1h' });
      assert.equal((await call(antigo, 'GET', '/auth/me')).status, 401);
    });

    await t.test('excluídos saem da equipe e da seleção de técnicos; cadastro antigo não pode ser editado', async () => {
      const lista = await call(admin.token, 'GET', '/funcionarios');
      assert.equal(lista.status, 200);
      assert.equal(lista.data.some(f => [tecnico.id, operador.id].includes(f.usuarioId)), false);
      const tecnicos = await call(admin.token, 'GET', '/tickets/tecnicos');
      assert.equal(tecnicos.data.some(u => u.id === tecnico.id), false);
      assert.ok(tecnicos.data.some(u => u.id === tecnicoNovo.id));
      assert.equal((await call(admin.token, 'GET', `/funcionarios/${tecnico.funcionario.id}`)).status, 404);
      assert.equal((await call(admin.token, 'PUT', `/funcionarios/${tecnico.funcionario.id}`, { Nome: 'Alterado' })).status, 404);
      assert.equal((await call(admin.token, 'POST', '/funcionarios', { Nome: 'Duplicado', Email: tecnico.Email, Senha: senha, Role: 'TECNICO' })).status, 409);
    });

    await t.test('OS antiga mantém nome e permite edição, encerramento e substituição; nova OS recusa excluídos', async () => {
      const consulta = await call(admin.token, 'GET', `/ordens-servico/${os.id}`);
      assert.equal(consulta.data.tecnico.Nome, tecnico.Nome);
      const editar = await call(admin.token, 'PUT', `/ordens-servico/${os.id}`, { tecnicoId: tecnico.id, operadorId: operador.id, observacoes: 'Histórico preservado' });
      assert.equal(editar.status, 200);
      for (const vinculo of [{ tecnicoId: tecnico.id }, { operadorId: operador.id }]) {
        assert.equal((await call(admin.token, 'POST', '/ordens-servico', { codigo: randomUUID().slice(0, 12), veiculoId: veiculo.id, ...vinculo })).status, 400);
      }
      assert.equal((await call(admin.token, 'PUT', `/ordens-servico/${os.id}`, { status: 'FINALIZADA' })).status, 200);
      assert.equal((await call(admin.token, 'PUT', `/ordens-servico/${os.id}`, { status: 'ABERTA', tecnicoId: tecnico.id })).status, 400);
      const troca = await call(admin.token, 'PUT', `/ordens-servico/${os.id}`, { status: 'ABERTA', tecnicoId: tecnicoNovo.id });
      assert.equal(troca.status, 200);
      assert.equal(troca.data.tecnicoId, tecnicoNovo.id);
      assert.equal((await call(admin.token, 'PUT', `/ordens-servico/${os.id}`, { tecnicoId: tecnico.id })).status, 400);
      assert.equal((await call(admin.token, 'PUT', `/ordens-servico/${os.id}`, { status: 'FINALIZADA' })).status, 200);
      assert.equal(await db.ordemServicoAtribuicao.count({ where: { ordemServicoId: os.id, tecnicoId: tecnico.id } }), 1);
    });

    await t.test('exclusão repetida é idempotente e também funciona sem OS vinculada', async () => {
      const antes = (await db.usuario.findUnique({ where: { id: tecnico.id } })).excluidoEm;
      assert.equal((await call(admin.token, 'DELETE', `/funcionarios/${tecnico.funcionario.id}`)).status, 200);
      assert.deepEqual((await db.usuario.findUnique({ where: { id: tecnico.id } })).excluidoEm, antes);
      const livre = await usuario('OPERADOR');
      assert.equal((await call(admin.token, 'DELETE', `/funcionarios/${livre.funcionario.id}`)).status, 200);
      assert.equal((await call(livre.token, 'GET', '/auth/me')).status, 401);
    });
  } finally {
    if (servidor) { servidor.closeAllConnections(); await new Promise(resolve => servidor.close(resolve)); }
    if (db) await db.$disconnect();
    if (criado) {
      assert.match(schemaTeste, /^funcionarios_test_[a-f0-9]{32}$/);
      await adminBanco.$executeRawUnsafe(`DROP SCHEMA "${schemaTeste}" CASCADE`);
    }
    await adminBanco.$disconnect();
    process.env.DATABASE_URL = urlOriginal;
    if (segredoOriginal === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = segredoOriginal;
  }
});
