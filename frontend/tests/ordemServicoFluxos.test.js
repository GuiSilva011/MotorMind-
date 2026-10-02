import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { parse } from 'espree';
import { calcularTotaisOrdem } from '../src/utils/ordemServicoCalculos.js';

// Executa as funções reais do componente com API e estado controlados, sem precisar de um banco.
const fonte = readFileSync(new URL('../src/pages/operador/ordemServico.jsx', import.meta.url), 'utf8');
const ast = parse(fonte, { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true }, range: true });
const componente = ast.body.find(no => no.type === 'FunctionDeclaration' && no.id.name === 'OrdemServico');
function contemJSX(no) {
  if (!no || typeof no !== 'object') return false;
  if (String(no.type).startsWith('JSX')) return true;
  return Object.values(no).some(valor => Array.isArray(valor) ? valor.some(contemJSX) : contemJSX(valor));
}
const funcoes = componente.body.body.filter(no => no.type === 'FunctionDeclaration' && !contemJSX(no));
const corpo = funcoes.map(no => fonte.slice(...no.range)).join('\n');
const nomes = funcoes.map(no => no.id.name);
const inicial = ast.body.flatMap(no => no.type === 'VariableDeclaration' ? no.declarations : [])
  .find(no => no.id.name === 'ordemInicial').init;
const ordemInicial = () => vm.runInNewContext(`(${fonte.slice(...inicial.range)})`);
const normalizar = valor => JSON.parse(JSON.stringify(valor));

function ambiente() {
  const chamadas = [], avisos = [], removidos = [], eventos = [];
  const contexto = {
    OS_RASCUNHO_KEY: 'motormind_ordem_servico_rascunho', ordem: ordemInicial(), modoTela: 'nova',
    busca: '', resultadosBusca: [], clienteNaoEncontrado: false, buscandoVeiculo: false, salvando: false,
    carregandoCatalogos: false, carregandoCodigo: false, carregandoOrdem: false, buscandoOrdens: false,
    modalBuscarOSAberto: false, ordensEncontradas: [], filtrosBuscaOS: { termo: '', status: '', dataInicio: '', dataFim: '' },
    catalogos: { diagnosticos: [], servicos: [], pecas: [], estoque: [], fornecedores: [], tecnicos: [], tecnicosOS: [] },
    modalCatalogo: { aberto: false, tipo: '', origem: '' }, crypto: { randomUUID }, console: { error() {} },
    localStorage: { removeItem: chave => removidos.push(chave) },
    Event: class { constructor(type) { this.type = type; } },
    window: { dispatchEvent: evento => eventos.push(evento.type) },
    toast: Object.fromEntries(['success', 'warning', 'error', 'info'].map(tipo => [tipo, mensagem => avisos.push({ tipo, mensagem })])),
  };
  Object.defineProperty(contexto, 'podeEditar', { get: () => ['nova', 'edicao'].includes(contexto.modoTela) });
  for (const nome of ['ordem', 'modoTela', 'busca', 'resultadosBusca', 'clienteNaoEncontrado', 'buscandoVeiculo', 'salvando',
    'carregandoCatalogos', 'carregandoCodigo', 'carregandoOrdem', 'buscandoOrdens', 'modalBuscarOSAberto', 'ordensEncontradas',
    'catalogos', 'modalCatalogo']) {
    contexto[`set${nome[0].toUpperCase()}${nome.slice(1)}`] = valor => {
      contexto[nome] = typeof valor === 'function' ? valor(contexto[nome]) : valor;
    };
  }
  contexto.api = {
    get: async (url, config) => {
      chamadas.push({ metodo: 'GET', url, config: normalizar(config || {}) });
      if (url === '/veiculos/buscar-para-os') return { data: contexto.veiculosEncontrados || [] };
      if (url === '/ordens-servico/buscar') return { data: contexto.listaOrdens || [] };
      if (url.startsWith('/ordens-servico/')) return { data: contexto.osPersistida };
      return { data: [] };
    },
    post: async (url, payload) => {
      chamadas.push({ metodo: 'POST', url, payload: normalizar(payload) });
      if (contexto.erroSalvar) throw contexto.erroSalvar;
      return { data: contexto.osPersistida };
    },
    put: async (url, payload) => {
      chamadas.push({ metodo: 'PUT', url, payload: normalizar(payload) });
      if (contexto.erroSalvar) throw contexto.erroSalvar;
      return { data: contexto.osPersistida };
    },
  };
  const fluxos = vm.runInNewContext(`(() => { ${corpo}\nreturn { ${nomes.join(', ')} }; })()`, contexto);
  return { contexto, fluxos, chamadas, avisos, removidos, eventos };
}

const veiculo = { id: 3, placa: 'ABC1D23', fabricante: 'Marca', modelo: 'Modelo', ano_fabricacao: 2020, ano_modelo: 2021,
  motor: '1.0', cambio: 'Manual', cor: 'Prata', km: 10, chassi: 'CHASSI-TESTE', ar: true,
  cliente: { id: 2, nome: 'Cliente de teste', Email: 'teste@example.com' } };
const osPersistida = { id: 7, codigo: 'OS-000007', status: 'ABERTA', tecnicoId: 9,
  tecnico: { Nome: 'Técnico de teste' }, veiculo, observacoes: 'Observação salva', diagnosticos: [], servicos: [], pecas: [] };

test('busca de cliente e seleção de veículo mantêm rota, parâmetros e campos', async () => {
  const { contexto, fluxos, chamadas } = ambiente();
  contexto.busca = ' ABC1D23 '; contexto.veiculosEncontrados = [veiculo];
  await fluxos.buscarClienteOuVeiculo();
  assert.deepEqual(chamadas[0], { metodo: 'GET', url: '/veiculos/buscar-para-os', config: { params: { termo: 'ABC1D23' } } });
  fluxos.selecionarVeiculo(contexto.resultadosBusca[0]);
  assert.equal(contexto.ordem.veiculo.id, 3);
  assert.equal(contexto.ordem.veiculo.cambio, 'Manual');
  assert.equal(contexto.ordem.cliente.email, 'teste@example.com');
  assert.equal(contexto.resultadosBusca.length, 0);
});

test('adição e edição de todos os grupos mantêm os vínculos e o cálculo atualizado', () => {
  const { contexto, fluxos } = ambiente();
  fluxos.adicionarDiagnostico(); const d = contexto.ordem.diagnosticos[0];
  fluxos.adicionarServicoAoDiagnostico(d.id); const s = contexto.ordem.diagnosticos[0].servicos[0];
  fluxos.adicionarPecaDiagnostico(d.id, s.id); const p = contexto.ordem.diagnosticos[0].servicos[0].pecas[0];
  fluxos.atualizarServicoDiagnostico(d.id, s.id, 'precoVenda', '100');
  fluxos.atualizarPecaDiagnostico(d.id, s.id, p.id, 'quantidade', '2');
  fluxos.atualizarPecaDiagnostico(d.id, s.id, p.id, 'custoUnitario', '25');
  fluxos.adicionarServicoSemDiagnostico(); const s2 = contexto.ordem.servicosSemDiagnostico[0];
  fluxos.atualizarServicoSemDiagnostico(s2.id, 'precoVenda', '80');
  fluxos.adicionarPecaSemDiagnostico(s2.id);
  fluxos.adicionarPecaAvulsa(); const p2 = contexto.ordem.pecasAvulsas[0];
  fluxos.atualizarPecaAvulsa(p2.id, 'custoUnitario', '10');
  assert.equal(calcularTotaisOrdem(contexto.ordem).totalGeral, 240);
  fluxos.removerPecaDiagnostico(d.id, s.id, p.id);
  assert.equal(calcularTotaisOrdem(contexto.ordem).totalGeral, 190);
});

test('selecionar estoque remove catálogo e fornecedor e não chama movimentação nem salvamento', () => {
  const { contexto, fluxos, chamadas } = ambiente();
  fluxos.adicionarPecaAvulsa(); const p = contexto.ordem.pecasAvulsas[0];
  fluxos.atualizarPecaAvulsa(p.id, 'pecaCatalogoId', 10);
  fluxos.atualizarPecaAvulsa(p.id, 'fornecedorId', 5);
  contexto.modalCatalogo = { origem: 'avulsa', pecaId: p.id };
  fluxos.aplicarPecaEstoque({ id: 21, codigo: 'EST-000021', nome: 'Peça física' });
  const atual = contexto.ordem.pecasAvulsas[0];
  assert.equal(atual.estoquePecaId, 21);
  assert.equal(atual.pecaCatalogoId, '');
  assert.equal(atual.fornecedorId, '');
  assert.equal(chamadas.length, 0);
});

test('criação envia POST com OS, técnico e origem das peças no contrato existente', async () => {
  const { contexto, fluxos, chamadas, eventos, removidos } = ambiente();
  fluxos.selecionarVeiculo(veiculo);
  contexto.ordem.codigo = 'OS-000007'; contexto.ordem.tecnicoId = '9';
  fluxos.adicionarPecaAvulsa(); const p = contexto.ordem.pecasAvulsas[0];
  contexto.modalCatalogo = { origem: 'avulsa', pecaId: p.id };
  fluxos.aplicarPecaEstoque({ id: 21, codigo: 'EST-000021', nome: 'Peça física' });
  contexto.osPersistida = osPersistida;
  await fluxos.salvarOrdemServico();
  const envio = chamadas.find(item => item.metodo === 'POST');
  assert.equal(envio.url, '/ordens-servico');
  assert.equal(envio.payload.tecnicoId, 9);
  assert.equal(envio.payload.veiculoId, 3);
  assert.equal(envio.payload.pecasAvulsas[0].estoquePecaId, 21);
  assert.equal(envio.payload.pecasAvulsas[0].pecaCatalogoId, null);
  assert.equal(contexto.modoTela, 'visualizacao');
  assert.equal(contexto.salvando, false);
  assert.deepEqual(eventos, ['estoque-atualizado']);
  assert.ok(removidos.includes('motormind_ordem_servico_rascunho'));
});

test('busca, abertura e edição da OS preservam GET, consulta inicial e PUT', async () => {
  const { contexto, fluxos, chamadas } = ambiente();
  contexto.filtrosBuscaOS = { termo: 'OS-000007', status: 'FECHADA', dataInicio: '', dataFim: '' };
  contexto.listaOrdens = [{ id: 7, codigo: 'OS-000007' }]; contexto.osPersistida = osPersistida;
  await fluxos.buscarOrdensAntigas(); await fluxos.abrirOrdemExistente(7);
  assert.deepEqual(chamadas[0].config.params, { termo: 'OS-000007', status: 'FECHADA' });
  assert.equal(chamadas[1].url, '/ordens-servico/7');
  assert.equal(contexto.modoTela, 'visualizacao');
  fluxos.editarOrdemAtual(); fluxos.atualizarCampoOrdem('observacoes', 'Texto editado');
  await fluxos.salvarOrdemServico();
  assert.equal(chamadas.find(item => item.metodo === 'PUT').url, '/ordens-servico/7');
  assert.equal(chamadas.find(item => item.metodo === 'PUT').payload.observacoes, 'Texto editado');
});

test('validação sem veículo impede POST e erro ao salvar preserva os dados preenchidos', async () => {
  const { contexto, fluxos, chamadas, avisos } = ambiente();
  contexto.ordem.codigo = 'OS-000007';
  await fluxos.salvarOrdemServico();
  assert.equal(chamadas.length, 0);
  assert.equal(avisos[0].tipo, 'warning');
  fluxos.selecionarVeiculo(veiculo);
  contexto.ordem.observacoes = 'Texto preservado';
  contexto.erroSalvar = { response: { data: { erro: 'Saldo insuficiente' } } };
  await fluxos.salvarOrdemServico();
  assert.equal(contexto.ordem.observacoes, 'Texto preservado');
  assert.equal(contexto.modoTela, 'nova');
  assert.equal(contexto.salvando, false);
  assert.equal(avisos.at(-1).mensagem, 'Saldo insuficiente');
});
