import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import '../../styles/tecnicoStyles/historicoVeicular.css';

/**
 * Tela responsável pela consulta do histórico veicular,
 * exibindo ordens de serviço, diagnósticos, serviços e peças relacionados.
 *
 * @component
 * @function HistoricoVeicular
 * @returns {JSX.Element} Tela de histórico veicular.
 */
function HistoricoVeicular() {
  const navigate = useNavigate();
  const location = useLocation();

  const veiculoSelecionado = location.state?.veiculo || null;

  const [busca, setBusca] = useState('');
  const [historico, setHistorico] = useState([]);
  const [ordemDetalhada, setOrdemDetalhada] = useState(null);

  const [carregando, setCarregando] = useState(false);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

  // Se um veiculo vier da navegação, dispara a primeira busca automaticamente.
  useEffect(() => {
    if (veiculoSelecionado?.placa) {
      setBusca(veiculoSelecionado.placa);
      buscarHistoricoPorTermo(veiculoSelecionado.placa);
    }
  }, []);

 /**
 * Totais consolidados de diagnósticos, serviços e peças encontrados no histórico.
 *
 * @type {{
 *   totalDiagnosticos: number,
 *   totalServicos: number,
 *   totalPecas: number
 * }}
 */
  const totaisHistorico = useMemo(() => {
    return historico.reduce(
      (acc, ordem) => {
        acc.totalDiagnosticos += Number(ordem.diagnosticos?.length || 0);
        acc.totalServicos += contarServicos(ordem);
        acc.totalPecas += contarPecas(ordem);

        return acc;
      },
      {
        totalDiagnosticos: 0,
        totalServicos: 0,
        totalPecas: 0,
      }
    );
  }, [historico]);

/**
 * Busca ordens de serviço com base em uma placa, cliente ou veículo.
 *
 * @async
 * @param {string} termoBusca - Termo utilizado na pesquisa.
 * @returns {Promise<void>}
 */
  async function buscarHistoricoPorTermo(termoBusca) {
    try {
      if (!termoBusca.trim()) {
        alert('Digite uma placa, cliente ou veículo para buscar.');
        return;
      }

      setCarregando(true);
      setOrdemDetalhada(null);

      const response = await api.get('/ordens-servico/buscar', {
        params: {
          termo: termoBusca.trim(),
        },
      });

      setHistorico(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao buscar histórico veicular:', error);
      setHistorico([]);
      alert('Erro ao buscar histórico veicular.');
    } finally {
      setCarregando(false);
    }
  }

/**
 * Executa a busca do histórico usando o valor digitado no campo de pesquisa.
 *
 * @returns {void}
 */
  function buscarHistorico() {
    buscarHistoricoPorTermo(busca);
  }

/**
 * Busca e abre os detalhes completos de uma ordem de serviço.
 *
 * @async
 * @param {number|string} ordemId - Identificador da ordem de serviço.
 * @returns {Promise<void>}
 */
  async function abrirDetalhesOrdem(ordemId) {
    try {
      setCarregandoDetalhes(true);

      const response = await api.get(`/ordens-servico/${ordemId}`);

      setOrdemDetalhada(response.data);
    } catch (error) {
      console.error('Erro ao carregar detalhes da OS:', error);
      alert('Erro ao carregar detalhes da ordem de serviço.');
    } finally {
      setCarregandoDetalhes(false);
    }
  }

/**
 * Fecha o painel de detalhes da ordem de serviço.
 *
 * @returns {void}
 */
  function fecharDetalhes() {
    setOrdemDetalhada(null);
  }

/**
 * Formata uma data para exibição no padrão brasileiro.
 *
 * @param {string|Date|null|undefined} data - Data que será formatada.
 * @returns {string} Data formatada ou hífen.
 */
  function formatarData(data) {
    if (!data) return '-';

    return new Date(data).toLocaleDateString('pt-BR');
  }

/**
 * Monta o nome do veículo usando fabricante e modelo.
 *
 * @param {Object|null|undefined} veiculo - Veículo que será formatado.
 * @returns {string} Nome do veículo ou hífen.
 */
  function montarNomeVeiculo(veiculo) {
    if (!veiculo) return '-';

    return `${veiculo.fabricante || ''} ${veiculo.modelo || ''}`.trim() || '-';
  }

/**
 * Conta a quantidade total de serviços de uma ordem,
 * incluindo serviços vinculados e não vinculados a diagnósticos.
 *
 * @param {Object} ordem - Ordem de serviço analisada.
 * @returns {number} Quantidade total de serviços.
 */
  function contarServicos(ordem) {
    const servicosDiagnostico =
      ordem?.diagnosticos?.reduce((acc, diagnostico) => {
        return acc + Number(diagnostico.servicos?.length || 0);
      }, 0) || 0;

    const servicosSoltos = ordem?.servicos?.length || 0;

    return servicosDiagnostico + servicosSoltos;
  }

/**
 * Conta a quantidade total de peças de uma ordem,
 * incluindo peças vinculadas a serviços e peças avulsas.
 *
 * @param {Object} ordem - Ordem de serviço analisada.
 * @returns {number} Quantidade total de peças.
 */
  function contarPecas(ordem) {
    const pecasDiagnostico =
      ordem?.diagnosticos?.reduce((accDiagnostico, diagnostico) => {
        const pecasServicos =
          diagnostico.servicos?.reduce((accServico, servico) => {
            return accServico + Number(servico.pecas?.length || 0);
          }, 0) || 0;

        return accDiagnostico + pecasServicos;
      }, 0) || 0;

    const pecasSoltas = ordem?.pecas?.length || 0;

    return pecasDiagnostico + pecasSoltas;
  }

/**
 * Retorna a classe CSS correspondente ao status da ordem de serviço.
 *
 * @param {string|null|undefined} status - Status da ordem.
 * @returns {string} Classe CSS usada na exibição do status.
 */
  function obterClasseStatus(status) {
    const statusNormalizado = String(status || '').toLowerCase();

    if (statusNormalizado.includes('finalizado')) {
      return 'historico-status-green';
    }

    if (statusNormalizado.includes('concluido')) {
      return 'historico-status-green';
    }

    if (statusNormalizado.includes('manutencao')) {
      return 'historico-status-blue';
    }

    if (statusNormalizado.includes('andamento')) {
      return 'historico-status-blue';
    }

    if (statusNormalizado.includes('cancelado')) {
      return 'historico-status-red';
    }

    return 'historico-status-gray';
  }

/**
 * Renderiza um card resumido de uma ordem de serviço encontrada.
 *
 * @param {Object} ordem - Ordem de serviço que será exibida.
 * @returns {JSX.Element} Card resumido da ordem.
 */
  function renderResumoOrdem(ordem) {
    return (
      <article className="historico-item" key={ordem.id}>
        <div className="historico-timeline-marker">
          <div className="historico-timeline-dot" />
        </div>

        <div className="historico-item-content">
          <div className="historico-item-header">
            <div>
              <strong>{ordem.codigo || 'OS sem código'}</strong>
              <span>{formatarData(ordem.dataEmissao || ordem.createdAt)}</span>
            </div>

            <span className={`historico-status ${obterClasseStatus(ordem.status)}`}>
              {ordem.status || 'SEM STATUS'}
            </span>
          </div>

          <div className="historico-item-main">
            <div>
              <span>Cliente</span>
              <strong>{ordem.clienteNome || ordem.veiculo?.cliente?.nome || '-'}</strong>
            </div>

            <div>
              <span>Veículo</span>
              <strong>
                {ordem.veiculo?.placa || '-'} | {montarNomeVeiculo(ordem.veiculo)}
              </strong>
            </div>

            <div>
              <span>Data</span>
              <strong>{formatarData(ordem.dataEmissao || ordem.createdAt)}</strong>
            </div>
          </div>

          <div className="historico-item-footer">
            <div className="historico-mini-stats">
              <span>Diagnósticos: {ordem.diagnosticos?.length || 0}</span>
              <span>Serviços: {contarServicos(ordem)}</span>
              <span>Peças: {contarPecas(ordem)}</span>
            </div>

            <button
              type="button"
              onClick={() => abrirDetalhesOrdem(ordem.id)}
              disabled={carregandoDetalhes}
            >
              {carregandoDetalhes ? 'Carregando...' : 'Ver detalhes'}
            </button>
          </div>
        </div>
      </article>
    );
  }

/**
 * Renderiza o modal com os detalhes completos da ordem selecionada.
 *
 * @returns {JSX.Element|null} Modal de detalhes ou null.
 */
  function renderDetalhesOrdem() {
    if (!ordemDetalhada) return null;

    const veiculo = ordemDetalhada.veiculo || {};
    const cliente = veiculo.cliente || {};

    return (
      <div className="historico-modal-overlay">
        <div className="historico-modal">
          <div className="historico-modal-header">
            <div>
              <h2>{ordemDetalhada.codigo || 'Ordem de serviço'}</h2>
              <span>Detalhes técnicos da ordem selecionada.</span>
            </div>

            <button
              type="button"
              className="historico-modal-close"
              onClick={fecharDetalhes}
            >
              ×
            </button>
          </div>

          <div className="historico-modal-summary">
            <div>
              <span>Cliente</span>
              <strong>{cliente.nome || ordemDetalhada.clienteNome || '-'}</strong>
            </div>

            <div>
              <span>Placa</span>
              <strong>{veiculo.placa || '-'}</strong>
            </div>

            <div>
              <span>Veículo</span>
              <strong>{montarNomeVeiculo(veiculo)}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{ordemDetalhada.status || '-'}</strong>
            </div>

            <div>
              <span>Data</span>
              <strong>
                {formatarData(ordemDetalhada.dataEmissao || ordemDetalhada.createdAt)}
              </strong>
            </div>

            <div>
              <span>Itens técnicos</span>
              <strong>
                {contarServicos(ordemDetalhada)} serviço(s) /{' '}
                {contarPecas(ordemDetalhada)} peça(s)
              </strong>
            </div>
          </div>

          {ordemDetalhada.observacoes && (
            <div className="historico-modal-observacao">
              <span>Observações da OS</span>
              <p>{ordemDetalhada.observacoes}</p>
            </div>
          )}

          <div className="historico-modal-grid">
            <section className="historico-modal-section">
              <div className="historico-section-title">
                <h3>Diagnósticos</h3>
                <span>{ordemDetalhada.diagnosticos?.length || 0} registro(s)</span>
              </div>

              {(!ordemDetalhada.diagnosticos ||
                ordemDetalhada.diagnosticos.length === 0) && (
                <div className="historico-empty-box">
                  Nenhum diagnóstico registrado.
                </div>
              )}

              {ordemDetalhada.diagnosticos?.map((diagnostico, index) => (
                <div className="historico-detail-card" key={diagnostico.id}>
                  <div className="historico-detail-title">
                    <strong>Diagnóstico {index + 1}</strong>
                  </div>

                  <p>
                    {diagnostico.nomeDiagnostico ||
                      diagnostico.descricao ||
                      'Diagnóstico sem descrição'}
                  </p>

                  {diagnostico.observacoes && (
                    <small>{diagnostico.observacoes}</small>
                  )}

                  {diagnostico.servicos?.length > 0 && (
                    <div className="historico-nested">
                      <strong>Serviços vinculados</strong>

                      {diagnostico.servicos.map((servico) => (
                        <div className="historico-nested-item" key={servico.id}>
                          <span>
                            {servico.nomeServico ||
                              servico.descricao ||
                              'Serviço sem descrição'}
                          </span>

                          <small>
                            {servico.tipo || '-'} | Responsável:{' '}
                            {servico.responsavel || '-'}
                          </small>

                          {servico.pecas?.length > 0 && (
                            <div className="historico-pecas-list">
                              {servico.pecas.map((peca) => (
                                <div key={peca.id}>
                                  <b>{peca.nomePeca || peca.descricao}</b>
                                  <span>
                                    Qtd: {peca.quantidade || 1}
                                    {peca.fornecedorNome
                                      ? ` | Fornecedor: ${peca.fornecedorNome}`
                                      : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>

            <section className="historico-modal-section">
              <div className="historico-section-title">
                <h3>Resumo técnico</h3>
                <span>Itens encontrados na OS</span>
              </div>

              <div className="historico-stats">
                <div>
                  <span>Diagnósticos</span>
                  <strong>{ordemDetalhada.diagnosticos?.length || 0}</strong>
                </div>

                <div>
                  <span>Serviços</span>
                  <strong>{contarServicos(ordemDetalhada)}</strong>
                </div>

                <div>
                  <span>Peças</span>
                  <strong>{contarPecas(ordemDetalhada)}</strong>
                </div>
              </div>

              <div className="historico-section-title historico-margin-top">
                <h3>Serviços</h3>
                <span>{ordemDetalhada.servicos?.length || 0} registro(s)</span>
              </div>

              {(!ordemDetalhada.servicos ||
                ordemDetalhada.servicos.length === 0) && (
                <div className="historico-empty-box">
                  Nenhum serviço sem diagnóstico registrado.
                </div>
              )}

              {ordemDetalhada.servicos?.map((servico) => (
                <div className="historico-detail-card" key={servico.id}>
                  <div className="historico-detail-title">
                    <strong>
                      {servico.nomeServico ||
                        servico.descricao ||
                        'Serviço sem descrição'}
                    </strong>
                  </div>

                  <p>
                    Tipo: {servico.tipo || '-'} | Responsável:{' '}
                    {servico.responsavel || '-'}
                  </p>
                </div>
              ))}

              <div className="historico-section-title historico-margin-top">
                <h3>Peças</h3>
                <span>{ordemDetalhada.pecas?.length || 0} registro(s)</span>
              </div>

              {(!ordemDetalhada.pecas || ordemDetalhada.pecas.length === 0) && (
                <div className="historico-empty-box">
                  Nenhuma peça avulsa registrada.
                </div>
              )}

              {ordemDetalhada.pecas?.map((peca) => (
                <div className="historico-detail-card" key={peca.id}>
                  <div className="historico-detail-title">
                    <strong>{peca.nomePeca || peca.descricao || '-'}</strong>
                  </div>

                  <p>
                    Fornecedor: {peca.fornecedorNome || '-'} | Qtd:{' '}
                    {peca.quantidade || 1}
                  </p>
                </div>
              ))}
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <main className="historico-veicular-page">
        <section className="historico-veicular-top">
          <div>
            <h1>Histórico veicular</h1>
            <p>
              Consulte diagnósticos, serviços realizados e peças trocadas.
            </p>

            {carregando && <small>Buscando histórico...</small>}
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

        {veiculoSelecionado && (
          <section className="historico-veicular-vehicle-card">
            <div className="historico-vehicle-icon">
              <img src="/icons/veiculo.svg" alt="Veículo" />
            </div>

            <div>
              <span>Veículo selecionado</span>
              <strong>{montarNomeVeiculo(veiculoSelecionado)}</strong>
            </div>

            <div>
              <span>Placa</span>
              <strong>{veiculoSelecionado.placa || '-'}</strong>
            </div>

            <button type="button" onClick={() => navigate('/tecnico/painel')}>
              Trocar veículo
            </button>
          </section>
        )}

        <section className="historico-veicular-card">
          <div className="historico-veicular-search">
            <div>
              <label>Pesquisar histórico</label>

              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    buscarHistorico();
                  }
                }}
                placeholder="Digite placa, cliente ou modelo do veículo"
              />
            </div>

            <button type="button" onClick={buscarHistorico}>
              Buscar
            </button>
          </div>
        </section>

        <section className="historico-resumo-grid historico-resumo-grid-three">
          <div>
            <span>Diagnósticos</span>
            <strong>{totaisHistorico.totalDiagnosticos}</strong>
          </div>

          <div>
            <span>Serviços realizados</span>
            <strong>{totaisHistorico.totalServicos}</strong>
          </div>

          <div>
            <span>Peças trocadas</span>
            <strong>{totaisHistorico.totalPecas}</strong>
          </div>
        </section>

        <section className="historico-veicular-card">
          <div className="historico-veicular-title">
            <div>
              <h2>Linha do tempo</h2>
              <span>{historico.length} registro(s) encontrado(s)</span>
            </div>
          </div>

          {historico.length === 0 && (
            <div className="historico-veicular-empty">
              Nenhum histórico encontrado para esta busca.
            </div>
          )}

          <div className="historico-list">
            {historico.map((ordem) => renderResumoOrdem(ordem))}
          </div>
        </section>

        {renderDetalhesOrdem()}
      </main>
    </Layout>
  );
}

export default HistoricoVeicular;