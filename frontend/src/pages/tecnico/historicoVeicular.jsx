import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import ConteudoOrdemTecnica from '../../components/ConteudoOrdemTecnica';
import useConsultaTickets from '../../hooks/useConsultaTickets';
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

  const [versao, setVersao] = useState(0);
  const consulta = useConsultaTickets(veiculoSelecionado?.id ? `/tecnico/veiculos/${veiculoSelecionado.id}/historico` : null, 15000, versao);
  const historico = useMemo(() => consulta.dados || [], [consulta.dados]);
  const busca = veiculoSelecionado?.placa || '';
  const [ordemDetalhada, setOrdemDetalhada] = useState(null);

  const carregando = consulta.carregando;
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);


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

  function buscarHistorico() {
    setOrdemDetalhada(null);
    setVersao(v => v + 1);
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

      const response = await api.get(`/tecnico/veiculos/${veiculoSelecionado.id}/historico/${ordemId}`);

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

        return accDiagnostico + pecasServicos + Number(diagnostico.pecas?.length || 0);
      }, 0) || 0;

    const pecasSoltas = (ordem?.pecas?.length || 0) + (ordem?.servicos?.reduce((total, servico) => total + (servico.pecas?.length || 0), 0) || 0);

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

          <ConteudoOrdemTecnica ordem={ordemDetalhada} />
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
              <label>Veículo vinculado</label>

              <input
                value={busca}
                readOnly
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    buscarHistorico();
                  }
                }}
                placeholder="Selecione um veículo pelo painel técnico"
              />
            </div>

            <button type="button" onClick={buscarHistorico} disabled={!veiculoSelecionado?.id || carregando}>
              Atualizar histórico
            </button>
          </div>
        </section>

        <section className="historico-resumo-grid historico-resumo-grid-three">
          {consulta.erro && <p className="os-tecnica-erro" role="alert">{consulta.erro}</p>}
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

        {!consulta.erro && renderDetalhesOrdem()}
      </main>
    </Layout>
  );
}

export default HistoricoVeicular;
