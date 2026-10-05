import SeletorTema from '../../components/SeletorTema';
import useTemaOficina from '../../hooks/useTemaOficina';
import { FiArrowLeft, FiClipboard, FiEye, FiPackage, FiRefreshCw, FiTool, FiX } from 'react-icons/fi';
import { TbCar } from 'react-icons/tb';
import StatusOrdemTecnica from '../../components/StatusOrdemTecnica';
import ModalOficina from '../../components/ModalOficina';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import ConteudoOrdemTecnica from '../../components/ConteudoOrdemTecnica';
import useConsultaTickets from '../../hooks/useConsultaTickets';
import api from '../../services/api';
import '../../styles/tecnicoStyles/tecnico.css';

/**
 * Tela responsável pela consulta do histórico veicular,
 * exibindo ordens de serviço, diagnósticos, serviços e peças relacionados.
 *
 * @component
 * @function HistoricoVeicular
 * @returns {JSX.Element} Tela de histórico veicular.
 */
function HistoricoVeicular() {
  const [tema, setTema] = useTemaOficina();
  const navigate = useNavigate();
  const location = useLocation();

  const veiculoSelecionado = location.state?.veiculo || null;

  const [versao, setVersao] = useState(0);
  const consulta = useConsultaTickets(veiculoSelecionado?.id ? `/tecnico/veiculos/${veiculoSelecionado.id}/historico` : null, 15000, versao);
  const historico = useMemo(() => consulta.dados || [], [consulta.dados]);
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

            <StatusOrdemTecnica status={ordem.status} />
          </div>

          <div className="tecnico-dados">
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
              className="oficina-btn"
              aria-label={`Ver detalhes da ordem ${ordem.codigo || ordem.id}`}
              onClick={() => abrirDetalhesOrdem(ordem.id)}
              disabled={carregandoDetalhes}
            >
              <FiEye aria-hidden="true" /> {carregandoDetalhes ? 'Carregando...' : 'Ver detalhes'}
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
      <ModalOficina className="tecnico-modal" labelledBy="historico-detalhes-titulo" onClose={fecharDetalhes}>
          <div className="tecnico-modal-header">
            <div>
              <h2 id="historico-detalhes-titulo">{ordemDetalhada.codigo || 'Ordem de serviço'}</h2>
              <span>Detalhes técnicos da ordem selecionada.</span>
            </div>

            <button
              type="button"
              className="oficina-btn"
              aria-label="Fechar detalhes da ordem de serviço"
              onClick={fecharDetalhes}
            >
              <FiX aria-hidden="true" />
            </button>
          </div>

          <div className="tecnico-dados tecnico-historico-resumo">
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
              <strong><StatusOrdemTecnica status={ordemDetalhada.status} /></strong>
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
            <div className="tecnico-observacao">
              <span>Observações da OS</span>
              <p>{ordemDetalhada.observacoes}</p>
            </div>
          )}

          <ConteudoOrdemTecnica ordem={ordemDetalhada} />
      </ModalOficina>
    );
  }

  return (
    <Layout className="oficina-theme tecnico-workspace" theme={tema}
      topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
      <main className="oficina-page historico-veicular-page">
        <header className="oficina-page-header">
          <div>
            <h1>Histórico veicular</h1>
            <p>
              Consulte diagnósticos, serviços realizados e peças trocadas.
            </p>

          </div>

          <div className="tecnico-page-actions">
            <button
              type="button"
              className="oficina-btn"
              onClick={() => navigate('/tecnico/painel')}
            >
              <FiArrowLeft aria-hidden="true" /> Voltar ao painel
            </button>
          </div>
        </header>

        {veiculoSelecionado && (
          <section className="oficina-panel tecnico-resumo-veiculo" aria-label="Veículo do histórico">
            <div className="tecnico-veiculo-icon">
              <TbCar aria-hidden="true" />
            </div>

            <div>
              <span>Veículo selecionado</span>
              <strong>{montarNomeVeiculo(veiculoSelecionado)}</strong>
            </div>

            <div>
              <span>Placa</span>
              <strong>{veiculoSelecionado.placa || '-'}</strong>
            </div>

          </section>
        )}


        {consulta.erro && <p className="tecnico-erro" role="alert">{consulta.erro}</p>}
        <section className="tecnico-indicadores" aria-label="Resumo do histórico">
          <div className="tecnico-indicador"><FiClipboard aria-hidden="true" /><div>
            <span>Diagnósticos</span>
            <strong>{carregando || consulta.erro ? '—' : totaisHistorico.totalDiagnosticos}</strong>
          </div>
          </div>

          <div className="tecnico-indicador"><FiTool aria-hidden="true" /><div>
            <span>Serviços realizados</span>
            <strong>{carregando || consulta.erro ? '—' : totaisHistorico.totalServicos}</strong>
          </div>
          </div>

          <div className="tecnico-indicador"><FiPackage aria-hidden="true" /><div>
            <span>Peças trocadas</span>
            <strong>{carregando || consulta.erro ? '—' : totaisHistorico.totalPecas}</strong>
          </div>
          </div>
        </section>

        <section className="oficina-panel">
          <div className="oficina-list-header">
            <div>
              <h2 className="oficina-section-heading"><FiClipboard aria-hidden="true" /> Linha do tempo</h2>
              <span>{historico.length} registro(s) encontrado(s)</span>
            </div>
            <button type="button" className="oficina-btn" onClick={buscarHistorico} disabled={!veiculoSelecionado?.id || carregando}>
              <FiRefreshCw aria-hidden="true" /> Atualizar histórico
            </button>
          </div>

          {carregando && <p className="tecnico-loading" role="status">Buscando histórico...</p>}
          {!carregando && !consulta.erro && historico.length === 0 && (
            <div className="oficina-empty-state">
              <FiClipboard aria-hidden="true" /><h3>{veiculoSelecionado ? 'Nenhuma OS no histórico' : 'Selecione um veículo'}</h3>
              <p>{veiculoSelecionado ? 'As ordens registradas para este veículo aparecerão nesta linha do tempo.' : 'Acesse o histórico de um veículo pelo painel de atendimentos.'}</p>
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
