import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';
import { parse } from 'espree';
import { periodoRelatorio } from '../src/utils/relatoriosGerenciais.js';

let vite, Grafico, Painel, Tela;
let tema = 'claro', role = 'ADMIN';
const localStorageAnterior = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const fonte = readFileSync(new URL('../src/pages/admin/relatorios.jsx', import.meta.url), 'utf8');
const ast = parse(fonte, { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true }, range: true });
const componente = ast.body.find(node => node.type === 'ExportDefaultDeclaration').declaration;

function carregarReal(contexto) {
  const declaracao = componente.body.body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : [])
    .find(node => node.id.name === 'carregarRelatorios');
  return vm.runInNewContext(`(${fonte.slice(...declaracao.init.arguments[0].range)})`, contexto);
}

function fixture(extra = {}) {
  return { ordens: [{ id: 1, codigo: 'OS-000001', status: 'FINALIZADA', dataEmissao: '2026-10-04T12:00:00',
    tecnicoId: 5, tecnico: { Nome: 'Técnico de teste' },
    veiculo: { placa: 'ABC1D23', fabricante: 'Marca', modelo: 'Modelo', cliente: { id: 2, nome: 'Cliente de teste' } },
    servicos: [{ id: 10, nomeServico: 'Serviço de teste', valorTotal: '100.00', pecas: [] }],
    pecas: [{ id: 20, nomePeca: 'Peça de teste', quantidade: 2, valorTotal: '50.00' }], diagnosticos: [] }],
    filtros: { periodo: 'todos', inicio: '', fim: '', status: '', tecnico: '' }, atualizado: true, ...extra };
}

before(async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem(key) {
    return key === 'motormind_tema' ? tema : key === 'motormind_usuario' ? JSON.stringify({ Role: role }) : null;
  } } });
  globalThis.__motormindRelatorioFixture = fixture();
  vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', plugins: [{
    name: 'relatorios-fixture', enforce: 'pre', transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/src/pages/admin/relatorios.jsx')) return;
      // Dados simulados só na renderização do teste; a página continua usando hooks e cálculos reais.
      return code.replace('const [ordensServico, setOrdensServico] = useState([]);', 'const [ordensServico, setOrdensServico] = useState(globalThis.__motormindRelatorioFixture.ordens);')
        .replace('const [carregando, setCarregando] = useState(true);', 'const [carregando, setCarregando] = useState(Boolean(globalThis.__motormindRelatorioFixture.carregando));')
        .replace("const [erro, setErro] = useState('');", "const [erro, setErro] = useState(globalThis.__motormindRelatorioFixture.erro || '');")
        .replace('const [atualizadoEm, setAtualizadoEm] = useState(null);', "const [atualizadoEm, setAtualizadoEm] = useState(globalThis.__motormindRelatorioFixture.atualizado ? new Date('2026-10-04T12:00:00') : null);")
        .replace("useState(() => ({ periodo: 'mes', ...periodoRelatorio('mes'), status: '', tecnico: '' }))", 'useState(() => globalThis.__motormindRelatorioFixture.filtros)')
        .replace("const [abaAtiva, setAbaAtiva] = useState('geral');", "const [abaAtiva, setAbaAtiva] = useState(globalThis.__motormindRelatorioFixture.aba || 'geral');");
    },
  }] });
  const graficos = await vite.ssrLoadModule('/src/components/GraficoRelatorio.jsx');
  Grafico = graficos.GraficoRelatorio;
  Painel = graficos.default;
  Tela = (await vite.ssrLoadModule('/src/pages/admin/relatorios.jsx')).default;
});
after(async () => {
  await vite?.close();
  if (localStorageAnterior) Object.defineProperty(globalThis, 'localStorage', localStorageAnterior);
  else delete globalThis.localStorage;
  delete globalThis.__motormindRelatorioFixture;
});

const dados = [{ chave: 'a', nome: 'Primeiro', valor: 40 }, { chave: 'b', nome: 'Segundo', valor: 60 }];
for (const tipo of ['barras', 'colunas', 'linha', 'rosca', 'tabela']) {
  test(`visualização ${tipo} renderiza os mesmos dados com nomes acessíveis`, () => {
    const html = renderToStaticMarkup(React.createElement(Grafico, { dados, tipo, titulo: 'Análise de teste', percentual: true, unidade: 'OS' }));
    assert.ok(html.includes('Primeiro'));
    assert.ok(html.includes('Segundo'));
    assert.ok(!/NaN|Infinity/.test(html));
    if (tipo === 'tabela') {
      assert.ok(html.includes('40%'));
      assert.ok(html.includes('60%'));
      assert.ok(html.includes('scope="col"'));
      assert.ok(html.includes('data-label="OS"'));
    }
    if (['linha', 'colunas', 'rosca'].includes(tipo)) assert.ok(html.includes('role="img"'));
  });
}

test('zeros, ponto único e nomes longos não produzem geometria inválida', () => {
  for (const tipo of ['barras', 'colunas', 'linha', 'rosca', 'tabela']) {
    for (const valor of [0, 1]) {
      const html = renderToStaticMarkup(React.createElement(Grafico, { tipo, titulo: 'Ponto único',
        dados: [{ chave: 'a', nome: 'Nome muito longo para a análise gerencial de teste', valor }] }));
      assert.ok(!/NaN|Infinity/.test(html));
      if (tipo === 'rosca' && valor === 0) assert.ok(html.includes('Não há dados'));
    }
  }
});

test('seletor oferece os tipos permitidos; tabela lista todos os registros e pagina', () => {
  const muitos = Array.from({ length: 25 }, (_, i) => ({ chave: String(i), nome: `Item ${i}`, valor: i + 1 }));
  const html = renderToStaticMarkup(React.createElement(Painel, { titulo: 'Ranking', descricao: 'Teste', dados: muitos, tipoInicial: 'tabela', limitar: true }));
  for (const tipo of ['barras', 'colunas', 'rosca', 'tabela']) assert.ok(html.includes(`value="${tipo}"`));
  assert.ok(html.includes('Página 1 de 3'));
  assert.ok(html.includes('todos os 25 registros'));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  for (const label of html.matchAll(/for="([^"]+)"/g)) assert.ok(ids.includes(label[1]));
});

function renderTela(dados = fixture()) {
  globalThis.__motormindRelatorioFixture = dados;
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/admin/relatorios'] }, React.createElement(Tela)));
}

test('painel gerencial usa os valores da OS, temas existentes e filtros associados', () => {
  for (tema of ['claro', 'escuro']) {
    for (role of ['ADMIN', 'OWNER']) {
      const html = renderTela();
      for (const texto of ['Relatórios gerenciais', 'Ordens ativas', 'Clientes atendidos', 'Evolução do período',
        'Situação das ordens', 'Composição dos valores', 'Peças mais utilizadas', '150,00', 'Técnico de teste', 'ABC1D23', 'Exportar tabela em CSV']) assert.ok(html.includes(texto), texto);
      assert.ok(!html.includes('Ticket médio'));
      assert.ok(html.includes(`data-theme="${tema}"`));
      const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
      assert.equal(ids.length, new Set(ids).size);
      for (const label of html.matchAll(/for="([^"]+)"/g)) assert.ok(ids.includes(label[1]));
      assert.ok(html.includes('value="FINALIZADA"'));
      assert.ok(html.includes('value="FECHADA"'));
    }
  }
});

test('carregamento e falha inicial não mostram indicadores zerados como se houvesse consulta válida', () => {
  let html = renderTela(fixture({ atualizado: false, carregando: true }));
  assert.ok(html.includes('Carregando os dados'));
  assert.ok(!html.includes('Resumo gerencial'));
  html = renderTela(fixture({ atualizado: false, erro: 'Falha de teste' }));
  assert.ok(html.includes('role="alert"'));
  assert.ok(html.includes('Tentar novamente'));
  assert.ok(!html.includes('Resumo gerencial'));
});

test('falha na atualização preserva a última consulta e informa o estado ao usuário', () => {
  const html = renderTela(fixture({ erro: 'Falha de teste' }));
  assert.ok(html.includes('última atualização continuam disponíveis'));
  assert.ok(html.includes('150,00'));
  assert.ok(html.includes('ABC1D23'));
});

test('período inválido bloqueia a análise; período válido sem dados orienta limpar os filtros', () => {
  let html = renderTela(fixture({ filtros: { inicio: '2026-10-05', fim: '2026-10-01' } }));
  assert.ok(html.includes('aria-invalid="true"'));
  assert.ok(!html.includes('Resumo gerencial'));
  html = renderTela(fixture({ filtros: { inicio: '2026-11-01', fim: '2026-11-30' } }));
  assert.ok(html.includes('Nenhuma OS neste período'));
  assert.ok(html.includes('Consultar todo o período'));
});

test('consulta real usa Axios com sinal de cancelamento e atualiza a data somente após sucesso', async () => {
  const chamadas = [], estado = { ordens: ['anteriores'], atualizado: 'anterior', erro: 'anterior', carregando: true };
  const contexto = { api: { get: async (url, options) => { chamadas.push({ url, options }); return { data: [] }; } }, toast: { error() {} },
    setOrdensServico: valor => { estado.ordens = valor; }, setAtualizadoEm: valor => { estado.atualizado = valor; },
    setErro: valor => { estado.erro = valor; }, setCarregando: valor => { estado.carregando = valor; } };
  const signal = new AbortController().signal;
  await carregarReal(contexto)(signal);
  assert.equal(chamadas[0].url, '/ordens-servico');
  assert.equal(chamadas[0].options.signal, signal);
  assert.deepEqual(estado.ordens, []);
  assert.ok(estado.atualizado);
  assert.equal(estado.erro, '');
  assert.equal(estado.carregando, false);
});

test('erro de API ou formato inesperado não substitui dados válidos nem a data anterior', async () => {
  for (const get of [async () => { throw new Error('Falha'); }, async () => ({ data: {} })]) {
    const estado = { ordens: ['anteriores'], atualizado: 'anterior', erro: '', carregando: true };
    const contexto = { api: { get }, toast: { error() {} }, setOrdensServico: valor => { estado.ordens = valor; },
      setAtualizadoEm: valor => { estado.atualizado = valor; }, setErro: valor => { estado.erro = valor; }, setCarregando: valor => { estado.carregando = valor; } };
    await carregarReal(contexto)();
    assert.deepEqual(estado.ordens, ['anteriores']);
    assert.equal(estado.atualizado, 'anterior');
    assert.ok(estado.erro);
    assert.equal(estado.carregando, false);
  }
});

test('cancelamento impede que uma resposta tardia altere a tela desmontada', async () => {
  let concluir;
  const alteracoes = [];
  const contexto = { api: { get: () => new Promise(resolve => { concluir = resolve; }) }, toast: { error() {} },
    ...Object.fromEntries(['setOrdensServico', 'setAtualizadoEm', 'setErro', 'setCarregando'].map(nome => [nome, () => alteracoes.push(nome)])) };
  const controller = new AbortController();
  const consulta = carregarReal(contexto)(controller.signal);
  controller.abort();
  concluir({ data: [] });
  await consulta;
  assert.deepEqual(alteracoes, []);
});

test('alterar datas marca período personalizado; troca e limpeza de filtros reiniciam a busca da tabela', () => {
  const estado = { filtros: { periodo: 'todos', inicio: '', fim: '', status: 'ABERTA', tecnico: '5' }, busca: 'ABC1D23' };
  const contexto = { periodoRelatorio, setFiltros: valor => { estado.filtros = typeof valor === 'function' ? valor(estado.filtros) : valor; },
    setBuscaTabela: valor => { estado.busca = valor; } };
  const obter = nome => {
    const declaracao = componente.body.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === nome);
    return vm.runInNewContext(`(${fonte.slice(...declaracao.range)})`, contexto);
  };
  obter('atualizarFiltro')('inicio', '2026-10-01');
  assert.equal(estado.filtros.periodo, 'personalizado');
  assert.equal(estado.busca, '');
  obter('alterarPeriodo')('30dias');
  assert.equal(estado.filtros.periodo, '30dias');
  assert.equal(estado.filtros.status, 'ABERTA');
  obter('limparFiltros')();
  assert.deepEqual(JSON.parse(JSON.stringify(estado.filtros)), { periodo: 'todos', inicio: '', fim: '', status: '', tecnico: '' });
});

test('abas associam seus painéis e exibem somente a seção selecionada, mantendo os demais painéis montados', () => {
  for (const aba of ['geral', 'evolucao', 'distribuicao', 'rankings', 'ordens']) {
    const html = renderTela(fixture({ aba }));
    const botoes = html.match(/<button[^>]*role="tab"[^>]*>/g);
    const paineis = [...html.matchAll(/<section id="relatorio-painel-([^"]+)"[^>]*>/g)];
    assert.equal(botoes.length, 5);
    assert.equal(paineis.length, 5);
    assert.equal(botoes.filter(botao => botao.includes('aria-selected="true"')).length, 1);
    assert.equal(paineis.filter(painel => !painel[0].includes('hidden=""')).length, 1);
    assert.equal(paineis.find(painel => !painel[0].includes('hidden=""'))[1], aba);
    for (const botao of botoes) {
      const destino = botao.match(/aria-controls="([^"]+)"/)[1];
      assert.ok(html.includes(`id="${destino}"`));
    }
    assert.ok(html.includes('relatorio-periodo'), 'Os filtros continuam disponíveis em qualquer aba');
  }
});

test('setas, Home e End trocam abas e encaminham o foco sem alterar filtros ou indicadores', () => {
  const declaracaoAbas = ast.body.flatMap(node => node.type === 'VariableDeclaration' ? node.declarations : [])
    .find(node => node.id.name === 'ABAS_RELATORIO');
  const declaracao = componente.body.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'navegarAbas');
  const focos = [];
  const contexto = { ABAS_RELATORIO: vm.runInNewContext(`(${fonte.slice(...declaracaoAbas.init.range)})`), abaAtiva: 'geral',
    setAbaAtiva: valor => { contexto.abaAtiva = valor; },
    abasRef: { current: { querySelector: seletor => ({ focus: () => focos.push(seletor) }) } } };
  const navegar = vm.runInNewContext(`(${fonte.slice(...declaracao.range)})`, contexto);
  for (const [key, esperada] of [['ArrowRight', 'evolucao'], ['ArrowLeft', 'geral'], ['ArrowLeft', 'ordens'], ['Home', 'geral'], ['End', 'ordens']]) {
    let impediu = false;
    navegar({ key, preventDefault: () => { impediu = true; } });
    assert.equal(contexto.abaAtiva, esperada);
    assert.ok(impediu);
    assert.equal(focos.at(-1), `#relatorio-aba-${esperada}`);
  }
  navegar({ key: 'Tab', preventDefault: () => { throw new Error('Tab deve manter a navegação padrão'); } });
  assert.equal(focos.length, 5);
});
