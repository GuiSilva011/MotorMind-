import SeletorTema from '../../components/SeletorTema';
import useTemaOficina from '../../hooks/useTemaOficina';
import { FiArrowLeft, FiClipboard, FiClock, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { TbCar } from 'react-icons/tb';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/tecnicoStyles/tecnico.css';

/**
 * Tela responsável pela consulta e pesquisa de veículos cadastrados,
 * permitindo acessar a checklist e o histórico do veículo selecionado.
 *
 * @component
 * @function VisualizarVeiculos
 * @returns {JSX.Element} Tela de consulta de veículos.
 */
function VisualizarVeiculos() {
  const [tema, setTema] = useTemaOficina();
  const navigate = useNavigate();

  const [veiculos, setVeiculos] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [carregando, setCarregando] = useState(false);

  // Carrega a lista de veiculos quando a tela abre.
  useEffect(() => {
    carregarVeiculos();
  }, []);

/**
 * Busca na API todos os veículos cadastrados no sistema.
 *
 * @async
 * @returns {Promise<void>}
 */
  async function carregarVeiculos() {
    try {
      setCarregando(true);

      const response = await api.get('/veiculos');

      setVeiculos(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      setVeiculos([]);
    } finally {
      setCarregando(false);
    }
  }

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
 * Redireciona o técnico para a tela de checklist,
 * enviando o veículo selecionado pela navegação.
 *
 * @param {Object} veiculo - Veículo que receberá a checklist.
 * @returns {void}
 */
  function irParaChecklist(veiculo) {
    navigate('/tecnico/checklist', {
      state: {
        veiculo,
      },
    });
  }

/**
 * Redireciona o técnico para o histórico do veículo selecionado.
 *
 * @param {Object} veiculo - Veículo cujo histórico será consultado.
 * @returns {void}
 */
  function irParaHistorico(veiculo) {
    navigate('/tecnico/historico-veicular', {
      state: {
        veiculo,
      },
    });
  }

/**
 * Lista de veículos filtrada pelo termo de pesquisa
 * e pelo tipo de vínculo com cliente.
 *
 * A pesquisa considera placa, modelo, fabricante, cliente e chassi.
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
        chassi.includes(termo);

      if (filtro === 'todos') return bateBusca;

      if (filtro === 'com-cliente') {
        return bateBusca && Boolean(veiculo.cliente?.nome);
      }

      if (filtro === 'sem-cliente') {
        return bateBusca && !veiculo.cliente?.nome;
      }

      return bateBusca;
    });
  }, [veiculos, busca, filtro]);

  return (
    <Layout className="oficina-theme tecnico-workspace" theme={tema}
      topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
      <main className="oficina-page visualizar-veiculos-page">
        <header className="oficina-page-header">
          <div><h1>Consultar veículos</h1><p>Acesse a checklist e o histórico dos veículos vinculados aos seus atendimentos.</p></div>
          <button type="button" className="oficina-btn" onClick={() => navigate('/tecnico/painel')}><FiArrowLeft aria-hidden="true" /> Voltar ao painel</button>
        </header>
        <section className="oficina-panel" aria-labelledby="veiculos-lista-titulo">
          <div className="oficina-list-header"><div><h2 id="veiculos-lista-titulo" className="oficina-section-heading"><TbCar aria-hidden="true" /> Veículos vinculados</h2>
            <span>{veiculosFiltrados.length} veículo(s) encontrado(s)</span></div></div>
          <div className="tecnico-toolbar">
            <div className="oficina-field"><label htmlFor="veiculos-busca">Pesquisar veículo</label>
              <div className="tecnico-search-control"><FiSearch aria-hidden="true" /><input id="veiculos-busca" type="search" value={busca} onChange={event => setBusca(event.target.value)} placeholder="Placa, cliente, marca, modelo ou chassi" /></div>
            </div>
            <div className="oficina-field"><label htmlFor="veiculos-filtro">Vínculo com cliente</label>
              <select id="veiculos-filtro" value={filtro} onChange={event => setFiltro(event.target.value)}>
                <option value="todos">Todos os veículos</option><option value="com-cliente">Com cliente vinculado</option><option value="sem-cliente">Sem cliente vinculado</option>
              </select>
            </div>
            <button type="button" className="oficina-btn" onClick={carregarVeiculos} disabled={carregando}><FiRefreshCw aria-hidden="true" /> Atualizar</button>
          </div>
          {carregando && <p className="tecnico-loading" role="status">Carregando veículos...</p>}
          {!carregando && veiculosFiltrados.length === 0 && <div className="oficina-empty-state"><TbCar aria-hidden="true" /><h3>Nenhum veículo encontrado</h3><p>Altere a busca ou consulte seus vínculos pelo painel técnico.</p></div>}
          <div className="tecnico-veiculos">
            {veiculosFiltrados.map(veiculo => (
              <article className="tecnico-veiculo" key={veiculo.id}>
                <div className="tecnico-veiculo-header"><div className="tecnico-veiculo-icon"><TbCar aria-hidden="true" /></div>
                  <div className="tecnico-veiculo-titulo"><h3>{montarNomeVeiculo(veiculo)}</h3><span>{veiculo.cliente?.nome || 'Cliente não informado'}</span></div>
                  <strong className="tecnico-placa">{veiculo.placa || 'SEM PLACA'}</strong>
                </div>
                <dl className="tecnico-dados">
                  <div><dt>Marca</dt><dd>{veiculo.fabricante || '—'}</dd></div><div><dt>Modelo</dt><dd>{veiculo.modelo || '—'}</dd></div>
                  <div><dt>Ano</dt><dd>{montarAnoVeiculo(veiculo)}</dd></div><div><dt>KM</dt><dd>{veiculo.km ?? '—'}</dd></div>
                  <div><dt>Cor</dt><dd>{veiculo.cor || '—'}</dd></div><div><dt>Chassi</dt><dd>{veiculo.chassi || '—'}</dd></div>
                </dl>
                <div className="tecnico-veiculo-acoes">
                  <button type="button" className="oficina-btn oficina-btn-primary" onClick={() => irParaChecklist(veiculo)}><FiClipboard aria-hidden="true" /> Checklist</button>
                  <button type="button" className="oficina-btn" onClick={() => irParaHistorico(veiculo)}><FiClock aria-hidden="true" /> Histórico veicular</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default VisualizarVeiculos;
