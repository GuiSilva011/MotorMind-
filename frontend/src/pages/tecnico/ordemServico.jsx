import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import ConteudoOrdemTecnica from "../../components/ConteudoOrdemTecnica";
import NovaSolicitacao from "../../components/NovaSolicitacao";
import useConsultaTickets from "../../hooks/useConsultaTickets";
import "../../styles/tecnicoStyles/ordemServico.css";

function VisualizacaoOrdem({ id }) {
  const [versao, setVersao] = useState(0);
  const [solicitando, setSolicitando] = useState(false);
  const navigate = useNavigate();
  const consulta = useConsultaTickets(`/tecnico/ordens/${id}`, 15000, versao);
  const ordem = consulta.dados;
  return (
    <main className="os-tecnica-page">
      <Link to="/tecnico/painel">← Voltar ao painel técnico</Link>
      <header className="os-tecnica-top">
        <div>
          <h1>Ordem de serviço{ordem ? ` · ${ordem.codigo}` : ""}</h1>
          <p>
            Somente os diagnósticos, serviços e peças que o operador salvou
            nesta OS.
          </p>
        </div>
        <button type="button" onClick={() => setVersao((v) => v + 1)}>
          Atualizar
        </button>
      </header>
      {consulta.carregando && (
        <p role="status">Carregando a ordem de serviço…</p>
      )}
      {consulta.erro && (
        <p className="os-tecnica-erro" role="alert">
          {consulta.erro}
        </p>
      )}
      {ordem && (
        <>
          <section
            className="os-tecnica-resumo"
            aria-label="Identificação da ordem de serviço"
          >
            <div>
              <span>Veículo</span>
              <strong>
                {ordem.veiculo.placa} · {ordem.veiculo.fabricante}{" "}
                {ordem.veiculo.modelo}
              </strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{ordem.status.replaceAll("_", " ")}</strong>
            </div>
            <div>
              <span>Último salvamento</span>
              <strong>
                {new Date(ordem.updatedAt).toLocaleString("pt-BR")}
              </strong>
            </div>
          </section>
          <div className="os-tecnica-acoes">
            <button
              type="button"
              className="os-tecnica-solicitar"
              disabled={Boolean(consulta.erro)}
              onClick={() => setSolicitando(true)}
            >
              Solicitar peça ao operador
            </button>
            <Link to={`/tickets?ordem=${ordem.id}`}>
              Ver tickets e conversas desta OS
            </Link>
            <button
              type="button"
              onClick={() =>
                navigate("/tecnico/checklist", {
                  state: { veiculo: ordem.veiculo },
                })
              }
            >
              Nova checklist
            </button>
            <button
              type="button"
              onClick={() =>
                navigate("/tecnico/historico-veicular", {
                  state: { veiculo: ordem.veiculo },
                })
              }
            >
              Histórico veicular
            </button>
          </div>
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
  const { id } = useParams();
  return (
    <Layout>
      <VisualizacaoOrdem key={id} id={id} />
    </Layout>
  );
}
