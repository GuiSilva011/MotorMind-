import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import SeletorTema from "../components/SeletorTema";
import useTemaOficina from "../hooks/useTemaOficina";
import { FiCheck, FiChevronLeft, FiChevronRight, FiClipboard, FiClock, FiDownload, FiMessageSquare, FiRefreshCw, FiSave, FiSend, FiUserCheck } from 'react-icons/fi';
import ImagemTicket from "../components/ImagemTicket";
import api from "../services/api";
import useConsultaTickets from "../hooks/useConsultaTickets";
import "../styles/tickets.css";

const STATUS = {
  ABERTA: "Aberta",
  EM_ATENDIMENTO: "Em atendimento",
  AGUARDANDO_PECA: "Aguardando peça",
  DISPONIVEL: "Disponível",
  ENTREGUE: "Entregue",
  CANCELADA: "Cancelada",
};
const TRANSICOES = {
  EM_ATENDIMENTO: ["AGUARDANDO_PECA", "DISPONIVEL", "CANCELADA"],
  AGUARDANDO_PECA: ["EM_ATENDIMENTO", "DISPONIVEL", "CANCELADA"],
  DISPONIVEL: ["EM_ATENDIMENTO", "ENTREGUE", "CANCELADA"],
};
const ABAS_TICKET = [
  { id: "pedido", nome: "Pedido", icone: FiClipboard },
  { id: "atendimento", nome: "Atendimento", icone: FiCheck },
  { id: "conversa", nome: "Conversa", icone: FiMessageSquare },
  { id: "historico", nome: "Histórico", icone: FiClock },
];
const STATUS_OS_ENCERRADA = ["FINALIZADA", "FECHADA", "CANCELADA"];
const dataHora = (data) => new Date(data).toLocaleString("pt-BR");
const erroApi = (error) =>
  error.response?.data?.erro ||
  "Não foi possível concluir. Verifique sua conexão e atualize antes de tentar novamente.";

function ChatTicket({ ticket, usuario, visivel }) {
  const [versao, setVersao] = useState(0);
  const [antesDe, setAntesDe] = useState(null);
  const [conteudo, setConteudo] = useState("");
  const [anexos, setAnexos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [baixando, setBaixando] = useState(null);
  const [agora, setAgora] = useState(() => Date.now());
  const chaveEnvio = useRef(crypto.randomUUID());
  const trava = useRef(false);
  const campoArquivos = useRef(null);
  const log = useRef(null);
  const seguir = useRef(true);
  const consulta = useConsultaTickets(
    visivel
      ? `/tickets/${ticket.id}/mensagens${antesDe ? `?antesDe=${antesDe}` : ""}`
      : null,
    antesDe ? 0 : 5000,
    versao,
  );
  const mensagens = (consulta.dados?.itens || []).filter(
    (mensagem) => new Date(mensagem.expiresAt).getTime() > agora,
  );
  const ultimoId = mensagens.at(-1)?.id;
  const podeEnviar =
    usuario.Role !== "ADMIN" &&
    Boolean(ticket.responsavelId) &&
    !["ENTREGUE", "CANCELADA"].includes(ticket.status) &&
    !STATUS_OS_ENCERRADA.includes(ticket.ordemServico.status) &&
    (usuario.Role !== "TECNICO" ||
      ticket.ordemServico.tecnicoId === usuario.id);
  useEffect(() => {
    if (visivel && !antesDe && seguir.current && log.current)
      log.current.scrollTop = log.current.scrollHeight;
  }, [ultimoId, antesDe, visivel]);
  useEffect(() => {
    const timer = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function enviar(event) {
    event.preventDefault();
    if (trava.current || !podeEnviar || (!conteudo.trim() && !anexos.length))
      return;
    trava.current = true;
    setEnviando(true);
    const body = new FormData();
    body.append("conteudo", conteudo);
    body.append("chaveEnvio", chaveEnvio.current);
    anexos.forEach((arquivo) => body.append("anexos", arquivo));
    try {
      await api.post(`/tickets/${ticket.id}/mensagens`, body);
      setConteudo("");
      setAnexos([]);
      if (campoArquivos.current) campoArquivos.current.value = "";
      chaveEnvio.current = crypto.randomUUID();
      seguir.current = true;
      setAntesDe(null);
      setVersao((v) => v + 1);
    } catch (error) {
      toast.error(erroApi(error));
    } finally {
      trava.current = false;
      setEnviando(false);
    }
  }

  async function baixar(anexo) {
    setBaixando(anexo.id);
    try {
      const { data } = await api.get(
        `/tickets/${ticket.id}/anexos/${anexo.id}`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = anexo.nomeArquivo || "anexo";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      toast.error("Anexo indisponível, expirado ou sem permissão.");
    } finally {
      setBaixando(null);
    }
  }

  return (
    <section className="ticket-chat" aria-label="Chat do ticket">
      <h3 className="oficina-section-heading">
        <FiMessageSquare aria-hidden="true" />Chat · Mecânico e responsável
      </h3>
      <p className="ticket-aviso">
        Mensagens e anexos expiram 48 horas após o envio. Registre decisões
        permanentes no status do ticket.
      </p>
      {consulta.erro && (
        <p role="alert" className="ticket-erro">
          {consulta.erro}
        </p>
      )}
      <div className="ticket-acoes">
        {consulta.dados?.antesDe && (
          <button
            type="button"
            onClick={() => setAntesDe(consulta.dados.antesDe)}
          >
            Mensagens anteriores
          </button>
        )}
        {antesDe && (
          <button
            type="button"
            onClick={() => {
              seguir.current = true;
              setAntesDe(null);
            }}
          >
            Voltar às recentes
          </button>
        )}
      </div>
      <div
        className="ticket-mensagens"
        ref={log}
        role="log"
        aria-live="polite"
        onScroll={() => {
          if (log.current)
            seguir.current =
              log.current.scrollHeight -
                log.current.scrollTop -
                log.current.clientHeight <
              80;
        }}
      >
        {consulta.carregando ? (
          <p>Carregando mensagens…</p>
        ) : (
          !mensagens.length && <p>Nenhuma mensagem disponível neste período.</p>
        )}
        {mensagens.map((mensagem) => (
          <article
            key={mensagem.id}
            className={
              mensagem.autorId === usuario.id
                ? "ticket-mensagem propria"
                : "ticket-mensagem"
            }
          >
            <strong>{mensagem.autor.Nome}</strong>
            <time dateTime={mensagem.createdAt}>
              {dataHora(mensagem.createdAt)}
            </time>
            {mensagem.conteudo && <p>{mensagem.conteudo}</p>}
            {mensagem.anexos.map((anexo) => (
              <div key={anexo.id}>
                {["image/jpeg", "image/png", "image/webp"].includes(anexo.mimeType) && (
                  <ImagemTicket
                    ticketId={ticket.id}
                    anexoId={anexo.id}
                    nomeArquivo={anexo.nomeArquivo || "Imagem anexada"}
                    expiresAt={mensagem.expiresAt}
                  />
                )}
                <button
                  type="button"
                  className="ticket-anexo"
                  disabled={baixando !== null}
                  onClick={() => baixar(anexo)}
                >
                  <FiDownload aria-hidden="true" />
                  {baixando === anexo.id
                    ? "Baixando…"
                    : `Baixar ${anexo.nomeArquivo}`}{" "}
                  ({Math.ceil(anexo.tamanhoBytes / 1024)} KB)
                </button>
              </div>
            ))}
          </article>
        ))}
      </div>
      {podeEnviar ? (
        <form className="ticket-composer" onSubmit={enviar}>
          <label htmlFor="ticket-mensagem">
            Mensagem
            <textarea
              id="ticket-mensagem"
              maxLength={2000}
              value={conteudo}
              disabled={enviando}
              onChange={(e) => {
                setConteudo(e.target.value);
                chaveEnvio.current = crypto.randomUUID();
              }}
              placeholder="Converse sobre as peças solicitadas"
            />
          </label>
          <label htmlFor="ticket-anexos">
            Anexos (até 3 arquivos de 5 MB: JPG, PNG, WebP ou PDF)
          </label>
          <input
            id="ticket-anexos"
            ref={campoArquivos}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={enviando}
            onChange={(e) => {
              const selecionados = [...e.target.files];
              if (
                selecionados.length > 3 ||
                selecionados.some((a) => a.size > 5 * 1024 * 1024)
              ) {
                toast.error("Escolha até 3 arquivos de no máximo 5 MB cada.");
                e.target.value = "";
                setAnexos([]);
                return;
              }
              setAnexos(selecionados);
              chaveEnvio.current = crypto.randomUUID();
            }}
          />
          <button
            className="ticket-primario"
            disabled={enviando || (!conteudo.trim() && !anexos.length)}
          >
            <FiSend aria-hidden="true" />
            {enviando ? "Enviando…" : "Enviar mensagem"}
          </button>
        </form>
      ) : (
        <p className="ticket-aviso">
          {!ticket.responsavelId
            ? "Aguarde um operador assumir para conversar."
            : "Chat em somente leitura."}
        </p>
      )}
    </section>
  );
}

function TicketDetalhe({ id, usuario, atualizado }) {
  const adminInicial = usuario.Role === "ADMIN";
  const [abaAtiva, setAbaAtiva] = useState(adminInicial ? "historico" : "pedido");
  const [conversaVisitada, setConversaVisitada] = useState(false);
  const [versao, setVersao] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const trava = useRef(false);
  const abasRef = useRef(null);
  const consulta = useConsultaTickets(`/tickets/${id}`, 10000, versao);
  const ticket = consulta.dados;
  const tecnico = usuario.Role === "TECNICO";
  const admin = usuario.Role === "ADMIN";
  const abasDisponiveis = ABAS_TICKET.filter(
    (aba) => admin
      ? ["conversa", "historico"].includes(aba.id)
      : !tecnico || aba.id !== "atendimento",
  );

  function selecionarAba(aba) {
    setAbaAtiva(aba);
    if (aba === "conversa") setConversaVisitada(true);
  }

  function navegarAbas(event) {
    const indice = abasDisponiveis.findIndex((aba) => aba.id === abaAtiva);
    const destinos = {
      ArrowRight: (indice + 1) % abasDisponiveis.length,
      ArrowLeft: (indice + abasDisponiveis.length - 1) % abasDisponiveis.length,
      Home: 0,
      End: abasDisponiveis.length - 1,
    };
    if (!(event.key in destinos)) return;
    event.preventDefault();
    const proxima = abasDisponiveis[destinos[event.key]].id;
    selecionarAba(proxima);
    abasRef.current?.querySelector(`#ticket-aba-${proxima}`)?.focus();
  }

  async function executar(tipo) {
    if (trava.current) return;
    if (
      tipo === "status" &&
      destino === "ENTREGUE" &&
      !window.confirm(
        "Confirma a entrega de todas as peças e quantidades solicitadas? Esta ação não realiza baixa de estoque. As retiradas devem estar registradas na OS.",
      )
    )
      return;
    trava.current = true;
    setOcupado(true);
    try {
      if (tipo === "assumir") await api.post(`/tickets/${id}/assumir`);
      else
        await api.patch(`/tickets/${id}/status`, { status: destino, motivo });
      setDestino("");
      setMotivo("");
      setVersao((v) => v + 1);
      atualizado();
      if (tipo === "assumir") {
        selecionarAba("conversa");
        abasRef.current?.querySelector("#ticket-aba-conversa")?.focus();
      }
      toast.success("Ticket atualizado.");
    } catch (error) {
      toast.error(erroApi(error));
      setVersao((v) => v + 1);
    } finally {
      trava.current = false;
      setOcupado(false);
    }
  }
  if (consulta.carregando)
    return (
      <section className="ticket-card oficina-panel" role="status">
        Carregando ticket…
      </section>
    );
  if (!ticket)
    return (
      <section className="ticket-card oficina-panel ticket-erro" role="alert">
        {consulta.erro || "Ticket não encontrado."}
      </section>
    );
  const responsavel = ticket.responsavelId === usuario.id;
  const opcoes = usuario.Role === "ADMIN" ? [] : responsavel
    ? TRANSICOES[ticket.status] || []
    : ticket.solicitanteId === usuario.id && ticket.status === "ABERTA"
      ? ["CANCELADA"]
      : [];
  const podeAssumir = usuario.Role === "OPERADOR" && !ticket.responsavelId &&
    ticket.status === "ABERTA" && !tecnico;
  const formularioStatus = opcoes.length > 0 && (
    <form className="ticket-status-form" onSubmit={(event) => {
      event.preventDefault();
      void executar("status");
    }}>
      <h3 className="oficina-section-heading">
        <FiCheck aria-hidden="true" />{tecnico ? "Cancelar solicitação" : "Atendimento"}
      </h3>
      <label>
        {tecnico ? "Ação do pedido" : "Atualizar atendimento"}
        <select required value={opcoes.includes(destino) ? destino : ""} disabled={ocupado}
          onChange={(event) => setDestino(event.target.value)}>
          <option value="">{tecnico ? "Selecione uma ação" : "Selecione o próximo status"}</option>
          {opcoes.map((status) => (
            <option key={status} value={status}>
              {tecnico && status === "CANCELADA" ? "Cancelar solicitação" : STATUS[status]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {tecnico ? "Motivo do cancelamento" : "Registro permanente"}{" "}
        {destino === "CANCELADA" ? "(obrigatório)" : "(opcional)"}
        <textarea maxLength={500} value={motivo} required={destino === "CANCELADA"}
          disabled={ocupado} onChange={(event) => setMotivo(event.target.value)}
          placeholder={tecnico ? "Informe por que o pedido deve ser cancelado" : "Motivo, disponibilidade, compra ou confirmação da entrega"} />
      </label>
      <button className="ticket-primario" disabled={ocupado || !opcoes.includes(destino)}>
        <FiSave aria-hidden="true" />
        {ocupado ? "Salvando…" : tecnico ? "Confirmar cancelamento" : "Salvar status"}
      </button>
    </form>
  );
  return (
    <section className="ticket-card oficina-panel ticket-detalhe" aria-labelledby="ticket-detail-title">
      {consulta.erro && (
        <p className="ticket-erro" role="alert">
          {consulta.erro}
        </p>
      )}
      <header className="ticket-cabecalho">
        <div>
          <p className="ticket-sobre-titulo">Detalhes da solicitação</p>
          <h2 id="ticket-detail-title">{ticket.codigo}</h2>
        </div>
        <span className={`ticket-status ${ticket.status}`}>
          {STATUS[ticket.status]}
        </span>
      </header>
      <div className="ticket-abas" role="tablist" aria-label="Seções da solicitação"
        ref={abasRef} onKeyDown={navegarAbas}>
        {abasDisponiveis.map((aba) => (
          <button key={aba.id} type="button" role="tab" id={`ticket-aba-${aba.id}`}
            aria-controls={`ticket-painel-${aba.id}`} aria-selected={abaAtiva === aba.id}
            tabIndex={abaAtiva === aba.id ? 0 : -1} onClick={() => selecionarAba(aba.id)}>
            <aba.icone aria-hidden="true" />{aba.nome}
          </button>
        ))}
      </div>
      {!admin && <div id="ticket-painel-pedido" className="ticket-aba-panel" role="tabpanel"
        aria-labelledby="ticket-aba-pedido" hidden={abaAtiva !== "pedido"} tabIndex={0}>
        <dl className="ticket-resumo">
          <div><dt>Ordem de serviço</dt><dd>{ticket.ordemServico.codigo}</dd></div>
          <div>
            <dt>Veículo</dt>
            <dd>
              <span className="ticket-placa">{ticket.ordemServico.veiculo.placa}</span>
              <span>{ticket.ordemServico.veiculo.modelo}</span>
            </dd>
          </div>
          <div><dt>Solicitante</dt><dd>{ticket.solicitante.Nome}</dd></div>
          <div>
            <dt>Responsável</dt>
            <dd>{ticket.responsavel?.Nome || "Aguardando atendimento"}</dd>
          </div>
        </dl>
        {["OPERADOR", "OWNER"].includes(usuario.Role) && (
          <Link className="ticket-link-os" to="/operador/ordem-servico">
            <FiClipboard aria-hidden="true" />Acessar ordens de serviço
          </Link>
        )}
        <div className="oficina-table-wrap">
          <table className="oficina-table">
            <caption>Peças solicitadas</caption>
            <thead>
              <tr>
                <th scope="col">Peça</th>
                <th scope="col">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {ticket.itens.map((item) => (
                <tr key={item.id}>
                  <td data-label="Peça">
                    {item.nomePeca}
                    {item.observacao && <small>{item.observacao}</small>}
                  </td>
                  <td data-label="Quantidade">{item.quantidadeSolicitada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ticket.observacao && <p className="ticket-texto">{ticket.observacao}</p>}
        {tecnico && formularioStatus}
      </div>}
      {!tecnico && !admin && <div id="ticket-painel-atendimento" className="ticket-aba-panel" role="tabpanel"
        aria-labelledby="ticket-aba-atendimento" hidden={abaAtiva !== "atendimento"} tabIndex={0}>
        <p className="ticket-aviso">
          Registre a retirada de peças na ordem de serviço. Atualizar este pedido
          não altera o saldo do estoque.
        </p>
        {podeAssumir && (
          <button
            type="button"
            className="ticket-primario"
            disabled={
              ocupado ||
              STATUS_OS_ENCERRADA.includes(ticket.ordemServico.status)
            }
            onClick={() => executar("assumir")}
          >
            <FiUserCheck aria-hidden="true" />
            {ocupado ? "Assumindo…" : "Assumir ticket e abrir chat"}
          </button>
        )}
        {formularioStatus}
        {!podeAssumir && !opcoes.length && (
          <p className="ticket-aviso">
            {["ENTREGUE", "CANCELADA"].includes(ticket.status)
              ? "Atendimento encerrado. Consulte as alterações na aba Histórico."
              : "O status do atendimento é atualizado pelo responsável pela solicitação."}
          </p>
        )}
      </div>}
      <div id="ticket-painel-conversa" className="ticket-aba-panel" role="tabpanel"
        aria-labelledby="ticket-aba-conversa" hidden={abaAtiva !== "conversa"} tabIndex={0}>
        {ticket.podeLerChat ? (
          conversaVisitada && <ChatTicket ticket={ticket} usuario={usuario} visivel={abaAtiva === "conversa"} />
        ) : (
          <div className="oficina-empty-state ticket-conversa-bloqueada">
            <FiMessageSquare aria-hidden="true" />
            <h3>{ticket.responsavelId ? "Conversa restrita" : "Aguardando atendimento"}</h3>
            <p>
              {ticket.responsavelId
                ? "A conversa é exclusiva do mecânico solicitante e do responsável pelo ticket."
                : usuario.Role === "TECNICO"
                  ? "Aguarde um operador assumir a solicitação para conversar."
                  : admin
                    ? "O administrador pode consultar as mensagens e anexos deste ticket em modo de leitura."
                    : "Assuma a solicitação na aba Atendimento para iniciar a conversa."}
            </p>
            {podeAssumir && (
              <button type="button" onClick={() => {
                selecionarAba("atendimento");
                abasRef.current?.querySelector("#ticket-aba-atendimento")?.focus();
              }}>
                <FiUserCheck aria-hidden="true" />Ir para atendimento
              </button>
            )}
          </div>
        )}
      </div>
      <div id="ticket-painel-historico" className="ticket-aba-panel" role="tabpanel"
        aria-labelledby="ticket-aba-historico" hidden={abaAtiva !== "historico"} tabIndex={0}>
        <section className="ticket-historico" aria-labelledby="ticket-historico-titulo">
          <h3 id="ticket-historico-titulo" className="oficina-section-heading">
            <FiClock aria-hidden="true" />Histórico permanente ({ticket.historico.length})
          </h3>
          {!ticket.historico.length && <p>Nenhuma alteração registrada.</p>}
          <ol>
            {ticket.historico.map((item) => (
              <li key={item.id}>
                <strong>{STATUS[item.statusAtual]}</strong> · {item.usuarioNome}
                <time dateTime={item.createdAt}>{dataHora(item.createdAt)}</time>
                {item.motivo && <p>{item.motivo}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}

export default function Tickets() {
  const [tema, setTema] = useTemaOficina();
  const usuario = JSON.parse(
    localStorage.getItem("motormind_usuario") || "null",
  );
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [filtro, setFiltro] = useState("ATIVOS");
  const [meus, setMeus] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [versao, setVersao] = useState(0);
  const tecnico = usuario?.Role === "TECNICO";
  const admin = usuario?.Role === "ADMIN";
  const ordemFiltro = params.get("ordem");
  const consulta = useConsultaTickets(
    `/tickets?status=${filtro}&meus=${meus}&pagina=${pagina}${ordemFiltro ? `&ordemServicoId=${encodeURIComponent(ordemFiltro)}` : ""}`,
    15000,
    versao,
  );
  const atualizar = () => setVersao((v) => v + 1);
  return (
    <Layout className="oficina-theme tickets-workspace" theme={tema}
      topbarActions={<SeletorTema tema={tema} onChange={setTema} />}>
      <main className="tickets-page oficina-page" aria-labelledby="tickets-page-title">
        <header className="ticket-cabecalho oficina-page-header">
          <div>
            <h1 id="tickets-page-title">Solicitações de peças</h1>
            <p>
              {tecnico
                ? "Acompanhe seus pedidos e converse com o responsável pelo atendimento."
                : admin
                  ? "Consulte o histórico e as mensagens dos tickets da oficina."
                  : "Assuma um ticket para atender o mecânico e conversar pelo chat."}
            </p>
          </div>
          <button type="button" onClick={atualizar}>
            <FiRefreshCw aria-hidden="true" />Atualizar
          </button>
        </header>
        {tecnico && (
          <p className="ticket-aviso">
            Para solicitar peças, abra a ordem de serviço no{" "}
            <Link to="/tecnico/painel">Painel técnico</Link>.
          </p>
        )}
        <div className="ticket-colunas">
          <section className="ticket-card oficina-panel ticket-lista" aria-labelledby="ticket-list-title">
            <div className="ticket-lista-header">
              <h2 id="ticket-list-title" className="oficina-section-heading">
                <FiClipboard aria-hidden="true" />Solicitações
              </h2>
              {!consulta.carregando && !consulta.erro && (
                <span className="ticket-contagem" aria-label={`${consulta.dados?.total || 0} solicitações neste filtro`}>
                  {consulta.dados?.total || 0}
                </span>
              )}
            </div>
            <label>
              Exibir
              <select
                value={filtro}
                onChange={(e) => {
                  setFiltro(e.target.value);
                  setPagina(1);
                }}
              >
                <option value="ATIVOS">Em aberto</option>
                <option value="TODOS">Todos (inclui histórico)</option>
                {Object.entries(STATUS).map(([valor, nome]) => (
                  <option key={valor} value={valor}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>
            {!tecnico && (
              <label className="ticket-checkbox">
                <input
                  type="checkbox"
                  checked={meus}
                  onChange={(e) => {
                    setMeus(e.target.checked);
                    setPagina(1);
                  }}
                />
                Somente meus atendimentos
              </label>
            )}
            {ordemFiltro && (
              <p>
                Filtrando por OS.{" "}
                <button
                  type="button"
                  onClick={() => {
                    setParams({});
                    setPagina(1);
                  }}
                >
                  Limpar filtro
                </button>
              </p>
            )}
            {consulta.erro && (
              <p role="alert" className="ticket-erro">
                {consulta.erro}
              </p>
            )}
            {consulta.carregando ? (
              <p className="ticket-lista-vazia" role="status">Carregando solicitações…</p>
            ) : !consulta.dados?.itens.length ? (
              <div className="oficina-empty-state ticket-lista-vazia">
                <FiClipboard aria-hidden="true" />
                <h3>Nenhuma solicitação</h3>
                <p>Não há pedidos para os filtros selecionados.</p>
              </div>
            ) : (
              <ul>
                {consulta.dados.itens.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      className={String(ticket.id) === id ? "selecionado" : ""}
                      aria-current={String(ticket.id) === id ? "page" : undefined}
                      to={`/tickets/${ticket.id}${ordemFiltro ? `?ordem=${encodeURIComponent(ordemFiltro)}` : ""}`}
                    >
                      <div className="ticket-lista-titulo">
                        <strong>{ticket.codigo}</strong>
                        <span className={`ticket-status ${ticket.status}`}>
                          {STATUS[ticket.status]}
                        </span>
                      </div>
                      <span>
                        OS {ticket.ordemServico.codigo} ·{" "}
                        {ticket.ordemServico.veiculo.placa}
                      </span>
                      <span>{ticket.solicitante.Nome}</span>
                      <small>
                        {ticket.responsavel?.Nome || "Sem responsável"}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="ticket-acoes ticket-pagination">
              <button
                type="button"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                <FiChevronLeft aria-hidden="true" />
                Anterior
              </button>
              <span>
                {pagina} /{" "}
                {Math.max(1, Math.ceil((consulta.dados?.total || 0) / 30))}
              </span>
              <button
                type="button"
                disabled={
                  !consulta.dados || pagina * 30 >= consulta.dados.total
                }
                onClick={() => setPagina((p) => p + 1)}
              >
                Próxima
                <FiChevronRight aria-hidden="true" />
              </button>
            </div>
          </section>
          {id ? (
            <TicketDetalhe
              key={id}
              id={id}
              usuario={usuario}
              atualizado={atualizar}
            />
          ) : (
            <section className="ticket-card oficina-panel ticket-vazio">
              <div className="oficina-empty-state">
                <FiMessageSquare aria-hidden="true" />
                <h2>Selecione uma solicitação</h2>
                <p>Consulte as peças, o histórico e a conversa de cada pedido.</p>
                <p>Os pedidos ficam vinculados à ordem de serviço.</p>
              </div>
            </section>
          )}
        </div>
      </main>
    </Layout>
  );
}
