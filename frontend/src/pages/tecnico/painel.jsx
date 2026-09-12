import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import useConsultaTickets from '../../hooks/useConsultaTickets';
import '../../styles/tecnicoStyles/painel.css';

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
  const navigate = useNavigate();

  const [versao, setVersao] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const consulta = useConsultaTickets('/tecnico/veiculos', 15000, versao);
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

  return (
    <Layout>
      <main className="painel-tecnico-page">
        <section className="painel-tecnico-top">
          <div>
            <h1>Painel Técnico</h1>
            <p>
              Veículos com ordens de serviço salvas e atribuídas a você.
              Acesse a checklist, o histórico e os itens da OS.
            </p>

            {carregando && <small>Carregando veículos...</small>}
          </div>

          <div className="painel-tecnico-resumo">
            <span>Veículos encontrados</span>
            <strong>{veiculosFiltrados.length}</strong>
          </div>
        </section>

        <section className="painel-tecnico-card">
          <div className="painel-tecnico-card-header">
            <div>
              <h2>Meus veículos em atendimento</h2>
              <span>
                Escolha um veículo para abrir checklist, consultar checklists
                antigas, ver histórico ou exibir a ordem de serviço.
              </span>
            </div>
          </div>

          <div className="painel-tecnico-toolbar">
            <div className="painel-tecnico-search">
              <label>Pesquisar veículo</label>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por placa, cliente, veículo ou código da OS"
              />
            </div>

            <div className="painel-tecnico-filter">
              <label>Filtro</label>

              <select
                value={filtro}
                onChange={(event) => setFiltro(event.target.value)}
              >
                <option value="todos">Todas as minhas OS ativas</option>
                <option value="ABERTA">Aberta</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="AGUARDANDO_PECA">Aguardando peça</option>
              </select>
            </div>

            <button
              type="button"
              className="painel-tecnico-refresh"
              onClick={carregarVeiculos}
              disabled={carregando}
            >
              Atualizar
            </button>
          </div>

          <div className="painel-tecnico-list">
            {consulta.erro && <p className="painel-tecnico-erro" role="alert">{consulta.erro}</p>}
            {!carregando && !consulta.erro && veiculosFiltrados.length === 0 && (
              <div className="painel-tecnico-empty">
                Nenhum veículo vinculado neste filtro. O operador precisa selecionar seu nome e salvar a OS para vinculá-la a você.
              </div>
            )}

            {veiculosFiltrados.map((veiculo) => (
              <article className="painel-tecnico-veiculo" key={veiculo.id}>
                <div className="painel-tecnico-veiculo-icon">
                  <img src="/icons/veiculo.svg" alt="Veículo" />
                </div>

                <div className="painel-tecnico-veiculo-info">
                  <div className="painel-tecnico-veiculo-title">
                    <div>
                      <h3>{montarNomeVeiculo(veiculo)}</h3>
                      <span>
                        {veiculo.cliente?.nome || 'Cliente não informado'}
                      </span>
                    </div>

                    <strong>{veiculo.placa || 'SEM PLACA'}</strong>
                  </div>

                  <div className="painel-tecnico-veiculo-dados">
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

                <div className="painel-tecnico-veiculo-actions">
                  <button
                    type="button"
                    className="painel-tecnico-btn painel-tecnico-btn-blue"
                    onClick={() => abrirNovaChecklist(veiculo)}
                  >
                    Nova checklist
                  </button>

                  <button
                    type="button"
                    className="painel-tecnico-btn painel-tecnico-btn-outline"
                    onClick={() => abrirChecklists(veiculo)}
                  >
                    Checklists
                  </button>

                  <button
                    type="button"
                    className="painel-tecnico-btn painel-tecnico-btn-dark"
                    onClick={() => abrirHistorico(veiculo)}
                  >
                    Histórico veicular
                  </button>
                  {veiculo.ordensServico.filter(ordem => filtro === 'todos' || ordem.status === filtro).map(ordem => (
                    <button type="button" key={ordem.id} className="painel-tecnico-btn painel-tecnico-btn-orange"
                      onClick={() => navigate(`/tecnico/ordens-servico/${ordem.id}`)}>
                      Exibir ordem de serviço
                      <small>{ordem.codigo} · {ordem.status.replaceAll('_', ' ')}</small>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Painel;
