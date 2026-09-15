import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiCheck, FiCheckCircle, FiLock } from "react-icons/fi";
import api from "../services/api";
import { camposComMascara, formatarCampoCadastro, posicaoCursorMascara, selecionarExclusaoMascara } from "./mascarasCadastroOficina";
import "./landingPage.css";
import "./cadastroOficina.css";

const estados =
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(
    " ",
  );
const grupos = [
  {
    titulo: "Dados da oficina",
    descricao: "Como seu negócio será identificado no MotorMind.",
    campos: [
      {
        name: "nomeFantasia",
        label: "Nome da oficina",
        required: true,
        maxLength: 120,
        autoComplete: "organization",
        largo: true,
      },
      { name: "razaoSocial", label: "Razão social", maxLength: 150 },
      {
        name: "cnpj",
        label: "CNPJ",
        maxLength: 18,
        placeholder: "00.000.000/0000-00",
        autoCapitalize: "characters",
        spellCheck: false,
      },
      {
        name: "telefone",
        label: "Telefone com DDD",
        required: true,
        type: "tel",
        maxLength: 20,
        autoComplete: "tel",
        inputMode: "tel",
        placeholder: "(11) 99999-9999",
      },
      {
        name: "whatsapp",
        label: "WhatsApp com DDD",
        type: "tel",
        maxLength: 20,
        inputMode: "tel",
        placeholder: "(11) 99999-9999",
      },
      {
        name: "Email",
        label: "E-mail da oficina",
        type: "email",
        required: true,
        maxLength: 120,
        autoComplete: "username",
        ajuda: "Este e-mail receberá a confirmação e será usado para entrar como administrador.",
        largo: true,
      },
    ],
  },
  {
    titulo: "Endereço",
    descricao: "Opcional. Informe o endereço de atendimento da oficina.",
    campos: [
      {
        name: "cep",
        label: "CEP",
        maxLength: 9,
        autoComplete: "postal-code",
        inputMode: "numeric",
        placeholder: "00000-000",
      },
      { name: "uf", label: "Estado", autoComplete: "address-level1" },
      {
        name: "endereco",
        label: "Rua ou avenida",
        maxLength: 120,
        autoComplete: "address-line1",
        largo: true,
      },
      { name: "numero", label: "Número", maxLength: 10 },
      {
        name: "complemento",
        label: "Complemento",
        maxLength: 80,
        autoComplete: "address-line2",
      },
      {
        name: "bairro",
        label: "Bairro",
        maxLength: 60,
        autoComplete: "address-level3",
      },
      {
        name: "cidade",
        label: "Cidade",
        maxLength: 60,
        autoComplete: "address-level2",
      },
    ],
  },
  {
    titulo: "Responsável e acesso",
    descricao:
      "Este será o administrador da oficina. O acesso usará o e-mail da oficina informado acima.",
    campos: [
      {
        name: "Nome",
        label: "Nome do responsável",
        required: true,
        maxLength: 120,
        autoComplete: "name",
        largo: true,
      },
      {
        name: "Senha",
        label: "Senha",
        type: "password",
        required: true,
        minLength: 8,
        maxLength: 72,
        autoComplete: "new-password",
      },
      {
        name: "confirmarSenha",
        label: "Confirmar senha",
        type: "password",
        required: true,
        minLength: 8,
        maxLength: 72,
        autoComplete: "new-password",
      },
    ],
  },
];
const vazio = Object.fromEntries(
  grupos.flatMap((g) => g.campos.map((c) => [c.name, ""])),
);

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
    document.title = "Cadastre sua oficina — MotorMind";
    window.scrollTo(0, 0);
    return () => {
      document.title = anterior;
    };
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
    // O fieldset pode ainda estar desabilitado até a próxima renderização.
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
    if (
      form.Senha.trim().length < 8 ||
      new TextEncoder().encode(form.Senha).length > 72
    ) {
      campos.Senha =
        "Use ao menos 8 caracteres. A senha deve ter até 72 bytes; acentos e símbolos podem ocupar mais de um byte.";
    }
    if (Object.keys(campos).length)
      return mostrarErros(campos, "Revise os campos indicados.");
    envioEmCurso.current = true;
    setEnviando(true);
    setErroGeral("");
    setErros({});
    try {
      const { data } = await api.post("/auth/cadastro-oficina", form, {
        timeout: 20000,
      });
      setConcluido({ ...data.oficina, confirmacao: data.confirmacao });
      setForm({ ...vazio });
      setMostrarSenha(false);
    } catch (error) {
      mostrarErros(
        error.response?.data?.campos || {},
        error.response?.data?.erro ||
          "Não foi possível confirmar o cadastro. Verifique sua conexão e tente novamente. Se o cadastro já tiver sido recebido, ele não será duplicado.",
      );
    } finally {
      envioEmCurso.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className="landing-page cadastro-oficina-page">
      <div className="landing-flag-strip" aria-hidden="true" />
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Link className="landing-brand" to="/">
            <span className="landing-brand-mark" aria-hidden="true">
              M
            </span>
            <span>MotorMind</span>
          </Link>
          <Link className="landing-btn landing-btn-ghost" to="/login">
            Já tenho acesso
          </Link>
        </div>
      </header>
      <main className="landing-container cadastro-oficina-main">
        <Link to="/" className="cadastro-voltar">
          <FiArrowLeft aria-hidden="true" /> Voltar ao site
        </Link>
        {concluido ? (
          <section
            className="cadastro-sucesso"
            ref={resultado}
            tabIndex={-1}
            aria-labelledby="cadastro-sucesso-titulo"
          >
            <FiCheckCircle
              className="cadastro-sucesso-icone"
              aria-hidden="true"
            />
            <p className="landing-eyebrow centralizado">Cadastro recebido</p>
            <h1 id="cadastro-sucesso-titulo">
              Sua oficina já está cadastrada.
            </h1>
            <p>
              <strong>{concluido.nomeFantasia}</strong> e o acesso do
              responsável foram registrados.
            </p>
            <div className="cadastro-aviso">
              <strong>
                {concluido.confirmacao?.enviado
                  ? "Confirme seu e-mail para ativar"
                  : "E-mail de confirmação não enviado"}
              </strong>
              <p>
                E-mail da oficina e de acesso: <strong>{concluido.email}</strong>
              </p>
              <p role={concluido.confirmacao?.enviado ? undefined : "alert"}>
                {concluido.confirmacao?.mensagem ||
                  "Solicite o e-mail de confirmação para ativar a oficina."}
              </p>
              <p>
                Após confirmar, entre como administrador com o mesmo e-mail e a
                senha que você cadastrou. O link vale por 24 horas.
              </p>
              <p>Nenhum pagamento foi realizado por este formulário.</p>
            </div>
            <Link className="landing-btn landing-btn-primary" to="/login">
              Ir para o login
            </Link>
            <p className="cadastro-confirmacao-link">
              <Link to="/confirmar-oficina">
                Solicitar novo e-mail de confirmação
              </Link>
            </p>
          </section>
        ) : (
          <>
            <div className="cadastro-titulo">
              <p className="landing-eyebrow">Comece com o MotorMind</p>
              <h1>Cadastre sua oficina.</h1>
              <p>
                Informe os dados do negócio e crie seu acesso para iniciar a
                aquisição.
              </p>
            </div>
            <div className="cadastro-layout">
              <form
                className="cadastro-form"
                onSubmit={cadastrar}
                ref={formulario}
                aria-busy={enviando}
              >
                <p className="cadastro-obrigatorios">
                  Os campos com * são obrigatórios.
                </p>
                {erroGeral && (
                  <div
                    className="cadastro-erro-geral"
                    role="alert"
                    tabIndex={-1}
                    ref={resultado}
                  >
                    {erroGeral}
                  </div>
                )}
                {grupos.map((grupo, index) => (
                  <fieldset key={grupo.titulo} disabled={enviando}>
                    <legend>
                      <span>{String(index + 1).padStart(2, "0")}</span>{" "}
                      {grupo.titulo}
                    </legend>
                    <p className="cadastro-grupo-descricao">
                      {grupo.descricao}
                    </p>
                    <div className="cadastro-campos">
                      {grupo.campos.map(({ label, largo, ajuda, ...campo }) => (
                        <div
                          className={`cadastro-campo${largo ? " largo" : ""}`}
                          key={campo.name}
                        >
                          <label htmlFor={`cadastro-${campo.name}`}>
                            {label}
                            {campo.required ? " *" : ""}
                          </label>
                          {campo.name === "uf" ? (
                            <select
                              id="cadastro-uf"
                              name="uf"
                              autoComplete={campo.autoComplete}
                              value={form.uf}
                              onChange={(e) => {
                                setForm((prev) => ({
                                  ...prev,
                                  uf: e.target.value,
                                }));
                                setErros((prev) => ({
                                  ...prev,
                                  uf: undefined,
                                }));
                              }}
                              aria-invalid={Boolean(erros.uf)}
                              aria-describedby={
                                erros.uf ? "erro-uf" : undefined
                              }
                            >
                              <option value="">Selecione</option>
                              {estados.map((uf) => (
                                <option key={uf} value={uf}>
                                  {uf}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              {...campo}
                              id={`cadastro-${campo.name}`}
                              value={form[campo.name]}
                              type={
                                campo.type === "password" && mostrarSenha
                                  ? "text"
                                  : campo.type || "text"
                              }
                              onChange={(e) => atualizarCampo(e, campo.name)}
                              onKeyDown={camposComMascara.has(campo.name) ? selecionarExclusaoMascara : undefined}
                              aria-invalid={Boolean(erros[campo.name])}
                              aria-describedby={
                                erros[campo.name]
                                  ? `erro-${campo.name}`
                                  : campo.type === "password"
                                    ? "cadastro-senha-ajuda"
                                    : ajuda ? `ajuda-${campo.name}` : undefined
                              }
                            />
                          )}
                          {ajuda && <p className="cadastro-senha-ajuda" id={`ajuda-${campo.name}`}>{ajuda}</p>}
                          {erros[campo.name] && (
                            <span
                              className="cadastro-campo-erro"
                              id={`erro-${campo.name}`}
                            >
                              {erros[campo.name]}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {index === 2 && (
                      <>
                        <p
                          className="cadastro-senha-ajuda"
                          id="cadastro-senha-ajuda"
                        >
                          Use pelo menos 8 caracteres na senha.
                        </p>
                        <label className="cadastro-mostrar-senha">
                          <input
                            type="checkbox"
                            checked={mostrarSenha}
                            onChange={(e) => setMostrarSenha(e.target.checked)}
                          />{" "}
                          Mostrar senhas
                        </label>
                      </>
                    )}
                  </fieldset>
                ))}
                <div className="cadastro-envio">
                  <p>
                    Este cadastro não realiza cobrança. Confirme seu e-mail para
                    ativar sua oficina e liberar o acesso de administrador.
                  </p>
                  <button
                    className="landing-btn landing-btn-primary landing-btn-block"
                    disabled={enviando}
                    type="submit"
                  >
                    {enviando
                      ? "Cadastrando oficina..."
                      : "Cadastrar oficina e iniciar aquisição"}
                  </button>
                </div>
              </form>
              <aside className="cadastro-resumo" aria-label="Sobre a aquisição">
                <span className="landing-license-badge">
                  Uma licença por oficina
                </span>
                <h2>
                  Mais organização.
                  <br />
                  Do atendimento ao pátio.
                </h2>
                <ul>
                  {[
                    "Clientes, veículos e ordens de serviço",
                    "Estoque físico e agenda",
                    "Equipe, checklists e solicitações de peças",
                    "Um ambiente exclusivo para sua oficina",
                  ].map((item) => (
                    <li key={item}>
                      <FiCheck aria-hidden="true" /> {item}
                    </li>
                  ))}
                </ul>
                <div className="cadastro-resumo-nota">
                  <FiLock aria-hidden="true" />
                  <div>
                    <strong>Confirme seu e-mail e comece</strong>
                    <p>
                      Use o link recebido para ativar a oficina. Seu e-mail e
                      senha do cadastro serão o acesso de administrador.
                    </p>
                  </div>
                </div>
                <Link to="/login">Sua oficina já tem acesso? Entrar</Link>
              </aside>
            </div>
          </>
        )}
      </main>
      <footer className="cadastro-rodape">
        MotorMind · Gestão para oficinas mecânicas
      </footer>
    </div>
  );
}
