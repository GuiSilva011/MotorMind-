import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/tecnicoStyles/visualizarVeiculos.css';

/**
 * Tela responsável pela consulta e pesquisa de veículos cadastrados,
 * permitindo acessar a checklist e o histórico do veículo selecionado.
 *
 * @component
 * @function VisualizarVeiculos
 * @returns {JSX.Element} Tela de consulta de veículos.
 */
function VisualizarVeiculos() {
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
    <Layout>
      <main className="visualizar-veiculos-page">
        <section className="visualizar-veiculos-top">
          <div>
            <h1>Veículos cadastrados</h1>
            <p>
              Consulte os veículos registrados no sistema e acesse rapidamente o
              checklist ou o histórico veicular.
            </p>

            {carregando && <small>Carregando veículos...</small>}
          </div>

          <div className="tecnico-page-actions">
            <button
              type="button"
              className="tecnico-voltar-painel"
              onClick={() => navigate('/tecnico/painel')}
            >
              Voltar ao painel
            </button>
          </div>
        </section>

        <section className="visualizar-veiculos-card">
          <div className="visualizar-veiculos-card-header">
            <div>
              <h2>Lista de veículos</h2>
              <span>{veiculosFiltrados.length} veículo(s) encontrado(s)</span>
            </div>
          </div>

          <div className="visualizar-veiculos-toolbar">
            <div className="visualizar-veiculos-search">
              <label>Pesquisar veículo</label>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por placa, cliente, marca, modelo ou chassi"
              />
            </div>

            <div className="visualizar-veiculos-filter">
              <label>Filtro</label>

              <select
                value={filtro}
                onChange={(event) => setFiltro(event.target.value)}
              >
                <option value="todos">Todos os veículos</option>
                <option value="com-cliente">Com cliente vinculado</option>
                <option value="sem-cliente">Sem cliente vinculado</option>
              </select>
            </div>

            <button
              type="button"
              className="visualizar-veiculos-refresh"
              onClick={carregarVeiculos}
              disabled={carregando}
            >
              Atualizar
            </button>
          </div>

          <div className="visualizar-veiculos-list">
            {veiculosFiltrados.length === 0 && (
              <div className="visualizar-veiculos-empty">
                Nenhum veículo encontrado.
              </div>
            )}

            {veiculosFiltrados.map((veiculo) => (
              <article className="visualizar-veiculos-item" key={veiculo.id}>
                <div className="visualizar-veiculos-icon">
                  <img src="/icons/veiculo.svg" alt="Veículo" />
                </div>

                <div className="visualizar-veiculos-info">
                  <div className="visualizar-veiculos-title-row">
                    <div>
                      <h2>{montarNomeVeiculo(veiculo)}</h2>
                      <span>
                        {veiculo.cliente?.nome || 'Cliente não informado'}
                      </span>
                    </div>

                    <strong className="visualizar-veiculos-placa">
                      {veiculo.placa || 'SEM PLACA'}
                    </strong>
                  </div>

                  <div className="visualizar-veiculos-details">
                    <div>
                      <span>Marca</span>
                      <strong>{veiculo.fabricante || '-'}</strong>
                    </div>

                    <div>
                      <span>Modelo</span>
                      <strong>{veiculo.modelo || '-'}</strong>
                    </div>

                    <div>
                      <span>Ano</span>
                      <strong>{montarAnoVeiculo(veiculo)}</strong>
                    </div>

                    <div>
                      <span>KM</span>
                      <strong>{veiculo.km || '-'}</strong>
                    </div>

                    <div>
                      <span>Cor</span>
                      <strong>{veiculo.cor || '-'}</strong>
                    </div>

                    <div>
                      <span>Chassi</span>
                      <strong>{veiculo.chassi || '-'}</strong>
                    </div>
                  </div>
                </div>

                <div className="visualizar-veiculos-actions">
                  <button
                    type="button"
                    className="visualizar-veiculos-btn visualizar-veiculos-btn-blue"
                    onClick={() => irParaChecklist(veiculo)}
                  >
                    Checklist
                  </button>

                  <button
                    type="button"
                    className="visualizar-veiculos-btn visualizar-veiculos-btn-dark"
                    onClick={() => irParaHistorico(veiculo)}
                  >
                    Histórico
                  </button>
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