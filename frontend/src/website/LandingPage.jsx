import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./landingPage.css";

const problemas = [
  {
    icone: "OS",
    titulo: "Ordens espalhadas",
    texto:
      "Centralize diagnósticos, serviços, peças e responsáveis em uma ordem de serviço digital.",
  },
  {
    icone: "CX",
    titulo: "Histórico difícil de consultar",
    texto:
      "Encontre clientes, veículos, checklists e atendimentos anteriores sem depender de papéis.",
  },
  {
    icone: "ES",
    titulo: "Estoque sem controle",
    texto:
      "Acompanhe os itens disponíveis, registre movimentações e identifique saldos abaixo do mínimo.",
  },
  {
    icone: "EQ",
    titulo: "Equipe desconectada",
    texto:
      "Vincule o mecânico à OS e organize solicitações de peças entre técnico e operador.",
  },
];

const funcionalidades = [
  {
    numero: "01",
    titulo: "Ordens de serviço",
    texto:
      "Cadastre diagnósticos, serviços e peças e gere a OS para impressão ou PDF.",
  },
  {
    numero: "02",
    titulo: "Agenda da oficina",
    texto: "Organize agendamentos e acompanhe os compromissos em calendário.",
  },
  {
    numero: "03",
    titulo: "Controle de estoque",
    texto:
      "Consulte saldos, movimente peças e faça a retirada vinculada à ordem de serviço.",
  },
  {
    numero: "04",
    titulo: "Painel técnico",
    texto:
      "Cada mecânico visualiza os veículos e as ordens de serviço atribuídas a ele.",
  },
  {
    numero: "05",
    titulo: "Checklists e histórico",
    texto:
      "Registre a inspeção técnica e consulte o histórico de cada veículo.",
  },
  {
    numero: "06",
    titulo: "Solicitações de peças",
    texto:
      "Abra tickets dentro da OS e converse com o operador pelo chat do atendimento.",
  },
];

const recursosLicenca = [
  "Gestão de clientes e veículos",
  "Agendamentos e calendário",
  "Ordens de serviço e geração de PDF",
  "Catálogo e estoque físico",
  "Painel técnico e checklists",
  "Tickets de peças e chat interno",
  "Usuários com perfis de acesso",
  "Dados isolados por oficina",
];

const etapas = [
  {
    numero: "1",
    titulo: "Inicie a aquisição",
    texto:
      "Escolha o MotorMind para sua oficina: uma licença, sem mensalidade recorrente.",
  },
  {
    numero: "2",
    titulo: "Cadastre sua oficina",
    texto:
      "Informe os dados da oficina e crie o acesso do primeiro responsável.",
  },
  {
    numero: "3",
    titulo: "Acesse o sistema",
    texto:
      "Confirme seu e-mail para ativar a oficina e entrar com seu acesso de administrador.",
  },
];

const perguntas = [
  {
    pergunta: "Preciso instalar algum programa?",
    resposta:
      "Não. O MotorMind é uma aplicação web e pode ser acessado pelo navegador nos dispositivos compatíveis.",
  },
  {
    pergunta: "Existe cobrança mensal?",
    resposta:
      "Não. O modelo definido para o MotorMind é de uma única compra, sem assinatura mensal recorrente.",
  },
  {
    pergunta: "O sistema funciona para uma oficina pequena?",
    resposta:
      "Sim. A oficina pode organizar usuários por perfil e usar somente os fluxos necessários à sua operação.",
  },
  {
    pergunta: "Os dados de uma oficina ficam separados das outras?",
    resposta:
      "Sim. Cada oficina possui seu próprio ambiente, e o acesso autenticado é limitado aos dados vinculados a ela.",
  },
  {
    pergunta: "Como funcionará o cadastro da oficina?",
    resposta:
      "Clique em Adquirir o MotorMind e preencha os dados da oficina e do responsável. Confirme o link enviado ao e-mail de acesso para ativar a oficina. O mesmo e-mail e senha serão usados pelo administrador. O cadastro não realiza cobrança.",
  },
];

function LandingPage() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [cabecalhoElevado, setCabecalhoElevado] = useState(false);

  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = "MotorMind — Gestão para oficinas mecânicas";

    function observarRolagem() {
      setCabecalhoElevado(window.scrollY > 10);
    }

    observarRolagem();
    window.addEventListener("scroll", observarRolagem, { passive: true });
    return () => {
      document.title = tituloAnterior;
      window.removeEventListener("scroll", observarRolagem);
    };
  }, []);

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <div className="landing-page" id="topo">
      <div className="landing-flag-strip" aria-hidden="true" />

      <header className={`landing-header${cabecalhoElevado ? " elevado" : ""}`}>
        <div className="landing-container landing-header-inner">
          <a className="landing-brand" href="#topo" onClick={fecharMenu}>
            <span className="landing-brand-mark" aria-hidden="true">
              M
            </span>
            <span>MotorMind</span>
          </a>

          <nav
            id="landing-navigation"
            className={`landing-nav${menuAberto ? " aberto" : ""}`}
            aria-label="Navegação principal"
          >
            <a href="#funcionalidades" onClick={fecharMenu}>
              Funcionalidades
            </a>
            <a href="#licenca" onClick={fecharMenu}>
              Licença
            </a>
            <a href="#como-funciona" onClick={fecharMenu}>
              Como funciona
            </a>
            <a href="#faq" onClick={fecharMenu}>
              Dúvidas
            </a>
          </nav>

          <div className="landing-header-actions">
            <Link className="landing-btn landing-btn-ghost" to="/login">
              Entrar
            </Link>
            <Link className="landing-btn landing-btn-primary" to="/cadastro-oficina">
              Adquirir o MotorMind
            </Link>
          </div>

          <button
            type="button"
            className="landing-nav-toggle"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-controls="landing-navigation"
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-bg" aria-hidden="true" />
          <div className="landing-container landing-hero-inner">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">
                <span className="landing-eyebrow-dot" /> Gestão para oficinas
                mecânicas
              </p>
              <h1>
                Sua oficina organizada <span>em um só sistema.</span>
              </h1>
              <p className="landing-hero-subtitle">
                Controle clientes, veículos, agenda, ordens de serviço, estoque
                e equipe com uma operação conectada do atendimento ao pátio.
              </p>
              <div className="landing-hero-actions">
                <Link
                  className="landing-btn landing-btn-primary landing-btn-large"
                  to="/cadastro-oficina"
                >
                  Adquirir o MotorMind
                </Link>
                <a
                  className="landing-btn landing-btn-outline landing-btn-large"
                  href="#funcionalidades"
                >
                  Conhecer o sistema
                </a>
              </div>
              <div className="landing-hero-points" aria-label="Diferenciais">
                <span>Pagamento único</span>
                <span>Ambiente por oficina</span>
                <span>Acesso por perfil</span>
              </div>
            </div>

            <div className="landing-hero-visual" aria-label="Exemplo do painel">
              <div className="landing-dashboard">
                <div className="landing-dashboard-topbar">
                  <span className="landing-window-dot" />
                  <span className="landing-window-dot" />
                  <span className="landing-window-dot" />
                  <strong>Painel MotorMind</strong>
                </div>
                <div className="landing-dashboard-body">
                  <div className="landing-dashboard-summary">
                    <div>
                      <small>OS em andamento</small>
                      <strong>08</strong>
                    </div>
                    <div>
                      <small>Agenda de hoje</small>
                      <strong>05</strong>
                    </div>
                  </div>
                  <div className="landing-dashboard-list">
                    <div>
                      <span className="andamento" />
                      <p>Onix — Troca de correia</p>
                      <small>Em andamento</small>
                    </div>
                    <div>
                      <span className="aguardando" />
                      <p>Corolla — Diagnóstico</p>
                      <small>Aguardando peça</small>
                    </div>
                    <div>
                      <span className="pronta" />
                      <p>HB20 — Revisão</p>
                      <small>Finalizada</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="landing-dashboard-chip">
                Fluxo simples e integrado
              </div>
            </div>
          </div>
          <div className="landing-hero-stripe" aria-hidden="true" />
        </section>

        <section className="landing-section landing-problems">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-eyebrow centralizado">
                <span className="landing-eyebrow-dot" /> Uma rotina mais clara
              </p>
              <h2>Menos informação espalhada, mais controle da oficina</h2>
              <p>
                O MotorMind reúne os principais processos internos para que a
                equipe trabalhe com a mesma informação.
              </p>
            </div>
            <div className="landing-problems-grid">
              {problemas.map((problema) => (
                <article className="landing-problem-card" key={problema.titulo}>
                  <span>{problema.icone}</span>
                  <h3>{problema.titulo}</h3>
                  <p>{problema.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-features"
          id="funcionalidades"
        >
          <div className="landing-container">
            <div className="landing-section-heading claro">
              <p className="landing-eyebrow centralizado">
                <span className="landing-eyebrow-dot" /> Funcionalidades
              </p>
              <h2>O fluxo da oficina conectado de ponta a ponta</h2>
              <p>
                Recursos para atendimento, administração e execução técnica no
                mesmo ambiente.
              </p>
            </div>
            <div className="landing-features-grid">
              {funcionalidades.map((funcionalidade) => (
                <article
                  className="landing-feature-card"
                  key={funcionalidade.numero}
                >
                  <span>{funcionalidade.numero}</span>
                  <h3>{funcionalidade.titulo}</h3>
                  <p>{funcionalidade.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-license" id="licenca">
          <div className="landing-container landing-license-layout">
            <div className="landing-license-copy">
              <p className="landing-eyebrow">
                <span className="landing-eyebrow-dot" /> Licença MotorMind
              </p>
              <h2>Uma compra. A gestão completa da sua oficina.</h2>
              <p>
                Uma única modalidade de acesso, vinculada à sua oficina.
                Comece pelo cadastro dos dados do negócio e do responsável.
              </p>
              <div className="landing-license-note">
                O cadastro não realiza cobrança. Confirme o link enviado ao
                seu e-mail para ativar a oficina e acessar o sistema.
              </div>
            </div>

            <article className="landing-license-card">
              <span className="landing-license-badge">Pagamento único</span>
              <h3>Licença completa</h3>
              <p className="landing-license-description">
                Sem planos diferentes e sem mensalidade recorrente.
              </p>
              <div className="landing-license-price">
                <strong>Compra única</strong>
                <span>uma licença por oficina</span>
              </div>
              <ul>
                {recursosLicenca.map((recurso) => (
                  <li key={recurso}>{recurso}</li>
                ))}
              </ul>
              <Link
                className="landing-btn landing-btn-primary landing-btn-block"
                to="/cadastro-oficina"
              >
                Adquirir o MotorMind
              </Link>
            </article>
          </div>
        </section>

        <section className="landing-section landing-steps" id="como-funciona">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-eyebrow centralizado">
                <span className="landing-eyebrow-dot" /> Próximos passos
              </p>
              <h2>Do cadastro ao primeiro acesso</h2>
              <p>
                Cadastre sua oficina e seu responsável. Confirme seu e-mail
                para ativar a licença e acessar o sistema como administrador.
              </p>
            </div>
            <ol className="landing-steps-grid">
              {etapas.map((etapa) => (
                <li key={etapa.numero}>
                  <span>{etapa.numero}</span>
                  <h3>{etapa.titulo}</h3>
                  <p>{etapa.texto}</p>
                </li>
              ))}
            </ol>
            <div className="landing-next-step">
              <div>
                <strong>Pronto para organizar sua oficina?</strong>
                <p>
                  Preencha o cadastro para iniciar a aquisição. Se sua oficina
                  já possui acesso ativo, entre com seu e-mail e senha.
                </p>
              </div>
              <Link className="landing-btn landing-btn-outline" to="/login">
                Já tenho acesso
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-section landing-faq" id="faq">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-eyebrow centralizado">
                <span className="landing-eyebrow-dot" /> Dúvidas frequentes
              </p>
              <h2>Antes de levar o MotorMind para sua oficina</h2>
            </div>
            <div className="landing-faq-list">
              {perguntas.map((item) => (
                <details key={item.pergunta}>
                  <summary>{item.pergunta}</summary>
                  <p>{item.resposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-flag-strip pequeno" aria-hidden="true" />
        <div className="landing-container landing-footer-inner">
          <div>
            <a className="landing-brand" href="#topo">
              <span className="landing-brand-mark" aria-hidden="true">
                M
              </span>
              <span>MotorMind</span>
            </a>
            <p>Gestão integrada para a rotina real da oficina mecânica.</p>
          </div>
          <nav aria-label="Navegação do rodapé">
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#licenca">Licença</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#faq">Dúvidas</a>
          </nav>
          <div className="landing-footer-access">
            <strong>Acesso da oficina</strong>
            <Link to="/login">Acessar o MotorMind</Link>
          </div>
        </div>
        <div className="landing-footer-bottom">
          © {new Date().getFullYear()} MotorMind. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
