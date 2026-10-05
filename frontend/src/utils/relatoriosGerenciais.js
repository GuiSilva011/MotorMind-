import { calcularTotalPeca, calcularTotalServico } from './ordemServicoCalculos.js';

export const STATUS_RELATORIO = [
  { valor: 'ABERTA', nome: 'Aberta' },
  { valor: 'EM_ANDAMENTO', nome: 'Em andamento' },
  { valor: 'AGUARDANDO_PECA', nome: 'Aguardando peça' },
  { valor: 'FINALIZADA', nome: 'Finalizada' },
  { valor: 'FECHADA', nome: 'Fechada' },
  { valor: 'CANCELADA', nome: 'Cancelada' },
];

const ATIVAS = new Set(['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA']);
const CONCLUIDAS = new Set(['FINALIZADA', 'FECHADA']);
const numero = valor => Number.isFinite(Number(valor)) ? Number(valor) : 0;
const centavos = valor => Math.round(numero(valor) * 100);
const lista = valor => Array.isArray(valor) ? valor : [];
const dataValida = valor => {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
};

export function chaveDia(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

export function periodoRelatorio(tipo, agora = new Date()) {
  if (tipo === 'todos') return { inicio: '', fim: '' };
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  if (tipo === 'mes') inicio.setDate(1);
  if (tipo === 'ano') inicio.setMonth(0, 1);
  if (tipo === '30dias') inicio.setDate(inicio.getDate() - 29);
  if (tipo === '90dias') inicio.setDate(inicio.getDate() - 89);
  return { inicio: chaveDia(inicio), fim: chaveDia(agora) };
}

function itensUnicos(itens) {
  const ids = new Set();
  const objetos = new Set();
  return itens.filter(item => {
    if (!item || typeof item !== 'object') return false;
    if (item.id != null) {
      const id = String(item.id);
      if (ids.has(id)) return false;
      ids.add(id);
    } else {
      if (objetos.has(item)) return false;
      objetos.add(item);
    }
    return true;
  });
}

function valorItem(item, calcular) {
  const valor = item.valorTotal != null ? numero(item.valorTotal) : calcular(item);
  return Math.max(centavos(valor), 0);
}

export function normalizarOrdemRelatorio(ordem) {
  const diagnosticos = lista(ordem.diagnosticos);
  const servicos = itensUnicos([...lista(ordem.servicos), ...diagnosticos.flatMap(item => lista(item.servicos))]);
  const pecas = itensUnicos([...lista(ordem.pecas), ...diagnosticos.flatMap(item => lista(item.pecas)),
    ...servicos.flatMap(item => lista(item.pecas))]);
  const totalServicos = servicos.reduce((soma, item) => soma + valorItem(item, calcularTotalServico), 0);
  const totalPecas = pecas.reduce((soma, item) => soma + valorItem(item, calcularTotalPeca), 0);
  const data = dataValida(ordem.dataEmissao);
  return {
    ...ordem, servicos, pecas, dia: data ? chaveDia(data) : '',
    totalServicos: totalServicos / 100, totalPecas: totalPecas / 100,
    total: (totalServicos + totalPecas) / 100,
    tecnicoNome: ordem.tecnico?.Nome || 'Sem técnico',
    clienteNome: ordem.veiculo?.cliente?.nome || 'Cliente não informado',
    modeloNome: [ordem.veiculo?.fabricante, ordem.veiculo?.modelo].filter(Boolean).join(' ') || 'Modelo não informado',
  };
}

export function filtrarOrdensRelatorio(ordens, filtros) {
  if (filtros.inicio && filtros.fim && filtros.inicio > filtros.fim) return [];
  return ordens.filter(ordem => {
    if (filtros.inicio && (!ordem.dia || ordem.dia < filtros.inicio)) return false;
    if (filtros.fim && (!ordem.dia || ordem.dia > filtros.fim)) return false;
    if (filtros.status && ordem.status !== filtros.status) return false;
    if (filtros.tecnico === 'sem' && ordem.tecnicoId != null) return false;
    if (filtros.tecnico && filtros.tecnico !== 'sem' && String(ordem.tecnicoId) !== filtros.tecnico) return false;
    return true;
  });
}

function adicionarRanking(mapa, nome, quantidade, valor, identificador) {
  const nomeTratado = String(nome || 'Não informado').trim() || 'Não informado';
  const chave = identificador ?? nomeTratado;
  const atual = mapa.get(chave) || { chave, nome: nomeTratado, ocorrencias: 0, quantidade: 0, valor: 0 };
  atual.ocorrencias++;
  atual.quantidade += Math.max(numero(quantidade), 0);
  atual.valor += centavos(valor);
  mapa.set(chave, atual);
}

export function agregarRelatorio(ordens) {
  const validas = ordens.filter(ordem => ordem.status !== 'CANCELADA');
  const somar = campo => validas.reduce((soma, ordem) => soma + centavos(ordem[campo]), 0) / 100;
  const total = somar('total');
  const clientes = new Set(validas.map(ordem => ordem.veiculo?.cliente?.id ?? ordem.veiculo?.clienteId).filter(id => id != null));
  const rankings = Object.fromEntries(['pecas', 'servicos', 'modelos', 'marcas', 'tecnicos'].map(nome => [nome, new Map()]));
  for (const ordem of validas) {
    for (const peca of ordem.pecas) {
      adicionarRanking(rankings.pecas, peca.nomePeca || peca.descricao || peca.nome,
        peca.quantidade, valorItem(peca, calcularTotalPeca) / 100);
    }
    for (const servico of ordem.servicos) {
      adicionarRanking(rankings.servicos, servico.nomeServico || servico.descricao || servico.nome,
        1, valorItem(servico, calcularTotalServico) / 100);
    }
    adicionarRanking(rankings.modelos, ordem.modeloNome, 1, ordem.total);
    adicionarRanking(rankings.marcas, ordem.veiculo?.fabricante || 'Marca não informada', 1, ordem.total);
    adicionarRanking(rankings.tecnicos, ordem.tecnicoNome, 1, ordem.total, String(ordem.tecnicoId ?? 'sem'));
  }
  return {
    quantidade: ordens.length, quantidadeValidas: validas.length, total,
    ticketMedio: validas.length ? total / validas.length : 0,
    ativas: ordens.filter(ordem => ATIVAS.has(ordem.status)).length,
    concluidas: ordens.filter(ordem => CONCLUIDAS.has(ordem.status)).length,
    canceladas: ordens.length - validas.length, clientes: clientes.size,
    totalServicos: somar('totalServicos'), totalPecas: somar('totalPecas'),
    valorConcluidas: validas.filter(ordem => CONCLUIDAS.has(ordem.status)).reduce((soma, ordem) => soma + centavos(ordem.total), 0) / 100,
    status: STATUS_RELATORIO.map(item => ({ chave: item.valor, nome: item.nome,
      valor: ordens.filter(ordem => ordem.status === item.valor).length })),
    rankings: Object.fromEntries(Object.entries(rankings).map(([chave, mapa]) => [chave,
      [...mapa.values()].map(item => ({ ...item, valor: item.valor / 100 }))])),
  };
}

export function serieRelatorio(ordens, filtros, metrica = 'quantidade') {
  const dias = ordens.map(ordem => ordem.dia).filter(Boolean).sort();
  const inicio = filtros.inicio || dias[0];
  const fim = filtros.fim || dias.at(-1);
  if (!inicio || !fim || inicio > fim) return { dados: [], agrupamento: 'dia' };
  const inicioData = new Date(`${inicio}T12:00:00`);
  const fimData = new Date(`${fim}T12:00:00`);
  const mensal = (fimData - inicioData) / 86400000 > 89;
  const agrupamento = mensal ? 'mês' : 'dia';
  const grupos = new Map();
  const cursor = new Date(inicioData);
  if (mensal) cursor.setDate(1);
  const chave = dia => mensal ? dia.slice(0, 7) : dia;
  // Preenche também os dias/meses sem OS, para que a evolução represente o período inteiro.
  while (chave(chaveDia(cursor)) <= chave(fim)) {
    const dia = chaveDia(cursor);
    const nome = mensal ? cursor.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      : cursor.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    grupos.set(chave(dia), { chave: chave(dia), nome, valor: 0 });
    if (mensal) cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  for (const ordem of ordens) {
    const grupo = grupos.get(chave(ordem.dia));
    if (!grupo) continue;
    grupo.valor += metrica === 'valor' ? (ordem.status === 'CANCELADA' ? 0 : centavos(ordem.total)) : 1;
  }
  return { agrupamento, dados: [...grupos.values()].map(item => ({ ...item, valor: metrica === 'valor' ? item.valor / 100 : item.valor })) };
}

export function ordenarRanking(dados, metrica) {
  return dados.map(item => ({ chave: item.chave, nome: item.nome, valor: item[metrica] || 0 }))
    .sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function dadosGrafico(dados, tipo, limite = 10) {
  if (tipo === 'tabela' || tipo === 'linha') return dados;
  const exibidos = dados.slice(0, limite);
  if (tipo !== 'rosca' || dados.length <= limite) return exibidos;
  return [...exibidos, { chave: '__outros', nome: 'Outros', valor: dados.slice(limite).reduce((soma, item) => soma + item.valor, 0) }];
}

export function formatarValorRelatorio(valor, formato = 'numero', compacto = false) {
  return numero(valor).toLocaleString('pt-BR', {
    ...(formato === 'moeda' ? { style: 'currency', currency: 'BRL' } : {}),
    ...(compacto ? { notation: 'compact', maximumFractionDigits: 1 } : { maximumFractionDigits: formato === 'moeda' ? 2 : 0 }),
  });
}

export function formatarDiaRelatorio(dia) {
  return dia ? dia.split('-').reverse().join('/') : 'Não informada';
}

export function buscarOrdensRelatorio(ordens, busca) {
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  return ordens.filter(ordem => [ordem.codigo, ordem.clienteNome, ordem.veiculo?.placa, ordem.modeloNome, ordem.tecnicoNome]
    .some(valor => String(valor || '').toLocaleLowerCase('pt-BR').includes(termo)));
}

export function exportarOrdensCsv(ordens) {
  const campo = valor => {
    let texto = String(valor ?? '');
    // Planilhas devem tratar nomes/códigos como texto, mesmo quando começam como uma fórmula.
    if (/^[\s]*[=+\-@]/.test(texto)) texto = `'${texto}`;
    return `"${texto.replaceAll('"', '""')}"`;
  };
  const valor = (ordem, chave) => ordem.status === 'CANCELADA' ? '' : numero(ordem[chave]).toFixed(2).replace('.', ',');
  const cabecalho = ['OS', 'Emissão', 'Cliente', 'Placa', 'Veículo', 'Técnico', 'Status', 'Serviços (R$)', 'Peças (R$)', 'Valor da OS (R$)'];
  const linhas = ordens.map(ordem => [ordem.codigo, formatarDiaRelatorio(ordem.dia), ordem.clienteNome, ordem.veiculo?.placa,
    ordem.modeloNome, ordem.tecnicoNome, STATUS_RELATORIO.find(item => item.valor === ordem.status)?.nome || ordem.status,
    valor(ordem, 'totalServicos'), valor(ordem, 'totalPecas'), valor(ordem, 'total')]);
  return '\uFEFF' + [cabecalho, ...linhas].map(linha => linha.map(campo).join(';')).join('\r\n');
}
