import SeletorTema from '../../components/SeletorTema';
import useTemaOficina from '../../hooks/useTemaOficina';
import { FiArrowLeft, FiClipboard, FiClock, FiMessageSquare, FiPackage, FiRefreshCw } from 'react-icons/fi';
import { TbCar } from 'react-icons/tb';
import StatusOrdemTecnica from '../../components/StatusOrdemTecnica';
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import ConteudoOrdemTecnica from "../../components/ConteudoOrdemTecnica";
import NovaSolicitacao from "../../components/NovaSolicitacao";
import useConsultaTickets from "../../hooks/useConsultaTickets";
import "../../styles/tecnicoStyles/tecnico.css";

function VisualizacaoOrdem({ id }) {
  const [versao, setVersao] = useState(0);
  const [solicitando, setSolicitando] = useState(false);
  const navigate = useNavigate();
  const consulta = useConsultaTickets(`/tecnico/ordens/${id}`, 15000, versao);
  const ordem = consulta.dados;
  return (
    <main className="oficina-page os-tecnica-page">
      <header className="oficina-page-header">
        <div>
          <h1>Ordem de serviço{ordem ? ` · ${ordem.codigo}` : ""}</h1>
          <p>
            Consulte os itens técnicos e solicite as peças necessárias para este atendimento.
          </p>
        </div>
        <div className="tecnico-page-actions">
          <Link className="oficina-btn" to="/tecnico/painel"><FiArrowLeft aria-hidden="true" /> Voltar ao painel</Link>
          <button type="button" className="oficina-btn" onClick={() => setVersao((v) => v + 1)} disabled={consulta.carregando}>
            <FiRefreshCw aria-hidden="true" /> Atualizar
          </button>
        </div>
      </header>
      {consulta.carregando && (
        <p className="tecnico-loading" role="status">Carregando a ordem de serviço…</p>
      )}
      {consulta.erro && (
        <p className="tecnico-erro" role="alert">
          {consulta.erro}
        </p>
      )}
      {ordem && (
        <>
          <section
            className="oficina-panel tecnico-resumo-veiculo"
            aria-label="Identificação da ordem de serviço"
          >
            <div className="tecnico-veiculo-icon"><TbCar aria-hidden="true" /></div>
            <div>
              <span>Veículo</span>
              <strong>
                {ordem.veiculo.placa} · {ordem.veiculo.fabricante}{" "}
                {ordem.veiculo.modelo}
              </strong>
            </div>
            <div>
              <span>Status</span>
              <strong><StatusOrdemTecnica status={ordem.status} /></strong>
            </div>
            <div>
              <span>Último salvamento</span>
              <strong>
                {new Date(ordem.updatedAt).toLocaleString("pt-BR")}
              </strong>
            </div>
          </section>
          <section className="oficina-panel os-tecnica-acoes" aria-labelledby="os-tecnica-acoes-titulo">
            <div className="oficina-panel-title"><h2 id="os-tecnica-acoes-titulo" className="oficina-section-heading"><FiPackage aria-hidden="true" /> Ações do atendimento</h2>
              <span>Solicite peças ao operador ou registre a inspeção do veículo.</span></div>
            <div className="tecnico-page-actions">
            <button
              type="button"
              className="oficina-btn oficina-btn-primary"
              disabled={Boolean(consulta.erro)}
              onClick={() => setSolicitando(true)}
            >
              <FiPackage aria-hidden="true" /> Solicitar peça ao operador
            </button>
            <Link className="oficina-btn" to={`/tickets?ordem=${ordem.id}`}>
              <FiMessageSquare aria-hidden="true" /> Tickets e conversas desta OS
            </Link>
            <button
              type="button"
              className="oficina-btn"
              onClick={() =>
                navigate("/tecnico/checklist", {
                  state: { veiculo: ordem.veiculo },
                })
              }
            >
              <FiClipboard aria-hidden="true" /> Nova checklist
            </button>
            <button
              type="button"
              className="oficina-btn"
              onClick={() =>
                navigate("/tecnico/historico-veicular", {
                  state: { veiculo: ordem.veiculo },
                })
              }
            >
              <FiClock aria-hidden="true" /> Histórico veicular
            </button>
            </div>
          </section>
          <p className="tecnico-nota os-tecnica-nota">Consulta técnica · Os itens abaixo refletem a última OS salva pelo operador.</p>
          <ConteudoOrdemTecnica ordem={ordem} />
          {solicitando && !consulta.erro && (
            <NovaSolicitacao
              ordem={ordem}
              fechar={() => setSolicitando(false)}
              criada={(ticketId) => navigate(`/tickets/${ticketId}`)}
            />
          )}
        </>
      )}
    </main>
  );
}

export default function OrdemServicoTecnico() {
  const [tema, setTema] = useTemaOficina();
  const { id } = useParams();
  return (
    <Layout className="oficina-theme tecnico-workspace" theme={tema}
      topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
      <VisualizacaoOrdem key={id} id={id} />
    </Layout>
  );
}
