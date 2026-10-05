import SeletorTema from '../../components/SeletorTema';
import useTemaOficina from '../../hooks/useTemaOficina';
import { FiCheckCircle, FiChevronRight, FiClipboard, FiClock, FiFileText, FiPackage, FiPlus, FiRefreshCw, FiSearch, FiTool } from 'react-icons/fi';
import { TbCar } from 'react-icons/tb';
import StatusOrdemTecnica from '../../components/StatusOrdemTecnica';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import useConsultaTickets from '../../hooks/useConsultaTickets';
import '../../styles/tecnicoStyles/tecnico.css';
import '../../styles/tecnicoStyles/painelMecanico.css';

/**
 * Painel responsável por listar e pesquisar veículos de OS atribuídas ao técnico,
 * permitindo acessar novas checklists, checklists anteriores
 * e o histórico veicular.
 *
 * @component
 * @function Painel
 * @returns {JSX.Element} Painel principal do técnico.
 */
function Painel() {
  const [tema, setTema] = useTemaOficina();
  const navigate = useNavigate();

  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [visao, setVisao] = useState('ordens');
  const consulta = useConsultaTickets('/tecnico/veiculos', 15000, versao);
  const solicitacoes = useConsultaTickets('/tickets?status=ATIVOS&meus=true&pagina=1', 15000, versao);
  const disponiveis = useConsultaTickets('/tickets?status=DISPONIVEL&meus=true&pagina=1', 15000, versao);
  const veiculos = useMemo(() => consulta.dados || [], [consulta.dados]);
  const carregando = consulta.carregando;
  function carregarVeiculos() { setVersao(v => v + 1); }

/**
 * Monta o ano do veículo combinando o ano de fabricação
 * e o ano do modelo quando ambos estiverem disponíveis.
 *
 * @param {Object} veiculo - Veículo que será formatado.
 * @returns {string} Ano do veículo ou hífen quando não informado.
 */
  function montarAnoVeiculo(veiculo) {
    if (veiculo.ano_fabricacao && veiculo.ano_modelo) {
      return `${veiculo.ano_fabricacao}/${veiculo.ano_modelo}`;
    }

    return veiculo.ano_modelo || veiculo.ano_fabricacao || '-';
  }

/**
 * Monta o nome do veículo usando fabricante e modelo.
 *
 * @param {Object} veiculo - Veículo que será formatado.
 * @returns {string} Nome do veículo ou uma descrição padrão.
 */
  function montarNomeVeiculo(veiculo) {
    const fabricante = veiculo.fabricante || '';
    const modelo = veiculo.modelo || '';

    return `${fabricante} ${modelo}`.trim() || 'Veículo sem descrição';
  }

/**
 * Redireciona o técnico para a tela de criação de checklist,
 * enviando o veículo selecionado pela navegação.
 *
 * @param {Object} veiculo - Veículo que receberá a nova checklist.
 * @returns {void}
 */
  function abrirNovaChecklist(veiculo) {
    navigate('/tecnico/checklist', {
      state: {
        veiculo,
      },
    });
  }

/**
 * Redireciona o técnico para a tela de checklists
 * vinculadas ao veículo selecionado.
 *
 * @param {Object} veiculo - Veículo cujas checklists serão consultadas.
 * @returns {void}
 */
  function abrirChecklists(veiculo) {
    navigate('/tecnico/checklists', {
      state: {
        veiculo,
      },
    });
  }

/**
 * Redireciona o técnico para o histórico completo
 * do veículo selecionado.
 *
 * @param {Object} veiculo - Veículo cujo histórico será consultado.
 * @returns {void}
 */
  function abrirHistorico(veiculo) {
    navigate('/tecnico/historico-veicular', {
      state: {
        veiculo,
      },
    });
  }

/**
 * Lista de veículos filtrada pelo termo de pesquisa
 * e pelo status das OS atribuídas.
 *
 * @type {Array<Object>}
 */
  const veiculosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return veiculos.filter((veiculo) => {
      const placa = veiculo.placa?.toLowerCase() || '';
      const modelo = veiculo.modelo?.toLowerCase() || '';
      const fabricante = veiculo.fabricante?.toLowerCase() || '';
      const cliente = veiculo.cliente?.nome?.toLowerCase() || '';
      const chassi = veiculo.chassi?.toLowerCase() || '';

      const bateBusca =
        !termo ||
        placa.includes(termo) ||
        modelo.includes(termo) ||
        fabricante.includes(termo) ||
        cliente.includes(termo) ||
        chassi.includes(termo) ||
        veiculo.ordensServico.some(ordem => ordem.codigo.toLowerCase().includes(termo));

      if (filtro === 'todos') return bateBusca;

      return bateBusca && veiculo.ordensServico.some(ordem => ordem.status === filtro);
    });
  }, [veiculos, busca, filtro]);

  const ordensAtivas = veiculos.flatMap(veiculo => veiculo.ordensServico);
  const ordensFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return veiculosFiltrados.flatMap(veiculo => {
      const buscaVeiculo = !termo || [veiculo.placa, veiculo.modelo, veiculo.fabricante, veiculo.cliente?.nome, veiculo.chassi]
        .some(valor => valor?.toLowerCase().includes(termo));
      return veiculo.ordensServico
        .filter(ordem => (filtro === 'todos' || ordem.status === filtro) && (buscaVeiculo || ordem.codigo.toLowerCase().includes(termo)))
        .map(ordem => ({ ...ordem, veiculo }));
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt) || b.id - a.id);
  }, [veiculosFiltrados, busca, filtro]);
  const statusSolicitacao = { ABERTA: 'Aberta', EM_ATENDIMENTO: 'Em atendimento', AGUARDANDO_PECA: 'Aguardando peça', DISPONIVEL: 'Disponível' };

  return (
    <Layout className="oficina-theme tecnico-workspace" theme={tema}
      topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
      <main className="oficina-page painel-tecnico-page">
        <div className="tecnico-painel-layout">
        <section className="oficina-panel tecnico-atendimentos" aria-labelledby="painel-veiculos-titulo">
          <div className="oficina-list-header">
            <div><h2 id="painel-veiculos-titulo" className="oficina-section-heading"><FiTool aria-hidden="true" /> Meus atendimentos</h2>
              <span>{visao === 'ordens' ? `${ordensFiltradas.length} ordem(ns) de serviço · Último salvamento primeiro` : `${veiculosFiltrados.length} veículo(s) neste filtro`}</span></div>
            <div className="tecnico-visoes" role="group" aria-label="Visualização dos atendimentos">
              <button type="button" aria-pressed={visao === 'ordens'} onClick={() => setVisao('ordens')}><FiFileText aria-hidden="true" /> Por OS</button>
              <button type="button" aria-pressed={visao === 'veiculos'} onClick={() => setVisao('veiculos')}><TbCar aria-hidden="true" /> Por veículo</button>
            </div>
          </div>
          <div className="tecnico-filtros-rapidos" role="group" aria-label="Filtrar meus atendimentos por status">
            {[['todos', 'Todos'], ['EM_ANDAMENTO', 'Em andamento'], ['AGUARDANDO_PECA', 'Aguardando peça'], ['ABERTA', 'Abertos']].map(([valor, titulo]) => (
              <button key={valor} type="button" aria-pressed={filtro === valor} onClick={() => setFiltro(valor)}>
                {titulo}<span>{carregando || consulta.erro ? '—' : valor === 'todos' ? ordensAtivas.length : ordensAtivas.filter(ordem => ordem.status === valor).length}</span>
              </button>
            ))}
          </div>
          <div className="tecnico-toolbar">
            <div className="oficina-field">
              <label htmlFor="painel-busca">Pesquisar veículo ou OS</label>
              <div className="tecnico-search-control"><FiSearch aria-hidden="true" />
                <input id="painel-busca" type="search" value={busca} onChange={event => setBusca(event.target.value)} placeholder="Placa, cliente, veículo ou código da OS" />
              </div>
            </div>
            <button type="button" className="oficina-btn" onClick={carregarVeiculos} disabled={carregando}><FiRefreshCw aria-hidden="true" /> Atualizar</button>
          </div>
          {consulta.erro && <p className="tecnico-erro" role="alert">{consulta.erro}</p>}
          {carregando && <p className="tecnico-loading" role="status">Carregando veículos...</p>}
          {!carregando && !consulta.erro && (visao === 'ordens' ? ordensFiltradas.length === 0 : veiculosFiltrados.length === 0) && (
            <div className="oficina-empty-state"><TbCar aria-hidden="true" /><h3>{visao === 'ordens' ? 'Nenhuma OS neste filtro' : 'Nenhum veículo neste filtro'}</h3>
              <p>{busca || filtro !== 'todos' ? 'Altere a busca ou o status para consultar outros atendimentos.' : 'Os veículos aparecem aqui quando o operador atribui uma OS a você e salva.'}</p>
              {(busca || filtro !== 'todos') && <button type="button" className="oficina-btn" onClick={() => { setBusca(''); setFiltro('todos'); }}>Limpar filtros</button>}
            </div>
          )}
          <div className="tecnico-os-lista" hidden={visao !== 'ordens'}>
            {ordensFiltradas.map(ordem => <article key={ordem.id} className="tecnico-os-card">
              <div className="tecnico-os-cabecalho"><h3>{ordem.codigo}</h3><StatusOrdemTecnica status={ordem.status} /></div>
              <div className="tecnico-os-veiculo"><TbCar aria-hidden="true" /><strong className="tecnico-placa">{ordem.veiculo.placa || 'SEM PLACA'}</strong><span>{montarNomeVeiculo(ordem.veiculo)}</span></div>
              <dl className="tecnico-dados tecnico-os-dados">
                <div><dt>Cliente</dt><dd>{ordem.veiculo.cliente?.nome || 'Não informado'}</dd></div>
                <div><dt>Último salvamento</dt><dd>{ordem.updatedAt ? new Date(ordem.updatedAt).toLocaleString('pt-BR') : '—'}</dd></div>
              </dl>
              <div className="tecnico-veiculo-acoes">
                <button type="button" className="oficina-btn oficina-btn-primary" onClick={() => navigate(`/tecnico/ordens-servico/${ordem.id}`)} aria-label={`Exibir ordem de serviço ${ordem.codigo}`}><FiFileText aria-hidden="true" /> Exibir ordem de serviço</button>
              </div>
            </article>)}
          </div>
          <div className="tecnico-veiculos" hidden={visao !== 'veiculos'}>
            {veiculosFiltrados.map(veiculo => (
              <article className="tecnico-veiculo" key={veiculo.id}>
                <div className="tecnico-veiculo-header">
                  <div className="tecnico-veiculo-icon"><TbCar aria-hidden="true" /></div>
                  <div className="tecnico-veiculo-titulo"><h3>{montarNomeVeiculo(veiculo)}</h3><span>{veiculo.cliente?.nome || 'Cliente não informado'}</span></div>
                  <strong className="tecnico-placa">{veiculo.placa || 'SEM PLACA'}</strong>
                </div>
                <dl className="tecnico-dados">
                  <div><dt>Marca</dt><dd>{veiculo.fabricante || '—'}</dd></div><div><dt>Modelo</dt><dd>{veiculo.modelo || '—'}</dd></div>
                  <div><dt>Ano</dt><dd>{montarAnoVeiculo(veiculo)}</dd></div><div><dt>KM</dt><dd>{veiculo.km ?? '—'}</dd></div>
                  <div><dt>Cor</dt><dd>{veiculo.cor || '—'}</dd></div><div><dt>Chassi</dt><dd>{veiculo.chassi || '—'}</dd></div>
                </dl>
                <div className="tecnico-veiculo-acoes">
                  <button type="button" className="oficina-btn" onClick={() => abrirNovaChecklist(veiculo)}><FiPlus aria-hidden="true" /> Nova checklist</button>
                  <button type="button" className="oficina-btn" onClick={() => abrirChecklists(veiculo)}><FiClipboard aria-hidden="true" /> Checklists</button>
                  <button type="button" className="oficina-btn" onClick={() => abrirHistorico(veiculo)}><FiClock aria-hidden="true" /> Histórico veicular</button>
                </div>
                <div className="tecnico-ordens" aria-label={`Ordens de serviço de ${veiculo.placa || montarNomeVeiculo(veiculo)}`}>
                  {veiculo.ordensServico.filter(ordem => filtro === 'todos' || ordem.status === filtro).map(ordem => (
                    <div className="tecnico-ordem-link" key={ordem.id}>
                      <div><strong>{ordem.codigo}</strong><StatusOrdemTecnica status={ordem.status} /></div>
                      <button type="button" className="oficina-btn oficina-btn-primary" aria-label={`Exibir ordem de serviço ${ordem.codigo}`}
                        onClick={() => navigate(`/tecnico/ordens-servico/${ordem.id}`)}><FiFileText aria-hidden="true" /> Exibir ordem de serviço</button>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
        <aside className="tecnico-acompanhamento" aria-label="Acompanhamento das solicitações de peças">
          <section className="oficina-panel tecnico-disponiveis" aria-labelledby="painel-disponiveis-titulo">
            <div className="oficina-panel-title"><h2 className="oficina-section-heading" id="painel-disponiveis-titulo"><FiCheckCircle aria-hidden="true" /> Peças disponíveis</h2>
              <span>Acompanhe a entrega com o operador responsável.</span></div>
            {disponiveis.carregando && <p className="tecnico-loading" role="status">Consultando disponibilidade...</p>}
            {disponiveis.erro && <p className="tecnico-erro" role="alert">{disponiveis.erro}</p>}
            {disponiveis.dados && !disponiveis.erro && <>
              <p className="tecnico-disponiveis-total"><strong>{disponiveis.dados.total}</strong> solicitação(ões) disponível(is)</p>
              {disponiveis.dados.total === 0 && <p className="tecnico-nota">O operador avisará quando as peças de um pedido estiverem disponíveis.</p>}
              <div className="tecnico-ticket-lista">{disponiveis.dados.itens.slice(0, 3).map(ticket => (
                <button type="button" key={ticket.id} className="tecnico-ticket-link" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                  <div><strong>{ticket.codigo}</strong><span>{ticket.ordemServico.codigo} · {ticket.ordemServico.veiculo.placa}</span></div><FiChevronRight aria-hidden="true" />
                </button>
              ))}</div>
            </>}
          </section>
          <section className="oficina-panel" aria-labelledby="painel-pedidos-titulo">
            <div className="oficina-panel-title"><h2 className="oficina-section-heading" id="painel-pedidos-titulo"><FiPackage aria-hidden="true" /> Outros pedidos ativos</h2><span>Pedidos recentes em abertura ou atendimento.</span></div>
            {solicitacoes.carregando && <p className="tecnico-loading" role="status">Carregando solicitações...</p>}
            {solicitacoes.erro && <p className="tecnico-erro" role="alert">{solicitacoes.erro}</p>}
            {solicitacoes.dados && !solicitacoes.erro && <>
              {solicitacoes.dados.total === 0 && <div className="tecnico-pedidos-vazio"><FiPackage aria-hidden="true" /><p>Você não tem solicitações pendentes.</p></div>}
              <div className="tecnico-ticket-lista">{solicitacoes.dados.itens.filter(ticket => ticket.status !== 'DISPONIVEL').slice(0, 5).map(ticket => (
                <button type="button" className="tecnico-ticket-link" key={ticket.id} onClick={() => navigate(`/tickets/${ticket.id}`)}>
                  <div><strong>{ticket.codigo}<span className={`tecnico-ticket-status ${ticket.status}`}>{statusSolicitacao[ticket.status] || ticket.status}</span></strong>
                    <span>{ticket.ordemServico.codigo} · {ticket.ordemServico.veiculo.placa}</span>
                    <small>{ticket.responsavel?.Nome || 'Aguardando operador'}</small></div><FiChevronRight aria-hidden="true" />
                </button>
              ))}</div>
            </>}
            <p className="tecnico-nota">Para solicitar uma peça, abra a OS e escolha <strong>Solicitar peça ao operador</strong>.</p>
          </section>
        </aside>
        </div>
      </main>
    </Layout>
  );
}

export default Painel;
