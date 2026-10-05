import assert from 'node:assert/strict';
import test from 'node:test';
import { agregarRelatorio, buscarOrdensRelatorio, dadosGrafico, exportarOrdensCsv, filtrarOrdensRelatorio,
  normalizarOrdemRelatorio, ordenarRanking, periodoRelatorio, serieRelatorio } from '../src/utils/relatoriosGerenciais.js';

function ordem(extra = {}) {
  return { id: 1, codigo: 'OS-000001', dataEmissao: '2026-10-04T12:00:00', status: 'ABERTA', tecnicoId: 10,
    tecnico: { id: 10, Nome: 'Técnico de teste' }, veiculo: { placa: 'ABC1D23', fabricante: 'Marca', modelo: 'Modelo', cliente: { id: 5, nome: 'Cliente de teste' } },
    diagnosticos: [], servicos: [], pecas: [], ...extra };
}

test('cada serviço e peça persistidos entram uma vez, mesmo presentes em vários grupos da API', () => {
  const peca = { id: 1, nomePeca: 'Filtro', quantidade: 2, custoUnitario: '25.00', desconto: '5.00' };
  const direta = { id: 2, nomePeca: 'Óleo', quantidade: 1, custoUnitario: '10.00' };
  const avulsa = { id: 3, nomePeca: 'Item avulso', quantidade: 3, custoUnitario: '0.10' };
  const servico = { id: 11, nomeServico: 'Troca', precoVenda: '100', desconto: '20', pecas: [peca] };
  const entrada = ordem({ servicos: [servico], pecas: [peca, direta, avulsa],
    diagnosticos: [{ servicos: [{ ...servico, pecas: [{ ...peca }] }], pecas: [{ ...direta }] }] });
  const normalizada = normalizarOrdemRelatorio(entrada);
  assert.equal(normalizada.servicos.length, 1);
  assert.equal(normalizada.pecas.length, 3);
  assert.equal(normalizada.totalServicos, 80);
  assert.equal(normalizada.totalPecas, 55.3);
  assert.equal(normalizada.total, 135.3);
  assert.equal(entrada.pecas.length, 3, 'A normalização não altera os dados de entrada');
  const resumo = agregarRelatorio([normalizada]);
  assert.equal(resumo.rankings.pecas.find(item => item.nome === 'Filtro').quantidade, 2);
  assert.equal(resumo.rankings.pecas.find(item => item.nome === 'Filtro').ocorrencias, 1);
});

test('valores líquidos persistidos são respeitados, incluindo zero; ausência usa a regra de descontos da OS', () => {
  const resultado = normalizarOrdemRelatorio(ordem({ servicos: [
    { id: 1, valorTotal: '0', precoVenda: '100' },
    { id: 2, valorTotal: '50.25', precoVenda: '999' },
    { id: 3, precoVenda: '20', desconto: '30' },
  ], pecas: [{ id: 4, quantidade: 2, custoUnitario: 25, desconto: 5 }] }));
  assert.equal(resultado.totalServicos, 50.25);
  assert.equal(resultado.totalPecas, 45);
  assert.equal(resultado.total, 95.25);
});

test('totais monetários não acumulam erros de centavos', () => {
  const ordens = Array.from({ length: 10 }, (_, indice) => normalizarOrdemRelatorio(ordem({ id: indice,
    pecas: [{ id: indice, quantidade: 1, custoUnitario: '0.10' }] })));
  assert.equal(agregarRelatorio(ordens).total, 1);
});

test('períodos rápidos usam dias civis inclusivos e atravessam meses e anos', () => {
  const hoje = new Date(2026, 9, 4, 12);
  assert.deepEqual(periodoRelatorio('mes', hoje), { inicio: '2026-10-01', fim: '2026-10-04' });
  assert.deepEqual(periodoRelatorio('30dias', hoje), { inicio: '2026-09-05', fim: '2026-10-04' });
  assert.deepEqual(periodoRelatorio('ano', hoje), { inicio: '2026-01-01', fim: '2026-10-04' });
  assert.deepEqual(periodoRelatorio('todos', hoje), { inicio: '', fim: '' });
  assert.deepEqual(periodoRelatorio('30dias', new Date(2024, 2, 1)), { inicio: '2024-02-01', fim: '2024-03-01' });
});

test('filtro de emissão inclui o início/fim do dia, sem confundir data de fechamento', () => {
  const ordens = [
    ordem({ id: 1, dataEmissao: '2026-10-01T00:00:00', dataFechamento: '2026-11-01T00:00:00' }),
    ordem({ id: 2, dataEmissao: '2026-10-04T23:59:59' }),
    ordem({ id: 3, dataEmissao: '2026-10-05T00:00:00' }),
    ordem({ id: 4, dataEmissao: null }),
  ].map(normalizarOrdemRelatorio);
  assert.deepEqual(filtrarOrdensRelatorio(ordens, { inicio: '2026-10-01', fim: '2026-10-04' }).map(item => item.id), [1, 2]);
  assert.equal(filtrarOrdensRelatorio(ordens, {}).length, 4);
  assert.equal(filtrarOrdensRelatorio(ordens, { inicio: '2026-10-05', fim: '2026-10-01' }).length, 0);
});

test('status e técnico filtram por IDs; Sem técnico seleciona apenas os não atribuídos', () => {
  const ordens = [ordem(), ordem({ id: 2, status: 'FECHADA', tecnicoId: 11 }), ordem({ id: 3, tecnicoId: null, tecnico: null })].map(normalizarOrdemRelatorio);
  assert.deepEqual(filtrarOrdensRelatorio(ordens, { status: 'FECHADA', tecnico: '11' }).map(item => item.id), [2]);
  assert.deepEqual(filtrarOrdensRelatorio(ordens, { tecnico: 'sem' }).map(item => item.id), [3]);
});

test('canceladas permanecem na contagem/status e saem dos valores, clientes e rankings', () => {
  const ordens = [
    ordem({ id: 1, status: 'FINALIZADA', servicos: [{ id: 1, nomeServico: 'Serviço', valorTotal: 100 }] }),
    ordem({ id: 2, status: 'FECHADA', pecas: [{ id: 2, nomePeca: 'Peça', quantidade: 3, valorTotal: 50 }] }),
    ordem({ id: 3, status: 'AGUARDANDO_PECA', servicos: [{ id: 3, nomeServico: 'Serviço', valorTotal: 60 }] }),
    ordem({ id: 4, status: 'CANCELADA', servicos: [{ id: 4, nomeServico: 'Cancelado', valorTotal: 1000 }] }),
  ].map(normalizarOrdemRelatorio);
  const resumo = agregarRelatorio(ordens);
  assert.equal(resumo.quantidade, 4);
  assert.equal(resumo.total, 210);
  assert.equal(resumo.ticketMedio, 70);
  assert.equal(resumo.ativas, 1);
  assert.equal(resumo.concluidas, 2);
  assert.equal(resumo.valorConcluidas, 150);
  assert.equal(resumo.canceladas, 1);
  assert.equal(resumo.clientes, 1);
  assert.equal(resumo.status.find(item => item.chave === 'CANCELADA').valor, 1);
  assert.equal(resumo.status.find(item => item.chave === 'FINALIZADA').valor, 1);
  assert.equal(resumo.status.find(item => item.chave === 'FECHADA').valor, 1);
  assert.ok(!resumo.rankings.servicos.some(item => item.nome === 'Cancelado'));
  assert.equal(resumo.rankings.pecas[0].quantidade, 3);
});

test('técnicos homônimos continuam separados, com categoria para ordens sem responsável', () => {
  const ordens = [ordem(), ordem({ id: 2, tecnicoId: 11 }), ordem({ id: 3, tecnicoId: null, tecnico: null })].map(normalizarOrdemRelatorio);
  const dados = agregarRelatorio(ordens).rankings.tecnicos;
  assert.equal(dados.length, 3);
  assert.ok(dados.some(item => item.nome === 'Sem técnico'));
});

test('evolução inclui períodos sem OS e canceladas entram somente na métrica de quantidade', () => {
  const ordens = [ordem({ dataEmissao: '2026-10-01T12:00:00', servicos: [{ valorTotal: 100 }] }),
    ordem({ id: 2, dataEmissao: '2026-10-03T12:00:00', status: 'CANCELADA', servicos: [{ valorTotal: 200 }] })].map(normalizarOrdemRelatorio);
  const filtros = { inicio: '2026-10-01', fim: '2026-10-03' };
  assert.deepEqual(serieRelatorio(ordens, filtros).dados.map(item => item.valor), [1, 0, 1]);
  assert.deepEqual(serieRelatorio(ordens, filtros, 'valor').dados.map(item => item.valor), [100, 0, 0]);
});

test('períodos longos agrupam por mês, incluem meses vazios e suportam todo o histórico', () => {
  const ordens = [ordem({ dataEmissao: '2026-01-31T12:00:00' }), ordem({ dataEmissao: '2026-05-01T12:00:00' })].map(normalizarOrdemRelatorio);
  const serie = serieRelatorio(ordens, {});
  assert.equal(serie.agrupamento, 'mês');
  assert.deepEqual(serie.dados.map(item => item.chave), ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05']);
  assert.deepEqual(serie.dados.map(item => item.valor), [1, 0, 0, 0, 1]);
});

test('sem dados, indicadores e séries não apresentam NaN ou divisão por zero', () => {
  const resumo = agregarRelatorio([]);
  assert.equal(resumo.ticketMedio, 0);
  assert.equal(resumo.total, 0);
  assert.deepEqual(serieRelatorio([], {}).dados, []);
  assert.equal(resumo.status.reduce((soma, item) => soma + item.valor, 0), 0);
});

test('rankings ordenam pela métrica escolhida e a tabela não perde registros', () => {
  const dados = [{ chave: 'A', nome: 'A', quantidade: 2, valor: 50 }, { chave: 'B', nome: 'B', quantidade: 5, valor: 10 }];
  assert.equal(ordenarRanking(dados, 'quantidade')[0].nome, 'B');
  assert.equal(ordenarRanking(dados, 'valor')[0].nome, 'A');
  const muitos = Array.from({ length: 15 }, (_, indice) => ({ chave: String(indice), nome: `Item ${indice}`, valor: 15 - indice }));
  assert.equal(dadosGrafico(muitos, 'barras').length, 10);
  assert.equal(dadosGrafico(muitos, 'tabela').length, 15);
  const rosca = dadosGrafico(muitos, 'rosca');
  assert.equal(rosca.at(-1).nome, 'Outros');
  assert.equal(rosca.reduce((soma, item) => soma + item.valor, 0), muitos.reduce((soma, item) => soma + item.valor, 0));
});

test('busca da tabela contempla código, cliente, placa, modelo e técnico sem alterar os indicadores', () => {
  const ordens = [normalizarOrdemRelatorio(ordem()), normalizarOrdemRelatorio(ordem({ id: 2, codigo: 'OS-000002', tecnico: { Nome: 'Outro' } }))];
  assert.equal(buscarOrdensRelatorio(ordens, ' OS-000001 ').length, 1);
  assert.equal(buscarOrdensRelatorio(ordens, 'abc1d23').length, 2);
  assert.equal(buscarOrdensRelatorio(ordens, 'cliente de teste').length, 2);
  assert.equal(buscarOrdensRelatorio(ordens, 'técnico de teste').length, 1);
  assert.equal(ordens.length, 2);
});

test('CSV usa BOM, decimal brasileiro, inclui todos os resultados e protege texto com fórmula/aspas', () => {
  const ordens = [normalizarOrdemRelatorio(ordem({ servicos: [{ valorTotal: 100.25 }],
    veiculo: { placa: 'ABC1D23', modelo: 'Modelo', cliente: { id: 5, nome: '=SOMA(1;2) "Teste"' } } })),
    normalizarOrdemRelatorio(ordem({ id: 2, status: 'CANCELADA', pecas: [{ valorTotal: 500 }] }))];
  const csv = exportarOrdensCsv(ordens);
  assert.ok(csv.startsWith('\uFEFF"OS";'));
  assert.ok(csv.includes('"100,25"'));
  assert.ok(csv.includes('"\'=SOMA(1;2) ""Teste"""'));
  assert.ok(csv.includes('"Cancelada";"";"";""'));
  assert.equal(csv.split('\r\n').length, 3);
});
