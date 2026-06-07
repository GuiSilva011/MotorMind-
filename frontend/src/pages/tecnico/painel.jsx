import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/tecnicoStyles/painel.css';

function Painel() {
  const navigate = useNavigate();

  const [veiculos, setVeiculos] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [carregando, setCarregando] = useState(false);

  // Carrega os veiculos assim que o painel tecnico abre.
  useEffect(() => {
    carregarVeiculos();
  }, []);

  // Busca os veiculos cadastrados para exibir na lista.
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

  // Monta o texto do ano combinando fabricacao e modelo.
  function montarAnoVeiculo(veiculo) {
    if (veiculo.ano_fabricacao && veiculo.ano_modelo) {
      return `${veiculo.ano_fabricacao}/${veiculo.ano_modelo}`;
    }

    return veiculo.ano_modelo || veiculo.ano_fabricacao || '-';
  }

  // Monta o nome exibido para o veiculo no card.
  function montarNomeVeiculo(veiculo) {
    const fabricante = veiculo.fabricante || '';
    const modelo = veiculo.modelo || '';

    return `${fabricante} ${modelo}`.trim() || 'Veículo sem descrição';
  }

  // Leva o usuario para a tela de nova checklist.
  function abrirNovaChecklist(veiculo) {
    navigate('/tecnico/checklist', {
      state: {
        veiculo,
      },
    });
  }

  // Leva o usuario para o historico de checklists do veiculo.
  function abrirChecklists(veiculo) {
    navigate('/tecnico/checklists', {
      state: {
        veiculo,
      },
    });
  }

  // Leva o usuario para o historico veicular completo.
  function abrirHistorico(veiculo) {
    navigate('/tecnico/historico-veicular', {
      state: {
        veiculo,
      },
    });
  }

  // Filtra os veiculos pelo texto e pelo tipo de vinculo com cliente.
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
      <main className="painel-tecnico-page">
        <section className="painel-tecnico-top">
          <div>
            <h1>Painel Técnico</h1>
            <p>
              Consulte os veículos cadastrados e acesse checklist ou histórico
              veicular.
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
              <h2>Veículos cadastrados</h2>
              <span>
                Escolha um veículo para abrir checklist, consultar checklists
                antigas ou ver histórico.
              </span>
            </div>
          </div>

          <div className="painel-tecnico-toolbar">
            <div className="painel-tecnico-search">
              <label>Pesquisar veículo</label>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por placa, cliente, marca, modelo ou chassi"
              />
            </div>

            <div className="painel-tecnico-filter">
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
              className="painel-tecnico-refresh"
              onClick={carregarVeiculos}
              disabled={carregando}
            >
              Atualizar
            </button>
          </div>

          <div className="painel-tecnico-list">
            {veiculosFiltrados.length === 0 && (
              <div className="painel-tecnico-empty">
                Nenhum veículo encontrado.
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

export default Painel;