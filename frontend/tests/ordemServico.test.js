import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { calcularTotalPeca, calcularTotalServico, calcularTotaisOrdem } from '../src/utils/ordemServicoCalculos.js';

let vite, Tela, SeletorTema, obterTemaSalvo;
before(async () => {
  vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  Tela = (await vite.ssrLoadModule('/src/components/OrdemServicoTela.jsx')).default;
  SeletorTema = (await vite.ssrLoadModule('/src/components/SeletorTema.jsx')).default;
  ({ obterTemaSalvo } = await vite.ssrLoadModule('/src/hooks/useTemaOficina.js'));
});
after(async () => { await vite?.close(); });

function ordemExemplo() {
  const peca = (id, extra = {}) => ({ id, descricao: `Peça ${id}`, pecaCatalogoId: 11, estoquePecaId: '',
    fornecedorId: 5, quantidade: 2, custoUnitario: 30, desconto: 5, ...extra });
  const servico = (id, extra = {}) => ({ id, servicoCatalogoId: 10, descricao: `Serviço ${id}`, responsavel: 'Técnico de teste',
    tipo: 'Mão de obra', precoVenda: 200, desconto: 20, pecas: [], ...extra });
  return { id: 7, codigo: 'OS-000007', status: 'ABERTA', tecnicoId: 9, tecnicoNome: 'Técnico de teste',
    cliente: { nome: 'Cliente de teste' }, veiculo: { id: 3, placa: 'ABC1D23', marca: 'Marca', modelo: 'Modelo',
      ano: '2020/2021', motor: '1.0', cambio: 'Manual', cor: 'Prata', km: 0, chassi: 'CHASSI-TESTE', possuiAr: true },
    observacoes: 'Observação preenchida',
    diagnosticos: [{ id: 'd1', descricao: 'Diagnóstico de teste', diagnosticoCatalogoId: 2,
      servicos: [servico('s1', { pecas: [peca('p1')] })] }],
    servicosSemDiagnostico: [servico('s2', { precoVenda: 100, desconto: 10,
      pecas: [peca('p2', { pecaCatalogoId: '', estoquePecaId: 21, fornecedorId: '', quantidade: 1, custoUnitario: 50, desconto: 100 })] })],
    pecasAvulsas: [peca('p3', { quantidade: 3, custoUnitario: 10, desconto: 0 })] };
}

function propsTela(extra = {}) {
  const chamadas = [];
  const acoes = new Proxy({ montarAnoVeiculo: () => '2020/2021' }, {
    get: (obj, nome) => obj[nome] || (obj[nome] = (...args) => chamadas.push({ nome, args })),
  });
  const ordem = extra.ordem || ordemExemplo();
  return { ordem, modoTela: 'edicao', catalogos: { fornecedores: [{ id: 5, nome: 'Fornecedor de teste' }],
    tecnicos: [{ id: 9, usuario: { Nome: 'Técnico de teste' } }], tecnicosOS: [{ id: 9, Nome: 'Técnico de teste' }] },
    busca: '', resultadosBusca: [], buscandoVeiculo: false, clienteNaoEncontrado: false,
    carregando: false, salvando: false, totais: calcularTotaisOrdem(ordem), podeCotar: true,
    acoes, formatarMoeda: valor => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    chamadas, ...extra };
}

function elementos(no, resultado = []) {
  if (Array.isArray(no)) no.forEach(item => elementos(item, resultado));
  else if (no?.props) { resultado.push(no); elementos(no.props.children, resultado); }
  return resultado;
}
function texto(no) {
  if (Array.isArray(no)) return no.map(texto).join('');
  if (no?.props) return texto(no.props.children);
  return typeof no === 'string' || typeof no === 'number' ? String(no) : '';
}
function porId(arvore, id) { return elementos(arvore).find(no => no.props.id === id); }
function botao(arvore, label) {
  return elementos(arvore).find(no => no.type === 'button' && (no.props['aria-label'] === label || texto(no) === label));
}

test('totais incluem todos os grupos e aplicam desconto limitado ao valor de cada item', () => {
  assert.deepEqual(calcularTotaisOrdem(ordemExemplo()), { totalServicos: 270, totalPecas: 85, totalGeral: 355,
    brutoServicos: 300, brutoPecas: 140, totalDescontos: 85 });
  assert.equal(calcularTotalServico({ precoVenda: 30, desconto: 50 }), 0);
  assert.equal(calcularTotalPeca({ quantidade: 2, custoUnitario: 10, desconto: 30 }), 0);
});

test('ordem sem itens tem resumo zero e não recebe dados fictícios', () => {
  const ordem = { ...ordemExemplo(), id: null, codigo: '', cliente: { nome: '' }, veiculo: { id: '' },
    diagnosticos: [], servicosSemDiagnostico: [], pecasAvulsas: [] };
  const props = propsTela({ ordem, modoTela: 'nova' });
  const html = renderToStaticMarkup(React.createElement(Tela, props));
  assert.ok(html.includes('Nenhum cliente ou veículo selecionado'));
  assert.ok(!html.includes('Cliente de teste'));
  assert.equal(props.totais.totalGeral, 0);
});

test('resumo, hierarquia e dados completos usam os valores da OS', () => {
  const props = propsTela();
  const html = renderToStaticMarkup(React.createElement(Tela, props));
  for (const textoEsperado of ['OS-000007', 'Cliente de teste', 'ABC1D23', 'CHASSI-TESTE', 'D.01', 'S.01', 'P.01',
    'Serviços sem diagnóstico', 'Peças avulsas', 'Serviços deste diagnóstico', 'Peças deste serviço', 'Resumo financeiro']) {
    assert.ok(html.includes(textoEsperado), textoEsperado);
  }
  assert.equal(porId(Tela(props), 'os-veiculo-km').props.value, 0);
});

test('ao incluir itens novos, seleção e preenchimento ficam disponíveis sem expandir outra área', () => {
  const ordem = ordemExemplo();
  const servico = ordem.diagnosticos[0].servicos[0];
  Object.assign(servico, { servicoCatalogoId: '', descricao: '', responsavel: '', tipo: '', precoVenda: '', desconto: '' });
  Object.assign(servico.pecas[0], { pecaCatalogoId: '', descricao: '', fornecedorId: '', custoUnitario: '', desconto: '' });
  for (const modoTela of ['nova', 'edicao']) {
    const arvore = Tela(propsTela({ ordem, modoTela }));
    const fechados = elementos(arvore).filter(no => no.type === 'details' && !no.props.open);
    for (const id of ['os-diagnostico-d1', 'os-servico-s1-catalogo', 'os-servico-s1-descricao',
      'os-servico-s1-preco', 'os-peca-p1-quantidade', 'os-peca-p1-custo']) {
      const controle = porId(arvore, id);
      assert.ok(controle && !controle.props.disabled, id);
      assert.ok(fechados.every(no => !elementos(no).includes(controle)), `${id} está visível`);
    }
    for (const label of ['Selecionar serviço cadastrado', 'Selecionar do catálogo', 'Pegar do estoque']) {
      const controle = botao(arvore, label);
      assert.ok(controle && !controle.props.disabled, label);
      assert.ok(fechados.every(no => !elementos(no).includes(controle)), `${label} está visível`);
    }
  }
});

test('botões de inclusão vinculam os itens ao grupo escolhido e distinguem os itens independentes', () => {
  const ordem = ordemExemplo();
  ordem.diagnosticos.push({ id: 'd2', descricao: 'Outro diagnóstico', servicos: [
    { ...ordem.servicosSemDiagnostico[0], id: 's3', pecas: [] },
  ] });
  const props = propsTela({ ordem }); const arvore = Tela(props);
  for (const label of ['Adicionar diagnóstico', 'Adicionar serviço ao diagnóstico D.02',
    'Adicionar peça ao serviço D.01.1', 'Adicionar peça ao serviço D.02.1',
    'Adicionar serviço sem diagnóstico', 'Adicionar peça ao serviço S.01', 'Adicionar peça avulsa']) {
    botao(arvore, label).props.onClick();
  }
  assert.deepEqual(props.chamadas, [
    { nome: 'adicionarDiagnostico', args: [] },
    { nome: 'adicionarServicoAoDiagnostico', args: ['d2'] },
    { nome: 'adicionarPecaDiagnostico', args: ['d1', 's1'] },
    { nome: 'adicionarPecaDiagnostico', args: ['d2', 's3'] },
    { nome: 'adicionarServicoSemDiagnostico', args: [] },
    { nome: 'adicionarPecaSemDiagnostico', args: ['s2'] },
    { nome: 'adicionarPecaAvulsa', args: [] },
  ]);
});

test('busca por Enter e seleção de veículo usam os handlers existentes', () => {
  const veiculo = { id: 99, placa: 'XYZ9A87', cliente: { nome: 'Cliente encontrado' } };
  const props = propsTela({ resultadosBusca: [veiculo] });
  const arvore = Tela(props);
  porId(arvore, 'os-busca-cliente').props.onKeyDown({ key: 'Enter' });
  elementos(arvore).find(no => no.props.className === 'os-search-result-item').props.onClick();
  assert.equal(props.chamadas[0].nome, 'buscarClienteOuVeiculo');
  assert.deepEqual(props.chamadas[1], { nome: 'selecionarVeiculo', args: [veiculo] });
});

test('os dois botões Salvar OS usam a mesma ação e bloqueiam o envio durante salvamento', () => {
  const props = propsTela();
  const botoes = elementos(Tela(props)).filter(no => no.type === 'button' && texto(no) === 'Salvar OS');
  assert.equal(botoes.length, 2);
  assert.equal(botoes[0].props.onClick, botoes[1].props.onClick);
  botoes[0].props.onClick();
  assert.equal(props.chamadas[0].nome, 'salvarOrdemServico');
  const enviando = elementos(Tela(propsTela({ salvando: true }))).filter(no => no.type === 'button' && texto(no) === 'Salvando…');
  assert.ok(enviando.every(no => no.props.disabled));
});

test('campos e exclusões preservam o contexto de diagnóstico, serviço independente e peça avulsa', () => {
  const props = propsTela(); const arvore = Tela(props);
  porId(arvore, 'os-servico-s1-preco').props.onChange({ target: { value: '250' } });
  porId(arvore, 'os-servico-s2-desconto').props.onChange({ target: { value: '15' } });
  porId(arvore, 'os-peca-p1-quantidade').props.onChange({ target: { value: '4' } });
  porId(arvore, 'os-peca-p2-custo').props.onChange({ target: { value: '60' } });
  porId(arvore, 'os-peca-p3-desconto').props.onChange({ target: { value: '2' } });
  botao(arvore, 'Remover peça D.01.1.1').props.onClick();
  botao(arvore, 'Remover serviço S.01').props.onClick();
  botao(arvore, 'Remover peça P.01').props.onClick();
  assert.deepEqual(props.chamadas, [
    { nome: 'atualizarServicoDiagnostico', args: ['d1', 's1', 'precoVenda', '250'] },
    { nome: 'atualizarServicoSemDiagnostico', args: ['s2', 'desconto', '15'] },
    { nome: 'atualizarPecaDiagnostico', args: ['d1', 's1', 'p1', 'quantidade', '4'] },
    { nome: 'atualizarPecaSemDiagnostico', args: ['s2', 'p2', 'custoUnitario', '60'] },
    { nome: 'atualizarPecaAvulsa', args: ['p3', 'desconto', '2'] },
    { nome: 'removerPecaDiagnostico', args: ['d1', 's1', 'p1'] },
    { nome: 'removerServicoSemDiagnostico', args: ['s2'] },
    { nome: 'removerPecaAvulsa', args: ['p3'] },
  ]);
});

test('catálogo e estoque permanecem distintos e estoque mantém fornecedor bloqueado', () => {
  const props = propsTela(); const arvore = Tela(props);
  const linhas = elementos(arvore).filter(no => no.props.className === 'os-piece-row');
  for (const linha of linhas) {
    elementos(linha).find(no => no.type === 'button' && (texto(no) === 'Selecionar do catálogo' || texto(no).startsWith('Catálogo:'))).props.onClick();
  }
  assert.deepEqual(props.chamadas.map(item => item.args[0].tipo), ['peca', 'peca', 'peca']);
  assert.ok(porId(arvore, 'os-peca-p2-fornecedor').props.disabled);
  assert.equal(porId(arvore, 'os-peca-p2-quantidade').props.step, '1');
});

test('estoque abre no contexto correto de cada grupo sem acionar salvamento', () => {
  const props = propsTela(); const arvore = Tela(props);
  const origens = ['diagnostico', 'servico-sem-diagnostico', 'avulsa'];
  const linhas = elementos(arvore).filter(no => no.props.className === 'os-piece-row');
  linhas.forEach((linha, index) => {
    elementos(linha).find(no => no.type === 'button' && (texto(no) === 'Pegar do estoque' || texto(no).startsWith('Estoque:'))).props.onClick();
    assert.equal(props.chamadas[index].args[0].origem, origens[index]);
    assert.equal(props.chamadas[index].args[0].tipo, 'estoque');
  });
  assert.ok(porId(arvore, 'os-peca-p2-fornecedor').props.disabled);
  assert.ok(!props.chamadas.some(item => item.nome === 'salvarOrdemServico'));
});

test('consulta mantém edição bloqueada e preserva ações de imprimir, buscar e editar', () => {
  const props = propsTela({ modoTela: 'visualizacao' }); const arvore = Tela(props);
  const html = renderToStaticMarkup(React.createElement(Tela, props));
  assert.ok(html.includes('Ver dados e valores do serviço'));
  assert.ok(html.includes('Ver dados e valores da peça'));
  assert.ok(elementos(arvore).filter(no => ['input', 'select', 'textarea'].includes(no.type))
    .every(no => no.props.readOnly || no.props.disabled));
  assert.ok(!botao(arvore, 'Adicionar diagnóstico'));
  assert.ok(!elementos(arvore).some(no => String(no.props['aria-label'] || '').startsWith('Remover')));
  botao(arvore, 'Editar OS').props.onClick();
  botao(arvore, 'Buscar OS').props.onClick();
  botao(arvore, 'Imprimir OS').props.onClick();
  assert.deepEqual(props.chamadas.map(item => item.nome), ['editarOrdemAtual', 'abrirModalBuscarOS', 'imprimirOrdemServico']);
});

test('todos os campos editáveis têm labels associados e IDs únicos', () => {
  const arvore = Tela(propsTela()); const nos = elementos(arvore);
  const ids = nos.filter(no => no.props.id).map(no => no.props.id);
  assert.equal(new Set(ids).size, ids.length);
  const labels = new Set(nos.filter(no => no.type === 'label').map(no => no.props.htmlFor));
  assert.ok(nos.filter(no => ['input', 'select', 'textarea'].includes(no.type) && no.props.type !== 'checkbox')
    .every(no => labels.has(no.props.id)));
});

test('seletor identifica o tema e delega a troca sem modificar dados da OS', () => {
  const props = propsTela(); const antes = JSON.stringify(props.ordem); const alteracoes = [];
  const escuro = SeletorTema({ tema: 'escuro', onChange: tema => alteracoes.push(tema) });
  const botoes = elementos(escuro).filter(no => no.type === 'button');
  assert.equal(botoes[0].props['aria-pressed'], false);
  assert.equal(botoes[1].props['aria-pressed'], true);
  botoes[0].props.onClick(); botoes[1].props.onClick();
  assert.deepEqual(alteracoes, ['claro', 'escuro']);
  assert.equal(JSON.stringify(props.ordem), antes);
});

test('tema padrão é claro; preferência escura é recuperada e falha de storage é tolerada', () => {
  const anterior = globalThis.localStorage;
  try {
    for (const [salvo, esperado] of [[null, 'claro'], ['invalido', 'claro'], ['claro', 'claro'], ['escuro', 'escuro']]) {
      globalThis.localStorage = { getItem: () => salvo };
      assert.equal(obterTemaSalvo(), esperado);
    }
    globalThis.localStorage = { getItem: () => { throw new Error('Storage bloqueado'); } };
    assert.equal(obterTemaSalvo(), 'claro');
  } finally {
    if (anterior === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = anterior;
  }
});
