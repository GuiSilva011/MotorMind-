import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiLock, FiInfo, FiMail, FiMapPin, FiPhone, FiUser, FiBriefcase, FiEye, FiEyeOff } from "react-icons/fi";
import api from "../services/api";
import { camposComMascara, formatarCampoCadastro, posicaoCursorMascara, selecionarExclusaoMascara } from "./mascarasCadastroOficina";
import "./landingPage.css";
import "./cadastroOficina.css";

const estados = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

const grupos = [
  {
    titulo: "Dados da oficina",
    descricao: "Como o seu negócio será identificado no MotorMind.",
    campos: [
      { name: "nomeFantasia", label: "Nome da oficina", required: true, maxLength: 120, autoComplete: "organization", largo: true },
      { name: "razaoSocial", label: "Razão social", maxLength: 150 },
      { name: "cnpj", label: "CNPJ", maxLength: 18, placeholder: "00.000.000/0000-00", autoCapitalize: "characters", spellCheck: false },
      { name: "telefone", label: "Telefone com DDD", required: true, type: "tel", maxLength: 20, autoComplete: "tel", inputMode: "tel", placeholder: "(11) 99999-9999" },
      { name: "whatsapp", label: "WhatsApp com DDD", type: "tel", maxLength: 20, inputMode: "tel", placeholder: "(11) 99999-9999" },
      { name: "Email", label: "E-mail da oficina", type: "email", required: true, maxLength: 120, autoComplete: "username", ajuda: "Este e-mail receberá a confirmação e será usado para entrar como administrador.", largo: true },
    ],
  },
  {
    titulo: "Endereço",
    descricao: "Opcional. Informe o endereço de atendimento da oficina.",
    campos: [
      { name: "cep", label: "CEP", maxLength: 9, autoComplete: "postal-code", inputMode: "numeric", placeholder: "00000-000" },
      { name: "uf", label: "Estado", autoComplete: "address-level1" },
      { name: "endereco", label: "Rua ou avenida", maxLength: 120, autoComplete: "address-line1", largo: true },
      { name: "numero", label: "Número", maxLength: 10 },
      { name: "complemento", label: "Complemento", maxLength: 80, autoComplete: "address-line2" },
      { name: "bairro", label: "Bairro", maxLength: 60, autoComplete: "address-level3" },
      { name: "cidade", label: "Cidade", maxLength: 60, autoComplete: "address-level2" },
    ],
  },
  {
    titulo: "Responsável e acesso",
    descricao: "Este será o administrador da oficina. O acesso usará o e-mail da oficina informado acima.",
    campos: [
      { name: "Nome", label: "Nome do responsável", required: true, maxLength: 120, autoComplete: "name", largo: true },
      { name: "Senha", label: "Senha de acesso", type: "password", required: true, minLength: 8, maxLength: 72, autoComplete: "new-password" },
      { name: "confirmarSenha", label: "Confirmar senha", type: "password", required: true, minLength: 8, maxLength: 72, autoComplete: "new-password" },
    ],
  },
];

const vazio = Object.fromEntries(grupos.flatMap((g) => g.campos.map((c) => [c.name, ""])));

export default function CadastroOficina() {
  const [form, setForm] = useState(vazio);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const envioEmCurso = useRef(false);
  const formulario = useRef(null);
  const resultado = useRef(null);

  useEffect(() => {
    const anterior = document.title;
    document.title = "Cadastre a sua oficina — MotorMind";
    window.scrollTo(0, 0);
    return () => { document.title = anterior; };
  }, []);

  useEffect(() => {
    if (concluido) {
      window.scrollTo(0, 0);
      resultado.current?.focus();
    }
  }, [concluido]);

  function mostrarErros(campos, mensagem) {
    setErros(campos);
    setErroGeral(mensagem);
    const primeiro = Object.keys(campos)[0];
    requestAnimationFrame(() => {
      if (primeiro) formulario.current?.elements.namedItem(primeiro)?.focus();
      else resultado.current?.focus();
    });
  }

  function atualizarCampo(event, campo) {
    const input = event.currentTarget;
    const digitado = input.value;
    const formatado = formatarCampoCadastro(campo, digitado);
    const cursor = input.selectionStart;
    const apagando = event.nativeEvent.inputType?.startsWith("delete");
    setForm((prev) => ({ ...prev, [campo]: formatado }));
    setErros((prev) => ({ ...prev, [campo]: undefined }));
    if (camposComMascara.has(campo) && cursor != null) {
      const novaPosicao = posicaoCursorMascara(digitado, formatado, cursor, apagando);
      requestAnimationFrame(() => {
        if (document.activeElement === input && input.value === formatado) {
          input.setSelectionRange(novaPosicao, novaPosicao);
        }
      });
    }
  }

  async function cadastrar(event) {
    event.preventDefault();
    if (envioEmCurso.current) return;
    const campos = {};
    if (form.Senha !== form.confirmarSenha)
      campos.confirmarSenha = "As senhas precisam ser iguais.";
    if (form.Senha.trim().length < 8 || new TextEncoder().encode(form.Senha).length > 72) {
      campos.Senha = "Use ao menos 8 caracteres. A senha deve ter até 72 bytes.";
    }
    if (Object.keys(campos).length) return mostrarErros(campos, "Reveja os campos indicados abaixo.");
    
    envioEmCurso.current = true;
    setEnviando(true);
    setErroGeral("");
    setErros({});
    try {
      const { data } = await api.post("/auth/cadastro-oficina", form, { timeout: 20000 });
      setConcluido({ ...data.oficina, confirmacao: data.confirmacao });
      setForm({ ...vazio });
      setMostrarSenha(false);
    } catch (error) {
      mostrarErros(
        error.response?.data?.campos || {},
        error.response?.data?.erro || "Não foi possível confirmar o registo. Verifique a sua ligação e tente novamente."
      );
    } finally {
      envioEmCurso.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className="landing-page co-page">
      <div className="mm-ambient-light light-top" aria-hidden="true" />
      
      {/* CABEÇALHO */}
      <header className="mm-header scrolled">
        <div className="mm-container header-inner">
          {/* TRECHO NOVO COM A LOGO */}
          <Link to="/" className="mm-brand" aria-label="MotorMind — página inicial">
            <img src="/logo.png" alt="MotorMind" className="mm-logo-img" />
          </Link>

          {/* BOTÕES CORRIGIDOS PARA O ESTILO DA LANDING PAGE */}
          <div className="header-actions">
            <Link className="signin" to="/">Voltar ao site</Link>
            <Link className="mm-button small" to="/login">
              Já tenho acesso <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mm-container co-main">
        {concluido ? (
          <section className="co-success-screen mm-reveal is-visible" ref={resultado} tabIndex={-1}>
            <div className="co-success-icon"><FiCheckCircle aria-hidden="true" /></div>
            <span className="co-eyebrow center">REGISTO RECEBIDO COM SUCESSO</span>
            <h1>A sua oficina já está cadastrada.</h1>
            <p className="co-success-desc">
              Os dados de <strong>{concluido.nomeFantasia}</strong> e o acesso do
              responsável foram registados no sistema.
            </p>
            
            <div className="co-success-box">
              <div className="co-success-box-header">
                <FiLock aria-hidden="true" />
                <strong>{concluido.confirmacao?.enviado ? "Confirme o seu e-mail para ativar" : "E-mail de confirmação não enviado"}</strong>
              </div>
              <div className="co-success-box-body">
                <p>E-mail da oficina e acesso: <strong className="txt-highlight">{concluido.email}</strong></p>
                <p className="txt-muted">{concluido.confirmacao?.mensagem || "Solicite o e-mail de confirmação para ativar a oficina."}</p>
                <p className="txt-muted">Após confirmar no seu e-mail, entre como administrador utilizando a senha que acabou de criar. O link expira em 24 horas.</p>
              </div>
            </div>

            <div className="co-success-actions">
              <Link className="co-btn-primary" to="/login">Ir para o Painel de Login</Link>
              <Link className="co-link-muted" to="/confirmar-oficina">Não recebeu? Solicitar novo e-mail</Link>
            </div>
          </section>
        ) : (
          <div className="co-layout mm-reveal is-visible">
            
            <div className="co-form-section">
              <div className="co-form-header">
                <Link to="/" className="co-back-link"><FiArrowLeft aria-hidden="true" /> Voltar ao site</Link>
                <span className="co-form-kicker">COMECE COM O MOTORMIND</span>
                <h1>Cadastre a sua <span>oficina.</span></h1>
                <p>Informe os dados do negócio e crie o seu acesso principal para iniciar a implantação.</p>
              </div>

              <form className="co-form" onSubmit={cadastrar} ref={formulario} aria-busy={enviando}>
                {erroGeral && (
                  <div className="co-alert-error" role="alert" tabIndex={-1} ref={resultado}>
                    <FiInfo size={18}/><span>{erroGeral}</span>
                  </div>
                )}

                {grupos.map((grupo, index) => (
                  <fieldset className="co-fieldset" key={grupo.titulo} disabled={enviando}>
                    <legend className="co-legend">
                      <span className="co-step-number">{String(index + 1).padStart(2, "0")}</span>
                      {grupo.titulo}
                    </legend>
                    <p className="co-legend-desc">{grupo.descricao}</p>

                    <div className="co-fields-grid">
                      {grupo.campos.map(({ label, largo, ajuda, ...campo }) => (
                        <div className={`co-field-wrap ${largo ? "largo" : ""}`} key={campo.name}>
                          <label className="co-label" htmlFor={`cadastro-${campo.name}`}>
                            {label} {campo.required && <span className="req">*</span>}
                          </label>
                          <div className={`co-input-shell ${erros[campo.name] ? "has-error" : ""}`}>
                            <span className="co-input-icon" aria-hidden="true">
                              {campo.type === "password" ? <FiLock /> :
                                campo.type === "email" ? <FiMail /> :
                                campo.type === "tel" ? <FiPhone /> :
                                ["cep", "uf", "endereco", "numero", "complemento", "bairro", "cidade"].includes(campo.name) ? <FiMapPin /> :
                                campo.name === "Nome" ? <FiUser /> : <FiBriefcase />}
                            </span>
                            {campo.name === "uf" ? (
                              <select
                                className={`co-input ${erros.uf ? "error" : ""}`}
                                id="cadastro-uf"
                                name="uf"
                                autoComplete={campo.autoComplete}
                                value={form.uf}
                                onChange={(e) => {
                                  setForm((prev) => ({ ...prev, uf: e.target.value }));
                                  setErros((prev) => ({ ...prev, uf: undefined }));
                                }}
                                aria-invalid={Boolean(erros.uf)}
                              >
                                <option value="">Selecione</option>
                                {estados.map((uf) => (
                                  <option key={uf} value={uf}>{uf}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                className={`co-input ${erros[campo.name] ? "error" : ""}`}
                                {...campo}
                                id={`cadastro-${campo.name}`}
                                value={form[campo.name]}
                                type={campo.type === "password" && mostrarSenha ? "text" : campo.type || "text"}
                                onChange={(e) => atualizarCampo(e, campo.name)}
                                onKeyDown={camposComMascara.has(campo.name) ? selecionarExclusaoMascara : undefined}
                                aria-invalid={Boolean(erros[campo.name])}
                              />
                            )}
                            {campo.type === "password" && (
                              <button
                                type="button"
                                className="co-eye-btn"
                                disabled={enviando}
                                onClick={() => setMostrarSenha((valor) => !valor)}
                                aria-label={mostrarSenha ? "Ocultar senhas" : "Mostrar senhas"}
                                aria-pressed={mostrarSenha}
                              >
                                {mostrarSenha ? <FiEyeOff /> : <FiEye />}
                              </button>
                            )}
                          </div>
                          {ajuda && <p className="co-help-text" id={`ajuda-${campo.name}`}>{ajuda}</p>}
                          {erros[campo.name] && <span className="co-error-text" id={`erro-${campo.name}`}>{erros[campo.name]}</span>}
                        </div>
                      ))}
                    </div>

                    {index === 2 && (
                      <div className="co-password-footer">
                        <p className="co-help-text">Use pelo menos 8 caracteres na senha.</p>
                        <label className="co-checkbox-label">
                          <input type="checkbox" checked={mostrarSenha} onChange={(e) => setMostrarSenha(e.target.checked)} />
                          <span className="co-checkbox-custom"/>
                          Mostrar senhas
                        </label>
                      </div>
                    )}
                  </fieldset>
                ))}

                <div className="co-form-footer">
                  <div className="co-disclaimer">
                    <FiLock size={18}/>
                    <span>Este cadastro não realiza cobrança. Confirme o seu e-mail na próxima etapa para ativar a sua oficina.</span>
                  </div>
                  <button className="co-btn-primary full-width" disabled={enviando} type="submit">
                    {enviando ? "A processar registo..." : "Cadastrar oficina e iniciar aquisição"}
                  </button>
                </div>
              </form>
            </div>

            <aside className="co-sidebar" aria-label="Resumo da aquisição">
              <div className="co-sidebar-card co-sidebar-modern">
                <div className="co-sidebar-glow" aria-hidden="true" />
                <div className="co-sidebar-content">
                  <span className="co-badge">LICENÇA VITALÍCIA</span>
                  <h2>Mais organização.<br /><span>Do balcão ao pátio.</span></h2>
                  <p className="co-sidebar-description">
                    Centralize a gestão da sua oficina e mantenha todas as etapas
                    do atendimento conectadas em um só lugar.
                  </p>

                  <div className="co-sidebar-divider" />

                  <ul className="sc-features">
                    <li><span className="sc-check"><FiCheck /></span> Clientes, veículos e ordens de serviço</li>
                    <li><span className="sc-check"><FiCheck /></span> Controle de estoque físico e agenda</li>
                    <li><span className="sc-check"><FiCheck /></span> Equipe, checklists e tickets de peças</li>
                    <li><span className="sc-check"><FiCheck /></span> Relatórios e cotação via WhatsApp</li>
                    <li><span className="sc-check"><FiCheck /></span> Um ambiente isolado para a sua oficina</li>
                  </ul>

                  <div className="sc-note">
                    <FiLock className="sc-note-icon" aria-hidden="true" />
                    <div>
                      <strong>Confirme o e-mail e comece</strong>
                      <p>Use o link recebido para ativar a oficina. O seu e-mail e senha do cadastro serão o acesso do administrador principal.</p>
                    </div>
                  </div>

                  <div className="sc-footer">
                    <span>A sua oficina já possui licença?</span>
                    <Link to="/login" className="co-btn-outline full-width">
                      Acessar Sistema <FiArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

          </div>
        )}
      </main>

      <footer className="co-footer">
        <div className="mm-container">
          <p>© {new Date().getFullYear()} MotorMind · Sistema Web Integrado para Oficinas Mecânicas</p>
        </div>
      </footer>
    </div>
  );
}
