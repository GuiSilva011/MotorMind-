import { useEffect, useRef, useState } from "react";
import api from "../services/api";

const FORMATOS = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function ImagemTicket({ ticketId, anexoId, nomeArquivo, expiresAt }) {
  const [imagem, setImagem] = useState({ url: "", erro: false });
  const [tentativa, setTentativa] = useState(0);
  const dialogo = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let url = "";
    const validade = new Date(expiresAt).getTime();

    function liberarImagem() {
      if (url) URL.revokeObjectURL(url);
      url = "";
    }

    async function carregar() {
      try {
        if (!(validade > Date.now())) throw new Error("Imagem expirada");
        const { data } = await api.get(`/tickets/${ticketId}/anexos/${anexoId}`, {
          responseType: "blob",
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (!(validade > Date.now()) || !FORMATOS.has(data.type))
          throw new Error("Imagem indisponível");
        url = URL.createObjectURL(data);
        setImagem({ url, erro: false });
      } catch {
        if (!controller.signal.aborted) setImagem({ url: "", erro: true });
      }
    }

    carregar();
    const timer = window.setTimeout(() => {
      controller.abort();
      liberarImagem();
      setImagem({ url: "", erro: true });
    }, Math.max(0, validade - Date.now()));

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      liberarImagem();
    };
  }, [ticketId, anexoId, expiresAt, tentativa]);

  return (
    <div className="ticket-imagem">
      {imagem.erro ? (
        <div className="ticket-imagem-falha" role="status">
          <span>Prévia indisponível. Confira a conexão e o prazo do anexo.</span>
          <button
            type="button"
            onClick={() => {
              setImagem({ url: "", erro: false });
              setTentativa((valor) => valor + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : imagem.url ? (
        <>
          <button
            type="button"
            className="ticket-imagem-previa"
            aria-label={`Ampliar imagem: ${nomeArquivo}`}
            onClick={() => {
              if (new Date(expiresAt).getTime() > Date.now())
                dialogo.current?.showModal();
            }}
          >
            <img
              src={imagem.url}
              alt={nomeArquivo}
              onError={() => setImagem({ url: "", erro: true })}
            />
            <span>Clique para ampliar</span>
          </button>
          <dialog
            ref={dialogo}
            className="ticket-dialog ticket-imagem-dialog"
            aria-label={`Visualização de imagem: ${nomeArquivo}`}
          >
            <div className="ticket-imagem-cabecalho">
              <strong>{nomeArquivo}</strong>
              <button type="button" onClick={() => dialogo.current?.close()}>
                Fechar
              </button>
            </div>
            <img src={imagem.url} alt={nomeArquivo} />
          </dialog>
        </>
      ) : (
        <div className="ticket-imagem-carregando" role="status">
          Carregando imagem…
        </div>
      )}
    </div>
  );
}
