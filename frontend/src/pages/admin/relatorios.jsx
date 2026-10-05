import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiActivity, FiBarChart2, FiCheckCircle, FiDollarSign, FiDownload, FiFilter, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi';
import Layout from '../../components/Layout';
import SeletorTema from '../../components/SeletorTema';
import PainelGraficoRelatorio, { PaginacaoRelatorio } from '../../components/GraficoRelatorio';
import useTemaOficina from '../../hooks/useTemaOficina';
import api from '../../services/api';
import { STATUS_RELATORIO, agregarRelatorio, buscarOrdensRelatorio, chaveDia, exportarOrdensCsv,
  filtrarOrdensRelatorio, formatarDiaRelatorio, formatarValorRelatorio, normalizarOrdemRelatorio,
  ordenarRanking, periodoRelatorio, serieRelatorio } from '../../utils/relatoriosGerenciais';
import '../../styles/adminStyles/relatorios.css';

const CATEGORIAS = {
  pecas: { nome: 'Peças', titulo: 'Peças mais utilizadas', unidade: 'Quantidade registrada', metrica: 'quantidade',
    descricao: 'Quantidades registradas nas peças das OS, agrupadas por nome.' },
  servicos: { nome: 'Serviços', titulo: 'Serviços mais realizados', unidade: 'Aplicações', metrica: 'ocorrencias',
    descricao: 'Aplicações de cada serviço nas OS, agrupadas pelo nome salvo.' },
  modelos: { nome: 'Modelos de veículos', titulo: 'Modelos mais atendidos', unidade: 'OS', metrica: 'ocorrencias',
    descricao: 'Quantidade de ordens por fabricante e modelo do veículo.' },
  marcas: { nome: 'Marcas de veículos', titulo: 'Marcas mais recorrentes', unidade: 'OS', metrica: 'ocorrencias',
    descricao: 'Quantidade de ordens por fabricante do veículo.' },
  tecnicos: { nome: 'Técnicos', titulo: 'Ordens por técnico', unidade: 'OS', metrica: 'ocorrencias',
    descricao: 'Responsável atual salvo na OS, incluindo ordens sem técnico.' },
};

const ABAS_RELATORIO = [
  { id: 'geral', nome: 'Visão geral' },
  { id: 'evolucao', nome: 'Evolução' },
  { id: 'distribuicao', nome: 'Status e valores' },
  { id: 'rankings', nome: 'Rankings' },
  { id: 'ordens', nome: 'Ordens de serviço' },
];

function Indicador({ titulo, valor, descricao, icone }) {
  return <article className="oficina-panel relatorio-indicador">
    <div><span>{titulo}</span>{icone}</div>
    <strong>{valor}</strong><p>{descricao}</p>
  </article>;
}

function TabelaOrdens({ ordens, busca, onBuscaChange }) {
  const [pagina, setPagina] = useState(null);
  const resultados = useMemo(() => buscarOrdensRelatorio(ordens, busca), [ordens, busca]);
  const totalPaginas = Math.max(1, Math.ceil(resultados.length / 10));
  const atual = pagina?.dados === resultados ? Math.min(pagina.numero, totalPaginas) : 1;
  const total = resultados.filter(ordem => ordem.status !== 'CANCELADA').reduce((soma, ordem) => soma + Math.round(ordem.total * 100), 0) / 100;
  function exportar() {
    const url = URL.createObjectURL(new Blob([exportarOrdensCsv(resultados)], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `motormind-relatorios-${chaveDia(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  const valor = (ordem, campo) => ordem.status === 'CANCELADA' ? '—' : formatarValorRelatorio(ordem[campo], 'moeda');
  return <section className="oficina-panel relatorio-ordens" aria-labelledby="relatorio-ordens-titulo">
    <div className="oficina-list-header">
      <div><h2 id="relatorio-ordens-titulo">Ordens de serviço do período</h2><span>{resultados.length} OS encontrada(s) · Exibição de 10 por página</span></div>
      <button type="button" className="oficina-btn" onClick={exportar} disabled={!resultados.length}>
        <FiDownload aria-hidden="true" /> Exportar tabela em CSV
      </button>
    </div>
    <div className="oficina-search relatorio-busca">
      <label htmlFor="relatorio-busca">Pesquisar na tabela</label>
      <div className="relatorio-busca-campo"><FiSearch aria-hidden="true" /><input id="relatorio-busca" type="search" value={busca}
        onChange={event => onBuscaChange(event.target.value)} placeholder="OS, cliente, placa, modelo ou técnico" /></div>
    </div>
    <div className="oficina-table-wrap">
      <table className="oficina-table relatorio-tabela relatorio-tabela-ordens">
        <thead><tr>{['OS', 'Emissão', 'Cliente', 'Veículo', 'Técnico', 'Status', 'Serviços', 'Peças', 'Valor da OS'].map(nome => <th scope="col" key={nome}>{nome}</th>)}</tr></thead>
        <tbody>
          {!resultados.length && <tr><td colSpan="9" className="oficina-empty">Nenhuma OS encontrada nesta busca.</td></tr>}
          {resultados.slice((atual - 1) * 10, atual * 10).map(ordem => <tr key={ordem.id}>
            <td data-label="OS"><strong>{ordem.codigo}</strong></td>
            <td data-label="Emissão">{formatarDiaRelatorio(ordem.dia)}</td>
            <td data-label="Cliente">{ordem.clienteNome}</td>
            <td data-label="Veículo"><strong>{ordem.veiculo?.placa || 'Sem placa'}</strong><small>{ordem.modeloNome}</small></td>
            <td data-label="Técnico">{ordem.tecnicoNome}</td>
            <td data-label="Status"><span className={`relatorio-status relatorio-status-${ordem.status.toLowerCase()}`}>
              {STATUS_RELATORIO.find(item => item.valor === ordem.status)?.nome || ordem.status}
            </span></td>
            <td data-label="Serviços">{valor(ordem, 'totalServicos')}</td>
            <td data-label="Peças">{valor(ordem, 'totalPecas')}</td>
            <td data-label="Valor da OS"><strong>{valor(ordem, 'total')}</strong></td>
          </tr>)}
        </tbody>
      </table>
    </div>
    <div className="relatorio-tabela-footer">
      <p>Total de OS não canceladas na tabela: <strong>{formatarValorRelatorio(total, 'moeda')}</strong></p>
      <PaginacaoRelatorio atual={atual} total={totalPaginas} onChange={numero => setPagina({ dados: resultados, numero })} />
    </div>
  </section>;
}

export default function Relatorios() {
  const [tema, setTema] = useTemaOficina();
  const [ordensServico, setOrdensServico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [filtros, setFiltros] = useState(() => ({ periodo: 'mes', ...periodoRelatorio('mes'), status: '', tecnico: '' }));
  const [metricaEvolucao, setMetricaEvolucao] = useState('quantidade');
  const [categoria, setCategoria] = useState('pecas');
  const [metricaRanking, setMetricaRanking] = useState('quantidade');
  const [buscaTabela, setBuscaTabela] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('geral');
  const abasRef = useRef(null);
  const consultaAtual = useRef(null);

  const carregarRelatorios = useCallback(signal => {
    return api.get('/ordens-servico', { signal }).then(response => {
      if (signal?.aborted) return;
      if (!Array.isArray(response.data)) throw new Error('Resposta de relatórios inválida.');
      setOrdensServico(response.data);
      setAtualizadoEm(new Date());
      setErro('');
    }).catch(error => {
      if (signal?.aborted) return;
      const mensagem = error.response?.data?.erro || 'Não foi possível carregar os relatórios. Tente atualizar novamente.';
      setErro(mensagem);
      toast.error(mensagem);
    }).finally(() => {
      if (!signal?.aborted) setCarregando(false);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    consultaAtual.current = controller;
    carregarRelatorios(controller.signal);
    return () => consultaAtual.current?.abort();
  }, [carregarRelatorios]);

  const normalizadas = useMemo(() => ordensServico.map(normalizarOrdemRelatorio), [ordensServico]);
  const tecnicos = useMemo(() => [...new Map(normalizadas.filter(ordem => ordem.tecnicoId != null)
    .map(ordem => [String(ordem.tecnicoId), { id: String(ordem.tecnicoId), nome: ordem.tecnicoNome }])).values()]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), [normalizadas]);
  const ordens = useMemo(() => filtrarOrdensRelatorio(normalizadas, filtros)
    .sort((a, b) => b.dia.localeCompare(a.dia) || b.codigo.localeCompare(a.codigo, 'pt-BR', { numeric: true })), [normalizadas, filtros]);
  const resumo = useMemo(() => agregarRelatorio(ordens), [ordens]);
  const evolucao = useMemo(() => serieRelatorio(ordens, filtros, metricaEvolucao), [ordens, filtros, metricaEvolucao]);
  const ranking = useMemo(() => ordenarRanking(resumo.rankings[categoria], metricaRanking), [resumo, categoria, metricaRanking]);
  const composicao = useMemo(() => [{ chave: 'servicos', nome: 'Serviços', valor: resumo.totalServicos },
    { chave: 'pecas', nome: 'Peças', valor: resumo.totalPecas }], [resumo]);
  const intervaloInvalido = filtros.inicio && filtros.fim && filtros.inicio > filtros.fim;
  const configRanking = CATEGORIAS[categoria];
  const periodo = filtros.inicio || filtros.fim
    ? `${filtros.inicio ? formatarDiaRelatorio(filtros.inicio) : 'Primeira OS'} até ${filtros.fim ? formatarDiaRelatorio(filtros.fim) : 'Última OS'}`
    : 'Todo o período';

  function atualizarFiltro(campo, valor) {
    setFiltros(anterior => ({ ...anterior, [campo]: valor, ...(['inicio', 'fim'].includes(campo) ? { periodo: 'personalizado' } : {}) }));
    setBuscaTabela('');
  }
  function alterarPeriodo(valor) {
    setFiltros(anterior => ({ ...anterior, periodo: valor, ...(valor === 'personalizado' ? {} : periodoRelatorio(valor)) }));
    setBuscaTabela('');
  }
  function limparFiltros() {
    setFiltros({ periodo: 'todos', inicio: '', fim: '', status: '', tecnico: '' });
    setBuscaTabela('');
  }

  function atualizarDados() {
    consultaAtual.current?.abort();
    const controller = new AbortController();
    consultaAtual.current = controller;
    setCarregando(true);
    setErro('');
    carregarRelatorios(controller.signal);
  }

  function navegarAbas(event) {
    const indice = ABAS_RELATORIO.findIndex(aba => aba.id === abaAtiva);
    const destinos = { ArrowRight: (indice + 1) % ABAS_RELATORIO.length,
      ArrowLeft: (indice + ABAS_RELATORIO.length - 1) % ABAS_RELATORIO.length,
      Home: 0, End: ABAS_RELATORIO.length - 1 };
    if (!(event.key in destinos)) return;
    event.preventDefault();
    const proxima = ABAS_RELATORIO[destinos[event.key]].id;
    setAbaAtiva(proxima);
    abasRef.current?.querySelector(`#relatorio-aba-${proxima}`)?.focus();
  }

  return <Layout className="oficina-theme relatorios-workspace" theme={tema}
    topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
    <main className="oficina-page" aria-labelledby="relatorios-titulo" aria-busy={carregando}>
      <header className="oficina-page-header">
        <div><h1 id="relatorios-titulo">Relatórios gerenciais</h1><p>Acompanhe a operação, os valores das OS e a demanda da oficina.</p>
          {atualizadoEm && <small>Atualizado em {atualizadoEm.toLocaleString('pt-BR')}</small>}
        </div>
        <button type="button" className="oficina-btn" onClick={atualizarDados} disabled={carregando}>
          <FiRefreshCw aria-hidden="true" /> {carregando ? 'Atualizando...' : 'Atualizar dados'}
        </button>
      </header>

      {atualizadoEm && !intervaloInvalido && <div className="relatorio-abas" role="tablist" aria-label="Seções dos relatórios" ref={abasRef} onKeyDown={navegarAbas}>
        {ABAS_RELATORIO.map(aba => <button key={aba.id} type="button" role="tab" id={`relatorio-aba-${aba.id}`}
          aria-controls={`relatorio-painel-${aba.id}`} aria-selected={abaAtiva === aba.id}
          tabIndex={abaAtiva === aba.id ? 0 : -1} onClick={() => setAbaAtiva(aba.id)}>{aba.nome}</button>)}
      </div>}

      <section className="oficina-panel relatorio-filtros" aria-labelledby="relatorio-filtros-titulo">
        <div className="oficina-list-header"><div><h2 id="relatorio-filtros-titulo" className="oficina-section-heading"><FiFilter aria-hidden="true" /> Filtros da análise</h2>
          <span>Período pela data de emissão da OS.</span></div>
          <button type="button" className="oficina-btn" onClick={limparFiltros}>Limpar filtros</button>
        </div>
        <div className="oficina-form-grid relatorio-filtros-grid">
          <div className="oficina-field"><label htmlFor="relatorio-periodo">Período</label>
            <select id="relatorio-periodo" value={filtros.periodo} onChange={event => alterarPeriodo(event.target.value)}>
              <option value="mes">Este mês</option><option value="30dias">Últimos 30 dias</option><option value="90dias">Últimos 90 dias</option>
              <option value="ano">Este ano</option><option value="todos">Todo o período</option><option value="personalizado">Personalizado</option>
            </select></div>
          <div className="oficina-field"><label htmlFor="relatorio-inicio">Data inicial</label><input id="relatorio-inicio" type="date" value={filtros.inicio}
            onChange={event => atualizarFiltro('inicio', event.target.value)} aria-invalid={Boolean(intervaloInvalido)} aria-describedby={intervaloInvalido ? 'relatorio-erro-periodo' : undefined} /></div>
          <div className="oficina-field"><label htmlFor="relatorio-fim">Data final</label><input id="relatorio-fim" type="date" value={filtros.fim}
            onChange={event => atualizarFiltro('fim', event.target.value)} aria-invalid={Boolean(intervaloInvalido)} aria-describedby={intervaloInvalido ? 'relatorio-erro-periodo' : undefined} /></div>
          <div className="oficina-field"><label htmlFor="relatorio-status">Status da OS</label>
            <select id="relatorio-status" value={filtros.status} onChange={event => atualizarFiltro('status', event.target.value)}>
              <option value="">Todos os status</option>{STATUS_RELATORIO.map(item => <option key={item.valor} value={item.valor}>{item.nome}</option>)}
            </select></div>
          <div className="oficina-field"><label htmlFor="relatorio-tecnico">Técnico responsável</label>
            <select id="relatorio-tecnico" value={filtros.tecnico} onChange={event => atualizarFiltro('tecnico', event.target.value)}>
              <option value="">Todos os técnicos</option><option value="sem">Sem técnico</option>{tecnicos.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
            </select></div>
        </div>
        {intervaloInvalido && <p id="relatorio-erro-periodo" className="relatorio-mensagem" role="alert">A data inicial deve ser anterior ou igual à data final.</p>}
      </section>

      {erro && <div className="oficina-panel relatorio-mensagem" role="alert"><p>{erro}</p>
        {atualizadoEm && <p>Os dados da última atualização continuam disponíveis.</p>}
        <button type="button" className="oficina-btn" onClick={atualizarDados} disabled={carregando}>Tentar novamente</button>
      </div>}
      {!atualizadoEm && !erro && <div className="oficina-panel oficina-empty-state" role="status"><FiBarChart2 aria-hidden="true" /><p>Carregando os dados da oficina...</p></div>}

      {atualizadoEm && !intervaloInvalido && <>
        <div className="relatorio-contexto"><strong>{periodo}</strong><span>{ordens.length} de {normalizadas.length} OS nos filtros atuais</span></div>
        <section id="relatorio-painel-geral" role="tabpanel" className="relatorio-aba-panel" aria-labelledby="relatorio-aba-geral" hidden={abaAtiva !== 'geral'} tabIndex="0">
        <div className="relatorio-indicadores" aria-label="Resumo gerencial">
          <Indicador titulo="Ordens no período" valor={resumo.quantidade} descricao={`${resumo.canceladas} cancelada(s)`} icone={<FiBarChart2 aria-hidden="true" />} />
          <Indicador titulo="Valor das OS" valor={formatarValorRelatorio(resumo.total, 'moeda')} descricao="Total dos itens após descontos, sem canceladas" icone={<FiDollarSign aria-hidden="true" />} />
          <Indicador titulo="Ticket médio" valor={formatarValorRelatorio(resumo.ticketMedio, 'moeda')} descricao={`Valor médio de ${resumo.quantidadeValidas} OS não cancelada(s)`} icone={<FiDollarSign aria-hidden="true" />} />
          <Indicador titulo="Ordens ativas" valor={resumo.ativas} descricao="Abertas, em andamento ou aguardando peça" icone={<FiActivity aria-hidden="true" />} />
          <Indicador titulo="Concluídas" valor={resumo.concluidas} descricao={`${formatarValorRelatorio(resumo.valorConcluidas, 'moeda')} em finalizadas e fechadas`} icone={<FiCheckCircle aria-hidden="true" />} />
          <Indicador titulo="Clientes atendidos" valor={resumo.clientes} descricao="Clientes distintos nas OS não canceladas" icone={<FiUsers aria-hidden="true" />} />
        </div>
        <p className="relatorio-nota">Valores baseados nas OS emitidas no período e em seus itens salvos. Não representam recebimentos ou lucro. OS canceladas entram na contagem e no status, mas não nos valores e rankings.</p>
        </section>
        {!ordens.length && <div className="oficina-panel oficina-empty-state"><FiSearch aria-hidden="true" /><h2>Nenhuma OS neste período</h2>
          <p>Altere as datas ou limpe os filtros para consultar outros registros.</p><button type="button" className="oficina-btn" onClick={limparFiltros}>Consultar todo o período</button>
        </div>}
        <section id="relatorio-painel-evolucao" role="tabpanel" className="relatorio-aba-panel" aria-labelledby="relatorio-aba-evolucao" hidden={abaAtiva !== 'evolucao'} tabIndex="0">
          {!!ordens.length &&
            <PainelGraficoRelatorio titulo="Evolução do período" descricao={`OS por ${evolucao.agrupamento}, incluindo intervalos sem emissão.`}
              dados={evolucao.dados} tipos={['colunas', 'linha', 'tabela']} tipoInicial="linha" formato={metricaEvolucao === 'valor' ? 'moeda' : 'numero'}
              coluna="Período" unidade={metricaEvolucao === 'valor' ? 'Valor das OS' : 'OS emitidas'} percentual={false} className="relatorio-painel-full" carregando={carregando}
              controles={<div className="oficina-field"><label htmlFor="relatorio-evolucao-metrica">Indicador</label>
                <select id="relatorio-evolucao-metrica" value={metricaEvolucao} onChange={event => setMetricaEvolucao(event.target.value)}>
                  <option value="quantidade">Ordens emitidas</option><option value="valor">Valor das OS</option>
                </select></div>} />}
        </section>
        <section id="relatorio-painel-distribuicao" role="tabpanel" className="relatorio-aba-panel" aria-labelledby="relatorio-aba-distribuicao" hidden={abaAtiva !== 'distribuicao'} tabIndex="0">
          {!!ordens.length && <div className="relatorios-grid">
            <PainelGraficoRelatorio titulo="Situação das ordens" descricao="Distribuição pelo status atual das OS selecionadas."
              dados={resumo.status} tipoInicial="rosca" coluna="Status" unidade="OS" carregando={carregando} />
            <PainelGraficoRelatorio titulo="Composição dos valores" descricao="Participação de serviços e peças no valor das OS não canceladas."
              dados={composicao} tipoInicial="rosca" formato="moeda" coluna="Tipo de item" unidade="Valor" carregando={carregando} />
          </div>}
        </section>
        <section id="relatorio-painel-rankings" role="tabpanel" className="relatorio-aba-panel" aria-labelledby="relatorio-aba-rankings" hidden={abaAtiva !== 'rankings'} tabIndex="0">
          {!!ordens.length &&
            <PainelGraficoRelatorio titulo={configRanking.titulo} descricao={configRanking.descricao} dados={ranking} limitar
              formato={metricaRanking === 'valor' ? 'moeda' : 'numero'} coluna={configRanking.nome} unidade={metricaRanking === 'valor' ? 'Valor das OS' : configRanking.unidade}
              className="relatorio-painel-full" carregando={carregando} controles={<>
                <div className="oficina-field"><label htmlFor="relatorio-categoria">Analisar por</label>
                  <select id="relatorio-categoria" value={categoria} onChange={event => { setCategoria(event.target.value); setMetricaRanking(CATEGORIAS[event.target.value].metrica); }}>
                    {Object.entries(CATEGORIAS).map(([valor, item]) => <option key={valor} value={valor}>{item.nome}</option>)}
                  </select></div>
                <div className="oficina-field"><label htmlFor="relatorio-ranking-metrica">Ordenar por</label>
                  <select id="relatorio-ranking-metrica" value={metricaRanking} onChange={event => setMetricaRanking(event.target.value)}>
                    <option value={configRanking.metrica}>{configRanking.unidade}</option><option value="valor">Valor</option>
                  </select></div>
              </>} />}
        </section>
        <section id="relatorio-painel-ordens" role="tabpanel" className="relatorio-aba-panel" aria-labelledby="relatorio-aba-ordens" hidden={abaAtiva !== 'ordens'} tabIndex="0">
          <TabelaOrdens ordens={ordens} busca={buscaTabela} onBuscaChange={setBuscaTabela} />
        </section>
      </>}
    </main>
  </Layout>;
}
