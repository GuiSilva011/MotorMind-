import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiMail, FiCheckCircle } from "react-icons/fi";
import api from "../services/api";
import "./landingPage.css";
import "./cadastroOficina.css";

export default function ConfirmarOficina() {
  const [token, setToken] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
  );
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ativada, setAtivada] = useState(null);
  const [aguardarAte, setAguardarAte] = useState(0);
  const emCurso = useRef(false);
  const titulo = useRef(null);

  useEffect(() => {
    const anterior = document.title;
    document.title = "Confirme sua oficina — MotorMind";
    window.scrollTo(0, 0);
    return () => {
      document.title = anterior;
    };
  }, []);
  useEffect(() => {
    if (ativada) titulo.current?.focus();
  }, [ativada]);
  useEffect(() => {
    if (!aguardarAte) return;
    const timer = window.setTimeout(
      () => setAguardarAte(0),
      Math.max(0, aguardarAte - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [aguardarAte]);

  async function confirmar() {
    if (emCurso.current) return;
    emCurso.current = true;
    setEnviando(true);
    setErro("");
    try {
      const { data } = await api.post(
        "/auth/confirmar-oficina",
        { token },
        { timeout: 20000 },
      );
      setAtivada(data);
      setToken("");
      window.history.replaceState(
        window.history.state,
        "",
        "/confirmar-oficina",
      );
    } catch (error) {
      setErro(
        error.response?.data?.erro ||
          "Não foi possível confirmar o acesso. Tente novamente ou entre com seu e-mail e senha se já confirmou.",
      );
    } finally {
      emCurso.current = false;
      setEnviando(false);
    }
  }

  async function reenviar(event) {
    event.preventDefault();
    if (emCurso.current || aguardarAte > Date.now()) return;
    emCurso.current = true;
    setEnviando(true);
    setErro("");
    setMensagem("");
    try {
      const { data } = await api.post(
        "/auth/reenviar-confirmacao",
        { Email: email.trim() },
        { timeout: 20000 },
      );
      setMensagem(data.mensagem);
      setAguardarAte(Date.now() + 60000);
    } catch (error) {
      setErro(
        error.response?.data?.erro ||
          "Não foi possível solicitar o e-mail. Tente novamente em alguns minutos.",
      );
    } finally {
      emCurso.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className="landing-page cadastro-oficina-page">
      <div className="landing-flag-strip" aria-hidden="true" />
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Link to="/" className="landing-brand">
            <span className="landing-brand-mark" aria-hidden="true">
              M
            </span>
            <span>MotorMind</span>
          </Link>
          <Link to="/login" className="landing-btn landing-btn-ghost">
            Entrar
          </Link>
        </div>
      </header>
      <main className="landing-container cadastro-oficina-main">
        <section
          className="cadastro-sucesso confirmacao-card"
          aria-busy={enviando}
        >
          {ativada ? (
            <>
              <FiCheckCircle
                className="cadastro-sucesso-icone"
                aria-hidden="true"
              />
              <h1 ref={titulo} tabIndex={-1}>
                Sua oficina está ativa!
              </h1>
              <p>
                O acesso de administrador de{" "}
                <strong>{ativada.oficina.nomeFantasia}</strong> foi liberado.
              </p>
              <div className="cadastro-aviso">
                <strong>Seu login de administrador</strong>
                <p>{ativada.administrador.Email}</p>
                <p>Use a mesma senha informada no cadastro.</p>
              </div>
              <Link to="/login" className="landing-btn landing-btn-primary">
                Acessar minha oficina
              </Link>
            </>
          ) : (
            <>
              <FiMail className="cadastro-sucesso-icone" aria-hidden="true" />
              <h1>
                {token
                  ? "Confirme seu e-mail."
                  : "Receba o link de confirmação."}
              </h1>
              <p>
                {token
                  ? "Confirme abaixo para ativar sua oficina e liberar o acesso de administrador com o e-mail e a senha do cadastro."
                  : "Informe o e-mail de acesso usado no cadastro da oficina. Enviaremos um link válido por 24 horas."}
              </p>
              {erro && (
                <div className="cadastro-erro-geral" role="alert">
                  {erro}
                </div>
              )}
              {mensagem && (
                <div className="cadastro-aviso" role="status">
                  {mensagem}
                </div>
              )}
              {token ? (
                <>
                  <button
                    type="button"
                    className="landing-btn landing-btn-primary"
                    onClick={confirmar}
                    disabled={enviando}
                  >
                    {enviando ? "Confirmando..." : "Confirmar e ativar oficina"}
                  </button>
                  <p className="cadastro-confirmacao-link">
                    <button
                      type="button"
                      disabled={enviando}
                      onClick={() => {
                        setToken("");
                        setErro("");
                        window.history.replaceState(
                          window.history.state,
                          "",
                          "/confirmar-oficina",
                        );
                      }}
                    >
                      Link expirado? Solicitar outro e-mail
                    </button>
                  </p>
                </>
              ) : (
                <form onSubmit={reenviar} className="confirmacao-form">
                  <div className="cadastro-campo">
                    <label htmlFor="confirmacao-email">E-mail de acesso</label>
                    <input
                      id="confirmacao-email"
                      type="email"
                      autoComplete="email"
                      maxLength={120}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={enviando}
                    />
                  </div>
                  <button
                    className="landing-btn landing-btn-primary landing-btn-block"
                    disabled={enviando || Boolean(aguardarAte)}
                    type="submit"
                  >
                    {enviando
                      ? "Solicitando envio..."
                      : aguardarAte
                        ? "Aguarde um minuto para reenviar"
                        : "Enviar e-mail de confirmação"}
                  </button>
                </form>
              )}
              <p className="cadastro-confirmacao-link">
                <Link to="/login">Já confirmou? Ir para o login</Link>
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
