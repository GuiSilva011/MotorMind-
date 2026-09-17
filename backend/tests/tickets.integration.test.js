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
    arquivos = await import('../src/utils/ticketArquivos.js');
    const tickets = (await import('../src/routes/ticketRoutes.js')).default;
    const ordens = (await import('../src/routes/ordemServicoRoutes.js')).default;
    const tecnicoRoutes = (await import('../src/routes/tecnicoRoutes.js')).default;
    const veiculoRoutes = (await import('../src/routes/veiculoRoutes.js')).default;
    const checklistRoutes = (await import('../src/routes/checklistRoutes.js')).default;
    const app = express(); app.use(express.json()); app.use('/tickets', tickets); app.use('/ordens-servico', ordens);
    app.use('/tecnico', tecnicoRoutes); app.use('/veiculos', veiculoRoutes); app.use('/checklists', checklistRoutes);
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
    const tecnicoOutra = await usuario('tecnicoOutra', 'TECNICO', outraOficina.id);
    const cliente = await db.cliente.create({ data: { oficinaId: oficina.id, nome: 'Cliente sintético' } });
    const veiculo = await db.veiculo.create({ data: { oficinaId: oficina.id, clienteId: cliente.id, placa: 'TST0001', modelo: 'Veículo de teste' } });
    async function call(u, method, rota, body) {
      const headers = u ? { Authorization: `Bearer ${jwt.sign({ oficinaId: u.oficinaId, role: u.role }, process.env.JWT_SECRET, { subject: String(u.id), expiresIn: '1h' })}` } : {};
      if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
      const response = await fetch(`${base}${rota}`, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
      const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.arrayBuffer();
      return { status: response.status, data, headers: response.headers };
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
    await t.test('painel só recebe veículos de OS salvas e atribuídas; filtro também protege a listagem antiga', async () => {
      const painel = await call(tecnico, 'GET', '/tecnico/veiculos');
      assert.equal(painel.status, 200);
      assert.equal(painel.headers.get('cache-control'), 'no-store');
      assert.equal((await call(null, 'GET', '/tecnico/veiculos')).status, 401);
      assert.deepEqual((await call(tecnico, 'GET', '/veiculos')).data, painel.data);
      assert.deepEqual(painel.data.map(v => v.id), [veiculo.id]);
      assert.deepEqual(painel.data[0].ordensServico.map(o => o.id), [os.id]);
      assert.equal((await call(tecnico2, 'GET', '/tecnico/veiculos')).data.length, 0);
      assert.equal((await call(tecnicoOutra, 'GET', '/tecnico/veiculos')).data.length, 0);
      assert.equal((await call(op1, 'GET', '/tecnico/veiculos')).status, 403);
      assert.equal((await call(tecnico2, 'GET', '/veiculos')).data.length, 0);
      assert.equal((await call(tecnico2, 'GET', '/veiculos/buscar-para-os?termo=TST')).data.length, 0);
      assert.equal((await call(op1, 'GET', '/veiculos')).data.length, 1);
    });
    await t.test('vínculo e snapshots só mudam em salvamento bem-sucedido; múltiplas OS não duplicam o veículo', async () => {
      const veiculoExtra = await db.veiculo.create({ data: { oficinaId: oficina.id, clienteId: cliente.id, placa: 'TST0002' } });
      const rascunho = (await call(op1, 'POST', '/ordens-servico', { codigo: 'OS-SEM-TECNICO', veiculoId: veiculoExtra.id })).data;
      assert.equal((await call(tecnico, 'GET', '/tecnico/veiculos')).data.some(v => v.id === veiculoExtra.id), false);
      const invalida = await call(op1, 'PUT', `/ordens-servico/${rascunho.id}`, { tecnicoId: tecnico.id, servicosSemDiagnostico: [{ servicoCatalogoId: 2147483647, nomeServico: 'Inválido' }] });
      assert.equal(invalida.status, 400);
      assert.equal((await db.ordemServico.findUnique({ where: { id: rascunho.id } })).tecnicoId, null);
      assert.equal(await db.ordemServicoAtribuicao.count({ where: { ordemServicoId: rascunho.id } }), 0);
      assert.equal((await call(tecnico, 'GET', '/tecnico/veiculos')).data.some(v => v.id === veiculoExtra.id), false);
      const catalogo = await db.pecaCatalogo.create({ data: { oficinaId: oficina.id, codigo: 'CAT-TESTE', nome: 'Nome salvo na OS' } });
      const payload = {
        tecnicoId: tecnico.id,
        diagnosticos: [{ nomeDiagnostico: 'Diagnóstico salvo', descricao: 'Descrição técnica',
          servicos: [{ nomeServico: 'Serviço do diagnóstico', precoVenda: 100, pecas: [{ nomePeca: 'Peça do serviço', quantidade: 2, custoUnitario: 30 }] }],
        }],
        servicosSemDiagnostico: [{ nomeServico: 'Serviço sem diagnóstico', pecas: [{ nomePeca: 'Peça do serviço solto', quantidade: 3 }] }],
        pecasAvulsas: [{ pecaCatalogoId: catalogo.id, nomePeca: 'Nome ignorado pelo catálogo ao salvar', quantidade: 4 }],
      };
      const salva = await call(op1, 'PUT', `/ordens-servico/${rascunho.id}`, payload);
      assert.equal(salva.status, 200);
      // Cobre também vínculos diretos já persistidos, permitidos pelo schema.
      await db.ordemPecaItem.create({ data: { ordemServicoId: rascunho.id, ordemDiagnosticoId: salva.data.diagnosticos[0].id, nomePeca: 'Peça direta do diagnóstico', quantidade: 1 } });
      await db.pecaCatalogo.update({ where: { id: catalogo.id }, data: { nome: 'Alteração posterior no catálogo' } });
      const leitura = await call(tecnico, 'GET', `/tecnico/ordens/${rascunho.id}`);
      assert.equal(leitura.status, 200);
      const ordem = leitura.data;
      assert.deepEqual((await call(tecnico, 'GET', `/ordens-servico/${rascunho.id}`)).data, ordem);
      assert.equal(ordem.diagnosticos[0].nomeDiagnostico, 'Diagnóstico salvo');
      assert.equal(ordem.diagnosticos[0].servicos[0].pecas[0].quantidade, 2);
      assert.equal(ordem.diagnosticos[0].pecas.length, 1);
      assert.equal(ordem.servicos[0].pecas[0].quantidade, 3);
      assert.equal(ordem.pecas[0].nomePeca, 'Nome salvo na OS');
      const pecas = [...ordem.pecas, ...ordem.servicos.flatMap(s => s.pecas), ...ordem.diagnosticos.flatMap(d => [...d.pecas, ...d.servicos.flatMap(s => s.pecas)])];
      assert.equal(pecas.length, 4); assert.equal(new Set(pecas.map(p => p.id)).size, 4);
      assert.doesNotMatch(JSON.stringify(ordem), /precoVenda|custoUnitario|valorTotal|Senha|Alteração posterior/);
      assert.equal((await call(tecnico2, 'GET', `/tecnico/ordens/${rascunho.id}`)).status, 404);
      assert.equal((await call(tecnicoOutra, 'GET', `/tecnico/ordens/${rascunho.id}`)).status, 404);
      assert.equal((await call(tecnicoOutra, 'GET', `/ordens-servico/${rascunho.id}`)).status, 404);
      assert.equal((await call(tecnico, 'PUT', `/ordens-servico/${rascunho.id}`, {})).status, 403);
      const segunda = (await call(op1, 'POST', '/ordens-servico', { codigo: 'OS-SEGUNDA', veiculoId: veiculoExtra.id, tecnicoId: tecnico.id })).data;
      let painel = (await call(tecnico, 'GET', '/tecnico/veiculos')).data;
      assert.equal(painel.filter(v => v.id === veiculoExtra.id).length, 1);
      assert.equal(painel.find(v => v.id === veiculoExtra.id).ordensServico.length, 2);
      assert.equal((await call(op1, 'PUT', `/ordens-servico/${segunda.id}`, { status: 'FINALIZADA' })).status, 200);
      assert.equal((await call(tecnico, 'GET', `/tecnico/ordens/${segunda.id}`)).status, 404);
      assert.equal((await call(tecnico, 'GET', '/tickets/ordens')).data.some(o => o.id === segunda.id), false);
      assert.equal(await db.ordemServicoAtribuicao.count({ where: { ordemServicoId: segunda.id, ativa: true } }), 0);
      painel = (await call(tecnico, 'GET', '/tecnico/veiculos')).data;
      assert.equal(painel.find(v => v.id === veiculoExtra.id).ordensServico.length, 1);
      assert.equal((await call(op1, 'PUT', `/ordens-servico/${rascunho.id}`, { tecnicoId: tecnico2.id })).status, 200);
      assert.equal((await call(tecnico, 'GET', '/tecnico/veiculos')).data.some(v => v.id === veiculoExtra.id), false);
      assert.equal((await call(tecnico2, 'GET', '/tecnico/veiculos')).data.some(v => v.id === veiculoExtra.id), true);
      assert.equal((await call(tecnico, 'POST', '/tickets', { ordemServicoId: rascunho.id, chaveAbertura: randomUUID(), itens: [{ nomePeca: 'Não permitido', quantidadeSolicitada: 1 }] })).status, 403);
      assert.equal((await call(op1, 'PUT', `/ordens-servico/${rascunho.id}`, { status: 'CANCELADA' })).status, 200);
      assert.equal((await call(tecnico2, 'GET', '/tecnico/veiculos')).data.length, 0);
    });
    await t.test('checklist só pode ser criada e consultada para veículo vinculado ao técnico', async () => {
      const checklist = await call(tecnico, 'POST', '/checklists', { veiculoId: veiculo.id, itensEntrada: [] });
      assert.equal(checklist.status, 201);
      assert.equal((await call(tecnico, 'GET', `/checklists/veiculo/${veiculo.id}`)).data.length, 1);
      assert.equal((await call(tecnico2, 'POST', '/checklists', { veiculoId: veiculo.id })).status, 404);
      assert.equal((await call(tecnico2, 'GET', `/checklists/veiculo/${veiculo.id}`)).status, 404);
      assert.equal((await call(tecnico2, 'GET', `/checklists/${checklist.data.checklist.id}`)).status, 404);
      assert.equal((await call(tecnicoOutra, 'GET', `/checklists/${checklist.data.checklist.id}`)).status, 404);
    });
    await t.test('histórico mantém OS anteriores do veículo, mas não permite abrir pedido por OS encerrada', async () => {
      const antiga = await db.ordemServico.create({ data: { oficinaId: oficina.id, codigo: 'OS-HISTORICA', veiculoId: veiculo.id, tecnicoId: tecnico2.id, status: 'FECHADA' } });
      const historico = await call(tecnico, 'GET', `/tecnico/veiculos/${veiculo.id}/historico`);
      assert.equal(historico.status, 200);
      assert.ok(historico.data.some(o => o.id === antiga.id));
      assert.equal((await call(tecnico, 'GET', `/tecnico/veiculos/${veiculo.id}/historico/${antiga.id}`)).status, 200);
      assert.equal((await call(tecnico, 'GET', `/tecnico/ordens/${antiga.id}`)).status, 404);
      assert.equal((await call(tecnico2, 'GET', `/tecnico/veiculos/${veiculo.id}/historico`)).status, 404);
      assert.equal((await call(tecnicoOutra, 'GET', `/tecnico/veiculos/${veiculo.id}/historico/${antiga.id}`)).status, 404);
      assert.equal((await call(tecnico2, 'POST', '/tickets', { ordemServicoId: antiga.id, chaveAbertura: randomUUID(), itens: [{ nomePeca: 'Não permitido', quantidadeSolicitada: 1 }] })).status, 409);
    });
    await t.test('consultas técnicas preservam validação de IDs, erros JSON e ausência de cache', async () => {
      const consultas = [
        ['/tecnico/ordens/invalido', 400],
        ['/tecnico/ordens/0', 400],
        ['/tecnico/ordens/2147483647', 404],
        ['/tecnico/veiculos/invalido/historico', 400],
        ['/tecnico/veiculos/2147483647/historico', 404],
        [`/tecnico/veiculos/${veiculo.id}/historico/invalido`, 400],
        [`/tecnico/veiculos/${veiculo.id}/historico/2147483647`, 404],
      ];
      for (const [rota, status] of consultas) {
        const resposta = await call(tecnico, 'GET', rota);
        assert.equal(resposta.status, status, rota);
        assert.equal(typeof resposta.data.erro, 'string', rota);
        assert.equal(resposta.headers.get('cache-control'), 'no-store', rota);
      }
    });
    await t.test('rotas de consulta mantêm perfil, oficina, validação de sessão e respostas JSON', async () => {
      const tecnicos = await call(op1, 'GET', '/tickets/tecnicos');
      assert.equal(tecnicos.status, 200);
      assert.deepEqual(tecnicos.data.map(u => u.id).sort(), [tecnico.id, tecnico2.id].sort());
      assert.equal(tecnicos.headers.get('cache-control'), 'no-store');
      assert.equal((await call(tecnico, 'GET', '/tickets/tecnicos')).status, 403);
      assert.equal((await call(op1, 'GET', '/tickets/ordens')).status, 403);
      assert.equal((await call(tecnico, 'GET', '/tickets/ordens')).data.some(o => o.id === os.id), true);
      assert.equal((await call({ ...op1, oficinaId: 0 }, 'GET', '/tickets')).status, 401);
      for (const rota of ['/tickets?pagina=0', '/tickets?status=INVALIDO', '/tickets/invalido', '/tickets/notificacoes/invalido/lida']) {
        const resposta = await call(op1, rota.endsWith('/lida') ? 'PATCH' : 'GET', rota);
        assert.equal(resposta.status, 400);
        assert.equal(typeof resposta.data.erro, 'string');
      }
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
    await t.test('fila mantém filtros e separa tickets do técnico e do responsável', async () => {
      const meus = await call(responsavel, 'GET', `/tickets?meus=true&ordemServicoId=${os.id}&status=EM_ATENDIMENTO`);
      assert.equal(meus.status, 200);
      assert.equal(meus.data.total, 1);
      assert.equal(meus.data.pagina, 1);
      assert.deepEqual(meus.data.itens.map(item => item.id), [ticket.id]);
      assert.equal((await call(outroOperador, 'GET', '/tickets?meus=true')).data.total, 0);
      assert.equal((await call(tecnico2, 'GET', '/tickets?status=TODOS')).data.total, 0);
      assert.equal((await call(tecnico, 'GET', '/tickets?status=TODOS')).data.total, 1);
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
    await t.test('upload autoriza o participante antes de processar anexos e mantém os limites', async () => {
      const totalMensagens = await db.mensagemTicket.count();
      function formulario() {
        const form = new FormData();
        form.append('chaveEnvio', randomUUID());
        for (let i = 0; i < 4; i++) form.append('anexos', new Blob(['%PDF-1.4\n%%EOF'], { type: 'application/pdf' }), `teste-${i}.pdf`);
        return form;
      }
      assert.equal((await call(outroOperador, 'POST', `/tickets/${ticket.id}/mensagens`, formulario())).status, 403);
      const excesso = await call(responsavel, 'POST', `/tickets/${ticket.id}/mensagens`, formulario());
      assert.equal(excesso.status, 400);
      assert.match(excesso.data.erro, /até 3 anexos/);
      assert.equal(await db.mensagemTicket.count(), totalMensagens);
    });
    await t.test('anexos são privados, expiram e são removidos sem apagar o ticket/histórico', async () => {
      const form = new FormData(); form.append('chaveEnvio', randomUUID()); form.append('conteudo', 'Anexo sintético');
      form.append('anexos', new Blob(['%PDF-1.4\n%%EOF'], { type: 'application/pdf' }), 'teste.pdf');
      const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/jYQAAAAASUVORK5CYII=', 'base64');
      form.append('anexos', new Blob([png], { type: 'image/png' }), 'peca.png');
      const resposta = await call(responsavel, 'POST', `/tickets/${ticket.id}/mensagens`, form);
      assert.equal(resposta.status, 201);
      const mensagem = resposta.data;
      const pdf = mensagem.anexos.find(a => a.mimeType === 'application/pdf');
      const imagem = mensagem.anexos.find(a => a.mimeType === 'image/png');
      assert.ok(pdf); assert.ok(imagem);
      assert.equal(imagem.url, undefined, 'Não expõe o caminho privado no JSON.');
      const rotaImagem = `/tickets/${ticket.id}/anexos/${imagem.id}`;
      for (const participante of [tecnico, responsavel]) {
        const previa = await call(participante, 'GET', rotaImagem);
        assert.equal(previa.status, 200);
        assert.equal(previa.headers.get('content-type'), 'image/png');
        assert.equal(previa.headers.get('cache-control'), 'no-store');
        assert.equal(previa.headers.get('x-content-type-options'), 'nosniff');
        assert.deepEqual(Buffer.from(previa.data), png);
      }
      assert.equal((await call(null, 'GET', rotaImagem)).status, 401);
      assert.equal((await call(outroOperador, 'GET', rotaImagem)).status, 403);
      assert.equal((await call(opOutra, 'GET', rotaImagem)).status, 404);
      const imagemPrivada = await db.mensagemAnexo.findUnique({ where: { id: imagem.id } });
      const anexo = await db.mensagemAnexo.findUnique({ where: { id: pdf.id } });
      const rota = `/tickets/${ticket.id}/anexos/${anexo.id}`;
      assert.equal((await call(tecnico, 'GET', rota)).status, 200);
      assert.equal((await call(outroOperador, 'GET', rota)).status, 403);
      assert.equal((await call(opOutra, 'GET', rota)).status, 404);
      await db.mensagemTicket.update({ where: { id: mensagem.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
      assert.equal((await call(tecnico, 'GET', rota)).status, 404);
      assert.equal((await call(tecnico, 'GET', rotaImagem)).status, 404);
      assert.equal((await call(tecnico, 'GET', `/tickets/${ticket.id}/mensagens`)).data.itens.some(m => m.id === mensagem.id), false);
      assert.equal((await call(responsavel, 'POST', `/tickets/${ticket.id}/mensagens`, { conteudo: 'Anexo sintético', chaveEnvio: form.get('chaveEnvio') })).status, 409);
      const historicos = await db.requisicaoPecaHistorico.count();
      await arquivos.limparChatExpirado(db);
      await assert.rejects(access(arquivos.caminhoAnexo(anexo.url)), { code: 'ENOENT' });
      await assert.rejects(access(arquivos.caminhoAnexo(imagemPrivada.url)), { code: 'ENOENT' });
      assert.equal(await db.mensagemAnexo.count({ where: { id: anexo.id } }), 0);
      assert.equal(await db.mensagemAnexo.count({ where: { id: imagem.id } }), 0);
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
      assert.equal((await call(tecnico, 'GET', '/tecnico/veiculos')).data.length, 0);
      assert.equal((await call(tecnico, 'GET', '/veiculos')).data.length, 0);
      assert.equal((await call(tecnico, 'GET', `/tecnico/ordens/${os.id}`)).status, 404);
      assert.equal((await call(tecnico, 'GET', `/ordens-servico/${os.id}`)).status, 404);
      assert.equal((await call(tecnico, 'GET', `/tecnico/veiculos/${veiculo.id}/historico`)).status, 404);
      assert.equal((await call(tecnico, 'POST', '/checklists', { veiculoId: veiculo.id })).status, 404);
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
