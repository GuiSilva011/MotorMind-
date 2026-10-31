import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiClock, FiInfo, FiLock, FiMail, FiRefreshCw, FiShield } from "react-icons/fi";
import api from "../services/api";
import "./landingPage.css";
import "./cadastroOficina.css";
import "./confirmarOficina.css";

export default function ConfirmarOficina() {
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") || "");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [ativada, setAtivada] = useState(null);
  const [aguardarAte, setAguardarAte] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const emCurso = useRef(false);
  const titulo = useRef(null);

  useEffect(() => {
    const anterior = document.title;
    document.title = "Confirme sua oficina — MotorMind";
    window.scrollTo(0, 0);
    return () => { document.title = anterior; };
  }, []);

  useEffect(() => {
    if (ativada) { window.scrollTo(0, 0); titulo.current?.focus(); }
  }, [ativada]);

  useEffect(() => {
    if (!aguardarAte) { setSegundosRestantes(0); return; }
    const atualizar = () => {
      const restante = Math.max(0, Math.ceil((aguardarAte - Date.now()) / 1000));
      setSegundosRestantes(restante);
      if (restante === 0) setAguardarAte(0);
    };
    atualizar();
    const intervalo = window.setInterval(atualizar, 1000);
    return () => window.clearInterval(intervalo);
  }, [aguardarAte]);

  function limparToken() {
    setToken("");
    setErro("");
    setMensagem("");
    window.history.replaceState(window.history.state, "", "/confirmar-oficina");
  }

  async function confirmar() {
    if (emCurso.current || !token) return;
    emCurso.current = true;
    setEnviando(true);
    setErro("");
    try {
      const { data } = await api.post("/auth/confirmar-oficina", { token }, { timeout: 20000 });
      setAtivada(data);
      setToken("");
      window.history.replaceState(window.history.state, "", "/confirmar-oficina");
    } catch (error) {
      setErro(error.response?.data?.erro || "Não foi possível confirmar o acesso. Tente novamente ou entre com seu e-mail e senha se já confirmou.");
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
      const { data } = await api.post("/auth/reenviar-confirmacao", { Email: email.trim() }, { timeout: 20000 });
      setMensagem(data.mensagem || "Se o e-mail estiver cadastrado, você receberá um novo link de confirmação.");
      setAguardarAte(Date.now() + 60000);
    } catch (error) {
      setErro(error.response?.data?.erro || "Não foi possível solicitar o e-mail. Tente novamente em alguns minutos.");
    } finally {
      emCurso.current = false;
      setEnviando(false);
    }
  }

  const modo = ativada ? "sucesso" : token ? "token" : "reenvio";

  return (
    <div className="landing-page co-page cf-page">
      <div className="mm-ambient-light light-top" aria-hidden="true" />

      <header className="mm-header scrolled">
        <div className="mm-container header-inner">
          <Link to="/" className="mm-brand" aria-label="MotorMind — página inicial">
            <img src="/logo.png" alt="MotorMind" className="mm-logo-img" />
          </Link>
          <div className="header-actions">
            <Link className="signin" to="/">Voltar ao site</Link>
            <Link className="mm-button small" to="/login">Já tenho acesso <FiArrowRight size={16} /></Link>
          </div>
        </div>
      </header>

      <main className="cf-main">
        <div className="cf-layout">
          <section className="cf-left" aria-labelledby="cf-title" aria-busy={enviando}>
            <Link to="/" className="cf-back"><FiArrowLeft aria-hidden="true" /> Voltar ao site</Link>

            <div className="cf-heading">
              <span className="cf-eyebrow">{modo === "sucesso" ? "ACESSO LIBERADO" : "ATIVAÇÃO DA SUA OFICINA"}</span>
              <h1 id="cf-title" ref={titulo} tabIndex={-1}>
                {modo === "sucesso" ? <>Sua oficina está <span>ativa!</span></> : modo === "token" ? <>Só falta confirmar <span>seu e-mail.</span></> : <>Receba seu link de <span>confirmação.</span></>}
              </h1>
              <p>
                {modo === "sucesso" ? <>O acesso de administrador de <strong>{ativada?.oficina?.nomeFantasia || "sua oficina"}</strong> foi liberado. Agora você pode entrar no MotorMind.</> : modo === "token" ? "Seu cadastro está quase pronto. Confirme a ativação para acessar o MotorMind com o e-mail e a senha definidos anteriormente." : "Informe o e-mail utilizado no cadastro da oficina. Enviaremos um novo link de ativação válido por 24 horas."}
              </p>
            </div>

            <div className="cf-form-card">
              <div className="cf-form-card-top">
                <span className={`cf-form-icon ${modo === "sucesso" ? "is-success" : ""}`} aria-hidden="true">
                  {modo === "sucesso" ? <FiCheckCircle /> : modo === "token" ? <FiShield /> : <FiMail />}
                </span>
                <div>
                  <span className="cf-card-caption">{modo === "sucesso" ? "03 / 03 · CONCLUÍDO" : modo === "token" ? "02 / 03 · VERIFICAÇÃO" : "02 / 03 · REENVIO"}</span>
                  <h2>{modo === "sucesso" ? "Confirmação concluída" : modo === "token" ? "Confirmação segura" : "Reenvio de confirmação"}</h2>
                </div>
              </div>
              <div className="cf-card-rule" />

              {erro && <div className="cf-alert cf-error" role="alert"><FiInfo aria-hidden="true" /><span>{erro}</span></div>}
              {mensagem && <div className="cf-alert cf-success" role="status"><FiCheckCircle aria-hidden="true" /><span>{mensagem}</span></div>}

              {modo === "sucesso" ? (
                <div className="cf-card-body">
                  <p className="cf-card-description">O acesso de administrador está pronto para uso.</p>
                  <div className="cf-account">
                    <FiMail aria-hidden="true" />
                    <div><span>Login do administrador</span><strong>{ativada?.administrador?.Email || "E-mail informado no cadastro"}</strong></div>
                  </div>
                  <div className="cf-info"><FiLock aria-hidden="true" /><p>Utilize a mesma senha criada no cadastro da oficina.</p></div>
                  <Link to="/login" className="cf-primary">Acessar minha oficina <FiArrowRight aria-hidden="true" /></Link>
                </div>
              ) : modo === "token" ? (
                <div className="cf-card-body">
                  <p className="cf-card-description">O link foi identificado. Clique abaixo para concluir a ativação da oficina.</p>
                  <div className="cf-info"><FiShield aria-hidden="true" /><p>Esta etapa valida o e-mail e libera o acesso do administrador.</p></div>
                  <button type="button" className="cf-primary" onClick={confirmar} disabled={enviando}>
                    {enviando ? <><span className="cf-spinner" /> Confirmando acesso...</> : <>Confirmar e ativar oficina <FiArrowRight aria-hidden="true" /></>}
                  </button>
                  <button className="cf-inline-link" type="button" disabled={enviando} onClick={limparToken}>Link expirado? Solicitar outro e-mail</button>
                </div>
              ) : (
                <form onSubmit={reenviar} className="cf-card-body cf-form">
                  <p className="cf-card-description">Preencha o e-mail de acesso para receber um novo link.</p>
                  <div className="cf-field">
                    <label htmlFor="confirmacao-email">E-mail de acesso</label>
                    <div className="cf-input-wrap">
                      <FiMail aria-hidden="true" />
                      <input id="confirmacao-email" name="Email" type="email" autoComplete="email" maxLength={120} placeholder="exemplo@suaoficina.com.br" required value={email} onChange={e => setEmail(e.target.value)} disabled={enviando} />
                    </div>
                    <p className="cf-help">Use o mesmo e-mail informado no cadastro da oficina.</p>
                  </div>
                  <button className="cf-primary" disabled={enviando || segundosRestantes > 0} type="submit">
                    {enviando ? <><span className="cf-spinner" /> Solicitando envio...</> : segundosRestantes > 0 ? <>Reenviar em {segundosRestantes}s <FiClock /></> : <>Enviar e-mail de confirmação <FiArrowRight aria-hidden="true" /></>}
                  </button>
                  {segundosRestantes > 0 && <p className="cf-cooldown"><FiClock aria-hidden="true" /> Aguarde antes de solicitar outro link.</p>}
                </form>
              )}
            </div>

            {modo !== "sucesso" && <p className="cf-bottom-link">Já confirmou seu e-mail? <Link to="/login">Ir para o login <FiArrowRight aria-hidden="true" /></Link></p>}
          </section>

          <aside className="cf-aside" aria-label="Etapas de ativação">
            <div className="cf-aside-glow" aria-hidden="true" />
            <div className="cf-aside-content">
              <span className="cf-aside-badge">BEM-VINDO AO MOTORMIND</span>
              <h2>Uma última etapa.<br /><span>Sua oficina conectada.</span></h2>
              <p className="cf-aside-description">A confirmação protege o cadastro e permite que o administrador acesse o ambiente da oficina.</p>
              <div className="cf-aside-divider" />
              <div className="cf-steps">
                <div className="cf-step complete"><span className="cf-step-number"><FiCheck /></span><div><strong>01. Cadastro realizado</strong><p>Dados da oficina e do responsável registrados.</p></div></div>
                <div className={`cf-step ${modo === "sucesso" ? "complete" : "current"}`}><span className="cf-step-number">{modo === "sucesso" ? <FiCheck /> : "02"}</span><div><strong>02. Confirmar e-mail</strong><p>Valide o endereço informado no cadastro.</p></div></div>
                <div className={`cf-step ${modo === "sucesso" ? "complete" : ""}`}><span className="cf-step-number">{modo === "sucesso" ? <FiCheck /> : "03"}</span><div><strong>03. Acessar o sistema</strong><p>Entre com seu e-mail e senha de administrador.</p></div></div>
              </div>
              <div className="cf-aside-note"><FiLock aria-hidden="true" /><div><strong>Seu acesso, com segurança</strong><p>O link de confirmação é válido por 24 horas. A senha permanece a mesma criada no cadastro.</p></div></div>
              <div className="cf-aside-footer">
                <span>{modo === "sucesso" ? "Tudo pronto para começar" : "Precisa de outro link?"}</span>
                {modo === "reenvio" ? <span className="cf-current"><FiRefreshCw /> Formulário disponível ao lado</span> : modo === "token" ? <button type="button" onClick={limparToken} disabled={enviando}>Solicitar novo e-mail <FiArrowRight /></button> : <Link to="/login">Acessar sistema <FiArrowRight /></Link>}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <footer className="cf-footer"><div className="mm-container"><p>© {new Date().getFullYear()} MotorMind · Sistema Web Integrado para Oficinas Mecânicas</p></div></footer>
    </div>
  );
}
