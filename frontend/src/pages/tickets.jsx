import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
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
const STATUS_OS_ENCERRADA = ["FINALIZADA", "FECHADA", "CANCELADA"];
const dataHora = (data) => new Date(data).toLocaleString("pt-BR");
const erroApi = (error) =>
  error.response?.data?.erro ||
  "Não foi possível concluir. Verifique sua conexão e atualize antes de tentar novamente.";

function ChatTicket({ ticket, usuario }) {
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
    `/tickets/${ticket.id}/mensagens${antesDe ? `?antesDe=${antesDe}` : ""}`,
    antesDe ? 0 : 5000,
    versao,
  );
  const mensagens = (consulta.dados?.itens || []).filter(
    (mensagem) => new Date(mensagem.expiresAt).getTime() > agora,
  );
  const ultimoId = mensagens.at(-1)?.id;
  const podeEnviar =
    Boolean(ticket.responsavelId) &&
    !["ENTREGUE", "CANCELADA"].includes(ticket.status) &&
    !STATUS_OS_ENCERRADA.includes(ticket.ordemServico.status) &&
    (usuario.Role !== "TECNICO" ||
      ticket.ordemServico.tecnicoId === usuario.id);
  useEffect(() => {
    if (!antesDe && seguir.current && log.current)
      log.current.scrollTop = log.current.scrollHeight;
  }, [ultimoId, antesDe]);
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
      <h3>Chat · Mecânico e responsável</h3>
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
        <form onSubmit={enviar}>
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
  const [versao, setVersao] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const trava = useRef(false);
  const consulta = useConsultaTickets(`/tickets/${id}`, 10000, versao);
  const ticket = consulta.dados;
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
      <section className="ticket-card" role="status">
        Carregando ticket…
      </section>
    );
  if (!ticket)
    return (
      <section className="ticket-card ticket-erro" role="alert">
        {consulta.erro || "Ticket não encontrado."}
      </section>
    );
  const responsavel = ticket.responsavelId === usuario.id;
  const opcoes = responsavel
    ? TRANSICOES[ticket.status] || []
    : ticket.solicitanteId === usuario.id && ticket.status === "ABERTA"
      ? ["CANCELADA"]
      : [];
  return (
    <section className="ticket-card ticket-detalhe">
      {consulta.erro && (
        <p className="ticket-erro" role="alert">
          {consulta.erro}
        </p>
      )}
      <header className="ticket-cabecalho">
        <h2>{ticket.codigo}</h2>
        <span className={`ticket-status ${ticket.status}`}>
          {STATUS[ticket.status]}
        </span>
      </header>
      <p>
        OS {ticket.ordemServico.codigo} · {ticket.ordemServico.veiculo.placa} ·{" "}
        {ticket.ordemServico.veiculo.modelo}
      </p>
      <p>
        Solicitante: <strong>{ticket.solicitante.Nome}</strong>
        <br />
        Responsável:{" "}
        <strong>{ticket.responsavel?.Nome || "Aguardando atendimento"}</strong>
      </p>
      {["OPERADOR", "OWNER"].includes(usuario.Role) && (
        <Link to="/operador/ordem-servico">Acessar ordens de serviço</Link>
      )}
      <table>
        <caption>Peças solicitadas</caption>
        <thead>
          <tr>
            <th>Peça</th>
            <th>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {ticket.itens.map((item) => (
            <tr key={item.id}>
              <td>
                {item.nomePeca}
                {item.observacao && <small>{item.observacao}</small>}
              </td>
              <td>{item.quantidadeSolicitada}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {ticket.observacao && <p className="ticket-texto">{ticket.observacao}</p>}
      <p className="ticket-aviso">
        O ticket acompanha o pedido e a entrega. Nesta etapa, retirar peças do
        estoque continua sendo uma ação da OS, sem baixa adicional pelo ticket.
      </p>
      {!ticket.responsavelId &&
        ticket.status === "ABERTA" &&
        usuario.Role !== "TECNICO" && (
          <button
            type="button"
            className="ticket-primario"
            disabled={
              ocupado ||
              STATUS_OS_ENCERRADA.includes(ticket.ordemServico.status)
            }
            onClick={() => executar("assumir")}
          >
            {ocupado ? "Assumindo…" : "Assumir ticket e abrir chat"}
          </button>
        )}
      {opcoes.length > 0 && (
        <form
          className="ticket-status-form"
          onSubmit={(e) => {
            e.preventDefault();
            void executar("status");
          }}
        >
          <label>
            Atualizar atendimento
            <select
              required
              value={opcoes.includes(destino) ? destino : ""}
              disabled={ocupado}
              onChange={(e) => setDestino(e.target.value)}
            >
              <option value="">Selecione o próximo status</option>
              {opcoes.map((status) => (
                <option key={status} value={status}>
                  {STATUS[status]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Registro permanente{" "}
            {destino === "CANCELADA" ? "(obrigatório)" : "(opcional)"}
            <textarea
              maxLength={500}
              value={motivo}
              required={destino === "CANCELADA"}
              disabled={ocupado}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo, disponibilidade, compra ou confirmação da entrega"
            />
          </label>
          <button disabled={ocupado || !opcoes.includes(destino)}>
            {ocupado ? "Salvando…" : "Salvar status"}
          </button>
        </form>
      )}
      <details className="ticket-historico">
        <summary>Histórico permanente ({ticket.historico.length})</summary>
        <ol>
          {ticket.historico.map((item) => (
            <li key={item.id}>
              <strong>{STATUS[item.statusAtual]}</strong> · {item.usuarioNome}
              <time>{dataHora(item.createdAt)}</time>
              {item.motivo && <p>{item.motivo}</p>}
            </li>
          ))}
        </ol>
      </details>
      {ticket.podeLerChat ? (
        <ChatTicket ticket={ticket} usuario={usuario} />
      ) : (
        <p className="ticket-aviso">
          {ticket.responsavelId
            ? "A conversa é exclusiva do mecânico solicitante e do responsável pelo ticket."
            : "Assuma o ticket para iniciar o chat."}
        </p>
      )}
    </section>
  );
}

export default function Tickets() {
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
  const ordemFiltro = params.get("ordem");
  const consulta = useConsultaTickets(
    `/tickets?status=${filtro}&meus=${meus}&pagina=${pagina}${ordemFiltro ? `&ordemServicoId=${encodeURIComponent(ordemFiltro)}` : ""}`,
    15000,
    versao,
  );
  const atualizar = () => setVersao((v) => v + 1);
  return (
    <Layout>
      <main className="tickets-page">
        <header className="ticket-cabecalho">
          <div>
            <h1>Solicitações de peças</h1>
            <p>
              {tecnico
                ? "Acompanhe seus pedidos e converse com o responsável pelo atendimento."
                : "Assuma um ticket para atender o mecânico e conversar pelo chat."}
            </p>
          </div>
          <button type="button" onClick={atualizar}>
            Atualizar
          </button>
        </header>
        {tecnico && (
          <p className="ticket-aviso">
            Para solicitar peças, abra a ordem de serviço no{" "}
            <Link to="/tecnico/painel">Painel técnico</Link>.
          </p>
        )}
        <div className="ticket-colunas">
          <section className="ticket-card ticket-lista">
            <h2>Tickets</h2>
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
              <p>Carregando tickets…</p>
            ) : !consulta.dados?.itens.length ? (
              <p>Nenhum ticket neste filtro.</p>
            ) : (
              <ul>
                {consulta.dados.itens.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      className={String(ticket.id) === id ? "selecionado" : ""}
                      to={`/tickets/${ticket.id}${ordemFiltro ? `?ordem=${encodeURIComponent(ordemFiltro)}` : ""}`}
                    >
                      <strong>{ticket.codigo}</strong>
                      <span className={`ticket-status ${ticket.status}`}>
                        {STATUS[ticket.status]}
                      </span>
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
            <div className="ticket-acoes">
              <button
                type="button"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => p - 1)}
              >
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
            <section className="ticket-card ticket-vazio">
              <h2>Atendimento organizado por ticket</h2>
              <p>
                Selecione uma solicitação para consultar as peças, o histórico e
                a conversa.
              </p>
              <p>
                Atualização automática: tickets a cada 15 segundos e chat a cada
                5 segundos.
              </p>
            </section>
          )}
        </div>
      </main>
    </Layout>
  );
}
